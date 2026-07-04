/**
 * Raw scores per signal (spec Дел 6.1, calibration v2) + the extremes markers
 * (spec Дел 7.3).
 *
 * Each extractor is a pure function of the graded items, and — critically — the
 * non-Gs extractors never see time: correctness alone drives them, so "slow ≠
 * wrong" is structural, not just a convention. Only `gsNetPerMin` reads effective
 * time, because Gs is the one throughput signal.
 *
 * v2: the level-weighted extractors accept the basal CREDIT levels (WISC
 * reverse-rule: levels below the first-correct level count as passed at their
 * level weight), and EF/Glr are level-weighted like the other laddered domains
 * so the per-age accuracy anchors hold.
 */

import {
  BACKWARD_FROM_AGE,
  CORSI_BACKWARD_OFFSET,
  GSM_MAX_SPAN,
  clampAge,
} from "@/content/norms";
import { MAX_LEVEL, difficultyWeight } from "@/content/tasks";
import type { GradedItem } from "@/features/assessment/types";

/** Σ weight of the credited basal levels. */
function creditWeight(creditLevels: readonly number[]): number {
  return creditLevels.reduce((a, l) => a + difficultyWeight(l), 0);
}

/**
 * Level-weighted accuracy with basal credit (Gf/Gv/CT):
 * (credits + Σ w·correct) / (credits + Σ w).
 */
export function weightedAccuracy(
  items: readonly GradedItem[],
  creditLevels: readonly number[] = [],
): number {
  let num = creditWeight(creditLevels);
  let den = num;
  for (const it of items) {
    num += it.difficultyWeight * (it.correct ? 1 : 0);
    den += it.difficultyWeight;
  }
  return den > 0 ? num / den : 0;
}

/**
 * EF planning efficiency 0–1 (v2: LEVEL-WEIGHTED, with basal credit):
 * per item, efficiency = solved ? min(1, minMoves/movesUsed) : 0; the score is
 * the level-weighted mean so a start-level problem solved optimally anchors ≈50.
 */
export function efEfficiency(
  items: readonly GradedItem[],
  creditLevels: readonly number[] = [],
): number {
  let num = creditWeight(creditLevels);
  let den = num;
  for (const it of items) {
    const ef = it.ef;
    const eff =
      ef && ef.solved && ef.movesUsed > 0
        ? Math.min(1, ef.minMoves / ef.movesUsed)
        : 0;
    num += it.difficultyWeight * eff;
    den += it.difficultyWeight;
  }
  return den > 0 ? num / den : 0;
}

/** Mean recall accuracy (0–1) across one item's recall rounds. */
function itemRecall(item: GradedItem): number {
  const accs = item.glr?.roundAccuracies ?? [];
  if (accs.length === 0) return 0;
  return accs.reduce((a, x) => a + x, 0) / accs.length;
}

/**
 * Glr recall accuracy 0–1 (v2: LEVEL-WEIGHTED across the laddered items, with
 * basal credit — credited levels count as fully recalled).
 */
export function glrRecall(
  items: readonly GradedItem[],
  creditLevels: readonly number[] = [],
): number {
  let num = creditWeight(creditLevels);
  let den = num;
  for (const it of items) {
    num += it.difficultyWeight * itemRecall(it);
    den += it.difficultyWeight;
  }
  return den > 0 ? num / den : 0;
}

/** One item's learning slope: (last − first) / (rounds − 1) recall gain. */
function itemSlope(item: GradedItem): number | null {
  const accs = item.glr?.roundAccuracies ?? [];
  if (accs.length < 2) return null;
  return (accs[accs.length - 1] - accs[0]) / (accs.length - 1);
}

/** Glr learning slope (v2): mean per-item slope across the administered items. */
export function learningSlope(items: readonly GradedItem[]): number {
  const slopes = items.map(itemSlope).filter((s): s is number => s !== null);
  if (slopes.length === 0) return 0;
  return slopes.reduce((a, s) => a + s, 0) / slopes.length;
}

/**
 * Gs net throughput per minute across the scored rounds (v2: 2 rounds):
 * Σ(correct − 0.5·errors) / Σ effective minutes.
 */
export function gsNetPerMin(items: readonly GradedItem[]): number {
  let net = 0;
  let ms = 0;
  for (const it of items) {
    if (!it.gs) continue;
    net += it.gs.found - 0.5 * it.gs.falseTaps;
    ms += it.effectiveTimeMs;
  }
  const minutes = ms / 60_000;
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
 * backward span normalised onto the forward scale (backward + offset). v2: the
 * offset is the Corsi-specific 0.5 (Kessels: backward ≈ forward), replacing the
 * old digit-span convention of 2.
 */
export function spanForIndex(
  forwardSpan: number,
  backwardSpan: number,
  age: number,
  ranBackward: boolean,
): number {
  if (!ranBackward || clampAge(age) < BACKWARD_FROM_AGE) return forwardSpan;
  return (forwardSpan + (backwardSpan + CORSI_BACKWARD_OFFSET)) / 2;
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

/** Span ceiling: reached the top supported span (the v2 ladder's length 7). */
export function spanCeiling(
  forwardSpan: number,
  backwardSpan: number,
): boolean {
  return Math.max(forwardSpan, backwardSpan) >= GSM_MAX_SPAN;
}
