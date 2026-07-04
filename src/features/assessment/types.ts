/**
 * Adaptive-engine types — the pure state machine's data shapes.
 *
 * The engine is a reducer over explicit, serialisable state: no clock, no I/O, no
 * randomness beyond the seeded PRNG. `nextAction` (selector) decides what to show;
 * `applyResponse` (reducer) folds a scripted response back in. Timing arrives ONLY
 * as data on the response (`elapsedMs` + `idleGaps`) — the real stopwatch and idle
 * detection are Phase 1.06.
 *
 * v2 (Phase 2.06): every domain but Gs ladders over the calibration-v2 level
 * tables (Gsm rows carry length/direction/path; Glr rows carry pairs/trials),
 * with the WISC-style reverse-on-first-fail BASAL rule; Gs is fixed-by-age with
 * 2 scored rounds (the speeded exception — no staircase, no basal).
 */

import type { CorsiDirection, Item, Signal, TowerMove } from "@/features/tasks";

// ── Responses (input to the reducer) ──────────────────────────────────────────

/** Timing handed in with every response (the engine measures nothing itself). */
export interface ResponseTiming {
  /** Raw wall-clock elapsed for the item, in ms (provided by 1.06). */
  elapsedMs: number;
  /** Durations (ms) of detected idle/tab-blur gaps within the item; long ones are excluded. */
  idleGaps?: number[];
}

/** A child's raw response to one administered item — graded against the item's key. */
export type RawResponse = ResponseTiming &
  (
    | { signal: "gf" | "gv"; optionIndex: number }
    | { signal: "ct"; optionIndex?: number; stepIndex?: number }
    | { signal: "gsm"; tapOrder: number[] }
    | { signal: "gs"; selectedCells: number[] }
    | { signal: "ef"; moves: TowerMove[] }
    | { signal: "glr"; rounds: number[][] }
  );

// ── Graded results (stored in state) ──────────────────────────────────────────

export type ErrorType = "impulsive" | "wrong" | "unsolved";

/** Per-signal extra observables captured at grade time, for scoring + 1.07. */
export interface GsObservation {
  found: number;
  falseTaps: number;
  targetCount: number;
  tappedCount: number;
  cellCount: number;
}
export interface EfObservation {
  minMoves: number;
  movesUsed: number;
  solved: boolean;
}
export interface GlrObservation {
  /** Recall accuracy (0–1) per round, in administration order. */
  roundAccuracies: number[];
}

/** One graded item, recorded in domain state and surfaced in the result's perItem. */
export interface GradedItem {
  signal: Signal;
  itemSeed: string;
  /** Laddered domains: the difficulty level administered. */
  level?: number;
  /** Corsi: the span length + direction administered. */
  spanLength?: number;
  direction?: CorsiDirection;
  /** Primary binary outcome — drives the staircase. */
  correct: boolean;
  effectiveTimeMs: number;
  rawElapsedMs: number;
  /** Idle gaps long enough to be excluded from effective time (feeds the idle flag). */
  excludedIdleGaps: number;
  tooFast: boolean;
  errorType?: ErrorType;
  /** Chosen option position (multiple-choice items only) — for same-position validity. */
  optionIndex?: number;
  /** Item difficulty weight (from the task bank) — weights accuracy scores. */
  difficultyWeight: number;
  gs?: GsObservation;
  ef?: EfObservation;
  glr?: GlrObservation;
}

// ── Per-domain state (two control flows in v2) ────────────────────────────────

/** Laddered basal/ceiling domains: Gf, Gv, Gsm, EF, Glr, CT. */
export interface LadderedDomain {
  kind: "laddered";
  signal: Signal;
  /** Current difficulty level (1–10). */
  level: number;
  consecutiveErrors: number;
  items: GradedItem[];
  cap: number;
  done: boolean;
  /** Highest level answered correctly (ceiling detection). */
  maxLevelCorrect: number;
  /**
   * Basal (v2): true until the first correct answer. While true, a wrong answer
   * demotes item-by-item WITHOUT tripping the consecutive-error ceiling.
   */
  basalPhase: boolean;
  /**
   * Levels below the first-correct level, credited as passed at their level
   * weight for the level-weighted accuracy score (WISC reverse-rule credit).
   * Empty until the basal is established (or when the domain floors out at L1).
   */
  basalCreditLevels: number[];
}

/** The fixed-by-age speeded domain: Gs (2 scored rounds, no staircase). */
export interface GsDomain {
  kind: "gs";
  signal: "gs";
  /** The age-pegged nominal level recorded on the items. */
  level: number;
  /** Scored rounds administered so far. */
  items: GradedItem[];
  /** Rounds to administer (GS_ROUNDS = 2). */
  rounds: number;
  done: boolean;
}

export type DomainState = LadderedDomain | GsDomain;

// ── Session state ─────────────────────────────────────────────────────────────

export interface SessionState {
  sessionSeed: string;
  age: number;
  /** Administration order (signals). */
  order: readonly Signal[];
  /** Pointer into `order` (advances on domainComplete). */
  domainIndex: number;
  /** Per-signal domain state. */
  domains: Record<Signal, DomainState>;
}

// ── Actions (output of the selector) ──────────────────────────────────────────

export interface AdministerAction {
  kind: "administer";
  signal: Signal;
  /** Per-domain index of this item (drives the derived item seed). */
  itemIndex: number;
  /** Seed for this item: deriveSeed(sessionSeed, signal, itemIndex). */
  itemSeed: string;
  /** Difficulty level administered (Gs: the age-pegged nominal level). */
  level?: number;
  /** Corsi. */
  spanLength?: number;
  direction?: CorsiDirection;
  /** Glr: how many recall rounds the UI should run (the ladder row's trials). */
  rounds?: number;
  /** The deterministic item to render (from generateItem on itemSeed). */
  item: Item;
}

export interface DomainCompleteAction {
  kind: "domainComplete";
  signal: Signal;
}

export interface SessionCompleteAction {
  kind: "sessionComplete";
}

export type NextAction =
  | AdministerAction
  | DomainCompleteAction
  | SessionCompleteAction;
