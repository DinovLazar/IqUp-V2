/**
 * Raw scores per signal (spec Дел 6.1) + the extremes markers (spec Дел 7.3).
 *
 * Each extractor is a pure function of the graded items, and — critically — the
 * non-Gs extractors never see time: correctness alone drives them, so "slow ≠
 * wrong" is structural, not just a convention. Only `gsNetPerMin` reads effective
 * time, because Gs is the one throughput signal.
 */

import {
  BACKWARD_FROM_AGE,
  BACKWARD_SPAN_OFFSET,
  GSM_MAX_SPAN,
  clampAge,
} from "@/content/norms";
import { MAX_LEVEL } from "@/content/tasks";
import type { GradedItem } from "@/features/assessment/types";

/** Σ(weight·correct) / Σ(weight) — accuracy weighted by reached difficulty (Gf/Gv/CT). */
export function weightedAccuracy(items: readonly GradedItem[]): number {
  let num = 0;
  let den = 0;
  for (const it of items) {
    num += it.difficultyWeight * (it.correct ? 1 : 0);
    den += it.difficultyWeight;
  }
  return den > 0 ? num / den : 0;
}

/** EF efficiency 0–1: mean of (solved ? minMoves/movesUsed : 0) over items. */
export function efEfficiency(items: readonly GradedItem[]): number {
  if (items.length === 0) return 0;
  let sum = 0;
  for (const it of items) {
    const ef = it.ef;
    if (ef && ef.solved && ef.movesUsed > 0) {
      sum += Math.min(1, ef.minMoves / ef.movesUsed);
    }
  }
  return sum / items.length;
}

/** Glr recall accuracy 0–1: mean recall accuracy across the recall rounds. */
export function glrRecall(item: GradedItem | null): number {
  const accs = item?.glr?.roundAccuracies ?? [];
  if (accs.length === 0) return 0;
  return accs.reduce((a, x) => a + x, 0) / accs.length;
}

/** Glr learning slope: per-round accuracy gain (last − first) / (rounds − 1). */
export function learningSlope(item: GradedItem | null): number {
  const accs = item?.glr?.roundAccuracies ?? [];
  if (accs.length < 2) return 0;
  return (accs[accs.length - 1] - accs[0]) / (accs.length - 1);
}

/** Gs net throughput per minute: (correct − 0.5·errors) / effective minutes. */
export function gsNetPerMin(item: GradedItem | null): number {
  const gs = item?.gs;
  if (!gs) return 0;
  const net = gs.found - 0.5 * gs.falseTaps;
  const minutes = (item?.effectiveTimeMs ?? 0) / 60_000;
  return minutes > 0 ? net / minutes : 0;
}

/** Max correct span length across a direction's trials (0 if none correct). */
export function maxCorrectSpan(items: readonly GradedItem[]): number {
  let max = 0;
  for (const it of items) {
    if (it.correct && (it.spanLength ?? 0) > max) max = it.spanLength ?? 0;
  }
  return max;
}

/**
 * The span value fed to the span index. Below the backward age (or with no
 * backward run) it is the forward span; from age 8 it averages forward with the
 * backward span normalised onto the forward scale (backward + offset), so a
 * backward span at its own expectation (forward − offset) is score-neutral (D-055).
 */
export function spanForIndex(
  forwardSpan: number,
  backwardSpan: number,
  age: number,
  ranBackward: boolean,
): number {
  if (!ranBackward || clampAge(age) < BACKWARD_FROM_AGE) return forwardSpan;
  return (forwardSpan + (backwardSpan + BACKWARD_SPAN_OFFSET)) / 2;
}

/** Count of correct items. */
export function correctCount(items: readonly GradedItem[]): number {
  return items.reduce((a, it) => a + (it.correct ? 1 : 0), 0);
}

// ── Extremes (spec Дел 7.3) ───────────────────────────────────────────────────

/** Laddered ceiling: aced everything AND topped out at the highest level. */
export function ladderCeiling(
  items: readonly GradedItem[],
  maxLevelCorrect: number,
): boolean {
  return (
    items.length > 0 &&
    correctCount(items) === items.length &&
    maxLevelCorrect >= MAX_LEVEL
  );
}

/** Laddered floor: items were administered but none was correct. */
export function ladderFloor(items: readonly GradedItem[]): boolean {
  return items.length > 0 && correctCount(items) === 0;
}

/** Span ceiling: reached the top supported span. */
export function spanCeiling(
  forwardSpan: number,
  backwardSpan: number,
): boolean {
  return Math.max(forwardSpan, backwardSpan) >= GSM_MAX_SPAN;
}
