export type PrepareMode = "tool" | "history" | "docs";

export type TargetModel = "claude-sonnet" | "gpt-4o" | "generic" | string;

export interface PrepareRequest {
  raw: string;
  budget_tokens: number;
  mode: PrepareMode;
  schema?: Record<string, unknown> | string[];
  keep?: string[];
  target_model?: TargetModel;
}

export interface PrepareResponse {
  packet: string;
  tokens_in: number;
  tokens_out: number;
  saved_ratio: number;
  estimated_usd_saved: number;
  loss_notes: string[];
  mode: PrepareMode;
}

export interface ScrubOptions {
  mode: PrepareMode;
  schema?: Record<string, unknown> | string[];
  keep?: string[];
}
