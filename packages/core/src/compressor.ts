import { estimateTokensSync } from "./tokens.js";

export interface CompressResult {
  text: string;
  notes: string[];
}

/**
 * Extractive/heuristic compressor: keeps high-signal sentences/chunks under budget.
 * Optional LLM path is env-gated and not required for demo.
 */
export function compress(text: string, budgetTokens: number): CompressResult {
  const notes: string[] = [];
  if (!text) return { text: "", notes: ["Empty after scrub"] };

  const tokens = estimateTokensSync(text);
  if (tokens <= budgetTokens) {
    notes.push("Already under budget; passthrough");
    return { text, notes };
  }

  // Prefer paragraph/sentence units
  const units = splitUnits(text);
  if (units.length === 0) {
    const clipped = clipToBudget(text, budgetTokens);
    notes.push("Hard-clipped to budget (no sentence boundaries)");
    return { text: clipped, notes };
  }

  const scored = units.map((u, i) => ({
    u,
    i,
    score: scoreUnit(u, i, units.length),
    tokens: estimateTokensSync(u),
  }));

  // Always keep first + last unit when possible (context anchors)
  const selected = new Set<number>();
  let used = 0;
  const tryAdd = (idx: number) => {
    const item = scored[idx];
    if (!item || selected.has(idx)) return;
    if (used + item.tokens > budgetTokens && selected.size > 0) return;
    if (used + item.tokens > budgetTokens && selected.size === 0) {
      // keep a clipped version of the first unit
      return;
    }
    selected.add(idx);
    used += item.tokens;
  };

  tryAdd(0);
  if (units.length > 1) tryAdd(units.length - 1);

  // Fill by score descending
  const order = [...scored].sort((a, b) => b.score - a.score || a.i - b.i);
  for (const item of order) {
    if (used >= budgetTokens) break;
    tryAdd(item.i);
  }

  // If still empty (single huge unit), hard clip
  if (selected.size === 0) {
    const clipped = clipToBudget(text, budgetTokens);
    notes.push("Hard-clipped oversized first unit to budget");
    return { text: clipped, notes };
  }

  const kept = [...selected].sort((a, b) => a - b).map((i) => units[i]!);
  let out = kept.join("\n\n");
  let outTokens = estimateTokensSync(out);

  // If still over (anchor units alone too big), clip
  if (outTokens > budgetTokens) {
    out = clipToBudget(out, budgetTokens);
    outTokens = estimateTokensSync(out);
    notes.push("Post-selection clip to enforce budget");
  }

  const dropped = units.length - selected.size;
  notes.push(
    `Extractive compress: kept ${selected.size}/${units.length} units (~${outTokens} tok, budget ${budgetTokens}); dropped ${dropped}`
  );
  return { text: out, notes };
}

function splitUnits(text: string): string[] {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paras.length >= 3) return paras;
  // sentence split
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sentences.length >= 2) return sentences;
  // line fallback
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  return lines.length ? lines : [text.trim()];
}

function scoreUnit(u: string, index: number, total: number): number {
  let score = 0;
  const len = u.length;
  // Prefer medium-length informative units
  if (len > 40 && len < 800) score += 3;
  else if (len >= 800) score += 1;
  else score += 0.5;
  // Position anchors
  if (index === 0 || index === total - 1) score += 2;
  // Keyword boosts common in tool/API dumps
  if (/\b(error|exception|failed|success|status|id|url|result|total|summary)\b/i.test(u)) score += 2;
  if (/\b(lorem|cookie|subscribe|newsletter|click here)\b/i.test(u)) score -= 2;
  // Numbers / structured data
  if (/\d/.test(u)) score += 0.5;
  if (/[{}\[\]:]/.test(u)) score += 0.5;
  return score;
}

function clipToBudget(text: string, budgetTokens: number): string {
  // char/4 => budget_tokens * 4 chars
  const maxChars = Math.max(16, budgetTokens * 4);
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 15).trimEnd() + "\n…[truncated]";
}

/** Optional env-gated LLM compress stub — returns null when not configured. */
export async function compressWithLlmOptional(
  text: string,
  budgetTokens: number
): Promise<CompressResult | null> {
  const url = process.env.PREPARE_LLM_URL;
  const key = process.env.PREPARE_LLM_API_KEY;
  if (!url || !key) return null;
  // Not implemented in MVP; heuristic path is authoritative for demo.
  return null;
}
