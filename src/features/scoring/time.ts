/**
 * Time-rules MATH (spec Дел 8) — pure functions over timing DATA. The engine never
 * runs a clock: per-item elapsed time and idle-gap markers are handed in by 1.06.
 *
 * The cardinal rule (spec Дел 6.4 / Дел 8 rule 1): **slow ≠ wrong**. Effective time
 * is computed here and feeds attention + the Gs speed score only — every other
 * signal's correctness is a function of answers alone (enforced structurally: the
 * non-Gs raw-score functions never receive time).
 */

import { IDLE_GAP_EXCLUDE_MS } from "@/content/norms";

/**
 * Effective time for a task = raw elapsed minus every idle gap longer than the
 * exclusion threshold (a real pause; spec Дел 8 rule 3 / Дел 7.1). Short gaps stay
 * in (normal thinking); the result is floored at 0.
 */
export function effectiveTime(
  rawElapsedMs: number,
  idleGaps: readonly number[] = [],
): number {
  const excluded = idleGaps
    .filter((g) => g > IDLE_GAP_EXCLUDE_MS)
    .reduce((a, g) => a + g, 0);
  return Math.max(0, rawElapsedMs - excluded);
}

/** How many idle gaps exceed the exclusion threshold (feeds the validity flag). */
export function countExcludedGaps(idleGaps: readonly number[] = []): number {
  return idleGaps.filter((g) => g > IDLE_GAP_EXCLUDE_MS).length;
}

/** Arithmetic mean (0 for an empty list). */
export function mean(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, x) => a + x, 0) / xs.length;
}

/** Population standard deviation (0 for fewer than 2 values). */
export function stdDev(xs: readonly number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const variance = xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length;
  return Math.sqrt(variance);
}

/**
 * Coefficient of variation (stdDev / mean) — the unit-free between-task time
 * variability that feeds the derived attention signal. 0 when undefined.
 */
export function coefficientOfVariation(xs: readonly number[]): number {
  const m = mean(xs);
  if (m <= 0) return 0;
  return stdDev(xs) / m;
}
