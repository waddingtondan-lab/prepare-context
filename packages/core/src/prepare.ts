import { scrub } from "./scrubber.js";
import { compress, compressWithLlmOptional } from "./compressor.js";
import { estimateTokensSync } from "./tokens.js";
import { estimateUsdSaved } from "./pricing.js";
import type { PrepareRequest, PrepareResponse } from "./types.js";

export async function prepare(req: PrepareRequest): Promise<PrepareResponse> {
  const raw = req.raw ?? "";
  const budget = Math.max(1, Math.floor(req.budget_tokens));
  const mode = req.mode;
  const loss_notes: string[] = [];

  const tokens_in = estimateTokensSync(raw);

  const scrubbed = scrub(raw, {
    mode,
    schema: req.schema,
    keep: req.keep,
  });
  loss_notes.push(...scrubbed.notes);

  let packet = scrubbed.text;
  const afterScrub = estimateTokensSync(packet);

  if (afterScrub <= budget) {
    loss_notes.push("Under budget after scrub; skip compress");
  } else {
    const llm = await compressWithLlmOptional(packet, budget);
    const compressed = llm ?? compress(packet, budget);
    packet = compressed.text;
    loss_notes.push(...compressed.notes);
  }

  // Final enforce
  let tokens_out = estimateTokensSync(packet);
  if (tokens_out > budget) {
    const maxChars = budget * 4;
    packet = packet.slice(0, Math.max(16, maxChars - 15)).trimEnd() + "\n…[truncated]";
    tokens_out = estimateTokensSync(packet);
    loss_notes.push("Final hard budget enforce");
  }

  const saved_ratio =
    tokens_in === 0 ? 0 : Math.round(((tokens_in - tokens_out) / tokens_in) * 10000) / 10000;

  return {
    packet,
    tokens_in,
    tokens_out,
    saved_ratio,
    estimated_usd_saved: estimateUsdSaved(tokens_in, tokens_out, req.target_model),
    loss_notes,
    mode,
  };
}
