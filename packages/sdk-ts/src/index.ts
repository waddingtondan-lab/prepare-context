import type { PrepareRequest, PrepareResponse } from "@prepare-context/core";
import { prepare as prepareLocal } from "@prepare-context/core";

/** Production API host (DNS/CNAME configured later). Local demos use localhost. */
export const DEFAULT_BASE_URL = "https://prepare.plaintools.vip";

export interface PrepareContextOptions extends PrepareRequest {
  /** Override API base. Default: https://prepare.plaintools.vip. Use http://127.0.0.1:8787 for local. */
  baseURL?: string;
  /** If true, run in-process via @prepare-context/core (no HTTP). Default true when no baseURL forced. */
  local?: boolean;
  fetchImpl?: typeof fetch;
}

export async function prepareContext(opts: PrepareContextOptions): Promise<PrepareResponse> {
  const {
    baseURL,
    local,
    fetchImpl = fetch,
    raw,
    budget_tokens,
    mode,
    schema,
    keep,
    target_model,
  } = opts;

  const useLocal = local === true || (local !== false && !baseURL);
  if (useLocal) {
    return prepareLocal({ raw, budget_tokens, mode, schema, keep, target_model });
  }

  const base = (baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const res = await fetchImpl(`${base}/v1/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw, budget_tokens, mode, schema, keep, target_model }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`prepareContext HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as PrepareResponse;
}

export type { PrepareRequest, PrepareResponse, PrepareMode } from "@prepare-context/core";
