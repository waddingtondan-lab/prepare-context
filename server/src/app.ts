import { Hono } from "hono";
import { cors } from "hono/cors";
import { prepare, TOKEN_ESTIMATOR, type PrepareMode, type PrepareRequest } from "@prepare-context/core";
import { LANDING_HTML, LLMS_TXT, prefersHtml } from "./landing.js";
import { buildOpenApiDocument, PUBLIC_BASE_URL } from "./openapi.js";
import {
  readPaymentEnv,
  resolvePaymentConfig,
  x402PrepareMiddleware,
  X402_CORS_HEADERS,
  type PaymentEnv,
} from "./payments.js";

export type AppEnv = {
  Bindings: PaymentEnv;
};

export const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", ...X402_CORS_HEADERS],
    exposeHeaders: [...X402_CORS_HEADERS],
  })
);

// x402 first: unpaid POST /v1/prepare must 402 before route body validation (400).
app.use("*", x402PrepareMiddleware());

app.get("/", (c) => {
  if (prefersHtml(c.req.header("Accept"))) {
    return c.html(LANDING_HTML);
  }
  const payments = resolvePaymentConfig(readPaymentEnv(c.env));
  return c.json({
    ok: true,
    service: "prepare-context",
    health: "/health",
    prepare: "/v1/prepare",
    openapi: "/openapi.json",
    llms: "/llms.txt",
    public_base_url: PUBLIC_BASE_URL,
    payments: {
      enabled: payments.enabled,
      protocol: "x402",
      price: payments.enabled ? payments.price : null,
      network: payments.enabled ? payments.network : null,
    },
    discovery: {
      openapi: `${PUBLIC_BASE_URL}/openapi.json`,
      x402scan: "https://www.x402scan.com/discovery/spec",
      bazaar: "extensions.bazaar on 402 PAYMENT-REQUIRED when payments enabled",
    },
  });
});

app.get("/openapi.json", (c) =>
  c.json(buildOpenApiDocument(), 200, {
    "Cache-Control": "public, max-age=300",
  })
);

app.get("/llms.txt", (c) =>
  c.text(LLMS_TXT, 200, {
    "Content-Type": "text/plain; charset=utf-8",
  })
);

app.get("/health", (c) => {
  const payments = resolvePaymentConfig(readPaymentEnv(c.env));
  return c.json({
    ok: true,
    service: "prepare-context",
    version: "0.1.0",
    token_estimator: TOKEN_ESTIMATOR,
    public_base_url: PUBLIC_BASE_URL,
    openapi: "/openapi.json",
    payments_enabled: payments.enabled,
  });
});

app.post("/v1/prepare", async (c) => {
  // Reached only after x402 middleware (or when payments disabled).
  let body: Partial<PrepareRequest>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body.raw !== "string") {
    return c.json({ error: "raw (string) is required" }, 400);
  }
  if (typeof body.budget_tokens !== "number" || !Number.isFinite(body.budget_tokens)) {
    return c.json({ error: "budget_tokens (number) is required" }, 400);
  }
  const mode = body.mode;
  if (mode !== "tool" && mode !== "history" && mode !== "docs") {
    return c.json({ error: 'mode must be "tool" | "history" | "docs"' }, 400);
  }

  const env = readPaymentEnv(c.env);
  const defaultModel = env.DEFAULT_TARGET_MODEL || "generic";

  const req: PrepareRequest = {
    raw: body.raw,
    budget_tokens: body.budget_tokens,
    mode: mode as PrepareMode,
    schema: body.schema,
    keep: body.keep,
    target_model: body.target_model ?? defaultModel,
  };

  try {
    const result = await prepare(req);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "prepare failed";
    return c.json({ error: message }, 500);
  }
});

export default app;
