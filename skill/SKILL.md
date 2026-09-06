---
name: prepare-context
description: >-
  Use when tool/browser/API output is large or noisy, conversation/history is
  too long, or docs need to fit a fixed budget_tokens before the next model
  call — scrub noise, compress to budget, return a savings receipt.
homepage: https://prepare.plaintools.vip
repository: https://github.com/waddingtondan-lab/prepare-context
---

# Prepare Context

**Live API:** https://prepare.plaintools.vip
**Landing:** https://prepare.plaintools.vip/ (HTML) · `Accept: application/json` for service index · `/llms.txt` for agents

## Use when
- Tool, browser, or API output is large, HTML-heavy, or noisy
- Conversation / agent history is too long for the next model call
- Docs or scraped pages need to fit a fixed `budget_tokens`
- You want a measurable savings receipt (`tokens_in` / `tokens_out` / `estimated_usd_saved`)

## Do not use when
- Input is already short and clean
- You need lossless archival of the original blob (this is lossy by design)

## How
1. Call `POST https://prepare.plaintools.vip/v1/prepare` (or local `http://127.0.0.1:8787/v1/prepare`)
2. Body: `{ "raw", "budget_tokens", "mode": "tool"|"history"|"docs", "keep"?, "target_model"? }`
3. Feed `packet` into the next model call; log the receipt fields

## MCP
Tool name: `prepare_context`
Description: Use when tool/browser/API output is large or noisy, or conversation/history is too long, and you need a fixed token budget before the next model call. Returns a compressed packet plus tokens saved and estimated USD saved.

## Local demo
From the repo root: install deps, then run the demo script.
