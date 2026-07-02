/**
 * Raw → 0–100 index formulas (spec Дел 6.2 / Прилог B.2), the five composite
 * indices (spec Дел 6.3) and the band cut-offs (spec Дел 6.4).
 *
 * Three formula families: accuracy, span, speed. 50 = typical for age; every
 * index is `clamp(round(...), 8, 99)`. Composites are weighted sums of signal
 * indices keyed by the canonical `IndexKey` from `lib/indices.ts`.
 */

import {
  ACCURACY_INDEX,
  BAND_THRESHOLDS,
  COMPOSITE_WEIGHTS,
  INDEX_MAX,
  INDEX_MIN,
  SPAN_INDEX,
  SPEED_INDEX,
  type ScoredSignal,
} from "@/content/norms";
import type { IndexKey } from "@/lib/indices";
import type { Band } from "@/components/ui/band-label";

/** Clamp + round into the displayable index band [8, 99]. */
export function clampIndex(raw: number): number {
  return Math.min(INDEX_MAX, Math.max(INDEX_MIN, Math.round(raw)));
}

/**
 * accuracy family (v2): piecewise-linear around the per-signal, per-age anchor
 * `expectedForAge` — acc = expected → 50 exactly; acc = 1 → 95 and acc = 0 →
 * 20 at EVERY age (a fixed slope would make the top band unreachable for older
 * ages, whose expectation is higher). Input clamped to [0,1].
 */
export function accuracyIndex(
  accuracyWeighted: number,
  expectedForAge: number,
): number {
  const a = Math.min(1, Math.max(0, accuracyWeighted));
  const e = Math.min(0.99, Math.max(0.01, expectedForAge));
  const { center, top, bottom } = ACCURACY_INDEX;
  const raw =
    a >= e
      ? center + ((a - e) / (1 - e)) * (top - center)
      : center - ((e - a) / e) * (center - bottom);
  return clampIndex(raw);
}

/** span family: 50 + (span − expected)·14 (span = expected → 50). */
export function spanIndex(span: number, expectedForAge: number): number {
  return clampIndex(
    SPAN_INDEX.base + (span - expectedForAge) * SPAN_INDEX.perUnit,
  );
}

/** speed family: 50 + (netPerMin − expected)·6 (= expected → 50). */
export function speedIndex(netPerMin: number, expectedForAge: number): number {
  return clampIndex(
    SPEED_INDEX.base + (netPerMin - expectedForAge) * SPEED_INDEX.perUnit,
  );
}

/**
 * Composite index value for an `IndexKey`, as a weighted sum of the contributing
 * signals' 0–100 indices (spec Дел 6.3). Weights per composite sum to 1, so the
 * result stays in the index band; it is re-clamped defensively.
 */
export function compositeIndex(
  key: IndexKey,
  signalIndex: Readonly<Record<ScoredSignal, number>>,
): number {
  const weights = COMPOSITE_WEIGHTS[key];
  let sum = 0;
  for (const [signal, weight] of Object.entries(weights)) {
    sum += (weight as number) * signalIndex[signal as ScoredSignal];
  }
  return clampIndex(sum);
}

/** The signals contributing to a composite index. */
export function contributingSignals(key: IndexKey): ScoredSignal[] {
  return Object.keys(COMPOSITE_WEIGHTS[key]) as ScoredSignal[];
}

/** Word band for an index value (spec Дел 6.4); enum matches band-label.tsx. */
export function bandFor(value: number): Band {
  if (value >= BAND_THRESHOLDS.exceptional) return "exceptional";
  if (value >= BAND_THRESHOLDS.strong) return "strong";
  if (value >= BAND_THRESHOLDS.solid) return "solid";
  return "development";
}
