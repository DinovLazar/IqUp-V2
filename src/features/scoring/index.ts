/**
 * Scoring layer — public barrel.
 *
 * Turns graded responses into the parent-facing result: raw scores (Дел 6.1),
 * raw→0–100 indices (Дел 6.2), derived attention (Дел 3.1 #5), the five composites
 * (Дел 6.3), bands (Дел 6.4), confidence (Дел 6.5), validity (Дел 7.1) and extremes
 * (Дел 7.3). All pure: same input ⇒ deep-equal output. The `AssessmentResult`
 * feeds the 1.03 UI kit with no adapter.
 */

export * from "./types";
export { finalize } from "./finalize";
export { gradeItem } from "./grade";
export { deriveAttention, type AttentionResult } from "./attention";
export { computeValidity, type ValidityResult } from "./validity";
export {
  computeConfidence,
  evidenceFromCount,
  evidenceFromGlrRounds,
  type Evidence,
} from "./confidence";
export {
  accuracyIndex,
  spanIndex,
  speedIndex,
  compositeIndex,
  contributingSignals,
  bandFor,
  clampIndex,
} from "./indices";
export {
  weightedAccuracy,
  efEfficiency,
  glrRecall,
  learningSlope,
  gsNetPerMin,
  maxCorrectSpan,
  spanForIndex,
  correctCount,
  ladderCeiling,
  ladderFloor,
  spanCeiling,
} from "./raw";
export {
  effectiveTime,
  countExcludedGaps,
  mean,
  stdDev,
  coefficientOfVariation,
} from "./time";
