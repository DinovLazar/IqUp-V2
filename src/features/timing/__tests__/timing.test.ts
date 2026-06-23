/**
 * Timing-layer tests (Phase 1.06) — the silent stopwatch, idle/tab-blur gap
 * recording and device calibration are PURE over injected timestamps, so they are
 * fully deterministic in node. We also assert the captured shape is exactly what
 * the 1.05 scoring layer consumes (`effectiveTime` excludes only > 30 s gaps).
 */

import { describe, expect, it } from "vitest";
import {
  checkIdle,
  finishItem,
  markVisible,
  registerActivity,
  startItem,
  summarizeCalibration,
  IDLE_NUDGE_MS,
} from "@/features/timing";
import { effectiveTime } from "@/features/scoring/time";

describe("stopwatch — idle gap recording", () => {
  it("ignores short pauses but records inactivity past the nudge threshold", () => {
    const s0 = startItem(1_000);
    // 10 s pause → normal thinking, not recorded
    const s1 = registerActivity(s0, 11_000);
    expect(s1.idleGaps).toEqual([]);
    // 25 s pause → recorded in full, clock re-anchored
    const s2 = registerActivity(s1, 36_000);
    expect(s2.idleGaps).toEqual([25_000]);
    expect(s2.lastActivityMs).toBe(36_000);
  });

  it("surfaces the nudge once inactivity reaches the threshold", () => {
    const s = startItem(0);
    expect(checkIdle(s, IDLE_NUDGE_MS - 1_000, IDLE_NUDGE_MS).nudgeActive).toBe(
      false,
    );
    expect(checkIdle(s, IDLE_NUDGE_MS + 1_000, IDLE_NUDGE_MS).nudgeActive).toBe(
      true,
    );
  });

  it("treats a long tab-blur return as a recorded gap", () => {
    const s = startItem(0);
    expect(markVisible(s, 25_000).idleGaps).toEqual([25_000]);
    // a brief switch is not recorded
    expect(markVisible(s, 5_000).idleGaps).toEqual([]);
  });

  it("finish emits engine-shaped timing and closes a trailing gap", () => {
    const s0 = startItem(1_000);
    const s1 = registerActivity(s0, 36_000); // 35 s inactivity → recorded
    expect(s1.idleGaps).toEqual([35_000]);
    const { timing } = finishItem(s1, 40_000); // trailing 4 s → not recorded
    expect(timing.elapsedMs).toBe(39_000);
    expect(timing.idleGaps).toEqual([35_000]);
  });

  it("omits idleGaps entirely when there were none", () => {
    const s0 = startItem(0);
    const s1 = registerActivity(s0, 2_000);
    const { timing } = finishItem(s1, 5_000);
    expect(timing).toEqual({ elapsedMs: 5_000 });
  });
});

describe("captured timing ↔ scoring contract", () => {
  it("a recorded sub-30 s gap stays in effective time; a >30 s gap is excluded", () => {
    // 25 s gap recorded by the stopwatch → scoring keeps it (thinking, not a break)
    expect(effectiveTime(39_000, [25_000])).toBe(39_000);
    // 35 s gap → scoring excludes it (a real break)
    expect(effectiveTime(50_000, [35_000])).toBe(15_000);
  });
});

describe("device calibration", () => {
  it("returns null with nothing to measure", () => {
    expect(summarizeCalibration([])).toBeNull();
  });

  it("uses first-tap latency for a single tap", () => {
    expect(summarizeCalibration([800])).toEqual({
      baselineTapMs: 800,
      sampleCount: 1,
    });
  });

  it("uses the median inter-tap gap for multiple taps", () => {
    expect(summarizeCalibration([500, 900, 1_300])).toEqual({
      baselineTapMs: 400,
      sampleCount: 3,
    });
  });
});
