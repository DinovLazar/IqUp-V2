/**
 * Phase 3.01 — validity threshold MODULATION (spec Дел 7.2 / 7.4 / 8, D-071).
 *
 * The §7.1 too-fast + idle thresholds are relaxed for the young 5–7 band, for
 * parent-assist (reading aloud), and made device-relative from the tap baseline.
 * These tests cover the pure resolver AND the wired verdict via `computeValidity`,
 * and prove the base case (no context) is byte-identical to 1.05.
 */

import { describe, expect, it } from "vitest";
import {
  MAX_IDLE_PAUSES,
  TOO_FAST_MS,
  TOO_FAST_FRACTION_STRONG,
  resolveValidityThresholds,
} from "@/content/norms";
import { computeValidity } from "../validity";
import { gradedItem } from "./helpers";

/** Build N Gf items, the first `fast` of them under `rawMs` (the rest deliberate). */
function items(n: number, fast: number, rawMs: number) {
  return Array.from({ length: n }, (_, i) =>
    gradedItem({
      signal: "gf",
      correct: true,
      rawElapsedMs: i < fast ? rawMs : 8_000,
      optionIndex: i % 4,
    }),
  );
}

describe("resolveValidityThresholds (Дел 7.2 / 7.4)", () => {
  it("no context ⇒ the exact 1.05 base thresholds", () => {
    expect(resolveValidityThresholds()).toEqual({
      tooFastMs: TOO_FAST_MS,
      tooFastFractionStrong: TOO_FAST_FRACTION_STRONG,
      maxIdlePauses: MAX_IDLE_PAUSES,
    });
    // an 8-year-old is NOT in the young band → still base.
    expect(resolveValidityThresholds({ age: 8 })).toEqual(
      resolveValidityThresholds(),
    );
  });

  it("the young 5–7 band relaxes the too-fast fraction + idle count", () => {
    const t = resolveValidityThresholds({ age: 6 });
    expect(t.tooFastFractionStrong).toBeGreaterThan(TOO_FAST_FRACTION_STRONG);
    expect(t.maxIdlePauses).toBeGreaterThan(MAX_IDLE_PAUSES);
    expect(t.tooFastMs).toBe(TOO_FAST_MS); // ms floor unchanged without a baseline
  });

  it("parent-assist relaxes further than the young band alone", () => {
    const young = resolveValidityThresholds({ age: 6 });
    const assisted = resolveValidityThresholds({
      age: 6,
      parentAssistMode: true,
    });
    expect(assisted.tooFastFractionStrong).toBeGreaterThanOrEqual(
      young.tooFastFractionStrong,
    );
    expect(assisted.maxIdlePauses).toBeGreaterThanOrEqual(young.maxIdlePauses);
  });

  it("the device baseline SCALES the too-fast ms (device-relative, not absolute)", () => {
    const slow = resolveValidityThresholds({ deviceBaselineMs: 600 });
    const fast = resolveValidityThresholds({ deviceBaselineMs: 200 });
    expect(slow.tooFastMs).toBeGreaterThan(fast.tooFastMs);
  });

  it("the device threshold is clamped to a floor and a ceiling", () => {
    expect(resolveValidityThresholds({ deviceBaselineMs: 10 }).tooFastMs).toBe(
      250,
    );
    expect(
      resolveValidityThresholds({ deviceBaselineMs: 9_999 }).tooFastMs,
    ).toBe(1_500);
  });
});

describe("parent-assist un-flags a false-positive too-fast session (Дел 7.4)", () => {
  it("an assisted 5–7 session that flags STRONG unassisted comes back ok/mild (age held fixed)", () => {
    // Same 6-year-old, same session (50% of answers under the floor); ONLY the
    // parent-assist flag changes. Young-unassisted (0.45) ⇒ 0.5 > 0.45 ⇒ strong;
    // assisted (0.5) ⇒ 0.5 > 0.5 is false ⇒ no too-fast flag.
    const session = items(20, 10, 200);

    const unassisted = computeValidity(session, { age: 6 });
    expect(unassisted.session).toBe("strong");
    expect(unassisted.flags.some((f) => f.code === "too_fast")).toBe(true);

    const assisted = computeValidity(session, {
      age: 6,
      parentAssistMode: true,
    });
    expect(assisted.session).not.toBe("strong");
    expect(["ok", "mild"]).toContain(assisted.session);
    expect(assisted.flags.some((f) => f.code === "too_fast")).toBe(false);
  });

  it("assist relaxes the idle-count flag too", () => {
    // 5 excluded gaps: > 3 base ⇒ flag, but ≤ 6 assisted ⇒ none.
    const session = [
      gradedItem({ signal: "gf", correct: true, excludedIdleGaps: 3 }),
      gradedItem({ signal: "gf", correct: true, excludedIdleGaps: 2 }),
    ];
    expect(
      computeValidity(session, { age: 9 }).flags.some(
        (f) => f.code === "idle_pauses",
      ),
    ).toBe(true);
    expect(
      computeValidity(session, { age: 6, parentAssistMode: true }).flags.some(
        (f) => f.code === "idle_pauses",
      ),
    ).toBe(false);
  });
});

describe("device-relative too-fast: comparable verdicts across devices (Дел 7.2)", () => {
  it("the same RELATIVE speed yields the same verdict on a fast + a slow device", () => {
    // Both baselines are STRICTLY inside the clamp band [250, 1500], so relativity
    // is exact: an answer at ~0.64× the device threshold (≈1.6× the tap cadence)
    // is implausibly fast on BOTH devices. (Relativity only bends where the clamp
    // bites — see the floor/ceiling test above.)
    const fastDevice = { deviceBaselineMs: 200 }; // threshold 500
    const slowDevice = { deviceBaselineMs: 480 }; // threshold 1200

    const fastBehaviour = items(10, 4, 320); // 320 < 500
    const slowBehaviour = items(10, 4, 768); // 768 < 1200 (same 0.64 ratio)

    const vFast = computeValidity(fastBehaviour, fastDevice);
    const vSlow = computeValidity(slowBehaviour, slowDevice);
    expect(vFast.session).toBe(vSlow.session);
    expect(vFast.session).toBe("strong");
  });

  it("an absolute-ms rule would DISagree on the same relative behaviour (regression guard)", () => {
    // Without device-relativity the slow device's 768 ms answers escape the 500 ms
    // floor entirely — the exact bias §7.2 fixes.
    const slowBehaviour = items(10, 4, 768);
    expect(computeValidity(slowBehaviour).session).toBe("ok"); // absolute floor misses it
    expect(
      computeValidity(slowBehaviour, { deviceBaselineMs: 480 }).session,
    ).toBe("strong");
  });

  it("a genuinely deliberate slow-device session is NOT flagged", () => {
    // Everything at 4–8× the baseline: real cognition, no flag.
    const deliberate = items(10, 0, 8_000);
    expect(computeValidity(deliberate, { deviceBaselineMs: 600 }).session).toBe(
      "ok",
    );
  });
});
