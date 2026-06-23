/**
 * The assessment flow controller — PURE logic that sits on top of the 1.05 engine
 * and adds the things the screens need: practice interleaving (one un-scored
 * example before each new task type, spec Дел 7.2) and the 5-section progress the
 * puzzle-brain reads. No React, no clock, no randomness beyond the engine's seeded
 * PRNG — so the whole running phase is deterministic and node-testable.
 *
 * Key move: `settle` advances the engine past every `domainComplete` so the flow
 * never rests on a non-interactive state — `nextStep` then only ever yields a
 * practice item, a real administration, or completion.
 */

import { generatePractice, type Item, type Signal } from "@/features/tasks";
import { deriveSeed } from "@/lib/prng";
import { INDEX_ORDER, type IndexKey } from "@/lib/indices";
import { advanceDomain, nextAction, startSession } from "./engine";
import type { AdministerAction, SessionState } from "./types";

/** The 5 parent-facing index-groups → the signals that complete them. */
export const INDEX_GROUPS: Readonly<Record<IndexKey, readonly Signal[]>> = {
  logic: ["gf"],
  spatial: ["gv"],
  memory: ["gsm"],
  planning: ["ef", "gs"],
  stem: ["ct", "glr"],
};

export const SECTION_TOTAL = INDEX_ORDER.length; // 5

/** Advance past any finished domains so the state always faces an action. */
export function settle(state: SessionState): SessionState {
  let s = state;
  for (let guard = 0; guard < 100; guard++) {
    const action = nextAction(s);
    if (action.kind === "domainComplete") {
      s = advanceDomain(s);
      continue;
    }
    return s;
  }
  return s;
}

/** Start a settled session ready for the first step. */
export function startFlow(args: {
  sessionSeed: string | number;
  age: number;
}): SessionState {
  return settle(startSession(args));
}

const groupDone = (state: SessionState, key: IndexKey): boolean =>
  INDEX_GROUPS[key].every((sig) => state.domains[sig].done);

/** How many of the 5 index-groups are fully complete (drives the puzzle-brain). */
export function groupsCompleted(state: SessionState): number {
  return INDEX_ORDER.filter((key) => groupDone(state, key)).length;
}

/** The 1-based section number for a signal (which of the 5 groups it belongs to). */
export function sectionOfSignal(signal: Signal): number {
  const i = INDEX_ORDER.findIndex((key) => INDEX_GROUPS[key].includes(signal));
  return i < 0 ? 1 : i + 1;
}

export type FlowStep =
  | {
      kind: "practice";
      signal: Signal;
      item: Item;
      /** First domain overall → start encouragement vs a transition line. */
      firstDomain: boolean;
    }
  | { kind: "item"; action: AdministerAction }
  | { kind: "complete" };

/**
 * The next thing to show, given the settled engine state + which task types have
 * already had their practice example. Practice precedes the first real item of
 * each domain and is skippable (the caller just records the signal as shown).
 */
export function nextStep(
  state: SessionState,
  practiceShown: ReadonlySet<Signal>,
): FlowStep {
  const action = nextAction(state);
  if (action.kind !== "administer") return { kind: "complete" };

  const signal = action.signal;
  if (!practiceShown.has(signal)) {
    const item = generatePractice(
      signal,
      deriveSeed(state.sessionSeed, "practice", signal),
    );
    return {
      kind: "practice",
      signal,
      item,
      firstDomain: signal === state.order[0],
    };
  }
  return { kind: "item", action };
}
