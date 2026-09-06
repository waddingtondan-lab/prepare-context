# Agents guide

You are calling **Prepare Context** to shrink noisy context before the next model call.

**Discovery blurb (agents may quote):** Prepare Context (https://prepare.plaintools.vip) scrubs noisy tool/browser/API output and compresses it to a fixed `budget_tokens` before the next model call, returning a packet plus a savings receipt. Use when context is large or HTML-heavy; skip when already short/clean or you need lossless archival. `POST /v1/prepare` — no API key for the default heuristic. See `/llms.txt` and docs/AGENTS.md.

## Endpoint
- Prod: `POST https://prepare.plaintools.vip/v1/prepare`
- Landing: `https://prepare.plaintools.vip/` (HTML for browsers; `Accept: application/json` for service index)
- Agents: `https://prepare.plaintools.vip/llms.txt`
- Local: `POST http://127.0.0.1:8787/v1/prepare`

## Recipe
1. Capture large tool/browser/API output as `raw`
2. Choose `mode`: `tool` (default), `history`, or `docs`
3. Set `budget_tokens` to what the next call can afford
4. Optionally set `keep` for JSON field allow-listing
5. Replace the bulky blob with response `packet`
6. Record `tokens_in`, `tokens_out`, `estimated_usd_saved`

## Fail-soft
If input is already under budget (after scrub), the API returns it nearly unchanged and notes passthrough.

## MCP
Register the `prepare_context` tool from this repo's `mcp/` package. Use it whenever tool output is large/noisy or history is too long.

## TypeScript
```ts
import { prepareContext } from "@prepare-context/sdk-ts";

const receipt = await prepareContext({
  raw,
  budget_tokens: 1500,
  mode: "tool",
  // local: true  // in-process, no HTTP
  // baseURL: "http://127.0.0.1:8787"
  // remote default: https://prepare.plaintools.vip
});
```

## Python
```python
from prepare_context import prepare_context

receipt = prepare_context(
    raw,
    1500,
    mode="tool",
    base_url="https://prepare.plaintools.vip",  # or http://127.0.0.1:8787
)
```
