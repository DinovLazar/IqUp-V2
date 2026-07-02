import { describe, expect, it } from "vitest";
import { INDEX_ORDER, type IndexKey } from "@/lib/indices";
import { BAND_ORDER, type Band } from "@/components/ui/band-label";
import type { Confidence } from "@/components/ui/confidence-label";
import { PROFILES, scoreProfile } from "@/features/assessment/fixtures";

describe("five profiles → five distinct index profiles (Дел 14 acceptance)", () => {
  it("produces five visibly different pentagon vectors", () => {
    const vectors = PROFILES.map((p) => {
      const r = scoreProfile(p);
      return INDEX_ORDER.map((k) => r.indices[k].value).join(",");
    });
    expect(new Set(vectors).size).toBe(PROFILES.length);
  });
});

describe("result feeds the 1.03 UI kit with no adapter", () => {
  const r = scoreProfile(PROFILES[0]);

  it("pentagon: 5 values in canonical order, each in the index band", () => {
    const values: number[] = INDEX_ORDER.map((k) => r.indices[k].value);
    expect(values).toHaveLength(5);
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(8);
      expect(v).toBeLessThanOrEqual(99);
    }
  });

  it("index-band-bar / band-label / confidence-label props line up by type", () => {
    // This block compiles ONLY if the result's enums match the component props.
    const props: { indexKey: IndexKey; band: Band; confidence: Confidence }[] =
      INDEX_ORDER.map((k) => ({
        indexKey: k,
        band: r.indices[k].band,
        confidence: r.indices[k].confidence,
      }));
    for (const p of props) {
      expect(BAND_ORDER).toContain(p.band);
      expect(["high", "medium", "low"]).toContain(p.confidence);
    }
  });

  it("meta carries the v2 versions + the pre-pilot norms stage", () => {
    expect(r.meta.normsStage).toBe("seed");
    expect(r.meta.scoringVersion).toBe("2.0.0");
    expect(r.meta.normsVersion).toBe("2.0.0");
    expect(r.meta.taskBankVersion).toBe("2.0.0");
  });
});
