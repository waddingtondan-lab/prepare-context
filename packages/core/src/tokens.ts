/**
 * Token estimation:
 * - Primary MVP path: characters / 4 (deterministic, no native deps).
 * - Optional: js-tiktoken cl100k_base when installed (estimateTokens async).
 */
export const TOKEN_ESTIMATOR =
  "char/4 fallback (optional js-tiktoken cl100k_base when installed)";

export function estimateTokensSync(text: string): number {
  if (!text) return 0;
  return Math.max(0, Math.ceil(text.length / 4));
}

export async function estimateTokens(text: string): Promise<number> {
  if (!text) return 0;
  try {
    const mod = await import("js-tiktoken").catch(() => null);
    if (mod && typeof (mod as { getEncoding?: (n: string) => { encode: (t: string) => number[] } }).getEncoding === "function") {
      const enc = (mod as { getEncoding: (n: string) => { encode: (t: string) => number[] } }).getEncoding("cl100k_base");
      return enc.encode(text).length;
    }
  } catch {
    // ignore
  }
  return estimateTokensSync(text);
}
