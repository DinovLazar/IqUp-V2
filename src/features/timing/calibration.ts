/**
 * Device calibration (spec Дел 7.2) — derive a baseline tap responsiveness from
 * the taps the child makes on the **first** practice item, folded in rather than
 * run as a separate game. Pure: takes tap timestamps (ms, relative to the item
 * start) and returns the baseline, or null if there is nothing to measure.
 *
 * With ≥ 2 taps the baseline is the median inter-tap gap (rhythm); with a single
 * tap it falls back to that tap's latency from item start (simple reaction).
 */

import { CALIBRATION_MIN_TAPS } from "./constants";
import type { DeviceCalibration } from "./types";

function median(xs: readonly number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * @param tapOffsetsMs tap timestamps in ms, relative to item start, in tap order.
 */
export function summarizeCalibration(
  tapOffsetsMs: readonly number[],
): DeviceCalibration | null {
  if (tapOffsetsMs.length < CALIBRATION_MIN_TAPS) return null;

  if (tapOffsetsMs.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < tapOffsetsMs.length; i++) {
      intervals.push(tapOffsetsMs[i] - tapOffsetsMs[i - 1]);
    }
    return {
      baselineTapMs: Math.round(median(intervals)),
      sampleCount: tapOffsetsMs.length,
    };
  }

  // Single tap → simple-reaction latency from item start.
  return { baselineTapMs: Math.round(tapOffsetsMs[0]), sampleCount: 1 };
}
