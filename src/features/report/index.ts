/**
 * Report engine — public barrel (Phase 1.07).
 *
 * Turns a 1.05 `AssessmentResult` into the deterministic, parent-facing
 * `ReportModel` via three pure layers: derived features (Дел 9.1), the versioned MK
 * module library (`@/content/modules`), and assembly (Дел 9.3). The engine consumes
 * 1.05's indices / bands / confidence / validity READ-ONLY — it never recomputes a
 * score, only narrates one (Дел 9). Same input ⇒ deep-equal output.
 */

export * from "./types";
export { deriveFeatures } from "./features";
export { assembleReport } from "./assemble";
export { selectReportSummary } from "./select";
export { selectProgramKey } from "./program";
export { resolveChild, resolveText, resolveTexts } from "./text";
