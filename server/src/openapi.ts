/**
 * OpenAPI 3.1 document for x402scan / agent discovery.
 * Served at GET /openapi.json (and linked from GET /).
 */
export const PUBLIC_BASE_URL = "https://prepare.plaintools.vip";

const PREPARE_INPUT_SCHEMA = {
  type: "object",
  properties: {
    raw: {
      type: "string",
      description: "Raw tool/API/browser/history/docs text to scrub and compress",
    },
    budget_tokens: {
      type: "number",
      description: "Target token budget for the compressed packet",
    },
    mode: {
      type: "string",
      enum: ["tool", "history", "docs"],
      description: "Scrub/compress strategy",
    },
    keep: {
      type: "array",
      items: { type: "string" },
      description: "Optional JSON field names to keep when scrubbing structured payloads",
    },
    schema: {
      description: "Optional schema hint (object or string array) for structured keep/filter",
      oneOf: [{ type: "object" }, { type: "array", items: { type: "string" } }],
    },
    target_model: {
      type: "string",
      description: "Pricing key for estimated_usd_saved (e.g. generic, claude-sonnet, gpt-4o)",
    },
  },
  required: ["raw", "budget_tokens", "mode"],
  additionalProperties: false,
} as const;

const PREPARE_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    packet: { type: "string", description: "Compressed context packet" },
    tokens_in: { type: "number" },
    tokens_out: { type: "number" },
    saved_ratio: { type: "number", description: "Fraction of tokens saved (0–1)" },
    estimated_usd_saved: { type: "number" },
    loss_notes: { type: "array", items: { type: "string" } },
    mode: { type: "string", enum: ["tool", "history", "docs"] },
  },
  required: [
    "packet",
    "tokens_in",
    "tokens_out",
    "saved_ratio",
    "estimated_usd_saved",
    "loss_notes",
    "mode",
  ],
} as const;

/** Shared prepare body example (OpenAPI + Bazaar discovery). */
export const PREPARE_INPUT_EXAMPLE = {
  raw: "<html><body>huge tool dump with scripts and noise</body></html>",
  budget_tokens: 800,
  mode: "tool" as const,
  keep: ["id", "title", "status"],
  target_model: "generic",
};

/** Shared savings receipt example (OpenAPI + Bazaar discovery). */
export const PREPARE_OUTPUT_EXAMPLE = {
  packet: "Clean status summary within budget…",
  tokens_in: 8932,
  tokens_out: 800,
  saved_ratio: 0.9104,
  estimated_usd_saved: 0.016,
  loss_notes: ["Dropped script/style blocks", "Extractive compress to budget"],
  mode: "tool" as const,
};

export const PREPARE_INPUT_JSON_SCHEMA = PREPARE_INPUT_SCHEMA;
export const PREPARE_OUTPUT_JSON_SCHEMA = PREPARE_OUTPUT_SCHEMA;

export function buildOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Prepare Context",
      version: "0.1.0",
      description:
        "Agent-native context scrubber + compressor with savings receipts. " +
        "POST /v1/prepare is x402-gated ($0.01 USDC on Base). " +
        "Unauthenticated probes receive HTTP 402 with PAYMENT-REQUIRED before body validation. " +
        "See https://prepare.plaintools.vip/llms.txt",
      contact: {
        name: "Plain Tools / Dan Waddington",
        email: "waddington.dan@gmail.com",
        url: "https://github.com/waddingtondan-lab/prepare-context",
      },
      "x-guidance":
        "Call POST /v1/prepare with JSON { raw, budget_tokens, mode } before an expensive model call. " +
        "When payments are enabled you will get HTTP 402 with a PAYMENT-REQUIRED header (base64 JSON). " +
        "Complete an x402 exact USDC payment on Base (eip155:8453), retry with PAYMENT-SIGNATURE. " +
        "Price is fixed $0.01. Free discovery routes: GET /, GET /health, GET /llms.txt, GET /openapi.json. " +
        "Response includes packet plus tokens_in/tokens_out/saved_ratio/estimated_usd_saved/loss_notes.",
    },
    servers: [{ url: PUBLIC_BASE_URL, description: "Production (Cloudflare Workers)" }],
    paths: {
      "/v1/prepare": {
        post: {
          operationId: "prepareContext",
          summary: "Scrub + compress context to a token budget",
          description:
            "Scrubs noisy tool/API/browser output, compresses to budget_tokens, returns a savings receipt. " +
            "x402 payment required when PAY_TO is configured ($0.01 USDC on Base mainnet).",
          "x-payment-info": {
            price: { mode: "fixed", currency: "USD", amount: "0.01" },
            protocols: [{ x402: {} }],
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: PREPARE_INPUT_SCHEMA,
                example: PREPARE_INPUT_EXAMPLE,
              },
            },
          },
          responses: {
            "200": {
              description: "Prepare receipt (compressed packet + savings)",
              content: {
                "application/json": {
                  schema: PREPARE_OUTPUT_SCHEMA,
                  example: PREPARE_OUTPUT_EXAMPLE,
                },
              },
            },
            "402": {
              description: "Payment Required",
              headers: {
                "PAYMENT-REQUIRED": {
                  description: "Base64 JSON x402 payment requirements (v2)",
                  schema: { type: "string" },
                },
              },
            },
            "400": { description: "Invalid JSON or missing required fields (only after payment)" },
            "500": { description: "Prepare failed" },
            "503": { description: "x402 facilitator unavailable" },
          },
        },
      },
      "/health": {
        get: {
          operationId: "health",
          summary: "Liveness",
          responses: {
            "200": { description: "Service health + payments_enabled flag" },
          },
        },
      },
      "/llms.txt": {
        get: {
          operationId: "llmsTxt",
          summary: "Agent-oriented plain-text summary",
          responses: {
            "200": { description: "text/plain agent summary" },
          },
        },
      },
    },
  };
}
