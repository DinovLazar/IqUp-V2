import { describe, expect, it } from "vitest";

import {
  PROFILES,
  scoreProfile,
  logicStrong,
} from "@/features/assessment/fixtures";
import { assembleReport } from "@/features/report";
import { renderReportPdf } from "@/features/report/pdf";

/**
 * Render seam tests (Phase 1.09) — `renderReportPdf` must produce a non-empty PDF
 * `Buffer` for ALL five fixtures (incl. the strong-invalid → retry variant) without
 * throwing. This drives the real `renderToBuffer` + font-registration path end to
 * end; the actual Macedonian-glyph (no-tofu) guarantee is asserted separately in
 * `fonts.test.ts` via `fontkit`.
 */

describe("renderReportPdf", () => {
  it("produces a non-empty PDF Buffer for all five fixtures", async () => {
    for (const profile of PROFILES) {
      const model = assembleReport(scoreProfile(profile));
      const buffer = await renderReportPdf(model, { city: "Скопје" });
      expect(Buffer.isBuffer(buffer), profile.label).toBe(true);
      expect(buffer.length, profile.label).toBeGreaterThan(1000);
      // Valid PDF header.
      expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    }
  }, 30_000);

  it("embeds the booking CTA link with ?grad={city} on a profile report", async () => {
    const model = assembleReport(scoreProfile(logicStrong));
    const buffer = await renderReportPdf(model, { city: "Скопје" });
    // @react-pdf writes the Link URI into the PDF as a /URI annotation.
    expect(buffer.includes(Buffer.from("?grad="))).toBe(true);
  }, 30_000);
});
