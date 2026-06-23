import { describe, expect, it } from "vitest";

import { PROFILES, scoreProfile } from "@/features/assessment/fixtures";
import { assembleReport, resolveChild, resolveText } from "@/features/report";
import type { ReportModel } from "@/features/report";

/**
 * `{child}` token resolution (resolved-decision 2 — no child name is ever collected).
 * The token expands to „вашето дете", capitalised to „Вашето дете" at a sentence
 * start, and no raw token may survive into an assembled report.
 */
describe("report engine — child-token resolver", () => {
  it("uses the sentence-initial form at the start of a string", () => {
    expect(resolveChild("{child} мисли во слики.")).toBe(
      "Вашето дете мисли во слики.",
    );
  });

  it("uses the mid-sentence form after a word", () => {
    expect(resolveChild("областа со простор за раст кај {child}.")).toBe(
      "областа со простор за раст кај вашето дете.",
    );
  });

  it("capitalises after a sentence terminator", () => {
    expect(resolveChild("Одлично. {child} продолжува.")).toBe(
      "Одлично. Вашето дете продолжува.",
    );
  });

  it("resolves multiple tokens in one string independently", () => {
    expect(resolveChild("{child} учи, а потоа {child} применува.")).toBe(
      "Вашето дете учи, а потоа вашето дете применува.",
    );
  });

  it("falls back to mk when a language slot is empty", () => {
    expect(resolveText({ mk: "здраво" }, "en")).toBe("здраво");
  });

  it("leaves no raw {child} token in any assembled report", () => {
    function strings(r: ReportModel): string[] {
      const out: string[] = [];
      if (r.partA) {
        out.push(
          r.partA.topStrength.text,
          r.partA.growthArea.text,
          r.partA.solvingStyle.text,
        );
        for (const a of r.partA.activities) out.push(...a.items);
        if (r.partA.extreme) out.push(r.partA.extreme.text);
      }
      if (r.partB) out.push(r.partB.readiness.text, r.partB.stemBridge.text);
      if (r.positioning) out.push(r.positioning.text);
      if (r.cta) out.push(r.cta.text);
      if (r.validity.note) out.push(r.validity.note);
      return out;
    }
    for (const p of PROFILES) {
      for (const s of strings(assembleReport(scoreProfile(p)))) {
        expect(s, `unresolved token in: ${s}`).not.toContain("{child}");
      }
    }
  });
});
