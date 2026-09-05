import * as cheerio from "cheerio";
import type { ScrubOptions } from "./types.js";

function looksLikeHtml(raw: string): boolean {
  const s = raw.trim().slice(0, 500).toLowerCase();
  return s.includes("<html") || s.includes("<!doctype") || s.includes("<body") || s.includes("<div") || s.includes("<script");
}

function looksLikeJson(raw: string): boolean {
  const t = raw.trim();
  return (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
}

function collapseWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function pickFields(value: unknown, keep: string[], path = ""): unknown {
  if (keep.length === 0) return value;
  if (Array.isArray(value)) {
    return value.map((v) => pickFields(v, keep, path ? path + "[]" : "[]"));
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const full = path ? path + "." + k : k;
      const keepHere = keep.some(
        (kk) => kk === k || kk === full || full.endsWith("." + kk) || kk.endsWith("." + k)
      );
      if (keepHere) {
        out[k] = v;
      } else if (v && typeof v === "object") {
        const nested = pickFields(v, keep, full);
        if (nested && typeof nested === "object" && Object.keys(nested as object).length > 0) {
          out[k] = nested;
        }
      }
    }
    return out;
  }
  return value;
}

function scrubHtml(raw: string): { text: string; notes: string[] } {
  const notes: string[] = [];
  const $ = cheerio.load(raw);
  let removed = 0;
  $("script, style, noscript, svg, iframe, link[rel='stylesheet'], meta, template").each((_, el) => {
    removed += 1;
    $(el).remove();
  });
  $("nav, footer, header, aside, [role='navigation'], .cookie, .ads, #cookie-banner").remove();
  if (removed) notes.push("Removed " + removed + " script/style/noise nodes");
  $("br").replaceWith("\n");
  $("p, div, li, tr, h1, h2, h3, h4, h5, h6, section, article").each((_, el) => {
    $(el).append("\n");
  });
  const text = collapseWhitespace($.root().text());
  notes.push("HTML reduced to visible text");
  return { text, notes };
}

function scrubJson(raw: string, options: ScrubOptions): { text: string; notes: string[] } {
  const notes: string[] = [];
  try {
    let data = JSON.parse(raw) as unknown;
    const keep = options.keep ?? (Array.isArray(options.schema) ? options.schema : undefined);
    if (keep && keep.length > 0) {
      data = pickFields(data, keep);
      notes.push("Kept JSON fields: " + keep.join(", "));
    } else if (options.schema && !Array.isArray(options.schema) && typeof options.schema === "object") {
      const keys = Object.keys(options.schema);
      if (keys.length) {
        data = pickFields(data, keys);
        notes.push("Kept schema keys: " + keys.join(", "));
      }
    }
    const text = JSON.stringify(data, null, 0);
    notes.push("JSON normalized");
    return { text, notes };
  } catch {
    notes.push("JSON parse failed; treated as plain text");
    return { text: collapseWhitespace(raw), notes };
  }
}

function scrubHistory(raw: string): { text: string; notes: string[] } {
  const notes: string[] = [];
  const lines = raw.split(/\n/);
  const cleaned = lines
    .map((l) => l.replace(/^\s*\[\d{4}-\d{2}-\d{2}[^\]]*\]\s*/, ""))
    .map((l) => l.replace(/\x1b\[[0-9;]*m/g, ""))
    .filter((l) => !/^\s*(DEBUG|TRACE)\b/i.test(l));
  if (cleaned.length < lines.length) notes.push("Dropped debug/trace lines and ANSI/timestamps");
  return { text: collapseWhitespace(cleaned.join("\n")), notes };
}

function scrubDocs(raw: string): { text: string; notes: string[] } {
  const notes: string[] = [];
  if (looksLikeHtml(raw)) return scrubHtml(raw);
  let text = raw.replace(/```[\s\S]*?```/g, (m) => {
    notes.push("Collapsed fenced code block");
    const first = m.split("\n")[0] ?? "```";
    return first + "\n/* code omitted in scrub */\n```";
  });
  return { text: collapseWhitespace(text), notes };
}

export function scrub(raw: string, options: ScrubOptions): { text: string; notes: string[] } {
  if (!raw) return { text: "", notes: ["Empty input"] };
  if (options.mode === "history") return scrubHistory(raw);
  if (options.mode === "docs") return scrubDocs(raw);
  if (looksLikeHtml(raw)) return scrubHtml(raw);
  if (looksLikeJson(raw)) return scrubJson(raw, options);
  return { text: collapseWhitespace(raw), notes: ["Plain text normalized"] };
}
