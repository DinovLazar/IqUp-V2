/**
 * finalize — fold a completed session state into the deterministic
 * `AssessmentResult`: per-signal raw scores + 0–100 indices (spec Дел 6.1/6.2),
 * the derived attention signal (Дел 3.1 #5), the five composites (Дел 6.3) with
 * bands (Дел 6.4), confidence (Дел 6.5), validity (Дел 7.1) and extremes (Дел 7.3).
 *
 * Pure: same final state ⇒ deep-equal result, always.
 */

import {
  EXPECTED_FORWARD_SPAN_BY_AGE,
  GS_EXPECTED_NET_PER_MIN_BY_AGE,
  GS_MASHING_FRACTION,
  NORMS_VERSION,
  SCORING_VERSION,
  byAge,
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

/** Collect each domain's graded items + one flat list of everything. */
function collectItems(state: SessionState): {
  laddered: Record<"gf" | "gv" | "ef" | "ct", GradedItem[]>;
  gsmForward: GradedItem[];
  gsmBackward: GradedItem[];
  gsItem: GradedItem | null;
  glrItem: GradedItem | null;
  all: GradedItem[];
} {
  const laddered = { gf: [], gv: [], ef: [], ct: [] } as Record<
    "gf" | "gv" | "ef" | "ct",
    GradedItem[]
  >;
  let gsmForward: GradedItem[] = [];
  let gsmBackward: GradedItem[] = [];
  let gsItem: GradedItem | null = null;
  let glrItem: GradedItem | null = null;

  for (const signal of state.order) {
    const d = state.domains[signal];
    if (d.kind === "laddered") {
      laddered[d.signal as "gf" | "gv" | "ef" | "ct"] = d.items;
    } else if (d.kind === "span") {
      gsmForward = d.forward;
      gsmBackward = d.backward;
    } else if (d.signal === "gs") {
      gsItem = d.item;
    } else {
      glrItem = d.item;
    }
  }

  const all = [
    ...laddered.gf,
    ...laddered.gv,
    ...laddered.ct,
    ...laddered.ef,
    ...gsmForward,
    ...gsmBackward,
    ...(gsItem ? [gsItem] : []),
    ...(glrItem ? [glrItem] : []),
  ];
  return { laddered, gsmForward, gsmBackward, gsItem, glrItem, all };
}

/**
 * Session-level context the scoring layer consumes but the pure engine state does
 * not carry (Phase 3.01). Captured alongside the session in the flow — parent
 * assist and the device tap baseline from the first practice item — and passed in
 * here to modulate the §7.1 validity thresholds. This deliberately does NOT widen
 * the per-item `ResponseTiming` / `CapturedTiming` contract (D-071 left that call
 * to 3.01; the decision is to keep it unchanged — D-131). Omit for the 1.05
 * behaviour (used verbatim by the existing tests + fixtures).
 */
export interface ScoringContext {
  /** 5–7yo parent-assist mode — relaxes the time-based validity thresholds (§7.4). */
  parentAssistMode?: boolean;
  /** Device tap baseline (ms) from the first practice item (§7.2, D-071). */
  deviceBaselineMs?: number;
}

/** Produce the full deterministic assessment result for a completed session. */
export function finalize(
  state: SessionState,
  context: ScoringContext = {},
): AssessmentResult {
  const { age } = state;
  const { laddered, gsmForward, gsmBackward, gsItem, glrItem, all } =
    collectItems(state);

  const attention = deriveAttention(all);

  // ── per-signal results ──────────────────────────────────────────────────────
  const signals = {} as Record<ScoredSignal, SignalResult>;
  const signalIndex = {} as Record<ScoredSignal, number>;
  const evidence = {} as Record<ScoredSignal, Evidence>;

  // Accuracy-family laddered domains (Gf, Gv, CT) — weighted accuracy.
  for (const signal of ["gf", "gv", "ct"] as const) {
    const items = laddered[signal];
    const d = state.domains[signal];
    const maxLevelCorrect = d.kind === "laddered" ? d.maxLevelCorrect : 0;
    const raw = weightedAccuracy(items);
    const index = accuracyIndex(raw);
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

  // EF — accuracy family via planning-efficiency ratio.
  {
    const items = laddered.ef;
    const d = state.domains.ef;
    const maxLevelCorrect = d.kind === "laddered" ? d.maxLevelCorrect : 0;
    const raw = efEfficiency(items);
    const index = accuracyIndex(raw);
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

  // Gsm — span family (forward, + backward from age 8).
  {
    const items = [...gsmForward, ...gsmBackward];
    const forwardSpan = maxCorrectSpan(gsmForward);
    const backwardSpan = maxCorrectSpan(gsmBackward);
    const ran = gsmBackward.length > 0;
    const raw = spanForIndex(forwardSpan, backwardSpan, age, ran);
    const index = spanIndex(raw, byAge(EXPECTED_FORWARD_SPAN_BY_AGE, age));
    signalIndex.gsm = index;
    evidence.gsm = evidenceFromCount(gsmForward.length);
    signals.gsm = {
      rawScore: raw,
      index,
      itemsAdministered: items.length,
      perItem: perItemOf(items),
      span: { forward: forwardSpan, backward: backwardSpan },
      ...timeObservables(items),
      ceiling: spanCeiling(forwardSpan, backwardSpan),
      // Floor = no evidence of mastery in ANY administered direction (keeps
      // floor/ceiling mutually exclusive even if backward outruns a failed
      // forward; D-066). Backward only runs from age 8.
      floor:
        gsmForward.length > 0 &&
        correctCount(gsmForward) === 0 &&
        (gsmBackward.length === 0 || correctCount(gsmBackward) === 0),
    };
  }

  // Gs — speed family (one timed grid; the one time-dependent score).
  {
    const items = gsItem ? [gsItem] : [];
    const raw = gsNetPerMin(gsItem);
    const index = speedIndex(raw, byAge(GS_EXPECTED_NET_PER_MIN_BY_AGE, age));
    signalIndex.gs = index;
    const mashing =
      !!gsItem?.gs &&
      gsItem.gs.cellCount > 0 &&
      gsItem.gs.tappedCount / gsItem.gs.cellCount >= GS_MASHING_FRACTION;
    evidence.gs = mashing ? 0 : gsItem ? 2 : 0;
    signals.gs = {
      rawScore: raw,
      index,
      itemsAdministered: items.length,
      perItem: perItemOf(items),
      meanEffectiveTimeMs: gsItem?.effectiveTimeMs ?? 0,
      ceiling:
        !!gsItem?.gs &&
        gsItem.gs.found === gsItem.gs.targetCount &&
        gsItem.gs.falseTaps === 0 &&
        gsItem.level !== undefined &&
        gsItem.level >= 9,
      floor: !!gsItem?.gs && gsItem.gs.found === 0,
    };
  }

  // Glr — accuracy family via recall accuracy + learning slope.
  {
    const items = glrItem ? [glrItem] : [];
    const raw = glrRecall(glrItem);
    const index = accuracyIndex(raw);
    signalIndex.glr = index;
    const rounds = glrItem?.glr?.roundAccuracies ?? [];
    evidence.glr = evidenceFromGlrRounds(rounds.length);
    const lastAcc = rounds.length > 0 ? rounds[rounds.length - 1] : 0;
    signals.glr = {
      rawScore: raw,
      index,
      itemsAdministered: items.length,
      perItem: perItemOf(items),
      meanEffectiveTimeMs: glrItem?.effectiveTimeMs ?? 0,
      learningSlope: learningSlope(glrItem),
      ceiling: lastAcc === 1 && (glrItem?.level ?? 0) >= 9,
      floor: rounds.length > 0 && lastAcc === 0,
    };
  }

  // Attention — derived, never administered (no items).
  {
    const index = accuracyIndex(attention.score);
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
  // Age is authoritative in the engine state; parent-assist + the device baseline
  // ride in the session context (Phase 3.01). Absent context ⇒ 1.05 thresholds.
  const validity = computeValidity(all, {
    age,
    parentAssistMode: context.parentAssistMode,
    deviceBaselineMs: context.deviceBaselineMs,
  });
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
