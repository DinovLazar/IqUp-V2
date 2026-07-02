/**
 * v2 "typical ≈ 50" anchor tests (Phase 2.06 DoD) — per index family, per age.
 *
 * Two layers:
 *   1. FORMULA anchors — feeding each family its own expected value must land
 *      exactly on 50 (the anchor is exact by construction).
 *   2. SIMULATED typical child — a full engine run with an ability exactly at
 *      the age's start levels / expected span / typical throughput must land
 *      the accuracy-staircase signals in 48–52 (v2 §1) and the discreteness-
 *      bound families (span steps ±14, Gs target granularity, Glr partial
 *      recall) inside documented wider bands.
 */

import { describe, expect, it } from "vitest";
import {
  ATTENTION_EXPECTED_SCORE,
  EXPECTED_FORWARD_SPAN_BY_AGE,
  GS_EXPECTED_NET_PER_MIN_BY_AGE,
  byAge,
  expectedWeightedAccuracy,
  startLevel,
} from "@/content/norms";
import { gsForAge } from "@/content/tasks";
import { runSession, startSession } from "@/features/assessment";
import { makeScript, type Profile } from "@/features/assessment/fixtures";
import { finalize } from "@/features/scoring";
import { accuracyIndex, spanIndex, speedIndex } from "../indices";

const AGES = [5, 6, 7, 8, 9, 10, 11, 12, 13];

function typicalProfile(age: number): Profile {
  return {
    label: `typical-${age}`,
    age,
    sessionSeed: `anchor-${age}`,
    ladder: {
      gf: startLevel("gf", age),
      gv: startLevel("gv", age),
      ef: startLevel("ef", age),
      ct: startLevel("ct", age),
      glr: startLevel("glr", age),
    },
    gsmForward: byAge(EXPECTED_FORWARD_SPAN_BY_AGE, age),
    gsFoundFrac: 0.65,
    gsFalseTaps: 0,
    gsMash: false,
    gsElapsedMs: gsForAge(age).windowSec * 1000,
    glrFinalFrac: 0.5,
    baseTimeMs: 4_000,
  };
}

describe("formula anchors — expected value → exactly 50, every age", () => {
  it("accuracy family (per signal × age)", () => {
    for (const signal of ["gf", "gv", "ef", "glr", "ct"] as const) {
      for (const age of AGES) {
        const expected = expectedWeightedAccuracy(signal, age);
        expect(accuracyIndex(expected, expected)).toBe(50);
      }
    }
    expect(
      accuracyIndex(ATTENTION_EXPECTED_SCORE, ATTENTION_EXPECTED_SCORE),
    ).toBe(50);
  });

  it("span family (per age)", () => {
    for (const age of AGES) {
      const expected = byAge(EXPECTED_FORWARD_SPAN_BY_AGE, age);
      expect(spanIndex(expected, expected)).toBe(50);
    }
  });

  it("speed family (per age)", () => {
    for (const age of AGES) {
      const expected = byAge(GS_EXPECTED_NET_PER_MIN_BY_AGE, age);
      expect(speedIndex(expected, expected)).toBe(50);
    }
  });
});

describe("simulated typical child — a full engine run lands at ≈ 50, every age 5–13", () => {
  it("accuracy-staircase signals (Gf, Gv, EF, CT) land in 48–52 (v2 §1)", () => {
    for (const age of AGES) {
      const result = finalize(
        runSession(
          startSession({ sessionSeed: `anchor-${age}`, age }),
          makeScript(typicalProfile(age)),
        ),
      );
      for (const signal of ["gf", "gv", "ef", "ct"] as const) {
        const index = result.signals[signal].index;
        expect(index, `${signal} @ age ${age}`).toBeGreaterThanOrEqual(48);
        expect(index, `${signal} @ age ${age}`).toBeLessThanOrEqual(52);
      }
      // The session data of an honest typical child is judged valid.
      expect(result.validity.session).toBe("ok");
    }
  });

  it("Glr (graded partial recall) lands within 45–62", () => {
    for (const age of AGES) {
      const result = finalize(
        runSession(
          startSession({ sessionSeed: `anchor-${age}`, age }),
          makeScript(typicalProfile(age)),
        ),
      );
      expect(
        result.signals.glr.index,
        `glr @ age ${age}`,
      ).toBeGreaterThanOrEqual(45);
      expect(result.signals.glr.index, `glr @ age ${age}`).toBeLessThanOrEqual(
        62,
      );
    }
  });

  it("Gsm (integer span steps, ±14/step) lands within 40–60", () => {
    for (const age of AGES) {
      const result = finalize(
        runSession(
          startSession({ sessionSeed: `anchor-${age}`, age }),
          makeScript(typicalProfile(age)),
        ),
      );
      expect(
        result.signals.gsm.index,
        `gsm @ age ${age}`,
      ).toBeGreaterThanOrEqual(40);
      expect(result.signals.gsm.index, `gsm @ age ${age}`).toBeLessThanOrEqual(
        60,
      );
    }
  });

  it("Gs (whole-target granularity, ±6/target-per-min) lands within 40–60", () => {
    for (const age of AGES) {
      const result = finalize(
        runSession(
          startSession({ sessionSeed: `anchor-${age}`, age }),
          makeScript(typicalProfile(age)),
        ),
      );
      expect(result.signals.gs.index, `gs @ age ${age}`).toBeGreaterThanOrEqual(
        40,
      );
      expect(result.signals.gs.index, `gs @ age ${age}`).toBeLessThanOrEqual(
        60,
      );
    }
  });

  it("every parent-facing composite index of a typical child reads 'solid' territory (40–65)", () => {
    for (const age of AGES) {
      const result = finalize(
        runSession(
          startSession({ sessionSeed: `anchor-${age}`, age }),
          makeScript(typicalProfile(age)),
        ),
      );
      for (const [key, index] of Object.entries(result.indices)) {
        expect(index.value, `${key} @ age ${age}`).toBeGreaterThanOrEqual(40);
        expect(index.value, `${key} @ age ${age}`).toBeLessThanOrEqual(65);
      }
    }
  });
});
