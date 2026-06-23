/**
 * Pure text resolution for the report engine.
 *
 * No child name is ever collected (spec Дел 13.1 / 14.3, resolved-decision 2), so
 * the module library writes a `{child}` token that this resolver expands to
 * „вашето дете" — capitalised to „Вашето дете" when it falls at the start of a
 * sentence. Keeping the token (rather than hard-coding the phrase) future-proofs
 * the library if a display-only name is ever introduced: only this resolver
 * changes (D-078).
 *
 * Pure: same string in → same string out. No clock, randomness or env.
 */

import type { Lang, LocalizedText } from "./types";

const CHILD_TOKEN = "{child}";
const CHILD_LOWER = "вашето дете";
const CHILD_UPPER = "Вашето дете";

/** Characters that mark the previous sentence as finished (so the next word capitalises). */
const SENTENCE_END = new Set([".", "!", "?", "…", ":", "„", "\n"]);

/**
 * Replace every `{child}` token, choosing the sentence-initial („Вашето дете") or
 * mid-sentence („вашето дете") form from the preceding non-space character.
 */
export function resolveChild(text: string): string {
  let out = "";
  let cursor = 0;
  for (;;) {
    const idx = text.indexOf(CHILD_TOKEN, cursor);
    if (idx === -1) {
      out += text.slice(cursor);
      return out;
    }
    out += text.slice(cursor, idx);
    const trimmed = out.replace(/\s+$/u, "");
    const prev = trimmed.length === 0 ? "" : trimmed[trimmed.length - 1];
    const initial = prev === "" || SENTENCE_END.has(prev);
    out += initial ? CHILD_UPPER : CHILD_LOWER;
    cursor = idx + CHILD_TOKEN.length;
  }
}

/** Pick a language (falling back to `mk`) and resolve `{child}` tokens. */
export function resolveText(text: LocalizedText, lang: Lang = "mk"): string {
  const raw = text[lang] ?? text.mk;
  return resolveChild(raw);
}

/** Resolve an array of localized strings (activity lists). */
export function resolveTexts(
  texts: readonly LocalizedText[],
  lang: Lang = "mk",
): string[] {
  return texts.map((t) => resolveText(t, lang));
}
