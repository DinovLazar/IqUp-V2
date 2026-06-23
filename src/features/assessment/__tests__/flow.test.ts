/**
 * Flow-controller tests (Phase 1.06). The running phase is pure logic on top of
 * the 1.05 engine, so driving it with the 1.05 `fixtures.ts` profiles must
 * reproduce the engine's own path exactly and deterministically — the DoD's
 * "same seed + age + response/timing script ⇒ same path + same captured data".
 */

import { describe, expect, it } from "vitest";
import { DOMAIN_ORDER } from "@/content/norms";
import type { Signal } from "@/features/tasks";
import {
  applyResponse,
  groupsCompleted,
  nextStep,
  sectionOfSignal,
  settle,
  startFlow,
  startSession,
  runSession,
  type SessionState,
} from "@/features/assessment";
import { correctFields, withTiming } from "@/features/assessment/tasks/view";
import {
  PROFILES,
  makeScript,
  type Profile,
} from "@/features/assessment/fixtures";

/** Drive the flow exactly as the screens do: practice → real → settle. */
function driveFlow(profile: Profile): {
  finalState: SessionState;
  practiceSignals: Signal[];
} {
  const script = makeScript(profile);
  let state = startFlow({ sessionSeed: profile.sessionSeed, age: profile.age });
  const shown = new Set<Signal>();
  const practiceSignals: Signal[] = [];

  for (let guard = 0; guard < 10_000; guard++) {
    const step = nextStep(state, shown);
    if (step.kind === "complete") {
      return { finalState: state, practiceSignals };
    }
    if (step.kind === "practice") {
      practiceSignals.push(step.signal);
      shown.add(step.signal);
      continue;
    }
    state = settle(applyResponse(state, script(step.action)));
  }
  throw new Error("driveFlow did not terminate");
}

describe("flow over the five fixture profiles", () => {
  for (const profile of PROFILES) {
    it(`${profile.label}: reproduces the engine path`, () => {
      const { finalState } = driveFlow(profile);
      const direct = runSession(
        startSession({ sessionSeed: profile.sessionSeed, age: profile.age }),
        makeScript(profile),
      );
      // The flow's response wiring must yield the exact same engine state.
      expect(finalState).toEqual(direct);
    });

    it(`${profile.label}: is deterministic`, () => {
      const a = driveFlow(profile);
      const b = driveFlow(profile);
      expect(a.finalState).toEqual(b.finalState);
      expect(a.practiceSignals).toEqual(b.practiceSignals);
    });

    it(`${profile.label}: one practice per task type, in administration order`, () => {
      const { practiceSignals, finalState } = driveFlow(profile);
      expect(practiceSignals).toEqual([...DOMAIN_ORDER]);
      expect(groupsCompleted(finalState)).toBe(5);
    });
  }
});

describe("flow driven by the UI response builders", () => {
  it("an all-correct session (via correctFields) completes deterministically", () => {
    const run = () => {
      let state = startFlow({ sessionSeed: "ui-correct", age: 10 });
      const shown = new Set<Signal>();
      for (let guard = 0; guard < 10_000; guard++) {
        const step = nextStep(state, shown);
        if (step.kind === "complete") return state;
        if (step.kind === "practice") {
          shown.add(step.signal);
          continue;
        }
        const response = withTiming(correctFields(step.action.item), {
          elapsedMs: 4_000,
        });
        state = settle(applyResponse(state, response));
      }
      throw new Error("did not terminate");
    };
    const a = run();
    const b = run();
    expect(a).toEqual(b);
    expect(groupsCompleted(a)).toBe(5);
  });
});

describe("section mapping", () => {
  it("maps each signal to one of the 5 sections", () => {
    for (const signal of DOMAIN_ORDER) {
      const s = sectionOfSignal(signal);
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(5);
    }
  });
});
