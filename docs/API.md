# API

**Production (Workers):** `https://prepare-context.<account>.workers.dev` (after wrangler)  
**Production (planned custom):** `https://prepare.plaintools.vip`  
**Local:** `http://127.0.0.1:8787`  

> Branding is Plain Tools. Custom domain attaches when DNS/zone is ready; workers.dev is the interim public API.

## `GET /health`
Returns service metadata including `token_estimator`.

## `POST /v1/prepare`

### Request
```json
{
  "raw": "<string — required>",
  "budget_tokens": 1500,
  "mode": "tool",
  "keep": ["id", "title", "status"],
  "schema": { "id": "string", "title": "string" },
  "target_model": "generic"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `raw` | string | Raw tool/history/docs text |
| `budget_tokens` | number | Max tokens for `packet` |
| `mode` | `"tool"\|"history"\|"docs"` | Scrub strategy |
| `keep` | string[]? | JSON field allow-list |
| `schema` | object \| string[]? | Alternate keep hint |
| `target_model` | string? | `claude-sonnet` \| `gpt-4o` \| `generic` for USD math |

### Response
```json
{
  "packet": "...",
  "tokens_in": 12000,
  "tokens_out": 1400,
  "saved_ratio": 0.8833,
  "estimated_usd_saved": 0.0212,
  "loss_notes": ["Removed 12 script/style/noise nodes", "..."],
  "mode": "tool"
}
```

## Token estimation
MVP uses **characters / 4** (documented heuristic). Optional `js-tiktoken` (`cl100k_base`) when installed.

## Pricing constants ($/MTok, input-heavy)
| Model | $/MTok |
|-------|--------|
| claude-sonnet | 3.0 |
| gpt-4o | 2.5 |
| generic | 2.0 |

## CORS
Open (`*`) for local demos.

## Auth
No API key required for the MVP demo path.
