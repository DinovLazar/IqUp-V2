/**
 * Seed norms & scoring config — barrel.
 *
 * One module (`seed-norms.ts`) holds every tunable constant the adaptive engine
 * and scoring layer use, each labelled as a seed value to be recalibrated from
 * pilot + anonymous data (spec Дел 6.6). `SCORING_VERSION` / `NORMS_VERSION` are
 * carried in every `AssessmentResult.meta`.
 */
export * from "./seed-norms";
