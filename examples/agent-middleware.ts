/**
 * Example agent middleware: scrub/compress tool output before the next model call.
 * Local: run the server on :8787 or use prepareContext({ local: true }).
 * Prod branding host: https://prepare.plaintools.vip
 */
import { prepareContext } from "@prepare-context/sdk-ts";

export async function withPreparedToolOutput(
  toolOutput: string,
  budgetTokens = 1500
): Promise<{ packet: string; receipt: Awaited<ReturnType<typeof prepareContext>> }> {
  const receipt = await prepareContext({
    raw: toolOutput,
    budget_tokens: budgetTokens,
    mode: "tool",
    target_model: "claude-sonnet",
    local: true, // swap to baseURL: "https://prepare.plaintools.vip" for remote
  });
  return { packet: receipt.packet, receipt };
}

// Usage sketch:
// const { packet, receipt } = await withPreparedToolOutput(hugeHtml);
// messages.push({ role: "tool", content: packet });
// console.info("saved", receipt.estimated_usd_saved);
