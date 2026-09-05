import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prepare, TOKEN_ESTIMATOR } from "@prepare-context/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, "fat-sample.html"), "utf8");

const result = await prepare({
  raw,
  budget_tokens: 800,
  mode: "tool",
  target_model: "generic",
});

console.log("=== Prepare Context demo savings receipt ===");
console.log(`API (prod branding): https://prepare.plaintools.vip`);
console.log(`Token estimator: ${TOKEN_ESTIMATOR}`);
console.log(`mode:            ${result.mode}`);
console.log(`tokens_in:       ${result.tokens_in}`);
console.log(`tokens_out:      ${result.tokens_out}`);
console.log(`saved_ratio:     ${result.saved_ratio}`);
console.log(`estimated_usd_saved: $${result.estimated_usd_saved}`);
console.log(`loss_notes:`);
for (const n of result.loss_notes) console.log(`  - ${n}`);
console.log("--- packet preview (first 500 chars) ---");
console.log(result.packet.slice(0, 500));
console.log("----------------------------------------");
if (result.tokens_in <= result.tokens_out) {
  console.error("ERROR: expected tokens_in >> tokens_out");
  process.exit(1);
}
console.log("OK: tokens_in >> tokens_out");
