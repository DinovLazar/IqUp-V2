/**
 * Phase 3.01 — local growth comparison + the cross-major comparability guard
 * (spec Дел 14.2 / 19.4, D-134). Same major task bank ⇒ per-index deltas + band
 * movement; a different task-bank MAJOR ⇒ the graceful "new version, fresh profile"
 * fallback with NO numeric comparison.
 */

import { describe, expect, it } from "vitest";
import type { AssessmentResult } from "@/features/scoring";
import {
  scoreProfile,
  flatTypical,
  logicStrong,
} from "@/features/assessment/fixtures";
import { compareToPrior, isCrossMajor, majorVersion } from "../compare";
import { buildStoredProfile } from "../summary";

/** Clone a result with an overridden task-bank version stamp (for the guard test). */
function withTaskBankVersion(
  result: AssessmentResult,
  version: string,
): AssessmentResult {
  return { ...result, meta: { ...result.meta, taskBankVersion: version } };
}

describe("version helpers", () => {
  it("majorVersion parses the leading integer; malformed ⇒ 0", () => {
    expect(majorVersion("1.0.0")).toBe(1);
    expect(majorVersion("2.3.1")).toBe(2);
    expect(majorVersion("")).toBe(0);
    expect(majorVersion("x.y")).toBe(0);
  });

  it("isCrossMajor compares only the major", () => {
    expect(isCrossMajor("1.0.0", "1.9.9")).toBe(false);
    expect(isCrossMajor("1.0.0", "2.0.0")).toBe(true);
  });
});

describe("compareToPrior — same major (Дел 14.2)", () => {
  const prior = buildStoredProfile(scoreProfile(flatTypical), {
    setSeed: "run-1",
    attempt: 1,
  });
  // A stronger second run (logic-strong) so at least one index clearly moves up.
  const current = scoreProfile(logicStrong);

  it("returns per-index deltas + band movement + attempt counts", () => {
    const cmp = compareToPrior(prior, current);
    if (!cmp.comparable) throw new Error("expected a comparable result");
    expect(cmp.attempts).toEqual({ prior: 1, current: 2 });

    const logic = cmp.indices.logic;
    expect(logic.priorValue).toBe(prior.indices.logic.value);
    expect(logic.currentValue).toBe(current.indices.logic.value);
    expect(logic.delta).toBe(logic.currentValue - logic.priorValue);
    expect(logic.direction).toBe(
      logic.delta > 0 ? "up" : logic.delta < 0 ? "down" : "same",
    );
    expect(logic.bandChanged).toBe(logic.priorBand !== logic.currentBand);
    // logic-strong really is stronger than flat on the logic index
    expect(logic.currentValue).toBeGreaterThan(logic.priorValue);
  });

  it("identical prior + current ⇒ every index 'same', zero delta", () => {
    const same = scoreProfile(flatTypical);
    const cmp = compareToPrior(prior, same);
    if (!cmp.comparable) throw new Error("expected a comparable result");
    for (const g of Object.values(cmp.indices)) {
      expect(g.delta).toBe(0);
      expect(g.direction).toBe("same");
      expect(g.bandChanged).toBe(false);
    }
  });
});

describe("cross-major guard (D-134 / Дел 19.4)", () => {
  it("a stored v1 stamp vs a current v2 build ⇒ incomparable, NO numeric comparison", () => {
    // Stored under an old v1 task bank (stamp injected — the live build is v2) …
    const priorV1 = buildStoredProfile(
      withTaskBankVersion(scoreProfile(flatTypical), "1.0.0"),
      {
        setSeed: "run-1",
        attempt: 1,
      },
    );
    // … compared against a v2 build.
    const currentV2 = withTaskBankVersion(scoreProfile(logicStrong), "2.0.0");

    const cmp = compareToPrior(priorV1, currentV2);
    expect(cmp.comparable).toBe(false);
    if (cmp.comparable) throw new Error("unreachable");
    expect(cmp.reason).toBe("cross-major-version");
    expect(cmp.priorTaskBankVersion).toBe(priorV1.stamps.taskBankVersion);
    expect(cmp.currentTaskBankVersion).toBe("2.0.0");
    // crucially, no per-index numbers are exposed in the fallback
    expect((cmp as Record<string, unknown>).indices).toBeUndefined();
  });

  it("a minor/patch bump within the same major stays comparable", () => {
    // Both stamps share major 2 (injected, so the assertion is independent of the
    // live task-bank version) — a minor/patch bump must stay comparable.
    const prior = buildStoredProfile(
      withTaskBankVersion(scoreProfile(flatTypical), "2.0.0"),
      {
        setSeed: "run-1",
        attempt: 1,
      },
    );
    const currentPatched = withTaskBankVersion(
      scoreProfile(flatTypical),
      "2.5.2",
    );
    expect(compareToPrior(prior, currentPatched).comparable).toBe(true);
  });
});
