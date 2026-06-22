import { describe, expect, it } from "vitest";
import {
  generateItem,
  generatePractice,
  TESTABLE_SIGNALS,
  type CtSubtype,
} from "@/features/tasks";

const SEEDS = ["s1", "s2", "alpha", "session-42|gf|3", "x"];
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const CT_SUBTYPES: CtSubtype[] = [
  "sequence",
  "debug",
  "loop",
  "condition",
  "maze",
];

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

  it("is stable for forced Gf/Gv families and every CT sub-type", () => {
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
      for (const subtype of CT_SUBTYPES) {
        expect(generateItem({ signal: "ct", level: 5, seed, subtype })).toEqual(
          generateItem({ signal: "ct", level: 5, seed, subtype }),
        );
      }
    }
  });

  it("Gsm is stable for explicit length + direction", () => {
    for (const seed of SEEDS) {
      const a = generateItem({
        signal: "gsm",
        level: 1,
        seed,
        length: 5,
        direction: "backward",
      });
      const b = generateItem({
        signal: "gsm",
        level: 1,
        seed,
        length: 5,
        direction: "backward",
      });
      expect(b).toEqual(a);
    }
  });
});

describe("determinism — generatePractice", () => {
  it("returns a deep-equal un-scored example for identical inputs", () => {
    for (const signal of TESTABLE_SIGNALS) {
      for (const seed of SEEDS) {
        const a = generatePractice(signal, seed);
        const b = generatePractice(signal, seed);
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
