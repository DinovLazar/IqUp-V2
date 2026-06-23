import { describe, expect, it } from "vitest";

import { PROFILES, scoreProfile } from "@/features/assessment/fixtures";
import { assembleReport, deriveFeatures } from "@/features/report";

/**
 * Determinism — the report engine's core contract (resolved-decision 4): same
 * `AssessmentResult` in → deep-equal `ReportModel` out, with deterministic
 * tie-breaking. Because `scoreProfile` is itself deterministic, scoring + deriving
 * + assembling a fixture twice must be byte-for-byte identical.
 */
describe("report engine — determinism", () => {
  for (const profile of PROFILES) {
    it(`assembles a deep-equal report for "${profile.label}" every time`, () => {
      const a = assembleReport(scoreProfile(profile));
      const b = assembleReport(scoreProfile(profile));
      expect(a).toEqual(b);
    });

    it(`derives deep-equal features for "${profile.label}" every time`, () => {
      const a = deriveFeatures(scoreProfile(profile));
      const b = deriveFeatures(scoreProfile(profile));
      expect(a).toEqual(b);
    });
  }

  it("re-assembling the SAME result object is also deep-equal (no hidden state)", () => {
    const result = scoreProfile(PROFILES[0]);
    expect(assembleReport(result)).toEqual(assembleReport(result));
  });
});
