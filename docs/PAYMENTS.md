# Payments (x402)

POST /v1/prepare can require an x402 USDC micropayment when PAY_TO is configured.
GET /, GET /health, and GET /llms.txt are always free.

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

Mainnet checklist: set X402_NETWORK=eip155:8453, confirm facilitator URL (or leave unset to use CDP default), put a real PAY_TO, test with a tiny amount first.

## Curl: unpaid to 402

```bash
curl -i https://prepare.plaintools.vip/v1/prepare \
  -H 'Content-Type: application/json' \
  -d '{"raw":"hello","budget_tokens":100,"mode":"tool"}'
```

When payments are enabled and no PAYMENT-SIGNATURE is sent, expect HTTP 402 with a PAYMENT-REQUIRED header (base64 JSON of payment requirements) and typically a JSON body describing accepts / payTo / network / price.

Retry after signing with a compatible x402 client, sending PAYMENT-SIGNATURE. Successful responses may include PAYMENT-RESPONSE.

Legacy clients may use X-PAYMENT / X-PAYMENT-RESPONSE; CORS exposes both sets.

## Buyer / seller quickstart

- Sellers (this service): https://docs.x402.org/getting-started/quickstart-for-sellers
- Buyers / agents: https://docs.x402.org/getting-started/quickstart-for-buyers

## Local Node

Same env vars as Workers. Leave PAY_TO unset for free local/dev. With PAY_TO set, unpaid POST /v1/prepare returns 402.

## Implementation notes

- Middleware: @x402/hono paymentMiddlewareFromConfig built per request from c.env / process.env
- syncFacilitatorOnStart: false (required for Cloudflare Workers)
- Bundle includes @x402/evm (pulls viem). Watch Worker size limits on deploy; if over limit, trim to a minimal verify path or paid Workers plan.
