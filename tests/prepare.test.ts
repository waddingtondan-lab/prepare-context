import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prepare, scrub, estimateTokensSync, estimateUsdSaved } from "@prepare-context/core";

describe("HTML scrub", () => {
  it("strips scripts and styles", async () => {
    const raw = `<html><head><style>.x{color:red}</style><script>alert(1)</script></head>
      <body><h1>Hello</h1><p>World</p><script>void(0)</script></body></html>`;
    const { text, notes } = scrub(raw, { mode: "tool" });
    assert.ok(!/alert\(1\)/.test(text));
    assert.ok(!/color:red/.test(text));
    assert.ok(/Hello/.test(text));
    assert.ok(/World/.test(text));
    assert.ok(notes.some((n) => /script|style|noise/i.test(n)));
  });
});

describe("schema/keep", () => {
  it("keeps only requested JSON fields", () => {
    const raw = JSON.stringify({
      id: "1",
      title: "T",
      noise: "xxx",
      nested: { status: "ok", drop: true },
    });
    const { text } = scrub(raw, { mode: "tool", keep: ["id", "title", "status"] });
    const parsed = JSON.parse(text);
    assert.equal(parsed.id, "1");
    assert.equal(parsed.title, "T");
    assert.equal(parsed.noise, undefined);
    assert.equal(parsed.nested?.status, "ok");
    assert.equal(parsed.nested?.drop, undefined);
  });
});

describe("budget", () => {
  it("respects budget within ±10%", async () => {
    const raw = Array.from({ length: 200 }, (_, i) =>
      `Paragraph ${i}. Important status id=${i} result=ok. ` + "word ".repeat(40)
    ).join("\n\n");
    const budget = 500;
    const res = await prepare({ raw, budget_tokens: budget, mode: "docs", target_model: "generic" });
    assert.ok(res.tokens_out <= budget * 1.1, `tokens_out ${res.tokens_out} > 110% of ${budget}`);
    assert.ok(res.tokens_in > res.tokens_out);
  });

  it("passthrough when under budget", async () => {
    const raw = "Short clean status: ok. id=42.";
    const res = await prepare({ raw, budget_tokens: 5000, mode: "tool" });
    assert.ok(res.loss_notes.some((n) => /under budget|passthrough/i.test(n)));
    assert.ok(res.packet.includes("id=42"));
    assert.equal(res.tokens_out, estimateTokensSync(res.packet));
  });
});

describe("savings math", () => {
  it("computes usd saved from token delta", () => {
    // generic = $2 / MTok; save 1_000_000 tokens => $2
    assert.equal(estimateUsdSaved(1_000_000, 0, "generic"), 2);
    assert.equal(estimateUsdSaved(1000, 1000, "generic"), 0);
    const usd = estimateUsdSaved(10_000, 1_000, "claude-sonnet");
    // saved 9000 tok * $3 / 1e6 = 0.027
    assert.equal(usd, 0.027);
  });

  it("receipt fields present", async () => {
    const raw = "<html><script>x</script><body>" + "lorem ".repeat(2000) + " RESULT:42</body></html>";
    const res = await prepare({ raw, budget_tokens: 300, mode: "tool", target_model: "gpt-4o" });
    assert.ok(typeof res.saved_ratio === "number");
    assert.ok(res.saved_ratio >= 0 && res.saved_ratio <= 1);
    assert.ok(res.estimated_usd_saved >= 0);
    assert.equal(res.mode, "tool");
  });
});
