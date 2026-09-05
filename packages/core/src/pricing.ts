/** Hardcoded $/MTok blended estimates for savings receipts (input-heavy). */
export const PRICE_PER_MTOK: Record<string, number> = {
  "claude-sonnet": 3.0,
  "gpt-4o": 2.5,
  generic: 2.0,
};

export function resolvePricePerMTok(targetModel?: string): number {
  if (!targetModel) return PRICE_PER_MTOK.generic;
  const key = targetModel.toLowerCase();
  if (key in PRICE_PER_MTOK) return PRICE_PER_MTOK[key]!;
  if (key.includes("claude") || key.includes("sonnet")) return PRICE_PER_MTOK["claude-sonnet"]!;
  if (key.includes("gpt-4o") || key.includes("gpt4o")) return PRICE_PER_MTOK["gpt-4o"]!;
  return PRICE_PER_MTOK.generic;
}

export function estimateUsdSaved(tokensIn: number, tokensOut: number, targetModel?: string): number {
  const saved = Math.max(0, tokensIn - tokensOut);
  const price = resolvePricePerMTok(targetModel);
  const usd = (saved / 1_000_000) * price;
  return Math.round(usd * 1_000_000) / 1_000_000;
}
