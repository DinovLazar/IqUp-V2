/**
 * The silent per-item stopwatch + idle watcher — PURE functions over explicit
 * timestamps (no clock of their own, mirroring the 1.05 engine). The React hook
 * `use-item-timer` feeds these real `performance.now()` values; tests feed
 * synthetic ones. Same timestamps in ⇒ same timing out.
 *
 * Model: inactivity is measured from `lastActivityMs`. When it reaches the nudge
 * threshold the gentle prompt appears; when activity resumes (or the item ends),
 * the whole inactivity span is recorded as one idle gap **if** it reached that
 * threshold. Scoring (1.05) later excludes only gaps over 30 s — here we just
 * record. A tab-blur return is handled as a resume of however long the child was
 * away.
 */

import { IDLE_RECORD_MS } from "./constants";
import type { CapturedTiming, ItemTimerState } from "./types";

/** Begin timing a freshly-presented item. */
export function startItem(nowMs: number): ItemTimerState {
  return {
    startMs: nowMs,
    lastActivityMs: nowMs,
    idleGaps: [],
    nudgeActive: false,
  };
}

/** Close any open inactivity span ≥ the record threshold, appending its duration. */
function closeGap(
  gaps: readonly number[],
  fromMs: number,
  toMs: number,
  recordMs: number,
): number[] {
  const span = toMs - fromMs;
  return span >= recordMs ? [...gaps, span] : [...gaps];
}

/**
 * Register user activity (a tap, key, or drag). Closes a recorded idle span if
 * one was open, re-anchors the inactivity clock, and clears the nudge.
 */
export function registerActivity(
  state: ItemTimerState,
  nowMs: number,
  recordMs: number = IDLE_RECORD_MS,
): ItemTimerState {
  return {
    ...state,
    idleGaps: closeGap(state.idleGaps, state.lastActivityMs, nowMs, recordMs),
    lastActivityMs: nowMs,
    nudgeActive: false,
  };
}

/** Watcher tick: surface the nudge once inactivity reaches the threshold. */
export function checkIdle(
  state: ItemTimerState,
  nowMs: number,
  nudgeMs: number,
): { state: ItemTimerState; nudgeActive: boolean } {
  const idle = nowMs - state.lastActivityMs;
  const nudgeActive = state.nudgeActive || idle >= nudgeMs;
  return { state: { ...state, nudgeActive }, nudgeActive };
}

/**
 * The tab regained focus. Treat the away span like any inactivity: record it if
 * long enough, then re-anchor (the child is re-engaging) and drop the nudge.
 */
export function markVisible(
  state: ItemTimerState,
  nowMs: number,
  recordMs: number = IDLE_RECORD_MS,
): ItemTimerState {
  return registerActivity(state, nowMs, recordMs);
}

/** Finish the item: close a trailing gap and emit the engine-shaped timing. */
export function finishItem(
  state: ItemTimerState,
  nowMs: number,
  recordMs: number = IDLE_RECORD_MS,
): { timing: CapturedTiming; state: ItemTimerState } {
  const idleGaps = closeGap(
    state.idleGaps,
    state.lastActivityMs,
    nowMs,
    recordMs,
  );
  const elapsedMs = Math.max(0, Math.round(nowMs - state.startMs));
  const timing: CapturedTiming =
    idleGaps.length > 0 ? { elapsedMs, idleGaps } : { elapsedMs };
  return { timing, state: { ...state, idleGaps } };
}
