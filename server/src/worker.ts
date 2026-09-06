/**
 * Cloudflare Workers entry — exports the shared Hono app.
 * Bundled by Wrangler; Node serve() is never imported.
 */
import app from "./app.js";

export default {
  fetch: app.fetch,
};
