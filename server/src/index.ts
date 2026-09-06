import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";

console.log(`prepare-context listening on http://${host}:${port}`);
console.log(`production base URL (planned): https://prepare.plaintools.vip`);

serve({ fetch: app.fetch, port, hostname: host });
