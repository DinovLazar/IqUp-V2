import { describe, expect, it } from "vitest";
import {
  CEILING_CONSECUTIVE_ERRORS,
  EXPECTED_FORWARD_SPAN_BY_AGE,
  GSM_MIN_SPAN,
  START_LEVEL_BY_AGE,
  byAge,
  itemCap,
} from "@/content/norms";
import { MAX_LEVEL } from "@/content/tasks";
import {
  advanceDomain,
  applyResponse,
  nextAction,
  runSession,
  startSession,
  type ResponseScript,
} from "../engine";
import type { AdministerAction, SessionState } from "../types";
import {
  correctResponse,
  flatTypical,
  makeScript,
  wrongResponse,
} from "../fixtures";

const LADDERED = ["gf", "gv", "ef", "ct"] as const;

/** Run a session while recording every administer action. */
function recordRun(state: SessionState, base: ResponseScript) {
  const actions: AdministerAction[] = [];
  const final = runSession(state, (a) => {
    actions.push(a);
    return base(a);
  });
  return { final, actions };
}

describe("start levels by age (Дел 5 / Прилог A)", () => {
  it("age 5 starts every laddered domain at the table value", () => {
    const s = startSession({ sessionSeed: "a", age: 5 });
    for (const sig of LADDERED) {
      const d = s.domains[sig];
      expect(d.kind).toBe("laddered");
      if (d.kind === "laddered")
        expect(d.level).toBe(byAge(START_LEVEL_BY_AGE, 5));
    }
    expect(byAge(START_LEVEL_BY_AGE, 5)).toBe(1);
  });

  it("age 13 starts every laddered domain at the table value", () => {
    const s = startSession({ sessionSeed: "a", age: 13 });
    for (const sig of LADDERED) {
      const d = s.domains[sig];
      if (d.kind === "laddered")
        expect(d.level).toBe(byAge(START_LEVEL_BY_AGE, 13));
    }
    expect(byAge(START_LEVEL_BY_AGE, 13)).toBe(8);
  });
});

describe("adaptive laddered path (Дел 5)", () => {
  it("all-correct climbs to the top and terminates on the item cap", () => {
    const { final } = recordRun(
      startSession({ sessionSeed: "climb", age: 13 }),
      correctResponse,
    );
    const d = final.domains.gf;
    expect(d.kind).toBe("laddered");
    if (d.kind !== "laddered") return;
    expect(d.items.length).toBe(itemCap("gf", 13)); // hit the cap, not the ceiling rule
    expect(d.consecutiveErrors).toBe(0);
    expect(d.maxLevelCorrect).toBe(MAX_LEVEL);
    expect(d.level).toBe(MAX_LEVEL);
    expect(d.done).toBe(true);
  });

  it("all-wrong floors and terminates on the ceiling rule (2 consecutive errors)", () => {
    const { final } = recordRun(
      startSession({ sessionSeed: "floor", age: 5 }),
      wrongResponse,
    );
    const d = final.domains.gf;
    if (d.kind !== "laddered") throw new Error("expected laddered");
    expect(d.items.length).toBe(CEILING_CONSECUTIVE_ERRORS); // stopped before the cap
    expect(d.consecutiveErrors).toBe(CEILING_CONSECUTIVE_ERRORS);
    expect(d.level).toBe(1); // descended to / held at the floor
    expect(d.items.every((it) => !it.correct)).toBe(true);
  });

  it("a mixed (boundary) script stabilises and runs to the cap without a ceiling stop", () => {
    const { final } = recordRun(
      startSession({ sessionSeed: flatTypical.sessionSeed, age: 9 }),
      makeScript(flatTypical),
    );
    const d = final.domains.gf;
    if (d.kind !== "laddered") throw new Error("expected laddered");
    expect(d.items.length).toBe(itemCap("gf", 9));
    expect(d.consecutiveErrors).toBeLessThan(CEILING_CONSECUTIVE_ERRORS);
    const correct = d.items.filter((it) => it.correct).length;
    expect(correct).toBeGreaterThan(0);
    expect(correct).toBeLessThan(d.items.length); // genuinely mixed
  });
});

describe("span-adaptive Gsm (Дел 5 / Прилог B.1)", () => {
  it("+1 on correct from the age's expected span; passes length + direction to the generator", () => {
    const { actions } = recordRun(
      startSession({ sessionSeed: "gsm-up", age: 13 }),
      correctResponse,
    );
    const fwd = actions.filter(
      (a) => a.signal === "gsm" && a.direction === "forward",
    );
    const expected = byAge(EXPECTED_FORWARD_SPAN_BY_AGE, 13);
    expect(fwd[0].spanLength).toBe(expected);
    expect(fwd[1].spanLength).toBe(expected + 1);
    // length + direction reach the generator (item reflects them).
    for (const a of fwd) {
      if (a.item.signal !== "gsm") throw new Error("expected gsm item");
      expect(a.item.stimulus.sequence.length).toBe(a.spanLength);
      expect(a.item.stimulus.direction).toBe("forward");
      expect(a.item.meta.direction).toBe("forward");
    }
  });

  it("runs backward only from age 8, starting ≈ forward − 2", () => {
    const old = recordRun(
      startSession({ sessionSeed: "g", age: 13 }),
      correctResponse,
    );
    const back = old.actions.filter(
      (a) => a.signal === "gsm" && a.direction === "backward",
    );
    expect(back.length).toBeGreaterThan(0);
    expect(back[0].spanLength).toBe(
      Math.max(GSM_MIN_SPAN, byAge(EXPECTED_FORWARD_SPAN_BY_AGE, 13) - 2),
    );

    const young = recordRun(
      startSession({ sessionSeed: "g", age: 5 }),
      correctResponse,
    );
    expect(
      young.actions.some(
        (a) => a.signal === "gsm" && a.direction === "backward",
      ),
    ).toBe(false);
  });

  it("the consecutive-error ceiling ends each direction", () => {
    const { final } = recordRun(
      startSession({ sessionSeed: "g", age: 13 }),
      wrongResponse,
    );
    const d = final.domains.gsm;
    if (d.kind !== "span") throw new Error("expected span");
    expect(d.forward.length).toBe(CEILING_CONSECUTIVE_ERRORS);
    expect(d.backward.length).toBe(CEILING_CONSECUTIVE_ERRORS);
    expect(d.done).toBe(true);
  });
});

describe("driver + selector invariants", () => {
  it("nextAction is pure — it does not mutate state", () => {
    const s = startSession({ sessionSeed: "pure", age: 8 });
    const snapshot = JSON.stringify(s);
    nextAction(s);
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it("a session emits domainComplete for every domain in order, then completes", () => {
    let s = startSession({ sessionSeed: "walk", age: 10 });
    const completed: string[] = [];
    for (let i = 0; i < 5000; i++) {
      const a = nextAction(s);
      if (a.kind === "sessionComplete") break;
      if (a.kind === "domainComplete") {
        completed.push(a.signal);
        s = advanceDomain(s);
        continue;
      }
      s = applyResponse(s, correctResponse(a));
    }
    expect(completed).toEqual([...s.order]);
  });
});
