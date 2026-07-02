/**
 * Derived attention (spec Дел 3.1 #5 / Дел 4 / Дел 8) — the 8th signal, computed,
 * never administered. There is no attention task; the indicator falls out of the
 * timing + error data already collected on the reasoning items:
 *
 *   attention = clamp01(1 − normalisedTimeVariability − impulsiveErrorRate)
 *
 *   • normalisedTimeVariability — coefficient of variation of effective times
 *     across the reasoning items, normalised against the AGE BAND's expected CV
 *     midpoint (v2 §5: a typical CV maps to 0.5 ⇒ attention score 0.5 ⇒ index
 *     ≈ 50; erratic pacing above 2× the midpoint saturates at 1).
 *   • impulsiveErrorRate — fraction of clean multiple-choice answers that were
 *     both too-fast (RT < threshold) and wrong (answered without looking).
 *
 * The age bands live in `seed-norms.ts` (ATTENTION_BANDS, [provisional]).
 */

import { ATTENTION, expectedCvMidpoint } from "@/content/norms";
import type { GradedItem } from "@/features/assessment/types";
import { coefficientOfVariation, mean } from "./time";

export interface AttentionResult {
  /** 0–1 attention score (fed to the accuracy index family). */
  score: number;
  /** Coefficient of variation of effective times (raw observable for 1.07). */
  timeVariability: number;
  impulsiveErrorRate: number;
  meanEffectiveTimeMs: number;
  /** Number of variability-signal items seen — drives the memory index confidence. */
  itemCount: number;
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Derive the attention indicator from every graded item in the session. */
export function deriveAttention(
  allItems: readonly GradedItem[],
  age: number,
): AttentionResult {
  const variabilityItems = allItems.filter((it) =>
    ATTENTION.variabilitySignals.includes(it.signal),
  );
  const times = variabilityItems.map((it) => it.effectiveTimeMs);
  const cv = coefficientOfVariation(times);
  // CV at the band midpoint → 0.5; ≥ 2× the midpoint saturates at 1.
  const normVariability = clamp01(cv / (2 * expectedCvMidpoint(age)));

  const impulsiveItems = allItems.filter((it) =>
    ATTENTION.impulsiveSignals.includes(it.signal),
  );
  const impulsiveErrors = impulsiveItems.filter(
    (it) => it.tooFast && !it.correct,
  ).length;
  const impulsiveErrorRate =
    impulsiveItems.length > 0 ? impulsiveErrors / impulsiveItems.length : 0;

  return {
    score: clamp01(1 - normVariability - impulsiveErrorRate),
    timeVariability: cv,
    impulsiveErrorRate,
    meanEffectiveTimeMs: mean(times),
    itemCount: variabilityItems.length,
  };
}
