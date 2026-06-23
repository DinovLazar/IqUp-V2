import { describe, expect, it } from "vitest";

import { PROFILES, scoreProfile } from "@/features/assessment/fixtures";
import { INDEX_ORDER } from "@/lib/indices";
import { ACTIVITY_MODULES } from "@/content/modules";
import { assembleReport } from "@/features/report";

/**
 * Coverage — every valid profile yields a non-empty Part A, Part B, positioning and
 * CTA, and EVERY index carries ≥ 1 home activity (Прилог C: "each index, not only
 * the growth zone, carries at least one concrete activity"). Full coverage means no
 * reachable profile ever renders a blank section.
 */
describe("report engine — coverage", () => {
  it("the activity library covers every index", () => {
    for (const key of INDEX_ORDER) {
      const m = ACTIVITY_MODULES.find((a) => a.index === key);
      expect(m, `missing activity module for ${key}`).toBeDefined();
      expect((m?.activities ?? []).length).toBeGreaterThan(0);
    }
  });

  for (const profile of PROFILES) {
    if (profile.label === "strong-invalid") continue; // retry variant has no profile
    it(`"${profile.label}" yields a complete, non-empty report`, () => {
      const r = assembleReport(scoreProfile(profile));

      // Part A
      expect(r.partA?.topStrength.text.length).toBeGreaterThan(0);
      expect(r.partA?.growthArea.text.length).toBeGreaterThan(0);
      expect(r.partA?.solvingStyle.text.length).toBeGreaterThan(0);

      // Every index carries ≥ 1 activity item.
      expect(r.partA?.activities.length).toBe(INDEX_ORDER.length);
      for (const key of INDEX_ORDER) {
        const block = r.partA?.activities.find((a) => a.index === key);
        expect(block, `missing activities for ${key}`).toBeDefined();
        expect((block?.items ?? []).length).toBeGreaterThan(0);
      }

      // Part B
      expect(r.partB?.readiness.text.length).toBeGreaterThan(0);
      expect(r.partB?.stemBridge.text.length).toBeGreaterThan(0);

      // Positioning + CTA
      expect(r.positioning?.text.length).toBeGreaterThan(0);
      expect(r.positioning?.program.name.length).toBeGreaterThan(0);
      expect(r.positioning?.programHook.length).toBeGreaterThan(0);
      expect(r.cta?.text.length).toBeGreaterThan(0);

      // Five parent-facing index rows; word + range only, never a digit.
      expect(r.indices?.length).toBe(INDEX_ORDER.length);
      for (const row of r.indices ?? []) {
        expect(row.wordLabel).not.toMatch(/\d/);
        expect(row.range).not.toMatch(/\d/);
      }
    });
  }
});
