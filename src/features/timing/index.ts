/**
 * Timing layer — public barrel (Phase 1.06).
 *
 * A silent per-item stopwatch + idle/tab-blur watcher whose decisions live in
 * pure functions (`stopwatch.ts`, `calibration.ts`) and whose only clock lives in
 * the `useItemTimer` React hook. Output is the engine-shaped `CapturedTiming`
 * (`elapsedMs` + optional `idleGaps`), fed straight into `applyResponse`.
 */

export * from "./constants";
export * from "./types";
export {
  startItem,
  registerActivity,
  checkIdle,
  markVisible,
  finishItem,
} from "./stopwatch";
export { summarizeCalibration } from "./calibration";
export { useItemTimer } from "./use-item-timer";
export type { UseItemTimerOptions, ItemTimerHandle } from "./use-item-timer";
