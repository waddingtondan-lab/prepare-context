# Agents guide

You are calling **Prepare Context** to shrink noisy context before the next model call.

## Endpoint
- Prod: `POST https://prepare.plaintools.vip/v1/prepare`
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
  // remote default branding: https://prepare.plaintools.vip
});
```

## Python
```python
from prepare_context import prepare_context

receipt = prepare_context(
    raw,
    1500,
    mode="tool",
    base_url="http://127.0.0.1:8787",  # or https://prepare.plaintools.vip
)
```
