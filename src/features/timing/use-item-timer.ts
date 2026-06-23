"use client";

/**
 * React binding for the pure stopwatch (`stopwatch.ts`). Owns the only clock in
 * the assessment — `performance.now()` — and feeds it to the pure functions, so
 * all timing decisions stay testable in node. One timer per administered item
 * (remount via a React `key` resets it).
 *
 * Exposes `markActivity` (wire to the screen's pointer/key handlers), the live
 * `nudgeActive` flag, a `dismissNudge` for the "Продолжи" button, and `finish()`
 * which returns the engine-shaped {@link CapturedTiming} plus any device
 * calibration captured on the first practice item.
 */

import * as React from "react";
import { IDLE_NUDGE_MS, IDLE_POLL_MS } from "./constants";
import {
  checkIdle,
  finishItem,
  markVisible,
  registerActivity,
  startItem,
} from "./stopwatch";
import { summarizeCalibration } from "./calibration";
import type {
  CapturedTiming,
  DeviceCalibration,
  ItemTimerState,
} from "./types";

const now = (): number =>
  typeof performance !== "undefined" ? performance.now() : 0;

export interface UseItemTimerOptions {
  /** Gs (the speed game) runs its own visible timer — suppress the idle nudge. */
  suppressIdle?: boolean;
  /** First practice item: collect tap offsets for the device baseline. */
  calibrate?: boolean;
}

export interface ItemTimerHandle {
  nudgeActive: boolean;
  markActivity: () => void;
  dismissNudge: () => void;
  finish: () => {
    timing: CapturedTiming;
    calibration: DeviceCalibration | null;
  };
}

export function useItemTimer({
  suppressIdle = false,
  calibrate = false,
}: UseItemTimerOptions = {}): ItemTimerHandle {
  // One timer per item: this hook is remounted (via a React `key`) for each
  // administration, so the refs initialise fresh from the clock on every mount.
  const stateRef = React.useRef<ItemTimerState>(startItem(now()));
  const tapsRef = React.useRef<number[]>([]);
  const [nudgeActive, setNudgeActive] = React.useState(false);

  const markActivity = React.useCallback(() => {
    const t = now();
    if (calibrate) {
      tapsRef.current.push(Math.max(0, t - stateRef.current.startMs));
    }
    stateRef.current = registerActivity(stateRef.current, t);
    setNudgeActive(false);
  }, [calibrate]);

  const dismissNudge = React.useCallback(() => {
    stateRef.current = registerActivity(stateRef.current, now());
    setNudgeActive(false);
  }, []);

  // Idle watcher.
  React.useEffect(() => {
    if (suppressIdle) return;
    const id = setInterval(() => {
      const res = checkIdle(stateRef.current, now(), IDLE_NUDGE_MS);
      stateRef.current = res.state;
      if (res.nudgeActive) setNudgeActive(true);
    }, IDLE_POLL_MS);
    return () => clearInterval(id);
  }, [suppressIdle]);

  // Tab-blur / refocus counts as an inactivity span.
  React.useEffect(() => {
    if (suppressIdle) return;
    const onVis = () => {
      if (document.visibilityState === "visible") {
        stateRef.current = markVisible(stateRef.current, now());
        setNudgeActive(false);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [suppressIdle]);

  const finish = React.useCallback(() => {
    const { timing } = finishItem(stateRef.current, now());
    const calibration = calibrate
      ? summarizeCalibration(tapsRef.current)
      : null;
    return { timing, calibration };
  }, [calibrate]);

  return { nudgeActive, markActivity, dismissNudge, finish };
}
