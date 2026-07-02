import { describe, expect, it } from "vitest";
import {
  generateItem,
  generatePractice,
  TESTABLE_SIGNALS,
  type CtFamily,
} from "@/features/tasks";

const SEEDS = ["s1", "s2", "alpha", "session-42|gf|3", "x"];
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const CT_FAMILIES: CtFamily[] = [
  "sequence",
  "debug",
  "loop",
  "loopEvent",
  "condition",
  "conditionLoop",
  "nestedLoop",
  "counter",
  "optimize",
];
const AGES = [5, 6, 9, 13];

describe("determinism — generateItem", () => {
  it("returns a deep-equal item for identical inputs across every signal/level/seed", () => {
    for (const signal of TESTABLE_SIGNALS) {
      for (const level of LEVELS) {
        for (const seed of SEEDS) {
          const a = generateItem({ signal, level, seed });
          const b = generateItem({ signal, level, seed });
          expect(b).toEqual(a);
        }
      }
    }
  });

  it("is stable with an age (the v2 age clamps are pure functions of input)", () => {
    for (const signal of TESTABLE_SIGNALS) {
      for (const age of AGES) {
        const a = generateItem({ signal, level: 3, seed: "aged", age });
        const b = generateItem({ signal, level: 3, seed: "aged", age });
        expect(b).toEqual(a);
      }
    }
  });

  it("is stable for forced Gf/Gv families and every CT family", () => {
    for (const seed of SEEDS) {
      for (const family of ["matrix", "series"]) {
        expect(generateItem({ signal: "gf", level: 5, seed, family })).toEqual(
          generateItem({ signal: "gf", level: 5, seed, family }),
        );
      }
      for (const family of ["rotation", "oddOneOut"]) {
        expect(generateItem({ signal: "gv", level: 5, seed, family })).toEqual(
          generateItem({ signal: "gv", level: 5, seed, family }),
        );
      }
      for (const subtype of CT_FAMILIES) {
        expect(generateItem({ signal: "ct", level: 5, seed, subtype })).toEqual(
          generateItem({ signal: "ct", level: 5, seed, subtype }),
        );
      }
    }
  });

  it("Gsm is stable for explicit length + direction + path", () => {
    for (const seed of SEEDS) {
      const a = generateItem({
        signal: "gsm",
        level: 1,
        seed,
        length: 5,
        direction: "backward",
        path: "crisscross",
      });
      const b = generateItem({
        signal: "gsm",
        level: 1,
        seed,
        length: 5,
        direction: "backward",
        path: "crisscross",
      });
      expect(b).toEqual(a);
    }
  });

  it("Gs is stable with a shared target seed (round 2 = same targets)", () => {
    for (const seed of SEEDS) {
      const a = generateItem({
        signal: "gs",
        level: 4,
        seed,
        age: 8,
        targetSeed: "targets-1",
      });
      const b = generateItem({
        signal: "gs",
        level: 4,
        seed,
        age: 8,
        targetSeed: "targets-1",
      });
      expect(b).toEqual(a);
      // A different layout seed with the SAME target seed hunts the same glyphs.
      const round2 = generateItem({
        signal: "gs",
        level: 4,
        seed: `${seed}-r2`,
        age: 8,
        targetSeed: "targets-1",
      });
      if (a.signal === "gs" && round2.signal === "gs") {
        expect(round2.stimulus.targets).toEqual(a.stimulus.targets);
      }
    }
  });
});

describe("determinism — generatePractice", () => {
  it("returns a deep-equal un-scored example for identical inputs", () => {
    for (const signal of TESTABLE_SIGNALS) {
      for (const seed of SEEDS) {
        const a = generatePractice(signal, seed, { level: 3, age: 9 });
        const b = generatePractice(signal, seed, { level: 3, age: 9 });
        expect(b).toEqual(a);
        expect(a.practice).toBe(true);
        expect(a.difficultyWeight).toBe(0);
      }
    }
  });
});

describe("determinism — sensitivity", () => {
  it("different seeds generally produce different items", () => {
    // Spot-check a few signals: same level, different seed → not identical.
    for (const signal of ["gf", "gv", "ef", "ct"] as const) {
      const a = generateItem({ signal, level: 6, seed: "seed-A" });
      const b = generateItem({ signal, level: 6, seed: "seed-B" });
      expect(a).not.toEqual(b);
    }
  });
});
