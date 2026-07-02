/**
 * finalize — fold a completed session state into the deterministic
 * `AssessmentResult`: per-signal raw scores + 0–100 indices (spec Дел 6.1/6.2,
 * calibration v2 anchors), the derived attention signal (Дел 3.1 #5), the five
 * composites (Дел 6.3) with bands (Дел 6.4), confidence (Дел 6.5), validity
 * (Дел 7.1, age-banded) and extremes (Дел 7.3).
 *
 * v2: the laddered accuracy signals (Gf, Gv, EF, Glr, CT) are level-weighted
 * WITH the basal credits and anchored per signal × age (typical ≈ 50); Gsm
 * ladders over direction-carrying rows (offset 0.5); Gs aggregates 2 rounds.
 *
 * Pure: same final state ⇒ deep-equal result, always.
 */

import {
  ATTENTION_EXPECTED_SCORE,
  EXPECTED_FORWARD_SPAN_BY_AGE,
  GS_EXPECTED_NET_PER_MIN_BY_AGE,
  GS_MASHING_FRACTION,
  NORMS_VERSION,
  SCORING_VERSION,
  byAge,
  expectedWeightedAccuracy,
  type ScoredSignal,
} from "@/content/norms";
import { TASK_BANK_VERSION } from "@/content/tasks";
import { INDEX_ORDER, type IndexKey } from "@/lib/indices";
import type { GradedItem, SessionState } from "@/features/assessment/types";
import { deriveAttention } from "./attention";
import {
  computeConfidence,
  evidenceFromCount,
  evidenceFromGlrRounds,
  type Evidence,
} from "./confidence";
import {
  accuracyIndex,
  bandFor,
  compositeIndex,
  spanIndex,
  speedIndex,
} from "./indices";
import {
  correctCount,
  efEfficiency,
  glrRecall,
  gsNetPerMin,
  ladderCeiling,
  ladderFloor,
  learningSlope,
  maxCorrectSpan,
  spanCeiling,
  spanForIndex,
  weightedAccuracy,
} from "./raw";
import { coefficientOfVariation, mean } from "./time";
import { computeValidity } from "./validity";
import type {
  AssessmentResult,
  IndexResult,
  PerItemResult,
  SignalResult,
} from "./types";

/** Map a graded item to its public per-item record. */
function perItemOf(items: readonly GradedItem[]): PerItemResult[] {
  return items.map((it) => ({
    level: it.level,
    spanLength: it.spanLength,
    direction: it.direction,
    correct: it.correct,
    effectiveTimeMs: it.effectiveTimeMs,
    errorType: it.errorType,
    tooFast: it.tooFast,
  }));
}

/** Fraction of items that were both too-fast and wrong. */
function impulsiveRate(items: readonly GradedItem[]): number {
  if (items.length === 0) return 0;
  return items.filter((it) => it.tooFast && !it.correct).length / items.length;
}

/** Effective-time observables shared by every signal block. */
function timeObservables(items: readonly GradedItem[]): {
  meanEffectiveTimeMs: number;
  timeVariability: number;
} {
  const times = items.map((it) => it.effectiveTimeMs);
  return {
    meanEffectiveTimeMs: mean(times),
    timeVariability: coefficientOfVariation(times),
  };
}

interface LadderedCollected {
  items: GradedItem[];
  creditLevels: number[];
  maxLevelCorrect: number;
}

/** Collect each domain's graded items + one flat list of everything. */
function collectItems(state: SessionState): {
  laddered: Record<
    "gf" | "gv" | "ef" | "ct" | "glr" | "gsm",
    LadderedCollected
  >;
  gsmForward: GradedItem[];
  gsmBackward: GradedItem[];
  gsItems: GradedItem[];
  all: GradedItem[];
} {
  const empty = (): LadderedCollected => ({
    items: [],
    creditLevels: [],
    maxLevelCorrect: 0,
  });
  const laddered = {
    gf: empty(),
    gv: empty(),
    ef: empty(),
    ct: empty(),
    glr: empty(),
    gsm: empty(),
  };
  let gsItems: GradedItem[] = [];

  for (const signal of state.order) {
    const d = state.domains[signal];
    if (d.kind === "laddered") {
      laddered[d.signal as keyof typeof laddered] = {
        items: d.items,
        creditLevels: d.basalCreditLevels,
        maxLevelCorrect: d.maxLevelCorrect,
      };
    } else {
      gsItems = d.items;
    }
  }

  const gsmForward = laddered.gsm.items.filter(
    (it) => it.direction === "forward",
  );
  const gsmBackward = laddered.gsm.items.filter(
    (it) => it.direction === "backward",
  );

  const all = [
    ...laddered.gf.items,
    ...laddered.gv.items,
    ...laddered.ct.items,
    ...laddered.ef.items,
    ...laddered.gsm.items,
    ...laddered.glr.items,
    ...gsItems,
  ];
  return { laddered, gsmForward, gsmBackward, gsItems, all };
}

/** Produce the full deterministic assessment result for a completed session. */
export function finalize(state: SessionState): AssessmentResult {
  const { age } = state;
  const { laddered, gsmForward, gsmBackward, gsItems, all } =
    collectItems(state);

  const attention = deriveAttention(all, age);

  // ── per-signal results ──────────────────────────────────────────────────────
  const signals = {} as Record<ScoredSignal, SignalResult>;
  const signalIndex = {} as Record<ScoredSignal, number>;
  const evidence = {} as Record<ScoredSignal, Evidence>;

  // Accuracy-family laddered domains (Gf, Gv, CT) — level-weighted accuracy
  // with basal credit, anchored per signal × age.
  for (const signal of ["gf", "gv", "ct"] as const) {
    const { items, creditLevels, maxLevelCorrect } = laddered[signal];
    const raw = weightedAccuracy(items, creditLevels);
    const index = accuracyIndex(raw, expectedWeightedAccuracy(signal, age));
    signalIndex[signal] = index;
    evidence[signal] = evidenceFromCount(items.length);
    signals[signal] = {
      rawScore: raw,
      index,
      itemsAdministered: items.length,
      perItem: perItemOf(items),
      ...timeObservables(items),
      impulsiveErrorRate: impulsiveRate(items),
      ceiling: ladderCeiling(items, maxLevelCorrect),
      floor: ladderFloor(items),
    };
  }

  // EF — accuracy family via LEVEL-WEIGHTED planning efficiency (v2).
  {
    const { items, creditLevels, maxLevelCorrect } = laddered.ef;
    const raw = efEfficiency(items, creditLevels);
    const index = accuracyIndex(raw, expectedWeightedAccuracy("ef", age));
    signalIndex.ef = index;
    evidence.ef = evidenceFromCount(items.length);
    signals.ef = {
      rawScore: raw,
      index,
      itemsAdministered: items.length,
      perItem: perItemOf(items),
      ...timeObservables(items),
      impulsiveErrorRate: impulsiveRate(items),
      ceiling: ladderCeiling(items, maxLevelCorrect),
      floor: ladderFloor(items),
    };
  }

  // Gsm — span family over the direction-carrying ladder (offset 0.5, v2).
  {
    const items = laddered.gsm.items;
    const forwardSpan = maxCorrectSpan(gsmForward);
    const backwardSpan = maxCorrectSpan(gsmBackward);
    const ran = gsmBackward.length > 0;
    const raw = spanForIndex(forwardSpan, backwardSpan, age, ran);
    const index = spanIndex(raw, byAge(EXPECTED_FORWARD_SPAN_BY_AGE, age));
    signalIndex.gsm = index;
    evidence.gsm = evidenceFromCount(items.length);
    signals.gsm = {
      rawScore: raw,
      index,
      itemsAdministered: items.length,
      perItem: perItemOf(items),
      span: { forward: forwardSpan, backward: backwardSpan },
      ...timeObservables(items),
      ceiling: spanCeiling(forwardSpan, backwardSpan),
      // Floor = no evidence of mastery in ANY administered direction (keeps
      // floor/ceiling mutually exclusive; D-066).
      floor:
        gsmForward.length > 0 &&
        correctCount(gsmForward) === 0 &&
        (gsmBackward.length === 0 || correctCount(gsmBackward) === 0),
    };
  }

  // Gs — speed family over the 2 scored rounds (the one time-dependent score).
  {
    const raw = gsNetPerMin(gsItems);
    const index = speedIndex(raw, byAge(GS_EXPECTED_NET_PER_MIN_BY_AGE, age));
    signalIndex.gs = index;
    let tapped = 0;
    let cells = 0;
    let found = 0;
    let targets = 0;
    let falseTaps = 0;
    for (const it of gsItems) {
      if (!it.gs) continue;
      tapped += it.gs.tappedCount;
      cells += it.gs.cellCount;
      found += it.gs.found;
      targets += it.gs.targetCount;
      falseTaps += it.gs.falseTaps;
    }
    const mashing = cells > 0 && tapped / cells >= GS_MASHING_FRACTION;
    evidence.gs = mashing ? 0 : gsItems.length > 0 ? 2 : 0;
    signals.gs = {
      rawScore: raw,
      index,
      itemsAdministered: gsItems.length,
      perItem: perItemOf(gsItems),
      meanEffectiveTimeMs: mean(gsItems.map((it) => it.effectiveTimeMs)),
      // Ceiling: every target found, zero errors, across BOTH scored rounds.
      ceiling:
        gsItems.length > 0 &&
        targets > 0 &&
        found === targets &&
        falseTaps === 0,
      floor: gsItems.length > 0 && found === 0,
    };
  }

  // Glr — accuracy family via LEVEL-WEIGHTED recall accuracy + learning slope (v2).
  {
    const { items, creditLevels, maxLevelCorrect } = laddered.glr;
    const raw = glrRecall(items, creditLevels);
    const index = accuracyIndex(raw, expectedWeightedAccuracy("glr", age));
    signalIndex.glr = index;
    const totalRounds = items.reduce(
      (a, it) => a + (it.glr?.roundAccuracies.length ?? 0),
      0,
    );
    evidence.glr = evidenceFromGlrRounds(totalRounds);
    signals.glr = {
      rawScore: raw,
      index,
      itemsAdministered: items.length,
      perItem: perItemOf(items),
      meanEffectiveTimeMs: mean(items.map((it) => it.effectiveTimeMs)),
      learningSlope: learningSlope(items),
      ceiling: ladderCeiling(items, maxLevelCorrect),
      floor: ladderFloor(items),
    };
  }

  // Attention — derived, never administered (no items).
  {
    const index = accuracyIndex(attention.score, ATTENTION_EXPECTED_SCORE);
    signalIndex.attention = index;
    evidence.attention = evidenceFromCount(attention.itemCount);
    signals.attention = {
      rawScore: attention.score,
      index,
      itemsAdministered: 0,
      perItem: [],
      meanEffectiveTimeMs: attention.meanEffectiveTimeMs,
      timeVariability: attention.timeVariability,
      impulsiveErrorRate: attention.impulsiveErrorRate,
      ceiling: false,
      floor: false,
    };
  }

  // ── validity + confidence (confidence reads validity's flags) ───────────────
  const validity = computeValidity(all, age);
  const confidence = computeConfidence(evidence, validity);

  // ── composite indices ───────────────────────────────────────────────────────
  const indices = {} as Record<IndexKey, IndexResult>;
  for (const key of INDEX_ORDER) {
    const value = compositeIndex(key, signalIndex);
    const cf = indexExtremes(key, signals);
    indices[key] = {
      value,
      band: bandFor(value),
      confidence: confidence[key],
      ceiling: cf.ceiling,
      floor: cf.floor,
    };
  }

  return {
    meta: {
      age,
      sessionSeed: state.sessionSeed,
      scoringVersion: SCORING_VERSION,
      normsVersion: NORMS_VERSION,
      taskBankVersion: TASK_BANK_VERSION,
      normsStage: "seed",
    },
    signals,
    indices,
    validity,
  };
}

/** Propagate extremes from the dominant contributing signal(s) to a composite. */
function indexExtremes(
  key: IndexKey,
  signals: Record<ScoredSignal, SignalResult>,
): { ceiling: boolean; floor: boolean } {
  switch (key) {
    case "logic":
      return { ceiling: signals.gf.ceiling, floor: signals.gf.floor };
    case "spatial":
      return { ceiling: signals.gv.ceiling, floor: signals.gv.floor };
    case "memory":
      return { ceiling: signals.gsm.ceiling, floor: signals.gsm.floor };
    case "planning":
      return { ceiling: signals.ef.ceiling, floor: signals.ef.floor };
    case "stem":
      return {
        ceiling: signals.ct.ceiling || signals.glr.ceiling,
        floor: signals.ct.floor && signals.glr.floor,
      };
  }
}
