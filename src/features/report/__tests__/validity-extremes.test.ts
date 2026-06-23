import { describe, expect, it } from "vitest";

import {
  ceilingProfile,
  flatTypical,
  scoreProfile,
  strongInvalid,
} from "@/features/assessment/fixtures";
import type { AssessmentResult } from "@/features/scoring";
import { assembleReport } from "@/features/report";

/**
 * Validity + extremes (spec Дел 7.1 / 7.3).
 *   • strong flag → the graceful retry variant, NOT a confident profile.
 *   • mild flag → an otherwise-normal report with the soft note attached.
 *   • ceiling → the positive ceiling copy in Part A.
 */
describe("report engine — validity + extremes", () => {
  it("strong-invalid → retry variant with no confident profile", () => {
    const r = assembleReport(scoreProfile(strongInvalid));
    expect(r.variant).toBe("retry");
    expect(r.indices).toBeNull();
    expect(r.partA).toBeNull();
    expect(r.partB).toBeNull();
    expect(r.positioning).toBeNull();
    expect(r.cta).toBeNull();
    expect(r.validity.variant).toBe("strong");
    expect(r.validity.retry).toBe(true);
    expect(r.validity.note ?? "").toMatch(/репрезентативни/);
  });

  it("a mild flag keeps the full profile and appends the soft note", () => {
    // flat-typical is a valid (ok) profile; force a mild verdict to exercise the branch.
    const base = scoreProfile(flatTypical);
    const mild: AssessmentResult = {
      ...base,
      validity: {
        session: "mild",
        flags: [{ code: "too_fast", severity: "mild" }],
      },
    };
    const r = assembleReport(mild);
    expect(r.variant).toBe("profile");
    expect(r.partA).not.toBeNull(); // still a confident profile
    expect(r.indices).not.toBeNull();
    expect(r.validity.variant).toBe("mild");
    expect(r.validity.retry).toBe(false);
    expect(r.validity.note ?? "").toMatch(/брзи/);
  });

  it("an ok profile carries no validity note", () => {
    const r = assembleReport(scoreProfile(flatTypical));
    expect(r.validity.variant).toBe("ok");
    expect(r.validity.note).toBeUndefined();
    expect(r.validity.retry).toBe(false);
  });

  it("the ceiling fixture shows the positive ceiling copy", () => {
    const r = assembleReport(scoreProfile(ceilingProfile));
    expect(r.partA?.extreme?.kind).toBe("ceiling");
    expect(r.partA?.extreme?.text ?? "").toMatch(/врвот/);
  });
});
