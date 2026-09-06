import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolvePaymentConfig,
  resolveFacilitatorUrl,
  DEFAULT_X402_PRICE,
  DEFAULT_X402_NETWORK,
  FACILITATOR_TESTNET,
  FACILITATOR_MAINNET,
  MAINNET_NETWORK,
} from "../server/src/payments.ts";
import { app } from "../server/src/app.ts";

const SAMPLE_BODY = {
  raw: "Short clean status: ok. id=42.",
  budget_tokens: 500,
  mode: "tool",
  target_model: "generic",
};

/** Dummy burn address for local 402 tests only — not a production wallet. */
const DUMMY_PAY_TO = "0x0000000000000000000000000000000000000001";

describe("resolvePaymentConfig", () => {
  it("disabled when PAY_TO unset", () => {
    const cfg = resolvePaymentConfig({});
    assert.equal(cfg.enabled, false);
    assert.equal(cfg.price, DEFAULT_X402_PRICE);
    assert.equal(cfg.network, DEFAULT_X402_NETWORK);
    assert.equal(cfg.facilitatorUrl, FACILITATOR_TESTNET);
  });

  it("enabled when PAY_TO set", () => {
    const cfg = resolvePaymentConfig({ PAY_TO: DUMMY_PAY_TO });
    assert.equal(cfg.enabled, true);
    assert.equal(cfg.payTo, DUMMY_PAY_TO);
  });

  it("disabled when X402_ENABLED=false even with PAY_TO", () => {
    const cfg = resolvePaymentConfig({ PAY_TO: DUMMY_PAY_TO, X402_ENABLED: "false" });
    assert.equal(cfg.enabled, false);
  });

  it("mainnet picks CDP facilitator by default", () => {
    assert.equal(resolveFacilitatorUrl(MAINNET_NETWORK), FACILITATOR_MAINNET);
    const cfg = resolvePaymentConfig({
      PAY_TO: DUMMY_PAY_TO,
      X402_NETWORK: MAINNET_NETWORK,
    });
    assert.equal(cfg.facilitatorUrl, FACILITATOR_MAINNET);
  });

  it("honors X402_FACILITATOR_URL override", () => {
    const url = "https://example.test/facilitator";
    const cfg = resolvePaymentConfig({
      PAY_TO: DUMMY_PAY_TO,
      X402_NETWORK: MAINNET_NETWORK,
      X402_FACILITATOR_URL: url,
    });
    assert.equal(cfg.facilitatorUrl, url);
  });
});

describe("POST /v1/prepare payment gating", () => {
  it("returns 200 when PAY_TO unset (free path)", async () => {
    const res = await app.request(
      "/v1/prepare",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(SAMPLE_BODY),
      },
      {} // empty Worker bindings
    );
    assert.equal(res.status, 200);
    const json = (await res.json()) as { packet?: string };
    assert.ok(typeof json.packet === "string");
  });

  it("returns 402 when PAY_TO set and no payment signature", async () => {
    const res = await app.request(
      "/v1/prepare",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(SAMPLE_BODY),
      },
      {
        PAY_TO: DUMMY_PAY_TO,
        X402_PRICE: "$0.001",
        X402_NETWORK: "eip155:84532",
      }
    );
    assert.equal(res.status, 402);
    const paymentRequired = res.headers.get("PAYMENT-REQUIRED") || res.headers.get("payment-required");
    // Header and/or body should describe payment; at least one must be present.
    const bodyText = await res.text();
    assert.ok(
      (paymentRequired && paymentRequired.length > 0) || /pay|402|accepts|x402/i.test(bodyText),
      `expected PAYMENT-REQUIRED header or payment body, got header=${paymentRequired} body=${bodyText.slice(0, 400)}`
    );
  });

  it("keeps GET /health free even when PAY_TO set", async () => {
    const res = await app.request("/health", { method: "GET" }, { PAY_TO: DUMMY_PAY_TO });
    assert.equal(res.status, 200);
    const json = (await res.json()) as { ok?: boolean; payments_enabled?: boolean };
    assert.equal(json.ok, true);
    assert.equal(json.payments_enabled, true);
  });
});
