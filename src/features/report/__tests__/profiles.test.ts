import { describe, expect, it } from "vitest";

import {
  ceilingProfile,
  logicStrong,
  PROFILES,
  scoreProfile,
  spatialStrong,
} from "@/features/assessment/fixtures";
import { assembleReport, deriveFeatures } from "@/features/report";
import type { ReportModel } from "@/features/report";

/**
 * Five profiles → five distinct reports (the spec's acceptance criterion, Дел 9.3:
 * "with enough modules, two children practically never get the same report"). The
 * five canonical fixtures must produce materially different models — different peak
 * / growth / selected module ids — so the personalisation is visible to the eye.
 */

/** A coarse signature of "which report did the engine assemble". */
function signature(r: ReportModel): string {
  if (r.variant === "retry") return "retry";
  return [
    r.partA?.topStrength.moduleId,
    r.partA?.growthArea.moduleId,
    r.partA?.solvingStyle.moduleId,
    r.partB?.stemBridge.moduleId,
    r.positioning?.program.key,
    r.partA?.extreme?.kind ?? "none",
  ].join("|");
}

describe("report engine — five profiles → five distinct reports", () => {
  const reports = PROFILES.map((p) => assembleReport(scoreProfile(p)));

  it("produces a unique signature per fixture", () => {
    const signatures = reports.map(signature);
    expect(new Set(signatures).size).toBe(PROFILES.length);
  });

  it("the four confident profiles differ in top strength OR growth module", () => {
    const confident = reports.filter((r) => r.variant === "profile");
    expect(confident.length).toBe(4);
    const pairs = confident.map(
      (r) => `${r.partA?.topStrength.moduleId}>${r.partA?.growthArea.moduleId}`,
    );
    expect(new Set(pairs).size).toBe(confident.length);
  });

  it("logic-strong peaks at logic; spatial-strong peaks at spatial", () => {
    expect(deriveFeatures(scoreProfile(logicStrong)).topStrengthIndex).toBe(
      "logic",
    );
    expect(deriveFeatures(scoreProfile(spatialStrong)).topStrengthIndex).toBe(
      "spatial",
    );
    expect(
      assembleReport(scoreProfile(logicStrong)).partA?.topStrength.index,
    ).toBe("logic");
    expect(
      assembleReport(scoreProfile(spatialStrong)).partA?.topStrength.index,
    ).toBe("spatial");
  });

  it("a strength and a growth module are always selected for a confident profile", () => {
    for (const r of reports) {
      if (r.variant !== "profile") continue;
      expect(r.partA?.topStrength.text.length).toBeGreaterThan(0);
      expect(r.partA?.growthArea.text.length).toBeGreaterThan(0);
      expect(r.partA?.topStrength.index).not.toBe(r.partA?.growthArea.index);
    }
  });

  it("the ceiling fixture's growth reads as the no-deficit 'all strong' module", () => {
    const r = assembleReport(scoreProfile(ceilingProfile));
    expect(r.partA?.growthArea.moduleId).toBe("growth_all_strong");
  });
});
