/**
 * Local growth comparison (spec Дел 14.2) + the cross-major comparability guard
 * (D-134 / spec Дел 19.4). Pure: compares a stored prior profile to the current
 * result and returns per-index deltas — OR, if the task bank's MAJOR version has
 * changed since the prior run, a graceful "new version, fresh profile" state with
 * NO numeric comparison (the two runs are not measured on the same instrument).
 *
 * This module ships the DATA only. It is deliberately NOT rendered into the report
 * this phase (the growth UI is a later report phase); a report/UI consumes the
 * typed result via the read API.
 */

import type { AssessmentResult } from "@/features/scoring";
import { INDEX_ORDER, type IndexKey } from "@/lib/indices";
import type { Band } from "@/components/ui/band-label";
import type { StoredProfile } from "./schema";

/** Parse the MAJOR from a semver-ish string ("2.3.1" → 2); malformed ⇒ 0. */
export function majorVersion(version: string): number {
  const major = Number.parseInt(version.split(".")[0] ?? "", 10);
  return Number.isFinite(major) ? major : 0;
}

/** Whether two task-bank version strings differ in their MAJOR (⇒ not comparable). */
export function isCrossMajor(prior: string, current: string): boolean {
  return majorVersion(prior) !== majorVersion(current);
}

/** One index's movement between the prior and current run (internal values). */
export interface IndexGrowth {
  /** 0–100 prior/current values — internal geometry, never shown as a number. */
  priorValue: number;
  currentValue: number;
  /** current − prior (positive ⇒ grew). Internal. */
  delta: number;
  priorBand: Band;
  currentBand: Band;
  bandChanged: boolean;
  direction: "up" | "down" | "same";
}

/** The comparison result — either an incomparable fallback or per-index growth. */
export type GrowthComparison =
  | {
      comparable: false;
      /** Why no numeric comparison is shown (D-134). */
      reason: "cross-major-version";
      priorTaskBankVersion: string;
      currentTaskBankVersion: string;
    }
  | {
      comparable: true;
      attempts: { prior: number; current: number };
      indices: Record<IndexKey, IndexGrowth>;
    };

/**
 * Compare a stored prior profile to the current scored result. Cross-major task
 * bank ⇒ the graceful incomparable fallback (no direct numeric comparison, D-134);
 * otherwise the per-index deltas + band movement.
 */
export function compareToPrior(
  prior: StoredProfile,
  current: AssessmentResult,
): GrowthComparison {
  const priorVer = prior.stamps.taskBankVersion;
  const currentVer = current.meta.taskBankVersion;

  if (isCrossMajor(priorVer, currentVer)) {
    return {
      comparable: false,
      reason: "cross-major-version",
      priorTaskBankVersion: priorVer,
      currentTaskBankVersion: currentVer,
    };
  }

  const indices = {} as Record<IndexKey, IndexGrowth>;
  for (const key of INDEX_ORDER) {
    const p = prior.indices[key];
    const c = current.indices[key];
    const delta = c.value - p.value;
    indices[key] = {
      priorValue: p.value,
      currentValue: c.value,
      delta,
      priorBand: p.band,
      currentBand: c.band,
      bandChanged: p.band !== c.band,
      direction: delta > 0 ? "up" : delta < 0 ? "down" : "same",
    };
  }

  return {
    comparable: true,
    attempts: { prior: prior.attempt, current: prior.attempt + 1 },
    indices,
  };
}
