/**
 * PDF design tokens (Phase 1.09) — pure constants mirroring the brand `@theme`
 * (`globals.css`) and the on-screen report components, expressed as literal hex so
 * `@react-pdf` (which cannot resolve `var(--…)`) renders identically to the screen.
 *
 * This module is pure: no clock, no randomness, no env — same as `lib/indices.ts`.
 * Keep the values here in sync with `globals.css` if the brand palette ever moves.
 */

import type { Band, Confidence } from "../types";

/** Brand palette + surface/line/text tokens (literal hex; ≥4.5:1 text on light). */
export const PDF_COLORS = {
  ink: "#231F26", // body / headings
  muted: "#5E5862", // helper / secondary
  bg: "#FAF8F4", // app base
  surface: "#FFFFFF",
  tintPur: "#F4EFF7", // emphasis surface
  border: "#EAE6E0",
  borderPur: "#E4D7EC",
  pur: "#762D90", // primary action
  purInk: "#651E80",
  white: "#FFFFFF",
  // Pentagon scaffolding (matches the web `pentagon.tsx`).
  ringStroke: "#E7E0EC",
  spokeStroke: "#ECE6F0",
  // Puzzle-brain (matches the web `puzzle-brain.tsx`).
  brainBase: "#F4EFF7",
  brainDim: "#ECE6F1",
} as const;

/** Montserrat — registered with `@react-pdf` in `fonts.ts`; referenced by name here. */
export const PDF_FONT_FAMILY = "Montserrat";

/** Montserrat weights bundled + registered (see `fonts.ts`). */
export const PDF_FONT_WEIGHT = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

/**
 * Band → indicative bar fill (0–1). Mirrors `IndexBandBar`'s `BAND_FILL`: the bar
 * length is an INDICATIVE shape derived from the band word, never the numeric
 * score (spec Дел 10.2 — no hard number).
 */
export const PDF_BAND_FILL: Record<Band, number> = {
  development: 0.28,
  solid: 0.52,
  strong: 0.74,
  exceptional: 0.92,
};

/** Band → magnitude level 1–4 (mirrors `BANDS`), for the 4-step pip glyph. */
export const PDF_BAND_LEVEL: Record<Band, number> = {
  development: 1,
  solid: 2,
  strong: 3,
  exceptional: 4,
};

/**
 * Confidence → bars + ink color (mirrors the web `ConfidenceLabel`). The MK word
 * (висока / средна / ниска) comes from `messages/mk.json` (`reportPdf.confidence`)
 * so all parent copy stays in the single i18n source.
 */
export const PDF_CONFIDENCE: Record<
  Confidence,
  { bars: number; color: string }
> = {
  high: { bars: 3, color: "#007D75" },
  medium: { bars: 2, color: "#9A6200" },
  low: { bars: 1, color: "#5E5862" },
};
