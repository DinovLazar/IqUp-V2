import { describe, expect, it } from "vitest";

import { BANDS, BAND_ORDER } from "@/components/ui/band-label";
import { BAND_FILL } from "@/components/ui/index-band-bar";
import { CONFIDENCE } from "@/components/ui/confidence-label";

import { PDF_BAND_FILL, PDF_BAND_LEVEL, PDF_CONFIDENCE } from "../theme";

/**
 * Sync guard (Phase 1.09) — the PDF theme intentionally restates the on-screen
 * band/confidence presentation as PDF-safe literals (the web maps live in
 * "use client" component files; `@react-pdf` runs in the Node render path). To stop
 * the two from silently drifting, this asserts the PDF maps equal the single source
 * exported by the components — so any change to one that isn't mirrored breaks here.
 */

describe("PDF theme mirrors the on-screen components", () => {
  it("PDF_BAND_FILL equals IndexBandBar's BAND_FILL", () => {
    expect(PDF_BAND_FILL).toEqual(BAND_FILL);
  });

  it("PDF_BAND_LEVEL equals BANDS[*].level for every band", () => {
    for (const band of BAND_ORDER) {
      expect(PDF_BAND_LEVEL[band], band).toBe(BANDS[band].level);
    }
  });

  it("PDF_CONFIDENCE bars + colors equal ConfidenceLabel's CONFIDENCE", () => {
    for (const key of Object.keys(
      PDF_CONFIDENCE,
    ) as (keyof typeof PDF_CONFIDENCE)[]) {
      expect(PDF_CONFIDENCE[key].bars, key).toBe(CONFIDENCE[key].bars);
      expect(PDF_CONFIDENCE[key].color, key).toBe(CONFIDENCE[key].color);
    }
  });
});
