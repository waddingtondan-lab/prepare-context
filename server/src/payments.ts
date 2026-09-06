/**
 * x402 payment gating for POST /v1/prepare.
 *
 * Enabled only when PAY_TO is set (and X402_ENABLED is not explicitly "false").
 * When PAY_TO is unset, middleware is a no-op so local/dev stays free.
 *
 * Workers: read c.env per request (bindings are request-scoped).
 * Node: fall back to process.env.
 *
 * Middleware runs before the route handler so unpaid probes (empty/minimal body)
 * receive HTTP 402 before JSON body validation can 400.
 */
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import {
  bazaarResourceServerExtension,
  declareDiscoveryExtension,
} from "@x402/extensions/bazaar";
import type { Context, MiddlewareHandler, Next } from "hono";
import {
  PREPARE_INPUT_EXAMPLE,
  PREPARE_INPUT_JSON_SCHEMA,
  PREPARE_OUTPUT_EXAMPLE,
  PREPARE_OUTPUT_JSON_SCHEMA,
} from "./openapi.js";

export const DEFAULT_X402_PRICE = "$0.01";
export const DEFAULT_X402_NETWORK = "eip155:84532"; // Base Sepolia
export const FACILITATOR_TESTNET = "https://x402.org/facilitator";
export const FACILITATOR_MAINNET = "https://api.cdp.coinbase.com/platform/v2/x402";
export const MAINNET_NETWORK = "eip155:8453"; // Base

/** Cloudflare Worker / Hono bindings used for payments + defaults. */
export type PaymentEnv = {
  PAY_TO?: string;
  X402_ENABLED?: string;
  X402_PRICE?: string;
  X402_NETWORK?: string;
  X402_FACILITATOR_URL?: string;
  DEFAULT_TARGET_MODEL?: string;
};

export type ResolvedPaymentConfig = {
  enabled: boolean;
  payTo: string;
  price: string;
  network: string;
  facilitatorUrl: string;
};

function readProcessEnv(key: keyof PaymentEnv): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const v = process.env[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** Merge Worker bindings with process.env (Node). Bindings win when present. */
export function readPaymentEnv(bindings?: PaymentEnv | null): PaymentEnv {
  const b = bindings ?? {};
  return {
    PAY_TO: b.PAY_TO || readProcessEnv("PAY_TO"),
    X402_ENABLED: b.X402_ENABLED || readProcessEnv("X402_ENABLED"),
    X402_PRICE: b.X402_PRICE || readProcessEnv("X402_PRICE"),
    X402_NETWORK: b.X402_NETWORK || readProcessEnv("X402_NETWORK"),
    X402_FACILITATOR_URL: b.X402_FACILITATOR_URL || readProcessEnv("X402_FACILITATOR_URL"),
    DEFAULT_TARGET_MODEL: b.DEFAULT_TARGET_MODEL || readProcessEnv("DEFAULT_TARGET_MODEL"),
  };
}

export function resolveFacilitatorUrl(network: string, override?: string): string {
  if (override && override.length > 0) return override;
  if (network === MAINNET_NETWORK) return FACILITATOR_MAINNET;
  return FACILITATOR_TESTNET;
}

export function resolvePaymentConfig(raw: PaymentEnv): ResolvedPaymentConfig {
  const payTo = (raw.PAY_TO ?? "").trim();
  const enabledFlag = (raw.X402_ENABLED ?? "").trim().toLowerCase();
  // PAY_TO required. X402_ENABLED=false forces off; unset or "true" keeps on when PAY_TO set.
  const enabled = payTo.length > 0 && enabledFlag !== "false";
  const network = (raw.X402_NETWORK ?? "").trim() || DEFAULT_X402_NETWORK;
  const price = (raw.X402_PRICE ?? "").trim() || DEFAULT_X402_PRICE;
  const facilitatorUrl = resolveFacilitatorUrl(network, (raw.X402_FACILITATOR_URL ?? "").trim());
  return { enabled, payTo, price, network, facilitatorUrl };
}

/** Bazaar discovery payload attached to POST /v1/prepare 402 responses. */
export function prepareBazaarExtensions() {
  return {
    ...declareDiscoveryExtension({
      bodyType: "json",
      input: { ...PREPARE_INPUT_EXAMPLE },
      inputSchema: {
        properties: PREPARE_INPUT_JSON_SCHEMA.properties,
        required: [...PREPARE_INPUT_JSON_SCHEMA.required],
      },
      output: {
        example: { ...PREPARE_OUTPUT_EXAMPLE },
        schema: PREPARE_OUTPUT_JSON_SCHEMA,
      },
    }),
  };
}

export function buildPrepareRoutes(cfg: ResolvedPaymentConfig) {
  return {
    "POST /v1/prepare": {
      accepts: {
        scheme: "exact" as const,
        price: cfg.price,
        network: cfg.network as `${string}:${string}`,
        payTo: cfg.payTo,
      },
      description: "Scrub + compress context to a token budget with a savings receipt",
      mimeType: "application/json",
      extensions: prepareBazaarExtensions(),
    },
  };
}

/** Cache initialized middleware per isolate (Workers reuse isolates across requests). */
const middlewareCache = new Map<string, MiddlewareHandler>();

function cacheKey(cfg: ResolvedPaymentConfig): string {
  return [cfg.payTo, cfg.price, cfg.network, cfg.facilitatorUrl].join("|");
}

/**
 * Per-request x402 middleware reading c.env / process.env.
 * Builds @x402/hono paymentMiddleware with syncFacilitatorOnStart: false, but
 * explicitly await server.initialize() (required in SDK 2.x — false alone never
 * loads facilitator supported kinds and unpaid calls become 500).
 *
 * Registers bazaarResourceServerExtension so declareDiscoveryExtension metadata
 * is enriched onto PAYMENT-REQUIRED / 402 responses for catalog indexing.
 */
export function x402PrepareMiddleware(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const cfg = resolvePaymentConfig(readPaymentEnv(c.env as PaymentEnv | undefined));
    if (!cfg.enabled) {
      return next();
    }

    const key = cacheKey(cfg);
    let middleware = middlewareCache.get(key);
    if (!middleware) {
      const network = cfg.network as `${string}:${string}`;
      const facilitatorClient = new HTTPFacilitatorClient({ url: cfg.facilitatorUrl });
      const server = new x402ResourceServer(facilitatorClient)
        .register(network, new ExactEvmScheme())
        .registerExtension(bazaarResourceServerExtension);
      try {
        await server.initialize();
      } catch (err) {
        const message = err instanceof Error ? err.message : "x402 facilitator init failed";
        return c.json({ error: message }, 503);
      }
      middleware = paymentMiddleware(
        buildPrepareRoutes(cfg),
        server,
        undefined,
        undefined,
        false // syncFacilitatorOnStart — Workers: we already initialized above
      );
      middlewareCache.set(key, middleware);
    }
    return middleware(c, next);
  };
}

/** CORS allow/expose list for x402 payment headers (v2 + legacy X-PAYMENT*). */
export const X402_CORS_HEADERS = [
  "PAYMENT-REQUIRED",
  "PAYMENT-SIGNATURE",
  "PAYMENT-RESPONSE",
  "X-PAYMENT",
  "X-PAYMENT-RESPONSE",
  "X-PAYMENT-REQUIRED",
] as const;
