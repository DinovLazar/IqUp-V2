/**
 * The adaptive engine — a pure, deterministic state machine (no clock, no I/O, no
 * randomness beyond the seeded PRNG). Three control flows live behind one uniform
 * selector/reducer interface:
 *
 *   • laddered basal/ceiling (Gf, Gv, EF, CT) — correct → level ↑, error → ↓;
 *     stop on `CEILING_CONSECUTIVE_ERRORS` consecutive errors or the age item cap.
 *   • span-adaptive (Gsm) — start at the age's expected forward span; +1 correct,
 *     −1 error; ceiling on consecutive errors. From age 8, run backward after
 *     forward (start ≈ forward − offset).
 *   • fixed, age-sized (Gs, Glr) — one administration sized by age.
 *
 * `startSession` → state; `nextAction` (selector) → what to do; `applyResponse`
 * (reducer) → next state; `advanceDomain` steps past a finished domain. Same
 * seed + age + response script ⇒ identical path, always.
 */

import {
  BACKWARD_SPAN_OFFSET,
  CEILING_CONSECUTIVE_ERRORS,
  DOMAIN_ORDER,
  EXPECTED_FORWARD_SPAN_BY_AGE,
  GLR_LEVEL_BY_AGE,
  GLR_ROUNDS_BY_AGE,
  GSM_MAX_SPAN,
  GSM_MAX_TRIALS_PER_DIRECTION,
  GSM_MIN_SPAN,
  GS_LEVEL_BY_AGE,
  SPAN_CEILING_CONSECUTIVE_ERRORS,
  START_LEVEL_BY_AGE,
  byAge,
  clampAge,
  itemCap,
} from "@/content/norms";
import { MAX_LEVEL, MIN_LEVEL } from "@/content/tasks";
import { generateItem, type Signal } from "@/features/tasks";
import { deriveSeed } from "@/lib/prng";
import { gradeItem } from "@/features/scoring/grade";
import type {
  AdministerAction,
  DomainState,
  FixedDomain,
  GradedItem,
  LadderedDomain,
  NextAction,
  RawResponse,
  SessionState,
  SpanDomain,
} from "./types";

const LADDERED_SIGNALS: readonly Signal[] = ["gf", "gv", "ef", "ct"];

// ── Session bootstrap ─────────────────────────────────────────────────────────

export interface StartSessionArgs {
  sessionSeed: string | number;
  age: number;
}

/** Build the initial per-domain state for a signal at an age. */
function initDomain(signal: Signal, age: number): DomainState {
  if (LADDERED_SIGNALS.includes(signal)) {
    return {
      kind: "laddered",
      signal,
      level: byAge(START_LEVEL_BY_AGE, age),
      consecutiveErrors: 0,
      items: [],
      cap: itemCap(signal, age),
      done: false,
      maxLevelCorrect: 0,
    };
  }
  if (signal === "gsm") {
    return {
      kind: "span",
      signal: "gsm",
      phase: "forward",
      currentSpan: byAge(EXPECTED_FORWARD_SPAN_BY_AGE, age),
      consecutiveErrors: 0,
      trialsInPhase: 0,
      forward: [],
      backward: [],
      runBackward: clampAge(age) >= 8,
      done: false,
    };
  }
  if (signal === "gs") {
    return {
      kind: "fixed",
      signal: "gs",
      level: byAge(GS_LEVEL_BY_AGE, age),
      administered: false,
      item: null,
      done: false,
    };
  }
  // glr
  return {
    kind: "fixed",
    signal: "glr",
    level: byAge(GLR_LEVEL_BY_AGE, age),
    rounds: byAge(GLR_ROUNDS_BY_AGE, age),
    administered: false,
    item: null,
    done: false,
  };
}

/** Start a session: deterministic domain order + per-domain start state from config. */
export function startSession({
  sessionSeed,
  age,
}: StartSessionArgs): SessionState {
  const a = clampAge(age);
  const seed = String(sessionSeed);
  const domains = {} as Record<Signal, DomainState>;
  for (const signal of DOMAIN_ORDER) domains[signal] = initDomain(signal, a);
  return {
    sessionSeed: seed,
    age: a,
    order: DOMAIN_ORDER,
    domainIndex: 0,
    domains,
  };
}

// ── Selector ──────────────────────────────────────────────────────────────────

/** Build the administer action for the current (not-done) domain. */
function buildAdminister(
  state: SessionState,
  d: DomainState,
): AdministerAction {
  if (d.kind === "laddered") {
    const itemIndex = d.items.length;
    const itemSeed = deriveSeed(state.sessionSeed, d.signal, itemIndex);
    const item = generateItem({
      signal: d.signal,
      level: d.level,
      seed: itemSeed,
    });
    return {
      kind: "administer",
      signal: d.signal,
      itemIndex,
      itemSeed,
      level: d.level,
      item,
    };
  }
  if (d.kind === "span") {
    const itemIndex = d.forward.length + d.backward.length;
    const itemSeed = deriveSeed(state.sessionSeed, "gsm", itemIndex);
    const item = generateItem({
      signal: "gsm",
      level: 1,
      seed: itemSeed,
      length: d.currentSpan,
      direction: d.phase,
    });
    return {
      kind: "administer",
      signal: "gsm",
      itemIndex,
      itemSeed,
      spanLength: d.currentSpan,
      direction: d.phase,
      item,
    };
  }
  // fixed (gs / glr)
  const itemSeed = deriveSeed(state.sessionSeed, d.signal, 0);
  const item = generateItem({
    signal: d.signal,
    level: d.level,
    seed: itemSeed,
  });
  return {
    kind: "administer",
    signal: d.signal,
    itemIndex: 0,
    itemSeed,
    level: d.level,
    rounds: d.signal === "glr" ? d.rounds : undefined,
    item,
  };
}

/**
 * The selector: what to do next given the state. Pure — derives the same
 * (deterministic) item the reducer will grade against.
 */
export function nextAction(state: SessionState): NextAction {
  if (state.domainIndex >= state.order.length)
    return { kind: "sessionComplete" };
  const signal = state.order[state.domainIndex];
  const d = state.domains[signal];
  if (d.done) return { kind: "domainComplete", signal };
  return buildAdminister(state, d);
}

// ── Reducers ──────────────────────────────────────────────────────────────────

function reduceLaddered(d: LadderedDomain, g: GradedItem): LadderedDomain {
  const items = [...d.items, g];
  let { level, consecutiveErrors, maxLevelCorrect } = d;
  if (g.correct) {
    maxLevelCorrect = Math.max(maxLevelCorrect, g.level ?? level);
    level = Math.min(MAX_LEVEL, level + 1);
    consecutiveErrors = 0;
  } else {
    level = Math.max(MIN_LEVEL, level - 1);
    consecutiveErrors += 1;
  }
  const done =
    items.length >= d.cap || consecutiveErrors >= CEILING_CONSECUTIVE_ERRORS;
  return { ...d, items, level, consecutiveErrors, maxLevelCorrect, done };
}

function reduceSpan(d: SpanDomain, g: GradedItem, age: number): SpanDomain {
  const trialsInPhase = d.trialsInPhase + 1;
  let { currentSpan, consecutiveErrors } = d;
  if (g.correct) {
    currentSpan = Math.min(GSM_MAX_SPAN, currentSpan + 1);
    consecutiveErrors = 0;
  } else {
    currentSpan = Math.max(GSM_MIN_SPAN, currentSpan - 1);
    consecutiveErrors += 1;
  }
  const forward = d.phase === "forward" ? [...d.forward, g] : d.forward;
  const backward = d.phase === "backward" ? [...d.backward, g] : d.backward;

  const phaseDone =
    consecutiveErrors >= SPAN_CEILING_CONSECUTIVE_ERRORS ||
    trialsInPhase >= GSM_MAX_TRIALS_PER_DIRECTION;

  if (!phaseDone) {
    return {
      ...d,
      forward,
      backward,
      currentSpan,
      consecutiveErrors,
      trialsInPhase,
    };
  }
  // Forward just ended and backward is due (age ≥ 8): switch phases.
  if (d.phase === "forward" && d.runBackward) {
    const expectedForward = byAge(EXPECTED_FORWARD_SPAN_BY_AGE, age);
    const backStart = Math.max(
      GSM_MIN_SPAN,
      expectedForward - BACKWARD_SPAN_OFFSET,
    );
    return {
      ...d,
      forward,
      backward,
      phase: "backward",
      currentSpan: backStart,
      consecutiveErrors: 0,
      trialsInPhase: 0,
      done: false,
    };
  }
  return {
    ...d,
    forward,
    backward,
    currentSpan,
    consecutiveErrors,
    trialsInPhase,
    done: true,
  };
}

function reduceFixed(d: FixedDomain, g: GradedItem): FixedDomain {
  return { ...d, administered: true, item: g, done: true };
}

/**
 * The reducer: grade the response against the (re-derived, deterministic) current
 * item and fold it into the domain. Does not mutate the input state.
 */
export function applyResponse(
  state: SessionState,
  response: RawResponse,
): SessionState {
  const action = nextAction(state);
  if (action.kind !== "administer") {
    throw new Error("applyResponse: no item is awaiting a response");
  }
  const graded = gradeItem(action.item, response);
  const signal = action.signal;
  const d = state.domains[signal];

  let next: DomainState;
  if (d.kind === "laddered") next = reduceLaddered(d, graded);
  else if (d.kind === "span") next = reduceSpan(d, graded, state.age);
  else next = reduceFixed(d, graded);

  return { ...state, domains: { ...state.domains, [signal]: next } };
}

/** Step past a finished domain (call on a `domainComplete` action). */
export function advanceDomain(state: SessionState): SessionState {
  if (state.domainIndex < state.order.length) {
    const d = state.domains[state.order[state.domainIndex]];
    if (!d.done)
      throw new Error("advanceDomain: current domain is not complete");
  }
  return { ...state, domainIndex: state.domainIndex + 1 };
}

// ── Driver ────────────────────────────────────────────────────────────────────

/** A scripted responder: given the item being administered, return the response. */
export type ResponseScript = (action: AdministerAction) => RawResponse;

/**
 * Drive a session to completion with a response script — the deterministic harness
 * used by the tests and reusable by 1.07. Returns the final state for `finalize`.
 */
export function runSession(
  initial: SessionState,
  script: ResponseScript,
): SessionState {
  let state = initial;
  for (let guard = 0; guard < 10_000; guard++) {
    const action = nextAction(state);
    if (action.kind === "sessionComplete") return state;
    if (action.kind === "domainComplete") {
      state = advanceDomain(state);
      continue;
    }
    state = applyResponse(state, script(action));
  }
  throw new Error("runSession: did not terminate (guard tripped)");
}
