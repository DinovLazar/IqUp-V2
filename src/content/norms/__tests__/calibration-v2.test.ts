/**
 * Calibration v2 — the config-level contract (Phase 2.06):
 *   (a) ladder monotonicity per family (where the ladder scales a parameter);
 *   (b) per-age start-level snapshot per signal (the §1–§8 start rows);
 *   (c) the under-8 Gsm backward→forward+crisscross substitution;
 *   (d) the series ×-rule age cap (never served below 9);
 *   (i) provisional-register completeness (exactly the §10 list);
 *   (j) the UX option clamp (a 6-year-old never sees more than 3 options).
 */

import { describe, expect, it } from "vitest";
import {
  EXPECTED_FORWARD_SPAN_BY_AGE,
  CORSI_BACKWARD_OFFSET,
  ITEM_CAPS,
  PROVISIONAL_NORMS,
  START_LEVELS,
  itemCap,
  startLevel,
} from "@/content/norms";
import {
  GS_BY_AGE,
  GSM_ISI_MS,
  GSM_PRESENTATION_MS,
  UX_BY_AGE,
  ctLevel,
  efLevel,
  gfLevel,
  glrLevel,
  gsmLevel,
  gsmLevelForAge,
  gsmTileCount,
  gvLevel,
  uxForAge,
} from "@/content/tasks/levels";
import { generateItem } from "@/features/tasks";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const AGES = [5, 6, 7, 8, 9, 10, 11, 12, 13];

// ── (a) ladder monotonicity ───────────────────────────────────────────────────

function nonDecreasing(values: number[]): boolean {
  return values.every((v, i) => i === 0 || v >= values[i - 1]);
}
function nonIncreasing(values: number[]): boolean {
  return values.every((v, i) => i === 0 || v <= values[i - 1]);
}

describe("ladder monotonicity (v2 §1–§8)", () => {
  it("Gf: matrix size, attribute count and distractor subtlety never decrease", () => {
    expect(nonDecreasing(LEVELS.map((l) => gfLevel(l).matrixSize))).toBe(true);
    expect(nonDecreasing(LEVELS.map((l) => gfLevel(l).matrixAttrCount))).toBe(
      true,
    );
    expect(
      nonDecreasing(LEVELS.map((l) => gfLevel(l).distractorSubtlety)),
    ).toBe(true);
  });

  it("Gv: max angle, segments, option count and mirror foils never decrease", () => {
    expect(
      nonDecreasing(LEVELS.map((l) => Math.max(...gvLevel(l).angles))),
    ).toBe(true);
    expect(nonDecreasing(LEVELS.map((l) => gvLevel(l).segments[0]))).toBe(true);
    expect(nonDecreasing(LEVELS.map((l) => gvLevel(l).segments[1]))).toBe(true);
    expect(nonDecreasing(LEVELS.map((l) => gvLevel(l).optionCount))).toBe(true);
    expect(nonDecreasing(LEVELS.map((l) => gvLevel(l).mirrorFoilCount))).toBe(
      true,
    );
  });

  it("Gsm: sequence length never decreases; presentation timing is the researched band", () => {
    expect(nonDecreasing(LEVELS.map((l) => gsmLevel(l).length))).toBe(true);
    expect(GSM_PRESENTATION_MS).toBe(700);
    expect(GSM_ISI_MS).toBe(400);
  });

  it("EF: minMoves never decreases", () => {
    expect(nonDecreasing(LEVELS.map((l) => efLevel(l).minMoves))).toBe(true);
  });

  it("Glr: pairs never decrease", () => {
    expect(nonDecreasing(LEVELS.map((l) => glrLevel(l).pairs))).toBe(true);
  });

  it("Gs (by age): grid grows, density thins, window shrinks", () => {
    expect(nonDecreasing(AGES.map((a) => GS_BY_AGE[a].cellCount))).toBe(true);
    expect(
      nonDecreasing(AGES.map((a) => GS_BY_AGE[a].distractorsPerTarget)),
    ).toBe(true);
    expect(nonIncreasing(AGES.map((a) => GS_BY_AGE[a].windowSec))).toBe(true);
    expect(nonDecreasing(AGES.map((a) => GS_BY_AGE[a].similarity[0]))).toBe(
      true,
    );
  });

  it("expected forward Corsi span rises with age (research curve)", () => {
    expect(
      nonDecreasing(AGES.map((a) => EXPECTED_FORWARD_SPAN_BY_AGE[a])),
    ).toBe(true);
    expect(EXPECTED_FORWARD_SPAN_BY_AGE[5]).toBe(3.5);
    expect(EXPECTED_FORWARD_SPAN_BY_AGE[7]).toBe(4.1);
    expect(EXPECTED_FORWARD_SPAN_BY_AGE[13]).toBe(6);
    // Corsi backward ≈ forward (Kessels) — NOT the digit-span convention of 2.
    expect(CORSI_BACKWARD_OFFSET).toBe(0.5);
  });
});

// ── (a′) exact ladder snapshots — every §1–§8 column pinned ──────────────────

describe("ladder tables match §1–§8 exactly (full-row snapshots)", () => {
  it("Gf: rule classes, xor gates, subtlety and the series columns", () => {
    expect(LEVELS.map((l) => gfLevel(l))).toEqual([
      {
        matrixSize: 2,
        matrixAttrCount: 1,
        ruleTypes: ["constancy"],
        allowXor: false,
        distractorSubtlety: 1,
        seriesRule: "plusOneTwo",
        seriesVisible: 4,
      },
      {
        matrixSize: 2,
        matrixAttrCount: 1,
        ruleTypes: ["constancy", "progression"],
        allowXor: false,
        distractorSubtlety: 1,
        seriesRule: "plusK",
        seriesVisible: 4,
      },
      {
        matrixSize: 2,
        matrixAttrCount: 1,
        ruleTypes: ["progression"],
        allowXor: false,
        distractorSubtlety: 2,
        seriesRule: "minusK",
        seriesVisible: 4,
      },
      {
        matrixSize: 3,
        matrixAttrCount: 1,
        ruleTypes: ["progression"],
        allowXor: false,
        distractorSubtlety: 2,
        seriesRule: "alternating",
        seriesVisible: 5,
      },
      {
        matrixSize: 3,
        matrixAttrCount: 2,
        ruleTypes: ["progression", "additionSubtraction"],
        allowXor: false,
        distractorSubtlety: 2,
        seriesRule: "timesTwo",
        seriesVisible: 4,
      },
      {
        matrixSize: 3,
        matrixAttrCount: 2,
        ruleTypes: ["additionSubtraction", "distributionOfThree"],
        allowXor: false,
        distractorSubtlety: 2,
        seriesRule: "timesK",
        seriesVisible: 4,
      },
      {
        matrixSize: 3,
        matrixAttrCount: 2,
        ruleTypes: ["distributionOfThree", "progression"],
        allowXor: false,
        distractorSubtlety: 2,
        seriesRule: "interleaved",
        seriesVisible: 6,
      },
      {
        matrixSize: 3,
        matrixAttrCount: 3,
        ruleTypes: ["distributionOfTwo"],
        allowXor: true,
        distractorSubtlety: 2,
        seriesRule: "timesThenPlus",
        seriesVisible: 5,
      },
      {
        matrixSize: 3,
        matrixAttrCount: 3,
        ruleTypes: ["distributionOfThree", "distributionOfTwo"],
        allowXor: true,
        distractorSubtlety: 3,
        seriesRule: "secondOrder",
        seriesVisible: 5,
      },
      {
        matrixSize: 3,
        matrixAttrCount: 3,
        ruleTypes: ["distributionOfTwo", "progression", "distributionOfThree"],
        allowXor: true,
        distractorSubtlety: 3,
        seriesRule: "fibonacci",
        seriesVisible: 5,
      },
    ]);
  });

  it("Gv: angles, segments, options and mirror foils per row", () => {
    expect(LEVELS.map((l) => gvLevel(l))).toEqual([
      {
        angles: [0, 45],
        segments: [2, 3],
        optionCount: 2,
        mirrorDistractor: false,
        mirrorFoilCount: 0,
      },
      {
        angles: [45],
        segments: [3, 3],
        optionCount: 3,
        mirrorDistractor: false,
        mirrorFoilCount: 0,
      },
      {
        angles: [90],
        segments: [3, 4],
        optionCount: 4,
        mirrorDistractor: false,
        mirrorFoilCount: 0,
      },
      {
        angles: [90],
        segments: [4, 4],
        optionCount: 4,
        mirrorDistractor: true,
        mirrorFoilCount: 1,
      },
      {
        angles: [120],
        segments: [4, 5],
        optionCount: 4,
        mirrorDistractor: true,
        mirrorFoilCount: 1,
      },
      {
        angles: [135],
        segments: [5, 5],
        optionCount: 4,
        mirrorDistractor: true,
        mirrorFoilCount: 1,
      },
      {
        angles: [135],
        segments: [5, 5],
        optionCount: 4,
        mirrorDistractor: true,
        mirrorFoilCount: 1,
      },
      {
        angles: [180],
        segments: [5, 6],
        optionCount: 4,
        mirrorDistractor: true,
        mirrorFoilCount: 1,
      },
      {
        angles: [180],
        segments: [6, 6],
        optionCount: 4,
        mirrorDistractor: true,
        mirrorFoilCount: 2,
      },
      {
        angles: [180],
        segments: [6, 7],
        optionCount: 5,
        mirrorDistractor: true,
        mirrorFoilCount: 2,
      },
    ]);
  });

  it("Gsm: length/direction/path per row", () => {
    expect(LEVELS.map((l) => gsmLevel(l))).toEqual([
      { length: 2, direction: "forward", path: "simple" },
      { length: 3, direction: "forward", path: "simple" },
      { length: 3, direction: "backward", path: "simple" },
      { length: 4, direction: "forward", path: "simple" },
      { length: 4, direction: "backward", path: "simple" },
      { length: 5, direction: "forward", path: "simple" },
      { length: 5, direction: "backward", path: "simple" },
      { length: 6, direction: "forward", path: "crisscross" },
      { length: 7, direction: "forward", path: "crisscross" },
      { length: 7, direction: "backward", path: "crisscross" },
    ]);
  });

  it("Gs: the §4 per-age table exactly (incl. targetSymbolCount)", () => {
    expect(GS_BY_AGE).toEqual({
      5: {
        cellCount: 12,
        distractorsPerTarget: 2,
        similarity: [1, 1],
        targetSymbolCount: 1,
        windowSec: 40,
      },
      6: {
        cellCount: 15,
        distractorsPerTarget: 2,
        similarity: [1, 1],
        targetSymbolCount: 1,
        windowSec: 35,
      },
      7: {
        cellCount: 18,
        distractorsPerTarget: 2,
        similarity: [1, 2],
        targetSymbolCount: 1,
        windowSec: 30,
      },
      8: {
        cellCount: 20,
        distractorsPerTarget: 3,
        similarity: [2, 2],
        targetSymbolCount: 2,
        windowSec: 25,
      },
      9: {
        cellCount: 22,
        distractorsPerTarget: 3,
        similarity: [2, 2],
        targetSymbolCount: 2,
        windowSec: 25,
      },
      10: {
        cellCount: 24,
        distractorsPerTarget: 3,
        similarity: [2, 2],
        targetSymbolCount: 2,
        windowSec: 22,
      },
      11: {
        cellCount: 24,
        distractorsPerTarget: 4,
        similarity: [2, 3],
        targetSymbolCount: 2,
        windowSec: 20,
      },
      12: {
        cellCount: 26,
        distractorsPerTarget: 4,
        similarity: [3, 3],
        targetSymbolCount: 2,
        windowSec: 20,
      },
      13: {
        cellCount: 28,
        distractorsPerTarget: 4,
        similarity: [3, 3],
        targetSymbolCount: 2,
        windowSec: 20,
      },
    });
  });

  it("EF: minMoves + structural properties per row (L9/L10 inherently constrained — D-137)", () => {
    expect(LEVELS.map((l) => efLevel(l))).toEqual([
      { minMoves: 2, constrained: false, distractorGoal: false },
      { minMoves: 2, constrained: false, distractorGoal: true },
      { minMoves: 3, constrained: false, distractorGoal: false },
      { minMoves: 3, constrained: true, distractorGoal: false },
      { minMoves: 4, constrained: false, distractorGoal: false },
      { minMoves: 4, constrained: true, distractorGoal: false },
      { minMoves: 5, constrained: false, distractorGoal: false },
      { minMoves: 5, constrained: true, distractorGoal: false },
      { minMoves: 6, constrained: true, distractorGoal: false },
      { minMoves: 7, constrained: true, distractorGoal: false },
    ]);
  });

  it("Glr: pairs/trials/symbolStyle per row", () => {
    expect(LEVELS.map((l) => glrLevel(l))).toEqual([
      { pairs: 4, trials: 3, symbolStyle: "pictorial" },
      { pairs: 4, trials: 2, symbolStyle: "pictorial" },
      { pairs: 5, trials: 3, symbolStyle: "pictorial" },
      { pairs: 6, trials: 3, symbolStyle: "pictorial" },
      { pairs: 6, trials: 2, symbolStyle: "mixed" },
      { pairs: 6, trials: 2, symbolStyle: "abstract" },
      { pairs: 8, trials: 3, symbolStyle: "abstract" },
      { pairs: 8, trials: 2, symbolStyle: "abstract" },
      { pairs: 10, trials: 3, symbolStyle: "abstract" },
      { pairs: 10, trials: 2, symbolStyle: "abstract" },
    ]);
  });

  it("CT: the family set per level", () => {
    expect(LEVELS.map((l) => [...ctLevel(l).family])).toEqual([
      ["sequence"],
      ["sequence"],
      ["sequence", "debug"],
      ["loop"],
      ["loop", "loopEvent"],
      ["condition"],
      ["conditionLoop"],
      ["nestedLoop"],
      ["counter"],
      ["optimize"],
    ]);
  });
});

// ── (b) per-age start levels per signal ───────────────────────────────────────

describe("per-signal start levels (v2 §1–§8)", () => {
  it("matches the research start rows exactly", () => {
    expect(START_LEVELS).toEqual({
      gf: { 5: 1, 6: 1, 7: 2, 8: 3, 9: 4, 10: 5, 11: 6, 12: 6, 13: 7 },
      gv: { 5: 1, 6: 2, 7: 3, 8: 4, 9: 5, 10: 6, 11: 7, 12: 8, 13: 8 },
      gsm: { 5: 1, 6: 2, 7: 2, 8: 3, 9: 4, 10: 4, 11: 5, 12: 6, 13: 6 },
      ef: { 5: 1, 6: 1, 7: 3, 8: 3, 9: 4, 10: 5, 11: 6, 12: 7, 13: 7 },
      glr: { 5: 1, 6: 1, 7: 3, 8: 3, 9: 4, 10: 6, 11: 6, 12: 7, 13: 7 },
      ct: { 5: 1, 6: 2, 7: 3, 8: 4, 9: 5, 10: 6, 11: 7, 12: 8, 13: 9 },
    });
    // Starts genuinely differ by domain (a 13yo starts Gf at 7 but CT at 9).
    expect(startLevel("gf", 13)).toBe(7);
    expect(startLevel("ct", 13)).toBe(9);
  });

  it("item caps follow the v2 table (lone +1 over shared, per cluster)", () => {
    expect(ITEM_CAPS).toEqual({
      lone: { young: 5, mid: 6, older: 7 },
      shared: { young: 4, mid: 5, older: 6 },
    });
    // The lone/shared MAPPING itself: Gf + Gv are lone; the rest are shared.
    for (const [age, lone, shared] of [
      [5, 5, 4],
      [8, 6, 5],
      [13, 7, 6],
    ] as const) {
      expect(itemCap("gf", age)).toBe(lone);
      expect(itemCap("gv", age)).toBe(lone);
      for (const sig of ["gsm", "ef", "glr", "ct"] as const) {
        expect(itemCap(sig, age)).toBe(shared);
      }
    }
  });
});

// ── (c) under-8 Gsm substitution ──────────────────────────────────────────────

describe("Gsm under-8 backward substitution (v2 §3)", () => {
  it("every backward level is served as forward + crisscross at the same length below 8", () => {
    for (const level of LEVELS) {
      const row = gsmLevel(level);
      for (const age of [5, 6, 7]) {
        const served = gsmLevelForAge(level, age);
        expect(served.length).toBe(row.length);
        expect(served.direction).toBe("forward");
        if (row.direction === "backward") {
          expect(served.path).toBe("crisscross");
        } else {
          expect(served.path).toBe(row.path);
        }
      }
      for (const age of [8, 13]) {
        expect(gsmLevelForAge(level, age)).toEqual(row);
      }
    }
  });

  it("the generated item honours the substitution and the age's board size", () => {
    // L3 = length 3 BACKWARD; a 7-year-old gets forward + crisscross instead.
    const young = generateItem({
      signal: "gsm",
      level: 3,
      seed: "sub",
      age: 7,
    });
    const older = generateItem({
      signal: "gsm",
      level: 3,
      seed: "sub",
      age: 9,
    });
    if (young.signal === "gsm" && older.signal === "gsm") {
      expect(young.stimulus.direction).toBe("forward");
      expect(young.stimulus.path).toBe("crisscross");
      expect(older.stimulus.direction).toBe("backward");
      expect(older.stimulus.path).toBe("simple");
      expect(young.stimulus.tiles).toHaveLength(9); // standard board from 7
    }
    const five = generateItem({ signal: "gsm", level: 1, seed: "sub", age: 5 });
    if (five.signal === "gsm") {
      expect(five.stimulus.tiles).toHaveLength(6); // young board at 5–6
    }
    expect(gsmTileCount(6)).toBe(6);
    expect(gsmTileCount(7)).toBe(9);
  });
});

// ── (d) series ×-rule age cap ─────────────────────────────────────────────────

describe("Gf series ×-rule age cap (v2 §1)", () => {
  it("below age 9 the series family is capped at L4 — a matrix is substituted above", () => {
    for (const age of [5, 6, 7, 8]) {
      for (const level of [5, 6, 7, 8, 9, 10]) {
        for (let s = 0; s < 4; s++) {
          const item = generateItem({
            signal: "gf",
            level,
            seed: `cap-${s}`,
            family: "series",
            age,
          });
          if (item.signal === "gf") expect(item.meta.family).toBe("matrix");
        }
      }
      // At or below the cap, series stays series (and never a ×-rule).
      for (const level of [1, 2, 3, 4]) {
        const item = generateItem({
          signal: "gf",
          level,
          seed: "cap-low",
          family: "series",
          age,
        });
        if (item.signal === "gf" && item.meta.family === "series") {
          expect(item.meta.ruleType).not.toMatch(/^times/);
        }
      }
    }
    // From age 9 the ladder's ×-levels serve series normally.
    const nine = generateItem({
      signal: "gf",
      level: 5,
      seed: "cap-9",
      family: "series",
      age: 9,
    });
    if (nine.signal === "gf") expect(nine.meta.family).toBe("series");
  });

  it("series render as objects (never numerals) below age 7", () => {
    for (const age of [5, 6]) {
      const item = generateItem({
        signal: "gf",
        level: 2,
        seed: "objects",
        family: "series",
        age,
      });
      if (item.signal === "gf" && item.stimulus.family === "series") {
        expect(item.stimulus.notation).toBe("objects");
      }
    }
    const seven = generateItem({
      signal: "gf",
      level: 2,
      seed: "objects",
      family: "series",
      age: 7,
    });
    if (seven.signal === "gf" && seven.stimulus.family === "series") {
      expect(seven.stimulus.notation).toBe("digits");
    }
  });
});

// ── (i) provisional register completeness ─────────────────────────────────────

describe("provisional-norms register (v2 §10)", () => {
  it("is non-empty and lists exactly the §10 worklist", () => {
    expect(PROVISIONAL_NORMS.length).toBeGreaterThan(0);
    expect(PROVISIONAL_NORMS.map((p) => p.key).sort()).toEqual(
      [
        "corsi-expected-span-ages-8-13",
        "corsi-backward-offset",
        "glr-ladder-starts-expectations",
        "attention-cv-bands",
        "attention-omission-commission-cutoffs",
        "gs-expected-net-per-min",
        "accuracy-index-anchors",
      ].sort(),
    );
    for (const entry of PROVISIONAL_NORMS) {
      expect(entry.reason.length).toBeGreaterThan(10);
    }
  });
});

// ── (j) UX option clamp ───────────────────────────────────────────────────────

describe("UX_BY_AGE option clamp (v2 §9)", () => {
  it("the table matches the research constraints", () => {
    expect(uxForAge(5)).toEqual({
      maxOptions: 3,
      minTapPx: 72,
      clutter: "minimal",
    });
    expect(uxForAge(8)).toEqual({
      maxOptions: 4,
      minTapPx: 48,
      clutter: "standard",
    });
    expect(uxForAge(12)).toEqual({
      maxOptions: 5,
      minTapPx: 44,
      clutter: "standard",
    });
    expect(
      Object.keys(UX_BY_AGE)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual(AGES);
  });

  it("a 6-year-old never sees more than 3 options — even when promoted", () => {
    for (const level of LEVELS) {
      for (let s = 0; s < 3; s++) {
        const gf = generateItem({
          signal: "gf",
          level,
          seed: `ux-${s}`,
          age: 6,
        });
        if (gf.signal === "gf") {
          expect(gf.options.length).toBeLessThanOrEqual(3);
        }
        const gv = generateItem({
          signal: "gv",
          level,
          seed: `ux-${s}`,
          age: 6,
        });
        if (gv.signal === "gv") {
          expect(gv.options.length).toBeLessThanOrEqual(3);
        }
        const glr = generateItem({
          signal: "glr",
          level,
          seed: `ux-${s}`,
          age: 6,
        });
        if (glr.signal === "glr") {
          for (const trial of glr.stimulus.trials) {
            expect(trial.options.length).toBeLessThanOrEqual(3);
          }
        }
        const ct = generateItem({
          signal: "ct",
          level,
          seed: `ux-${s}`,
          age: 6,
        });
        if (ct.signal === "ct" && "options" in ct.stimulus) {
          expect(ct.stimulus.options.length).toBeLessThanOrEqual(3);
        }
      }
    }
  });
});
