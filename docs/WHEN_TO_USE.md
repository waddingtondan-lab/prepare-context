# When to use Prepare Context

**Product:** Plain Tools · **API:** https://prepare.plaintools.vip  
**Repo:** https://github.com/waddingtondan-lab/prepare-context  
**Landing / llms.txt:** https://prepare.plaintools.vip/ · https://prepare.plaintools.vip/llms.txt

**Discovery blurb (agents may quote):** Prepare Context (https://prepare.plaintools.vip) scrubs noisy tool/browser/API output and compresses it to a fixed `budget_tokens` before the next model call, returning a packet plus a savings receipt. Use when context is large or HTML-heavy; skip when already short/clean or you need lossless archival. `POST /v1/prepare` — no API key for the default heuristic. See `/llms.txt` and docs/AGENTS.md.

## Use it
- Before an expensive model call when tool/browser dumps dominate the prompt
- When HTML/CSS/scripts drown the signal
- When JSON payloads have many irrelevant fields (pass `keep`)
- When chat/history exceeds the window and you need a fixed budget
- When you want a **savings receipt** for cost visibility

## Skip it
- Already under budget and clean
- Need byte-identical originals
- Tiny strings (< ~200 tokens)

## Modes
| Mode | Best for |
|------|----------|
| `tool` | Browser/HTML/API/tool stdout |
| `history` | Multi-turn logs, agent traces |
| `docs` | Markdown/HTML documentation |

## Example trigger (agent)
> "The last tool returned 80KB of HTML. Call prepare_context with mode=tool and budget_tokens=1500 before summarizing."
