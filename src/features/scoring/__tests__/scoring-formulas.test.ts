import { describe, expect, it } from "vitest";
import { INDEX_MAX, INDEX_MIN, type ScoredSignal } from "@/content/norms";
import {
  accuracyIndex,
  bandFor,
  clampIndex,
  compositeIndex,
  spanIndex,
  speedIndex,
} from "../indices";
import {
  efEfficiency,
  glrRecall,
  gsNetPerMin,
  learningSlope,
  maxCorrectSpan,
  spanForIndex,
  weightedAccuracy,
} from "../raw";
import {
  coefficientOfVariation,
  countExcludedGaps,
  effectiveTime,
  mean,
  stdDev,
} from "../time";
import { gradedItem } from "./helpers";

describe("raw → index formulas (Прилог B.2)", () => {
  it("accuracy family: 20 + acc·75 (1.0 → 95)", () => {
    expect(accuracyIndex(1.0)).toBe(95);
    expect(accuracyIndex(0)).toBe(20);
    expect(accuracyIndex(0.5)).toBe(58); // round(57.5)
  });

  it("span family: 50 + (span − expected)·14 (= expected → 50)", () => {
    expect(spanIndex(5, 5)).toBe(50);
    expect(spanIndex(6, 5)).toBe(64);
    expect(spanIndex(4, 5)).toBe(36);
  });

  it("speed family: 50 + (netPerMin − expected)·6 (= expected → 50)", () => {
    expect(speedIndex(14, 14)).toBe(50);
    expect(speedIndex(16, 14)).toBe(62);
  });

  it("clamps hold at 8 and 99", () => {
    expect(clampIndex(5)).toBe(INDEX_MIN);
    expect(clampIndex(200)).toBe(INDEX_MAX);
    expect(spanIndex(0, 7)).toBe(8); // 50 − 98 → clamp 8
    expect(spanIndex(12, 4)).toBe(99); // 50 + 112 → clamp 99
    expect(clampIndex(50.4)).toBe(50);
    expect(clampIndex(50.6)).toBe(51);
  });
});

describe("composite indices (Дел 6.3)", () => {
  const idx: Record<ScoredSignal, number> = {
    gf: 60,
    gv: 70,
    gsm: 60,
    gs: 40,
    ef: 60,
    glr: 70,
    ct: 50,
    attention: 80,
  };

  it("computes each of the five weighted composites exactly", () => {
    expect(compositeIndex("logic", idx)).toBe(60); // Gf
    expect(compositeIndex("spatial", idx)).toBe(70); // Gv
    expect(compositeIndex("memory", idx)).toBe(66); // 0.7·60 + 0.3·80
    expect(compositeIndex("planning", idx)).toBe(52); // 0.6·60 + 0.4·40
    expect(compositeIndex("stem", idx)).toBe(60); // 0.5·50 + 0.5·70
  });
});

describe("bands (Дел 6.4) — boundary tests", () => {
  it("maps values to the right word band at every boundary", () => {
    expect(bandFor(44)).toBe("development");
    expect(bandFor(45)).toBe("solid");
    expect(bandFor(63)).toBe("solid");
    expect(bandFor(64)).toBe("strong");
    expect(bandFor(79)).toBe("strong");
    expect(bandFor(80)).toBe("exceptional");
    expect(bandFor(8)).toBe("development");
    expect(bandFor(99)).toBe("exceptional");
  });
});

describe("raw-score extractors (Дел 6.1)", () => {
  it("weighted accuracy weights correctness by item difficulty", () => {
    const items = [
      gradedItem({ signal: "gf", difficultyWeight: 0.5, correct: true }),
      gradedItem({ signal: "gf", difficultyWeight: 0.5, correct: false }),
    ];
    expect(weightedAccuracy(items)).toBeCloseTo(0.5, 10);
    expect(weightedAccuracy([])).toBe(0);
  });

  it("EF efficiency = mean(minMoves/moves) over solved items, 0 if unsolved", () => {
    const items = [
      gradedItem({
        signal: "ef",
        ef: { minMoves: 2, movesUsed: 2, solved: true },
      }),
      gradedItem({
        signal: "ef",
        ef: { minMoves: 3, movesUsed: 6, solved: true },
      }),
    ];
    expect(efEfficiency(items)).toBeCloseTo(0.75, 10); // (1 + 0.5)/2
    const withFail = [
      ...items,
      gradedItem({
        signal: "ef",
        ef: { minMoves: 3, movesUsed: 0, solved: false },
      }),
    ];
    expect(efEfficiency(withFail)).toBeCloseTo(0.5, 10); // (1 + 0.5 + 0)/3
  });

  it("Glr recall = mean round accuracy; learning slope = per-round gain", () => {
    const item = gradedItem({
      signal: "glr",
      glr: { roundAccuracies: [0.2, 0.6] },
    });
    expect(glrRecall(item)).toBeCloseTo(0.4, 10);
    expect(learningSlope(item)).toBeCloseTo(0.4, 10);
    expect(
      learningSlope(
        gradedItem({ signal: "glr", glr: { roundAccuracies: [0.5] } }),
      ),
    ).toBe(0);
    expect(glrRecall(null)).toBe(0);
  });

  it("Gs net-per-minute = (correct − 0.5·errors) / effective minutes", () => {
    const item = gradedItem({
      signal: "gs",
      effectiveTimeMs: 60_000,
      gs: {
        found: 6,
        falseTaps: 0,
        targetCount: 6,
        tappedCount: 6,
        cellCount: 20,
      },
    });
    expect(gsNetPerMin(item)).toBeCloseTo(6, 10);
    const withErrors = gradedItem({
      signal: "gs",
      effectiveTimeMs: 30_000,
      gs: {
        found: 6,
        falseTaps: 2,
        targetCount: 6,
        tappedCount: 8,
        cellCount: 20,
      },
    });
    expect(gsNetPerMin(withErrors)).toBeCloseTo(10, 10); // (6 − 1) / 0.5
  });

  it("max correct span ignores incorrect trials", () => {
    const items = [
      gradedItem({ signal: "gsm", spanLength: 4, correct: true }),
      gradedItem({ signal: "gsm", spanLength: 5, correct: false }),
      gradedItem({ signal: "gsm", spanLength: 5, correct: true }),
    ];
    expect(maxCorrectSpan(items)).toBe(5);
    expect(maxCorrectSpan([])).toBe(0);
  });

  it("span-for-index averages backward only from age 8", () => {
    expect(spanForIndex(5, 3, 7, true)).toBe(5); // age < 8 → forward only
    expect(spanForIndex(5, 3, 9, false)).toBe(5); // no backward run → forward
    expect(spanForIndex(5, 3, 9, true)).toBe(5); // (5 + (3+2))/2
    expect(spanForIndex(6, 4, 10, true)).toBe(6); // (6 + (4+2))/2
  });
});

describe("time-rules math (Дел 8)", () => {
  it("excludes only idle gaps longer than the threshold", () => {
    expect(effectiveTime(50_000, [35_000])).toBe(15_000); // long pause excluded
    expect(effectiveTime(50_000, [20_000])).toBe(50_000); // short gap kept
    expect(effectiveTime(50_000, [35_000, 40_000])).toBe(0); // floored at 0
    expect(effectiveTime(8_000, [])).toBe(8_000);
  });

  it("counts excluded gaps for the validity flag", () => {
    expect(countExcludedGaps([35_000, 40_000, 5_000])).toBe(2);
    expect(countExcludedGaps([])).toBe(0);
  });

  it("CV is scale-of-spread over mean; 0 when flat", () => {
    expect(coefficientOfVariation([100, 100, 100])).toBe(0);
    expect(mean([2, 4])).toBe(3);
    expect(stdDev([5])).toBe(0);
    expect(coefficientOfVariation([])).toBe(0);
  });
});
