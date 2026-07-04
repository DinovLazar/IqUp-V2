/**
 * Phase 3.01 — idle / tab-blur HARDENING (spec Дел 8). End-to-end proof that both
 * inactivity (the idle watcher) AND a tab-blur return (`visibilitychange` →
 * `markVisible`) record the same kind of gap, that `effectiveTime` (scoring)
 * excludes only the > 30 s ones, that an excluded gap can raise the idle-count
 * validity flag, and — critically — that the gentle nudge itself is timer-free and
 * penalty-free (it changes no time and no score).
 */

import { describe, expect, it } from "vitest";
import {
  checkIdle,
  finishItem,
  markVisible,
  registerActivity,
  startItem,
  IDLE_NUDGE_MS,
  IDLE_GAP_EXCLUDE_MS,
} from "@/features/timing";
import { generateItem } from "@/features/tasks";
import { gradeItem } from "@/features/scoring/grade";
import { computeValidity } from "@/features/scoring/validity";
import { effectiveTime } from "@/features/scoring/time";
import type { GradedItem } from "@/features/assessment/types";

/** Grade a Gf item with a scripted timing payload (the shape 1.06 emits). */
function gradeGf(elapsedMs: number, idleGaps: number[]): GradedItem {
  const item = generateItem({
    signal: "gf",
    level: 5,
    seed: `idle-${elapsedMs}`,
  });
  if (item.signal !== "gf") throw new Error("expected a Gf item");
  return gradeItem(item, {
    signal: "gf",
    optionIndex: item.answer,
    elapsedMs,
    idleGaps,
  });
}

describe("tab-blur is treated identically to idle inactivity (Дел 8)", () => {
  it("a long visibilitychange away-span records a gap the same way idle does", () => {
    // Idle path: no activity for 35 s, then the child taps.
    const idlePath = registerActivity(startItem(0), 35_000);
    // Blur path: tab hidden then re-shown 35 s later.
    const blurPath = markVisible(startItem(0), 35_000);
    expect(blurPath.idleGaps).toEqual(idlePath.idleGaps);
    expect(blurPath.idleGaps).toEqual([35_000]);
  });

  it("a blur mid-item flows blur → excluded gap → reduced effective time", () => {
    const s0 = startItem(0);
    const away = markVisible(s0, 40_000); // gone 40 s (> 30 s exclude)
    const { timing } = finishItem(away, 45_000); // 5 s more of work
    expect(timing.elapsedMs).toBe(45_000);
    expect(timing.idleGaps).toEqual([40_000]);

    const graded = gradeGf(timing.elapsedMs, timing.idleGaps ?? []);
    expect(graded.effectiveTimeMs).toBe(5_000); // 45 s − 40 s excluded
    expect(graded.excludedIdleGaps).toBe(1);
    // scoring agrees on exclusion directly
    expect(effectiveTime(timing.elapsedMs, timing.idleGaps)).toBe(5_000);
  });
});

describe("excluded gaps raise the idle-count validity flag (Дел 7.1 / 8)", () => {
  it("four > 30 s gaps across items ⇒ idle_pauses flag; the same gaps drop from time", () => {
    // Four items, each with one > 30 s gap (blur or idle — identical here).
    const items = Array.from({ length: 4 }, () => {
      const { timing } = finishItem(markVisible(startItem(0), 35_000), 40_000);
      return gradeGf(timing.elapsedMs, timing.idleGaps ?? []);
    }).map((g, i) => ({ ...g, optionIndex: i % 4 }));

    // every gap excluded from effective time
    for (const g of items) expect(g.effectiveTimeMs).toBe(5_000);
    // 4 excluded gaps > the base tolerance (3) ⇒ flag
    const v = computeValidity(items);
    expect(v.flags.some((f) => f.code === "idle_pauses")).toBe(true);
  });
});

describe("the idle nudge is timer-free + penalty-free (brand §8, D-047)", () => {
  it("surfacing the nudge records nothing itself and never subtracts from time", () => {
    const s0 = startItem(0);
    // The watcher tick surfaces the nudge at ~22 s of inactivity. checkIdle only
    // flips a boolean — no countdown, and it records no gap.
    const { state: nudged, nudgeActive } = checkIdle(
      s0,
      IDLE_NUDGE_MS + 500,
      IDLE_NUDGE_MS,
    );
    expect(nudgeActive).toBe(true);
    expect(nudged.idleGaps).toEqual([]); // the nudge itself records nothing

    // The child resumes at ~23 s. Their real idle span IS recorded (it reached the
    // nudge threshold), but at ~23 s it is UNDER the 30 s exclusion floor, so
    // scoring keeps the full time — a nudge-length pause is never a penalty.
    const resumed = registerActivity(nudged, IDLE_NUDGE_MS + 1_000);
    const { timing } = finishItem(resumed, IDLE_NUDGE_MS + 3_000);
    expect(timing.idleGaps).toEqual([IDLE_NUDGE_MS + 1_000]); // ~23 s recorded
    expect(timing.idleGaps?.[0]).toBeLessThan(IDLE_GAP_EXCLUDE_MS);
    // effective time is NOT reduced — the nudge-length pause stays in.
    expect(effectiveTime(timing.elapsedMs, timing.idleGaps)).toBe(
      timing.elapsedMs,
    );
  });

  it("the nudge threshold sits below the formal exclusion threshold", () => {
    // A pause reaches the nudge (recorded) but scoring still excludes only > 30 s.
    expect(IDLE_NUDGE_MS).toBeLessThan(IDLE_GAP_EXCLUDE_MS);
    const recordedButKept = registerActivity(startItem(0), IDLE_NUDGE_MS + 100);
    expect(recordedButKept.idleGaps).toEqual([IDLE_NUDGE_MS + 100]);
    // 22.1 s gap is recorded, yet scoring keeps it (< 30 s ⇒ thinking, not a break)
    expect(effectiveTime(30_000, recordedButKept.idleGaps)).toBe(30_000);
  });
});
