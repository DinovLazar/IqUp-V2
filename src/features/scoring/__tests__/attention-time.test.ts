import { describe, expect, it } from "vitest";
import { generateItem } from "@/features/tasks";
import { deriveAttention } from "../attention";
import { gradeItem } from "../grade";
import { flatTypical, scoreProfile } from "@/features/assessment/fixtures";
import { gradedItem } from "./helpers";

describe("derived attention (Дел 3.1 #5 / Дел 4 / Дел 8)", () => {
  it("consistent, engaged answers ⇒ high attention", () => {
    const items = Array.from({ length: 4 }, () =>
      gradedItem({ signal: "gf", correct: true, effectiveTimeMs: 4_000 }),
    );
    const a = deriveAttention(items, 9);
    expect(a.timeVariability).toBe(0);
    expect(a.impulsiveErrorRate).toBe(0);
    expect(a.score).toBe(1);
  });

  it("erratic pacing lowers attention via time variability", () => {
    const items = [2_000, 4_000, 6_000, 8_000].map((t) =>
      gradedItem({ signal: "gf", correct: true, effectiveTimeMs: t }),
    );
    const a = deriveAttention(items, 9);
    expect(a.timeVariability).toBeGreaterThan(0);
    expect(a.score).toBeLessThan(1);
  });

  it("too-fast wrong answers lower attention via the impulsive-error rate", () => {
    const items = Array.from({ length: 4 }, () =>
      gradedItem({
        signal: "gf",
        correct: false,
        tooFast: true,
        effectiveTimeMs: 300,
      }),
    );
    const a = deriveAttention(items, 9);
    expect(a.impulsiveErrorRate).toBe(1);
    expect(a.score).toBe(0);
  });

  it("the CV normalisation is AGE-BANDED: the same pacing scores differently by band (v2 §5)", () => {
    // CV ≈ 0.42 sits at the young band's midpoint (0.475 → score ≈ 0.56) but
    // well above the oldest band's (0.30 → score ≈ 0.30).
    const items = [2_500, 4_000, 5_500, 7_000].map((t) =>
      gradedItem({ signal: "gf", correct: true, effectiveTimeMs: t }),
    );
    const young = deriveAttention(items, 5);
    const old = deriveAttention(items, 13);
    expect(young.timeVariability).toBeCloseTo(old.timeVariability, 10);
    expect(young.score).toBeGreaterThan(old.score);
  });

  it("attention is derived — no administered items in the result", () => {
    const r = scoreProfile(flatTypical);
    expect(r.signals.attention.itemsAdministered).toBe(0);
    expect(r.signals.attention.perItem).toHaveLength(0);
  });
});

describe("slow ≠ wrong (Дел 6.4 / Дел 8) — time never changes a correct answer", () => {
  it("the same correct option grades correct whether fast or slow", () => {
    const item = generateItem({ signal: "gf", level: 5, seed: "slow-vs-fast" });
    if (item.signal !== "gf") throw new Error("expected a Gf item");
    const fast = gradeItem(item, {
      signal: "gf",
      optionIndex: item.answer,
      elapsedMs: 600,
    });
    const slow = gradeItem(item, {
      signal: "gf",
      optionIndex: item.answer,
      elapsedMs: 9_000,
    });
    expect(fast.correct).toBe(true);
    expect(slow.correct).toBe(true);
    expect(fast.effectiveTimeMs).not.toBe(slow.effectiveTimeMs); // time differs…
  });

  it("non-Gs signal indices are identical for a fast vs a slow run", () => {
    const fast = scoreProfile({ ...flatTypical, baseTimeMs: 1_000 });
    const slow = scoreProfile({ ...flatTypical, baseTimeMs: 30_000 });
    for (const s of ["gf", "gv", "ct", "ef", "gsm", "glr"] as const) {
      expect(fast.signals[s].index).toBe(slow.signals[s].index);
      expect(fast.signals[s].rawScore).toBe(slow.signals[s].rawScore);
    }
  });
});
