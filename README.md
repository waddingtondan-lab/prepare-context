# Prepare Context

**Agent-facing context scrubber + compressor** with savings receipts.

| | |
|--|--|
| **Brand** | Plain Tools |
| **API (Workers)** | `https://prepare-context.<account>.workers.dev` (after wrangler) |
| **API (planned custom)** | https://prepare.plaintools.vip |
| **Repo** | https://github.com/waddingtondan-lab/prepare-context |
| **Local** | `http://127.0.0.1:8787` |

> Product branding is **Plain Tools** / `prepare.plaintools.vip`. Production target is **Cloudflare Workers**; custom domain attaches when DNS/zone is ready. See **Deploy** below.

## Why agents call this

Before an expensive model call:

1. **Scrub** noisy tool/API/browser output (HTML/CSS/scripts → clean text; optional JSON `keep`)
2. **Compress** into a fixed `budget_tokens`
3. **Return a receipt**: `tokens_in` / `tokens_out` / `saved_ratio` / `estimated_usd_saved` / `loss_notes`

No API key required for the MVP demo path (deterministic scrub + extractive compress).

## Quick start

```bash
npm install
npm run demo          # prints a savings receipt (tokens_in >> tokens_out)
npm test
npm run dev           # HTTP API on :8787
```

Demo loads `examples/fat-sample.html`, scrubs scripts/styles, packs to a budget, and prints USD saved.

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

CORS is open for local demos. See [docs/API.md](docs/API.md).

## Packages

| Path | Role |
|------|------|
| `packages/core` | Scrub + compress + tokens + pricing |
| `server` | Hono HTTP API |
| `packages/sdk-ts` | `prepareContext(...)` |
| `packages/sdk-py` | Python mirror client |
| `mcp` | MCP tool `prepare_context` |
| `skill/SKILL.md` | Cursor-style skill card |
| `examples/` | Fat HTML + demo + middleware snippet |


## Deploy

**Cloudflare Workers** — preferred for production:

1. `npm install` then `npx wrangler login` (or set `CLOUDFLARE_API_TOKEN`).
2. Build core, then publish the Worker: `npm run build -w @prepare-context/core && npx wrangler deploy`.
3. Interim URL: `https://prepare-context.<your-subdomain>.workers.dev` — verify with `GET /health`.
4. Custom domain **prepare.plaintools.vip**: attach in Workers Custom Domains when the zone is on Cloudflare. If DNS stays on Porkbun, add only a `prepare` CNAME to the Workers target Cloudflare shows. See [docs/DNS.md](docs/DNS.md).

Local Node API unchanged: `npm run dev` (Hono + `@hono/node-server` on `:8787`).

**Render / Docker** (optional backups): `render.yaml` and `Dockerfile` still work (`HOST=0.0.0.0`, health `/health`).

## MCP tool

**Name:** `prepare_context`  

**Description:** Use when tool/browser/API output is large or noisy, or conversation/history is too long, and you need a fixed token budget before the next model call. Returns a compressed packet plus tokens saved and estimated USD saved.

See `mcp/tool-card.json`.

## Token estimation

Default: **characters / 4**. Optional `js-tiktoken` (`cl100k_base`) when installed. Documented in API responses via `/health`.

## Pricing constants ($/MTok)

Hardcoded estimates for receipts: `claude-sonnet` 3.0 · `gpt-4o` 2.5 · `generic` 2.0.

## Payments

Not in MVP. Future x402/USDC + API-key credits — see [docs/PAYMENTS.md](docs/PAYMENTS.md).

## Docs

- [WHEN_TO_USE.md](docs/WHEN_TO_USE.md)
- [API.md](docs/API.md)
- [AGENTS.md](docs/AGENTS.md)
- [PAYMENTS.md](docs/PAYMENTS.md)
- [DNS.md](docs/DNS.md) — Porkbun CNAME for prepare.plaintools.vip

## License

MIT
