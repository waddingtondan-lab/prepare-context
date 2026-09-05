#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { prepare, type PrepareMode } from "@prepare-context/core";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const card = JSON.parse(
  readFileSync(join(__dirname, "..", "tool-card.json"), "utf8")
) as {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const TOOL_DESCRIPTION =
  "Use when tool/browser/API output is large or noisy, or conversation/history is too long, and you need a fixed token budget before the next model call. Returns a compressed packet plus tokens saved and estimated USD saved.";

const server = new Server(
  { name: "prepare-context", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: card.name ?? "prepare_context",
      description: card.description ?? TOOL_DESCRIPTION,
      inputSchema: card.inputSchema,
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "prepare_context") {
    return {
      content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
      isError: true,
    };
  }
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;
  const raw = String(args.raw ?? "");
  const budget_tokens = Number(args.budget_tokens);
  const mode = String(args.mode ?? "tool") as PrepareMode;
  if (!raw || !Number.isFinite(budget_tokens)) {
    return {
      content: [{ type: "text", text: "raw and budget_tokens are required" }],
      isError: true,
    };
  }
  const result = await prepare({
    raw,
    budget_tokens,
    mode: mode === "history" || mode === "docs" ? mode : "tool",
    keep: Array.isArray(args.keep) ? (args.keep as string[]) : undefined,
    schema: args.schema as Record<string, unknown> | string[] | undefined,
    target_model: typeof args.target_model === "string" ? args.target_model : "generic",
  });
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
