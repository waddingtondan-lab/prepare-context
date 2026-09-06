# Prepare Context

**Agent-facing context scrubber + compressor** with savings receipts.

| | |
|--|--|
| **Brand** | Plain Tools |
| **Live API + landing** | https://prepare.plaintools.vip |
| **JSON index** | `GET /` with `Accept: application/json` |
| **Agent summary** | https://prepare.plaintools.vip/llms.txt |
| **Repo** | https://github.com/waddingtondan-lab/prepare-context |
| **Local** | `http://127.0.0.1:8787` |

Open https://prepare.plaintools.vip/ in a browser for the agent/builder landing page (example request, demo receipt, MCP). Agents should prefer `/llms.txt` or `Accept: application/json`.

## Why agents call this

Before an expensive model call:

1. **Scrub** noisy tool/API/browser output (HTML/CSS/scripts → clean text; optional JSON `keep`)
2. **Compress** into a fixed `budget_tokens`
3. **Return a receipt**: `tokens_in` / `tokens_out` / `saved_ratio` / `estimated_usd_saved` / `loss_notes`

No API key. When x402 is enabled on the live API, unpaid prepare returns HTTP 402; otherwise the heuristic path is free (deterministic scrub + extractive compress).

## Quick start

Live endpoint: `POST https://prepare.plaintools.vip/v1/prepare`

Local: install workspace deps, run the demo script, tests, and `dev` server on :8787.

Demo loads `examples/fat-sample.html`, scrubs scripts/styles, packs to a budget, and prints USD saved.

**Verified demo receipt** (local fat HTML sample, not a customer case study): **8932 → 800 tokens** (~91% saved, ~$0.016 at generic $2/MTok).

## HTTP API

`POST /v1/prepare`

```json
{
  "raw": "<html>...huge tool dump...</html>",
  "budget_tokens": 800,
  "mode": "tool",
  "keep": ["id", "title", "status"],
  "target_model": "generic"
}
```

`GET /health` — liveness + token estimator info.
`GET /llms.txt` — short machine-readable agent summary.
`GET /` — HTML landing (browsers) or JSON service index (`Accept: application/json`).
`GET /openapi.json` — OpenAPI 3.1 for x402scan / agent discovery.

CORS is open for local demos. See [docs/API.md](docs/API.md).

## Packages

| Path | Role |
|------|------|
| `packages/core` | Scrub + compress + tokens + pricing |
| `server` | Hono HTTP API (+ Worker landing) |
| `packages/sdk-ts` | `prepareContext(...)` |
| `packages/sdk-py` | Python mirror client |
| `mcp` | MCP tool `prepare_context` |
| `skill/SKILL.md` | Cursor-style skill card |
| `examples/` | Fat HTML + demo + middleware snippet |

## Deploy

**Cloudflare Workers** — production on **prepare.plaintools.vip**. Build core, then `wrangler deploy`. See [docs/DNS.md](docs/DNS.md).

Local Node API: workspace `dev` script (Hono on `:8787`). Render/Docker backups remain in-repo.

## MCP tool

**Name:** `prepare_context`

**Description:** Use when tool/browser/API output is large or noisy, or conversation/history is too long, and you need a fixed token budget before the next model call. Returns a compressed packet plus tokens saved and estimated USD saved.

See `mcp/tool-card.json`.

## Token estimation

Default: **characters / 4**. Optional `js-tiktoken` (`cl100k_base`) when installed. Documented in API responses via `/health`.

## Pricing constants ($/MTok)

Hardcoded estimates for receipts: `claude-sonnet` 3.0 · `gpt-4o` 2.5 · `generic` 2.0.

## Payments

Optional **x402** gating on `POST /v1/prepare` when `PAY_TO` is set (default `$0.01` USDC on Base mainnet). Landing/health/llms/openapi stay free. See [docs/PAYMENTS.md](docs/PAYMENTS.md).

## Discovery

| | |
|--|--|
| **OpenAPI** | https://prepare.plaintools.vip/openapi.json |
| **x402scan** | Publish OpenAPI, then register-origin with SIWX (manual — needs wallet auth). Spec: https://www.x402scan.com/discovery/spec |
| **Bazaar** | `declareDiscoveryExtension` on paid route; CDP indexing needs a CDP facilitator settlement (we use PayAI — see PAYMENTS.md). |

Do not auto-register on x402scan without explicit approval.

## Docs

- [WHEN_TO_USE.md](docs/WHEN_TO_USE.md)
- [API.md](docs/API.md)
- [AGENTS.md](docs/AGENTS.md)
- [PAYMENTS.md](docs/PAYMENTS.md)
- [DNS.md](docs/DNS.md)

## License

MIT
