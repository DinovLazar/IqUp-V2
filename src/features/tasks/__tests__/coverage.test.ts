import { describe, expect, it } from "vitest";
import {
  generateItem,
  generatePractice,
  TESTABLE_SIGNALS,
  TASK_BANK_VERSION,
  type CtSubtype,
  type Item,
} from "@/features/tasks";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SEEDS = ["c1", "c2", "c3"];
const CT_SUBTYPES: CtSubtype[] = [
  "sequence",
  "debug",
  "loop",
  "condition",
  "maze",
];

/** Basic structural validity every item must satisfy. */
function expectValid(item: Item, level: number, practice: boolean) {
  expect(item.level).toBe(level);
  expect(item.practice).toBe(practice);
  expect(item.taskBankVersion).toBe(TASK_BANK_VERSION);
  expect(item.answer).toBeDefined();

  switch (item.signal) {
    case "gf":
    case "gv":
      expect(item.options.length).toBe(4);
      expect(item.answer).toBeGreaterThanOrEqual(0);
      expect(item.answer).toBeLessThan(item.options.length);
      break;
    case "gsm":
      expect(item.stimulus.sequence.length).toBeGreaterThan(0);
      expect(item.answer.length).toBe(item.stimulus.sequence.length);
      break;
    case "gs":
      expect(item.stimulus.cells.length).toBe(item.stimulus.cellCount);
      expect(item.answer.length).toBeGreaterThan(0);
      break;
    case "ef":
      expect(item.answer.minMoves).toBeGreaterThanOrEqual(1);
      expect(item.answer.optimalPath.length).toBe(item.answer.minMoves);
      break;
    case "glr":
      expect(item.stimulus.trials.length).toBe(item.stimulus.pairs.length);
      expect(item.answer.length).toBe(item.stimulus.trials.length);
      break;
    case "ct":
      expect(item.meta.ctSubtype).toBeDefined();
      break;
  }
}

describe("coverage", () => {
  it("every testable signal produces a valid item for every level 1–10", () => {
    for (const signal of TESTABLE_SIGNALS) {
      for (const level of LEVELS) {
        for (const seed of SEEDS) {
          expectValid(generateItem({ signal, level, seed }), level, false);
        }
      }
    }
  });

  it("Attention has no generator (intentionally absent)", () => {
    expect(TESTABLE_SIGNALS).not.toContain("attention");
    expect(TESTABLE_SIGNALS.sort()).toEqual(
      ["ct", "ef", "gf", "glr", "gs", "gsm", "gv"].sort(),
    );
  });

  it("CT covers all five sub-types at every level", () => {
    for (const subtype of CT_SUBTYPES) {
      for (const level of LEVELS) {
        for (const seed of SEEDS) {
          const item = generateItem({ signal: "ct", level, seed, subtype });
          expect(item.signal).toBe("ct");
          if (item.signal === "ct") expect(item.meta.ctSubtype).toBe(subtype);
        }
      }
    }
  });

  it("Gf and Gv expose both families", () => {
    for (const seed of SEEDS) {
      for (const family of ["matrix", "series"]) {
        const item = generateItem({ signal: "gf", level: 5, seed, family });
        if (item.signal === "gf") expect(item.meta.family).toBe(family);
      }
      for (const family of ["rotation", "oddOneOut"]) {
        const item = generateItem({ signal: "gv", level: 5, seed, family });
        if (item.signal === "gv") expect(item.meta.family).toBe(family);
      }
    }
  });

  it("a practice example exists for every signal", () => {
    for (const signal of TESTABLE_SIGNALS) {
      for (const seed of SEEDS) {
        expectValid(generatePractice(signal, seed), 1, true);
      }
    }
  });
});
