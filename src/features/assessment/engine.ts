/**
 * The adaptive engine — a pure, deterministic state machine (no clock, no I/O, no
 * randomness beyond the seeded PRNG). Two control flows live behind one uniform
 * selector/reducer interface (calibration v2):
 *
 *   • laddered basal/ceiling (Gf, Gv, Gsm, EF, Glr, CT) — per-signal start
 *     level for the age; correct → level ↑, error → ↓ (floor L1, ceiling L10);
 *     WISC-style BASAL: a wrong FIRST item demotes item-by-item (ceiling
 *     suspended) until the first correct answer, and every level below that
 *     first-correct level is credited as passed at its level weight; then the
 *     normal staircase resumes and `CEILING_CONSECUTIVE_ERRORS` consecutive
 *     errors (or the age item cap) end the domain. Gsm rows carry
 *     length/direction/path (under-8 backward→forward+crisscross substitution
 *     via the level lookup); Glr rows carry pairs/trials.
 *   • fixed, age-sized speeded (Gs) — the WISC speeded-subtest exception: no
 *     staircase, no basal; 2 scored rounds from the per-age parameter row
 *     (round 2 = fresh layout, same params, same targets via a shared
 *     target seed).
 *
 * `startSession` → state; `nextAction` (selector) → what to do; `applyResponse`
 * (reducer) → next state; `advanceDomain` steps past a finished domain. Same
 * seed + age + response script ⇒ identical path, always.
 */

import {
  CEILING_CONSECUTIVE_ERRORS,
  DOMAIN_ORDER,
  GSM_MAX_TRIALS_PER_DIRECTION,
  clampAge,
  itemCap,
  startLevel,
  type LadderedSignal,
} from "@/content/norms";
import {
  GS_ROUNDS,
  MAX_LEVEL,
  MIN_LEVEL,
  glrLevel,
  gsNominalLevel,
  gsmLevelForAge,
} from "@/content/tasks";
import { generateItem, type Signal } from "@/features/tasks";
import { deriveSeed } from "@/lib/prng";
import { gradeItem } from "@/features/scoring/grade";
import type {
  AdministerAction,
  DomainState,
  GradedItem,
  GsDomain,
  LadderedDomain,
  NextAction,
  RawResponse,
  SessionState,
} from "./types";

/** Every signal ladders except the fixed-by-age, speeded Gs. */
const LADDERED_SIGNALS: readonly Signal[] = [
  "gf",
  "gv",
  "gsm",
  "ef",
  "glr",
  "ct",
];

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
      level: startLevel(signal as LadderedSignal, age),
      consecutiveErrors: 0,
      items: [],
      cap: itemCap(signal, age),
      done: false,
      maxLevelCorrect: 0,
      basalPhase: true,
      basalCreditLevels: [],
    };
  }
  return {
    kind: "gs",
    signal: "gs",
    level: gsNominalLevel(age),
    items: [],
    rounds: GS_ROUNDS,
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
    if (d.signal === "gsm") {
      const row = gsmLevelForAge(d.level, state.age);
      const item = generateItem({
        signal: "gsm",
        level: d.level,
        seed: itemSeed,
        age: state.age,
        length: row.length,
        direction: row.direction,
        path: row.path,
      });
      return {
        kind: "administer",
        signal: "gsm",
        itemIndex,
        itemSeed,
        level: d.level,
        spanLength: row.length,
        direction: row.direction,
        item,
      };
    }
    const item = generateItem({
      signal: d.signal,
      level: d.level,
      seed: itemSeed,
      age: state.age,
    });
    return {
      kind: "administer",
      signal: d.signal,
      itemIndex,
      itemSeed,
      level: d.level,
      rounds: d.signal === "glr" ? glrLevel(d.level).trials : undefined,
      item,
    };
  }
  // Gs — fixed 2 scored rounds; the targets are shared across rounds.
  const itemIndex = d.items.length;
  const itemSeed = deriveSeed(state.sessionSeed, "gs", itemIndex);
  const item = generateItem({
    signal: "gs",
    level: d.level,
    seed: itemSeed,
    age: state.age,
    targetSeed: deriveSeed(state.sessionSeed, "gs-targets"),
  });
  return {
    kind: "administer",
    signal: "gs",
    itemIndex,
    itemSeed,
    level: d.level,
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

const levelRange = (below: number): number[] =>
  Array.from({ length: Math.max(0, below - MIN_LEVEL) }, (_, i) => i + 1);

function reduceLaddered(d: LadderedDomain, g: GradedItem): LadderedDomain {
  const items = [...d.items, g];
  let { level, consecutiveErrors, maxLevelCorrect, basalPhase } = d;
  let { basalCreditLevels } = d;

  if (basalPhase) {
    if (g.correct) {
      // Basal established: credit every level below the first-correct level.
      const firstCorrect = g.level ?? level;
      basalPhase = false;
      basalCreditLevels = levelRange(firstCorrect);
      maxLevelCorrect = Math.max(maxLevelCorrect, firstCorrect);
      level = Math.min(MAX_LEVEL, firstCorrect + 1);
      consecutiveErrors = 0;
    } else if (level <= MIN_LEVEL) {
      // Wrong at L1: the descent can go no lower, so the basal phase ends with
      // nothing credited — but ONE error is not a termination (§0 sanctions
      // only the ceiling and the cap). The normal consecutive-error ceiling
      // takes over: a child who mistapped the very first L1 item gets another
      // L1 item; a descent chain arrives here with ≥2 errors and ends anyway.
      basalPhase = false;
      basalCreditLevels = [];
      consecutiveErrors += 1;
    } else {
      // Demote item-by-item; the ceiling is suspended during the descent.
      level -= 1;
      consecutiveErrors += 1;
    }
  } else if (g.correct) {
    maxLevelCorrect = Math.max(maxLevelCorrect, g.level ?? level);
    level = Math.min(MAX_LEVEL, level + 1);
    consecutiveErrors = 0;
  } else {
    level = Math.max(MIN_LEVEL, level - 1);
    consecutiveErrors += 1;
  }

  // Gsm backstop (kept from v1): no direction may run past its trial cap.
  const directionCapped =
    d.signal === "gsm" &&
    (["forward", "backward"] as const).some(
      (dir) =>
        items.filter((it) => it.direction === dir).length >=
        GSM_MAX_TRIALS_PER_DIRECTION,
    );

  const done =
    items.length >= d.cap ||
    directionCapped ||
    (!basalPhase && consecutiveErrors >= CEILING_CONSECUTIVE_ERRORS);
  return {
    ...d,
    items,
    level,
    consecutiveErrors,
    maxLevelCorrect,
    basalPhase,
    basalCreditLevels,
    done,
  };
}

function reduceGs(d: GsDomain, g: GradedItem): GsDomain {
  const items = [...d.items, g];
  return { ...d, items, done: items.length >= d.rounds };
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

  const next: DomainState =
    d.kind === "laddered" ? reduceLaddered(d, graded) : reduceGs(d, graded);

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
