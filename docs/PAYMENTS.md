# Payments (x402)

POST /v1/prepare can require an x402 USDC micropayment when PAY_TO is configured.
GET /, GET /health, GET /llms.txt, and GET /openapi.json are always free.

If PAY_TO is unset, behavior matches the free MVP (no HTTP 402) so local/dev keeps working.

## Enable on Cloudflare Workers

Set the receiving wallet as a Worker secret (do not commit it into wrangler.toml vars):

```bash
npx wrangler secret put PAY_TO
```

Optional: set X402_ENABLED to false to force free even if PAY_TO exists.

Non-secret defaults live in wrangler.toml [vars]:

| Var | Default | Notes |
|-----|---------|--------|
| X402_PRICE | $0.01 | Exact USDC price string |
| X402_NETWORK | eip155:8453 | Base mainnet (real USDC) |
| X402_FACILITATOR_URL | (derived) | See table below |
| X402_ENABLED | unset | Set to false to disable gating while keeping PAY_TO |

Redeploy after changing secrets/vars: npx wrangler deploy.

## Testnet vs mainnet

| | Testnet | Mainnet (default now) |
|--|-------------------|---------|
| X402_NETWORK | eip155:84532 (Base Sepolia) | eip155:8453 (Base) |
| Facilitator | https://x402.org/facilitator | https://facilitator.payai.network |
| Asset | USDC on Base Sepolia | USDC on Base |
| Scheme | exact via @x402/evm ExactEvmScheme | same |

Override facilitator explicitly with X402_FACILITATOR_URL if needed.

Production currently uses **PayAI** (`https://facilitator.payai.network`) on Base mainnet, not the CDP default facilitator URL.

## Curl: unpaid to 402

```bash
curl -i https://prepare.plaintools.vip/v1/prepare \
  -H 'Content-Type: application/json' \
  -d '{"raw":"hello","budget_tokens":100,"mode":"tool"}'
```

Empty / minimal body probes also return 402 when payments are enabled (x402 middleware runs before JSON body validation):

```bash
curl -i -X POST https://prepare.plaintools.vip/v1/prepare
curl -i -X POST https://prepare.plaintools.vip/v1/prepare \
  -H 'Content-Type: application/json' -d '{}'
```

When payments are enabled and no PAYMENT-SIGNATURE is sent, expect HTTP 402 with a PAYMENT-REQUIRED header (base64 JSON of payment requirements) and typically a JSON body describing accepts / payTo / network / price. Decoded PAYMENT-REQUIRED may include `extensions.bazaar` discovery metadata (input/output schemas).

Retry after signing with a compatible x402 client, sending PAYMENT-SIGNATURE. Successful responses may include PAYMENT-RESPONSE.

Legacy clients may use X-PAYMENT / X-PAYMENT-RESPONSE; CORS exposes both sets.

## Discovery (x402scan + Bazaar)

### OpenAPI (x402scan)

Canonical discovery document:

- **https://prepare.plaintools.vip/openapi.json**

It describes `POST /v1/prepare` with request/response schemas, `responses["402"]`, and `x-payment-info` (`fixed` `$0.01` USD + `protocols: [{ x402: {} }]`).

Validate locally (no registration):

```bash
npx -y @agentcash/discovery@latest discover https://prepare.plaintools.vip
npx -y @agentcash/discovery@latest check https://prepare.plaintools.vip/v1/prepare
```

### Register on x402scan (manual — needs Dan)

Registration is **not** automatic. `POST https://x402scan.com/api/x402/registry/register-origin` with body `{ "origin": "https://prepare.plaintools.vip" }` requires **SIWX wallet auth** in a browser (or agentcash `fetch_with_auth`). Do not register until discovery/probe audits are clean **and** Dan explicitly approves.

UI handoff: https://www.x402scan.com/resources/register (or https://x402scan.com/resources/register)

Spec: https://www.x402scan.com/discovery/spec

### Bazaar / CDP indexing

Route config registers `@x402/extensions` `bazaarResourceServerExtension` and `declareDiscoveryExtension({ input, inputSchema, output })` on `POST /v1/prepare`, so unpaid 402 challenges can carry Bazaar discovery metadata.

**Honest blocker:** Coinbase CDP Bazaar catalogs resources after a **successful settlement through the CDP facilitator** (`https://api.cdp.coinbase.com/platform/v2/x402`). This deployment settles via **PayAI** (`https://facilitator.payai.network`). PayAI may or may not index Bazaar the same way; CDP listing is not guaranteed while facilitator is PayAI. Options later:

1. Keep PayAI for settle + rely on x402scan OpenAPI registration for discoverability.
2. Point `X402_FACILITATOR_URL` at CDP and complete one real paid settle so CDP Bazaar can index (costs real USDC).
3. Confirm with PayAI whether they expose a Bazaar/discovery catalog.

We do **not** invent a paid settlement in CI or deploy scripts.

## Buyer / seller quickstart

- Sellers (this service): https://docs.x402.org/getting-started/quickstart-for-sellers
- Buyers / agents: https://docs.x402.org/getting-started/quickstart-for-buyers
- Bazaar extension: https://docs.x402.org/extensions/overview

## Local Node

Same env vars as Workers. Leave PAY_TO unset for free local/dev. With PAY_TO set, unpaid POST /v1/prepare returns 402 (including empty-body probes).

## Implementation notes

- Middleware: `@x402/hono` `paymentMiddleware` built per request from `c.env` / `process.env`
- Order: global x402 middleware **before** `/v1/prepare` handler body parse
- `syncFacilitatorOnStart: false` + explicit `server.initialize()` (required for Cloudflare Workers)
- Bundle includes `@x402/evm` (pulls viem) and `@x402/extensions` (Bazaar). Watch Worker size limits on deploy.
