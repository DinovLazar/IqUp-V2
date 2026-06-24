/**
 * Stats normalizer (Phase 2.04): coerces the RPC jsonb into a complete typed
 * shape — every index gets all four bands (missing → 0), counts coerced.
 */

import { describe, expect, it } from "vitest";

import { normalizeStats, sortedEntries, sortedNumericEntries } from "../stats";
import { BAND_ORDER } from "@/components/ui/band-label";
import { INDEX_ORDER } from "@/lib/indices";

describe("normalizeStats", () => {
  it("fills every index with all four bands (missing → 0)", () => {
    const stats = normalizeStats({
      total: 3,
      bands: { logic: { strong: 2 } },
    });
    for (const index of INDEX_ORDER) {
      for (const band of BAND_ORDER) {
        expect(typeof stats.bands[index][band]).toBe("number");
      }
    }
    expect(stats.bands.logic.strong).toBe(2);
    expect(stats.bands.logic.development).toBe(0);
    expect(stats.bands.spatial.exceptional).toBe(0);
  });

  it("coerces total + distributions defensively", () => {
    const stats = normalizeStats({
      total: "5",
      byAge: { "8": 2, "9": "1" },
      byGender: { female: 3 },
    });
    expect(stats.total).toBe(5);
    expect(stats.byAge["8"]).toBe(2);
    expect(stats.byAge["9"]).toBe(1);
    expect(stats.byGender.female).toBe(3);
  });

  it("returns an all-empty, all-zero shape for null/garbage input", () => {
    const stats = normalizeStats(null);
    expect(stats.total).toBe(0);
    expect(stats.byCity).toEqual({});
    expect(stats.bands.stem.development).toBe(0);
  });
});

describe("sorted entries", () => {
  it("sortedEntries is count-desc then key-asc", () => {
    expect(sortedEntries({ b: 1, a: 1, c: 5 })).toEqual([
      ["c", 5],
      ["a", 1],
      ["b", 1],
    ]);
  });

  it("sortedNumericEntries orders by numeric key", () => {
    expect(sortedNumericEntries({ "10": 1, "2": 1, "8": 1 })).toEqual([
      ["2", 1],
      ["8", 1],
      ["10", 1],
    ]);
  });
});
