/**
 * Task bank — public barrel.
 *
 * Phase 1.04: deterministic, seedable procedural generators for the 7 testable
 * signals (Gf, Gv, Gsm, Gs, EF, Glr, CT), emitting pure data / coordinate
 * geometry only. Attention is a derived signal (1.05), so it has no generator.
 *
 * Everything downstream (the assessment flow in 1.06, scoring in 1.05) imports
 * from here.
 */

export { TASK_BANK_VERSION } from "@/content/tasks";
export * from "./types";
export * from "./guards";
export {
  REGISTRY,
  TESTABLE_SIGNALS,
  generateItem,
  generatePractice,
  type GenerateItemArgs,
} from "./registry";
