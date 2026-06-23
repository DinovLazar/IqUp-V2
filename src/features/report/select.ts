/**
 * On-screen summary selector (spec Дел 10.1). The confirmation screen (1.08) shows
 * a SUMMARY only — the pentagon + the five bands + the top strength + the CTA. The
 * full report (growth, activities, STEM bridge, positioning) lives only in the
 * emailed PDF (1.09).
 *
 * Pure projection of the already-assembled `ReportModel`; it never re-selects or
 * recomputes. No disclaimer here — that is the shared 1.10 component.
 */

import type { ReportModel, ReportSummary } from "./types";

export function selectReportSummary(report: ReportModel): ReportSummary {
  return {
    variant: report.variant,
    indices: report.indices,
    topStrength: report.partA?.topStrength ?? null,
    cta: report.cta,
    validity: report.validity,
  };
}
