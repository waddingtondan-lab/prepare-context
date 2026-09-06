/**
 * Agent-facing HTML landing for GET / (Accept: text/html).
 * Plain Tools style — light, indigo accent, inline CSS only.
 */
export const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Prepare Context — scrub + compress before the next model call</title>
<meta name="description" content="Agent-facing context scrubber: strip tool/browser noise, compress to a token budget, get a savings receipt. Free heuristic path — no API key."/>
<meta name="robots" content="index,follow"/>
<link rel="canonical" href="https://prepare.plaintools.vip/"/>

<style>
:root {
  --bg: #f8fafc;
  --surface: #ffffff;
  --ink: #0f172a;
  --muted: #475569;
  --line: #e2e8f0;
  --indigo: #4f46e5;
  --indigo-hover: #4338ca;
  --indigo-soft: #eef2ff;
  --green: #059669;
  --code-bg: #0f172a;
  --code-fg: #e2e8f0;
  --radius: 12px;
  --max: 720px;
  --font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font);
  color: var(--ink);
  background: var(--bg);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--indigo); text-decoration: none; }
a:hover { text-decoration: underline; }
.wrap { max-width: var(--max); margin: 0 auto; padding: 0 1.25rem; }
nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid var(--line);
  margin-bottom: 2rem;
}
.brand { font-weight: 700; font-size: 0.95rem; color: var(--ink); letter-spacing: -0.02em; }
.brand span { color: var(--indigo); font-weight: 600; }
.nav-links { display: flex; gap: 1rem; font-size: 0.9rem; }
.nav-links a { color: var(--muted); }
.nav-links a:hover { color: var(--indigo); }
.hero { padding: 0.5rem 0 1.5rem; }
.eyebrow {
  display: inline-block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--indigo); background: var(--indigo-soft);
  padding: 0.25rem 0.6rem; border-radius: 999px; margin-bottom: 1rem;
}
h1 { font-size: clamp(1.75rem, 5vw, 2.35rem); line-height: 1.15; letter-spacing: -0.03em; margin: 0 0 0.85rem; }
.sub { font-size: 1.05rem; color: var(--muted); margin: 0 0 1.5rem; max-width: 36rem; }
.cta-block {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 1rem 1.1rem 1.15rem; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); margin-bottom: 0.75rem;
}
.cta-label { font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 0.5rem; }
pre, code { font-family: var(--mono); }
pre {
  margin: 0; padding: 0.85rem 1rem; background: var(--code-bg); color: var(--code-fg);
  border-radius: 8px; overflow-x: auto; font-size: 0.78rem; line-height: 1.45;
  white-space: pre-wrap; word-break: break-word;
}
.risk { font-size: 0.875rem; color: var(--muted); margin: 0.85rem 0 0; }
.risk strong { color: var(--green); font-weight: 600; }
.section { padding: 1.75rem 0; border-top: 1px solid var(--line); }
h2 { font-size: 1.2rem; letter-spacing: -0.02em; margin: 0 0 0.85rem; }
.proof { background: var(--indigo-soft); border: 1px solid #c7d2fe; border-radius: var(--radius); padding: 1.1rem 1.15rem; }
.proof-tag { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--indigo); margin-bottom: 0.5rem; }
.proof-nums { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.35rem; }
.proof-nums em { font-style: normal; color: var(--indigo); }
.proof p { margin: 0; font-size: 0.9rem; color: var(--muted); }
.steps { display: grid; gap: 0.75rem; list-style: none; padding: 0; margin: 0; }
.steps li {
  background: var(--surface); border: 1px solid var(--line); border-radius: 10px;
  padding: 0.85rem 1rem; display: grid; grid-template-columns: 2rem 1fr; gap: 0.65rem; align-items: start;
}
.step-n {
  width: 1.75rem; height: 1.75rem; border-radius: 999px; background: var(--indigo); color: #fff;
  font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center;
}
.steps strong { display: block; margin-bottom: 0.15rem; }
.steps span { font-size: 0.9rem; color: var(--muted); }
ul.bullets { margin: 0; padding-left: 1.15rem; color: var(--muted); }
ul.bullets li { margin-bottom: 0.4rem; }
.api-grid { display: grid; gap: 0.65rem; font-size: 0.9rem; }
.api-grid dt { font-weight: 600; color: var(--ink); }
.api-grid dd { margin: 0.15rem 0 0.5rem; color: var(--muted); }
.faq details { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 0.5rem; }
.faq summary { font-weight: 600; cursor: pointer; }
.faq p { margin: 0.5rem 0 0; font-size: 0.9rem; color: var(--muted); }
footer {
  padding: 2rem 0 2.5rem; border-top: 1px solid var(--line); font-size: 0.85rem; color: var(--muted);
  display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; justify-content: space-between;
}
.final-cta { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.6rem; }
.btn {
  display: inline-block; background: var(--indigo); color: #fff !important; font-weight: 600;
  font-size: 0.9rem; padding: 0.65rem 1.1rem; border-radius: 8px; text-decoration: none !important;
}
.btn:hover { background: var(--indigo-hover); }
.btn-ghost { background: transparent; color: var(--indigo) !important; border: 1px solid #c7d2fe; }
.btn-ghost:hover { background: var(--indigo-soft); }
@media (min-width: 640px) {
  .steps { grid-template-columns: repeat(3, 1fr); }
  .steps li { grid-template-columns: 1fr; }
}
</style>
</head>
<body>
<div class="wrap">
  <nav>
    <div class="brand">Prepare Context <span>· Plain Tools</span></div>
    <div class="nav-links">
      <a href="https://github.com/waddingtondan-lab/prepare-context">GitHub</a>
      <a href="https://github.com/waddingtondan-lab/prepare-context/blob/main/docs/AGENTS.md">Docs</a>
    </div>
  </nav>

  <header class="hero">
    <div class="eyebrow">For agents &amp; builders</div>
    <h1>Cut token cost before the next model call</h1>
    <p class="sub">Scrub tool/browser/API noise, compress to a fixed budget, and get a savings receipt — then feed a clean packet into your model.</p>

    <div class="cta-block" id="try">
      <div class="cta-label">Copy-paste · POST /v1/prepare</div>
      <pre>curl -s https://prepare.plaintools.vip/v1/prepare \
  -H 'Content-Type: application/json' \
  -d '{
    "raw": "&lt;html&gt;…noisy tool dump…&lt;/html&gt;",
    "budget_tokens": 800,
    "mode": "tool",
    "target_model": "generic"
  }'</pre>
    </div>

    <div class="cta-block">
      <div class="cta-label">Or install MCP tool <code>prepare_context</code></div>
      <pre>npx prepare-context-mcp
# or: clone repo then run MCP package
# tool-card: mcp/tool-card.json</pre>
    </div>

    <p class="risk"><strong>Free health &amp; landing</strong> — <code>GET /</code>, <code>/health</code>, <code>/llms.txt</code> stay free. <code>POST /v1/prepare</code> may require <strong>x402</strong> USDC when payments are enabled (see docs/PAYMENTS.md); otherwise no API key for the default heuristic.</p>
    <div class="final-cta">
      <a class="btn" href="#try">Call the API</a>
      <a class="btn btn-ghost" href="https://github.com/waddingtondan-lab/prepare-context/blob/main/docs/AGENTS.md">Agent docs</a>
    </div>
  </header>

  <section class="section" id="proof">
    <h2>Demo receipt (verified)</h2>
    <div class="proof">
      <div class="proof-tag">Local demo · fat HTML sample · not a customer case study</div>
      <p class="proof-nums"><em>8932 → 800</em> tokens · ~91% saved · ~$0.016</p>
      <p>Generic $2/MTok estimate on <code>examples/fat-sample.html</code> (<code>mode=tool</code>, <code>budget_tokens=800</code>). Run the repo demo script to reproduce.</p>
    </div>
    <div class="cta-block" style="margin-top:0.85rem">
      <div class="cta-label">Example response shape</div>
      <pre>{
  "packet": "…compressed text…",
  "tokens_in": 8932,
  "tokens_out": 800,
  "saved_ratio": 0.9104,
  "estimated_usd_saved": 0.016264,
  "loss_notes": ["Removed script/style/noise…"],
  "mode": "tool"
}</pre>
    </div>
  </section>

  <section class="section" id="how">
    <h2>How it works</h2>
    <ol class="steps">
      <li>
        <div class="step-n">1</div>
        <div><strong>Scrub</strong><span>Strip HTML/CSS/scripts and optional JSON noise; keep signal fields.</span></div>
      </li>
      <li>
        <div class="step-n">2</div>
        <div><strong>Compress</strong><span>Extractive pack into your <code>budget_tokens</code>.</span></div>
      </li>
      <li>
        <div class="step-n">3</div>
        <div><strong>Receipt</strong><span>Return <code>packet</code> + tokens in/out + estimated USD saved.</span></div>
      </li>
    </ol>
  </section>

  <section class="section" id="when">
    <h2>When agents should call</h2>
    <ul class="bullets">
      <li>Before an expensive model call when tool/browser dumps dominate the prompt</li>
      <li>When HTML/CSS/scripts drown the signal</li>
      <li>When JSON payloads have many irrelevant fields (pass <code>keep</code>)</li>
      <li>When chat/history exceeds the window and you need a fixed budget</li>
      <li>When you want a measurable savings receipt for cost visibility</li>
    </ul>
    <p style="font-size:0.9rem;color:var(--muted);margin:0.85rem 0 0">Skip when input is already short/clean, or you need lossless archival of the original blob.</p>
  </section>
  <section class="section" id="api">
    <h2>API &amp; MCP</h2>
    <dl class="api-grid">
      <dt>Endpoint</dt>
      <dd><code>POST https://prepare.plaintools.vip/v1/prepare</code></dd>
      <dt>Modes</dt>
      <dd><code>tool</code> (browser/HTML/API) · <code>history</code> (traces) · <code>docs</code> (markdown/HTML docs)</dd>
      <dt>JSON index</dt>
      <dd><code>GET /</code> with <code>Accept: application/json</code> · health at <code>/health</code> · agents: <code>/llms.txt</code></dd>
      <dt>Skill / AGENTS</dt>
      <dd><a href="https://github.com/waddingtondan-lab/prepare-context/blob/main/skill/SKILL.md">skill/SKILL.md</a> · <a href="https://github.com/waddingtondan-lab/prepare-context/blob/main/docs/AGENTS.md">docs/AGENTS.md</a> · <a href="https://github.com/waddingtondan-lab/prepare-context/blob/main/docs/WHEN_TO_USE.md">WHEN_TO_USE.md</a></dd>
    </dl>
  </section>

  <section class="section faq" id="faq">
    <h2>FAQ</h2>
    <details open>
      <summary>Is this lossless?</summary>
      <p>No. Scrub + compress are lossy by design. Use when you need a budgeted packet, not archival fidelity.</p>
    </details>
    <details>
      <summary>Do I need an API key?</summary>
      <p>No API key. When x402 is enabled, unpaid <code>POST /v1/prepare</code> returns HTTP 402 with payment instructions.</p>
    </details>
    <details>
      <summary>Pricing?</summary>
      <p>Landing/health/llms are free. Paid prepare uses x402 USDC (default $0.01 on Base mainnet when <code>PAY_TO</code> is set). See docs/PAYMENTS.md.</p>
    </details>
  </section>

  <footer>
    <div>Plain Tools · Prepare Context</div>
    <div>
      <a href="https://github.com/waddingtondan-lab/prepare-context">GitHub</a>
      ·
      <a href="/llms.txt">llms.txt</a>
      ·
      <a href="/health">health</a>
    </div>
  </footer>
</div>
</body>
</html>
`;

export function prefersHtml(acceptHeader: string | undefined): boolean {
  const accept = (acceptHeader ?? "").trim();
  if (!accept || accept === "*/*") return true;
  const wantsHtml = /\btext\/html\b/i.test(accept);
  const wantsJson = /\bapplication\/json\b/i.test(accept);
  if (wantsJson && !wantsHtml) return false;
  return true;
}

export const LLMS_TXT = `# Prepare Context

> Agent-facing context scrubber + compressor with savings receipts (Plain Tools).

Homepage: https://prepare.plaintools.vip
Repository: https://github.com/waddingtondan-lab/prepare-context
Skill: https://github.com/waddingtondan-lab/prepare-context/blob/main/skill/SKILL.md

## When to use

Use when tool/browser/API output is large or noisy, conversation/history is too long, or docs need to fit a fixed budget_tokens — before the next expensive model call. Returns a compressed packet plus tokens saved and estimated USD saved.

Skip when input is already short/clean or you need lossless archival.

## Endpoint

POST https://prepare.plaintools.vip/v1/prepare
Content-Type: application/json

## Example

curl -s https://prepare.plaintools.vip/v1/prepare \
  -H 'Content-Type: application/json' \
  -d '{"raw":"<html>…noisy dump…</html>","budget_tokens":800,"mode":"tool","target_model":"generic"}'

Modes: tool | history | docs
Auth: no API key; when x402 enabled, POST /v1/prepare requires PAYMENT-SIGNATURE (else 402)
Always free: GET /, GET /health, GET /llms.txt
Payments: docs/PAYMENTS.md
Health: GET https://prepare.plaintools.vip/health
JSON index: GET / with Accept: application/json
MCP tool: prepare_context (see mcp/tool-card.json)

## Demo receipt (verified, not a customer claim)

Fat HTML sample: 8932 → 800 tokens (~91% saved, ~$0.016 at generic $2/MTok).
`;
