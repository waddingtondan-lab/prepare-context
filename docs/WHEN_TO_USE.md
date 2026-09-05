# When to use Prepare Context

**Product:** Plain Tools · **API:** https://prepare.plaintools.vip  
**Repo:** https://github.com/waddingtondan-lab/prepare-context

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
