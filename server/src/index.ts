import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { prepare, TOKEN_ESTIMATOR, type PrepareMode, type PrepareRequest } from "@prepare-context/core";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "prepare-context",
    version: "0.1.0",
    token_estimator: TOKEN_ESTIMATOR,
    public_base_url: "https://prepare.plaintools.vip",
  })
);

app.post("/v1/prepare", async (c) => {
  let body: Partial<PrepareRequest>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body.raw !== "string") {
    return c.json({ error: "raw (string) is required" }, 400);
  }
  if (typeof body.budget_tokens !== "number" || !Number.isFinite(body.budget_tokens)) {
    return c.json({ error: "budget_tokens (number) is required" }, 400);
  }
  const mode = body.mode;
  if (mode !== "tool" && mode !== "history" && mode !== "docs") {
    return c.json({ error: 'mode must be "tool" | "history" | "docs"' }, 400);
  }

  const req: PrepareRequest = {
    raw: body.raw,
    budget_tokens: body.budget_tokens,
    mode: mode as PrepareMode,
    schema: body.schema,
    keep: body.keep,
    target_model: body.target_model ?? process.env.DEFAULT_TARGET_MODEL ?? "generic",
  };

  try {
    const result = await prepare(req);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "prepare failed";
    return c.json({ error: message }, 500);
  }
});

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";

console.log(`prepare-context listening on http://${host}:${port}`);
console.log(`production base URL (planned): https://prepare.plaintools.vip`);

serve({ fetch: app.fetch, port, hostname: host });
