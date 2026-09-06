/**
 * Cloudflare Workers entry — exports the shared Hono app.
 * Bundled by Wrangler; Node serve() is never imported.
 */
export { app as default } from "./app.js";
