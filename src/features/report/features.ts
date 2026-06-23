/**
 * Layer 2 — derived features (spec Дел 9.1).
 *
 * Reads a scored `AssessmentResult` and computes the narrative features the
 * assembly layer selects modules against: profile shape, top strength + primary
 * growth, the observed speed-accuracy style, memory forward/backward asymmetry,
 * the learning slope, extremes, the STEM-bridge lead and the positioning tier.
 *
 * It **never recomputes** indices, bands, confidence or validity — those are
 * mirrored verbatim from 1.05 (resolved-decision 5). The only new numbers here are
 * narrative classifications drawn directly from per-item behaviour (Дел 9.5: "not
 * derived speculatively"). The thresholds below are clearly-labelled report-engine
 * SEEDS — they tune copy selection, never a score.
 *
 * Pure: same `AssessmentResult` in → deep-equal `DerivedFeatures` out.
 */

import { INDEX_ORDER, type IndexKey } from "@/lib/indices";
import type { AssessmentResult } from "@/features/scoring";
import type {
  Band,
  DerivedFeatures,
  ProfileStrength,
  SolvingStyle,
  StemLead,
} from "./types";

/**
 * SEED — narrative-classification thresholds (report engine only; NOT scoring
 * norms). They decide which copy fits, never a number a parent sees.
 */
const NARRATIVE = {
  /** Index spread (max − min) at/above which the profile reads as peaked. */
  peakedSpread: 12,
  /** Reasoning accuracy at/above this reads as "accurate". */
  accurateAccuracy: 0.7,
  /** Too-fast-and-wrong rate at/above this reads as "fast+errors". */
  impulsiveRate: 0.2,
  /** Fast-but-correct rate at/above this (with accuracy) reads as "fast+accurate". */
  fastCorrectRate: 0.25,
  /** Forward − backward Corsi gap beyond the expected 2 that reads as an asymmetry. */
  memoryGap: 3,
} as const;

/** Signals with clean binary correctness used for the solving-style read (Дел 8). */
const REASONING_SIGNALS = ["gf", "gv", "ef", "ct"] as const;

const STRONG_BANDS: ReadonlySet<Band> = new Set(["strong", "exceptional"]);

/** Argmax / argmin over the 5 indices, tie-broken by lib/indices order. */
function pickExtremeIndex(
  value: Record<IndexKey, number>,
  kind: "max" | "min",
): IndexKey {
  let best = INDEX_ORDER[0];
  for (const key of INDEX_ORDER) {
    const better =
      kind === "max" ? value[key] > value[best] : value[key] < value[best];
    if (better) best = key; // strict `>` / `<` keeps the first-in-order on ties
  }
  return best;
}

/** Classify the observed speed-accuracy style straight from behaviour (Дел 9.5). */
function classifyStyle(
  accuracy: number,
  impulsiveRate: number,
  fastCorrectRate: number,
  items: number,
): SolvingStyle {
  if (items === 0) return "balanced";
  if (impulsiveRate >= NARRATIVE.impulsiveRate) return "fast-errors";
  if (accuracy >= NARRATIVE.accurateAccuracy) {
    return fastCorrectRate >= NARRATIVE.fastCorrectRate
      ? "fast-accurate"
      : "slow-accurate";
  }
  return "balanced";
}

/** Lead the STEM bridge with the strongest of spatial / logic / CT (Дел 9.3). */
function stemLeadFrom(
  value: Record<IndexKey, number>,
  band: Record<IndexKey, Band>,
): StemLead {
  const trio: { lead: StemLead; key: IndexKey }[] = [
    { lead: "spatial", key: "spatial" },
    { lead: "logic", key: "logic" },
    { lead: "ct", key: "stem" },
  ];
  // Highest value wins; ties break by lib/indices order (logic < spatial < stem).
  trio.sort((a, b) => {
    if (value[b.key] !== value[a.key]) return value[b.key] - value[a.key];
    return INDEX_ORDER.indexOf(a.key) - INDEX_ORDER.indexOf(b.key);
  });
  const top = trio[0];
  return band[top.key] === "development" ? "default" : top.lead;
}

export function deriveFeatures(result: AssessmentResult): DerivedFeatures {
  const { indices, signals, validity, meta } = result;

  // ── Read-only mirrors of the 1.05 composite output ──────────────────────────
  const indexValue = {} as Record<IndexKey, number>;
  const indexBand = {} as Record<IndexKey, Band>;
  const indexConfidence = {} as Record<
    IndexKey,
    DerivedFeatures["indexConfidence"][IndexKey]
  >;
  const indexCeiling = {} as Record<IndexKey, boolean>;
  const indexFloor = {} as Record<IndexKey, boolean>;
  for (const key of INDEX_ORDER) {
    const r = indices[key];
    indexValue[key] = r.value;
    indexBand[key] = r.band;
    indexConfidence[key] = r.confidence;
    indexCeiling[key] = r.ceiling;
    indexFloor[key] = r.floor;
  }

  const values = INDEX_ORDER.map((k) => indexValue[k]);
  const indexSpread = Math.max(...values) - Math.min(...values);

  const topStrengthIndex = pickExtremeIndex(indexValue, "max");
  const primaryGrowthIndex = pickExtremeIndex(indexValue, "min");
  const growthIsStrong = STRONG_BANDS.has(indexBand[primaryGrowthIndex]);

  // ── Observed solving style — all inputs behavioural (read-only per-item) ─────
  let correct = 0;
  let total = 0;
  let impulsive = 0;
  let fastCorrect = 0;
  for (const signal of REASONING_SIGNALS) {
    for (const item of signals[signal].perItem) {
      total += 1;
      if (item.correct) correct += 1;
      if (item.errorType === "impulsive") impulsive += 1;
      if (item.tooFast && item.correct) fastCorrect += 1;
    }
  }
  const accuracy = total === 0 ? 0 : correct / total;
  const impulsiveRate = total === 0 ? 0 : impulsive / total;
  const fastCorrectRate = total === 0 ? 0 : fastCorrect / total;
  const solvingStyle = classifyStyle(
    accuracy,
    impulsiveRate,
    fastCorrectRate,
    total,
  );

  // ── Memory forward/backward asymmetry (when Corsi backward ran) ──────────────
  const span = signals.gsm.span ?? null;
  const memoryForwardSpan = span?.forward ?? null;
  const memoryBackwardSpan = span && span.backward > 0 ? span.backward : null;
  const memoryForwardStronger =
    memoryForwardSpan !== null &&
    memoryBackwardSpan !== null &&
    memoryForwardSpan - memoryBackwardSpan >= NARRATIVE.memoryGap;

  // ── Learning slope (Glr) + session variability (attention) ───────────────────
  const learningSlope = signals.glr.learningSlope ?? null;
  const positiveLearningSlope = (learningSlope ?? 0) > 0;
  const sessionVariability = signals.attention.timeVariability ?? null;

  // ── Extremes (spec Дел 7.3) ──────────────────────────────────────────────────
  const ceilingCount = INDEX_ORDER.filter((k) => indexCeiling[k]).length;
  const anyCeiling = ceilingCount > 0;
  const anyFloor = INDEX_ORDER.some((k) => indexFloor[k]);

  const stemLead = stemLeadFrom(indexValue, indexBand);
  const profileStrength: ProfileStrength = STRONG_BANDS.has(
    indexBand[topStrengthIndex],
  )
    ? "plus"
    : "basic";

  return {
    age: meta.age,
    profileShape: indexSpread >= NARRATIVE.peakedSpread ? "peaked" : "flat",
    indexSpread,
    indexValue,
    indexBand,
    indexConfidence,
    indexCeiling,
    indexFloor,
    topStrengthIndex,
    primaryGrowthIndex,
    growthIsStrong,
    solvingStyle,
    accuracy,
    impulsiveRate,
    fastCorrectRate,
    memoryForwardSpan,
    memoryBackwardSpan,
    memoryForwardStronger,
    learningSlope,
    positiveLearningSlope,
    sessionVariability,
    anyCeiling,
    anyFloor,
    ceilingCount,
    stemLead,
    profileStrength,
    validity: validity.session,
    validityFlags: validity.flags,
    mildFlag: validity.session === "mild",
    strongFlag: validity.session === "strong",
  };
}
