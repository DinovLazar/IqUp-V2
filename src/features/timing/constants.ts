/**
 * UI-layer timing constants (Phase 1.06). These govern the *behaviour* of the
 * silent stopwatch and the idle nudge — the render-time concerns the pure 1.05
 * scoring layer deliberately does not own. Where a value is also a scoring input
 * it is RE-EXPORTED from the seed-norms so there is a single source of truth.
 *
 * The relationship that matters (spec Дел 8 / D-059): the gentle nudge appears at
 * {@link IDLE_NUDGE_MS} (inside the 20–25 s window), but a gap is only formally
 * EXCLUDED from a task's effective time once it passes {@link IDLE_GAP_EXCLUDE_MS}
 * (30 s) — that exclusion lives in scoring. This phase only *records* the gap.
 */

import { IDLE_GAP_EXCLUDE_MS, TOO_FAST_MS } from "@/content/norms";

export { IDLE_GAP_EXCLUDE_MS, TOO_FAST_MS };

/**
 * Show the gentle idle nudge after this much inactivity (ms). Sits inside the
 * spec's ~20–25 s window and below the 30 s formal-exclusion threshold, so the
 * child is reassured well before any pause is treated as a real break.
 */
export const IDLE_NUDGE_MS = 22_000;

/** How often the idle watcher re-checks inactivity (ms). */
export const IDLE_POLL_MS = 1_000;

/**
 * A recorded idle gap is one whose inactivity reached the nudge threshold. Its
 * full duration is stored in the response timing; scoring decides exclusion
 * (> {@link IDLE_GAP_EXCLUDE_MS}). Shorter pauses are normal thinking and ignored.
 */
export const IDLE_RECORD_MS = IDLE_NUDGE_MS;

/** Minimum taps before a device-calibration baseline is meaningful. */
export const CALIBRATION_MIN_TAPS = 1;
