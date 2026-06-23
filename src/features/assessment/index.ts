/**
 * Adaptive engine — public barrel.
 *
 * A pure, deterministic state machine for administering the battery: start level
 * by age, basal/ceiling laddering, span growth (forward + backward from age 8),
 * fixed age-sized domains, and per-item seed derivation. Timing arrives only as
 * data on responses; the engine never runs a clock. Pairs with `@/features/scoring`
 * (`finalize`) to turn a completed session into an `AssessmentResult`.
 */

export * from "./types";
export {
  startSession,
  nextAction,
  applyResponse,
  advanceDomain,
  runSession,
  type StartSessionArgs,
  type ResponseScript,
} from "./engine";
export {
  startFlow,
  settle,
  nextStep,
  groupsCompleted,
  sectionOfSignal,
  INDEX_GROUPS,
  SECTION_TOTAL,
  type FlowStep,
} from "./flow";
