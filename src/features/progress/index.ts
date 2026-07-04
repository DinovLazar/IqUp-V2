/**
 * Local progress — public barrel (Phase 3.01, spec Дел 14.2).
 *
 * An ANONYMOUS, on-device record of a child's prior result summary, so a repeat
 * visit can (a) generate a fresh item set (never re-showing questions) and (b)
 * compute a local growth comparison — all in the browser, linked to no identity
 * and joinable to neither the anonymous score store nor the Brevo lead store
 * (spec §14.1). This phase ships the storage + repeat-seed + cross-major guard +
 * a clean read API; it does NOT render the comparison (a later report phase does).
 *
 * Split like the timing layer: pure logic (`summary` / `compare` / `repeat` /
 * `schema`) + one thin IO adapter (`storage`). The composed read/write API below
 * is the single entry point a UI consumes.
 */

import type { AssessmentResult } from "@/features/scoring";
import { buildStoredProfile, type StoredProfileMeta } from "./summary";
import { compareToPrior, type GrowthComparison } from "./compare";
import { sessionSeedFor } from "./repeat";
import { loadStoredProfile, saveStoredProfile } from "./storage";
import type { StoredProfile } from "./schema";

// Pure building blocks (also exported for direct use + testing).
export * from "./schema";
export { buildStoredProfile, type StoredProfileMeta } from "./summary";
export {
  compareToPrior,
  isCrossMajor,
  majorVersion,
  type GrowthComparison,
  type IndexGrowth,
} from "./compare";
export { nextRepeatSeed, sessionSeedFor } from "./repeat";
export {
  loadStoredProfile,
  saveStoredProfile,
  clearStoredProfile,
  STORAGE_KEY,
} from "./storage";

// ── Composed read/write API (what the flow + a future report/UI consume) ────────

/** The prior on-device profile, or null if none / unreadable / different schema. */
export function loadPriorProfile(): StoredProfile | null {
  return loadStoredProfile();
}

/**
 * Resolve the seed + attempt for a new session from the prior profile: first run ⇒
 * the caller's fresh random seed at attempt 1; a repeat ⇒ a derived fresh seed at
 * the next attempt (so the item set differs — spec Дел 14.2).
 */
export function resolveSessionSeed(
  prior: StoredProfile | null,
  freshSeed: string,
): { setSeed: string; attempt: number } {
  return sessionSeedFor(prior, freshSeed);
}

/** Persist a just-finished session's anonymous summary (best-effort, on-device). */
export function saveSessionProfile(
  result: AssessmentResult,
  meta: StoredProfileMeta,
): void {
  saveStoredProfile(buildStoredProfile(result, meta));
}

/**
 * The growth comparison for a current result against the stored prior — null if
 * there is no prior. Cross-major task bank yields the graceful incomparable
 * fallback (D-134). This is the read API a report/UI consumes; it renders nothing.
 */
export function readGrowth(current: AssessmentResult): GrowthComparison | null {
  const prior = loadStoredProfile();
  return prior ? compareToPrior(prior, current) : null;
}
