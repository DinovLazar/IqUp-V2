/**
 * Timing-layer data shapes. The per-item output, {@link CapturedTiming}, is
 * structurally the {@link ResponseTiming} the 1.05 engine/scoring layer consumes
 * (`elapsedMs` + optional `idleGaps`) — it is fed straight into `applyResponse`.
 *
 * {@link DeviceCalibration} is captured on the first practice item (spec Дел 7.2)
 * but has **no home in the 1.05 `ResponseTiming` contract**, so it rides at the
 * session level instead — captured-but-inert, like `parentAssistMode`, ready for
 * the age/device-adjusted validity thresholds in Phase 3.01. This mismatch is
 * intentional and surfaced in the completion report (the 1.05 layer is unchanged).
 */

import type { ResponseTiming } from "@/features/assessment";

/** Per-item timing in exactly the shape the engine/scoring layer expects. */
export type CapturedTiming = ResponseTiming;

/** Pure state of one item's silent stopwatch + idle watcher. */
export interface ItemTimerState {
  /** Wall-clock the item became answerable (ms, from a monotonic source). */
  startMs: number;
  /** Last observed user activity (or tab-refocus) — the inactivity anchor. */
  lastActivityMs: number;
  /** Completed idle gaps (ms) whose inactivity reached the nudge threshold. */
  idleGaps: number[];
  /** Whether the gentle nudge is currently surfaced. */
  nudgeActive: boolean;
}

/** Device baseline captured on the first practice item (Дел 7.2). */
export interface DeviceCalibration {
  /** Baseline tap responsiveness (ms): median inter-tap gap, else first-tap latency. */
  baselineTapMs: number;
  /** How many taps the baseline rests on. */
  sampleCount: number;
}
