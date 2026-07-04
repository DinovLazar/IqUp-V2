import { describe, expect, it } from "vitest";
import {
  CEILING_CONSECUTIVE_ERRORS,
  START_LEVELS,
  itemCap,
  startLevel,
  type LadderedSignal,
} from "@/content/norms";
import { GS_ROUNDS, MAX_LEVEL, gsForAge, gsmLevel } from "@/content/tasks";
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

const LADDERED: readonly LadderedSignal[] = [
  "gf",
  "gv",
  "gsm",
  "ef",
  "glr",
  "ct",
];

/** Run a session while recording every administer action. */
function recordRun(state: SessionState, base: ResponseScript) {
  const actions: AdministerAction[] = [];
  const final = runSession(state, (a) => {
    actions.push(a);
    return base(a);
  });
  return { final, actions };
}

describe("per-signal start levels (v2)", () => {
  it("every laddered domain starts at ITS OWN signal's table value", () => {
    for (const age of [5, 9, 13]) {
      const s = startSession({ sessionSeed: "a", age });
      for (const sig of LADDERED) {
        const d = s.domains[sig];
        expect(d.kind).toBe("laddered");
        if (d.kind === "laddered") {
          expect(d.level).toBe(startLevel(sig, age));
          expect(d.basalPhase).toBe(true);
          expect(d.basalCreditLevels).toEqual([]);
        }
      }
    }
    // The per-signal tables genuinely diverge (the reason the shared one died).
    expect(START_LEVELS.gf[13]).toBe(7);
    expect(START_LEVELS.ct[13]).toBe(9);
  });
});

describe("adaptive laddered path + basal (v2 §0)", () => {
  it("all-correct climbs to the top, credits below the start, and stops at the cap", () => {
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
    // First item correct at start 7 ⇒ basal credit for levels 1–6.
    expect(d.basalPhase).toBe(false);
    expect(d.basalCreditLevels).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("a wrong FIRST item demotes item-by-item with the ceiling SUSPENDED until the first correct (basal)", () => {
    // Age 13 Gf starts at 7; fail 7, 6, 5, then pass 4 → basal at 4, credits 1–3.
    let s = startSession({ sessionSeed: "basal", age: 13 });
    // Walk to the gf domain (it is first in DOMAIN_ORDER).
    const levels: number[] = [];
    for (let i = 0; i < 3; i++) {
      const a = nextAction(s);
      if (a.kind !== "administer" || a.signal !== "gf") throw new Error("gf");
      levels.push(a.level as number);
      s = applyResponse(s, wrongResponse(a));
    }
    expect(levels).toEqual([7, 6, 5]);
    const mid = s.domains.gf;
    if (mid.kind !== "laddered") throw new Error("laddered");
    // 3 consecutive errors — yet the domain is NOT done (basal suspends ceiling).
    expect(mid.consecutiveErrors).toBe(3);
    expect(mid.done).toBe(false);
    expect(mid.basalPhase).toBe(true);

    const a4 = nextAction(s);
    if (a4.kind !== "administer") throw new Error("administer");
    expect(a4.level).toBe(4);
    s = applyResponse(s, correctResponse(a4));
    const d = s.domains.gf;
    if (d.kind !== "laddered") throw new Error("laddered");
    expect(d.basalPhase).toBe(false);
    expect(d.basalCreditLevels).toEqual([1, 2, 3]); // credited below first-correct
    expect(d.level).toBe(5); // staircase resumes upward
    expect(d.consecutiveErrors).toBe(0);
  });

  it("after the basal is established, 2 consecutive errors end the domain (ceiling restored)", () => {
    let s = startSession({ sessionSeed: "post-basal", age: 9 });
    const first = nextAction(s);
    if (first.kind !== "administer" || first.signal !== "gf")
      throw new Error("gf");
    s = applyResponse(s, correctResponse(first)); // basal established at start
    for (let i = 0; i < 2; i++) {
      const a = nextAction(s);
      if (a.kind !== "administer") throw new Error("administer");
      s = applyResponse(s, wrongResponse(a));
    }
    const d = s.domains.gf;
    if (d.kind !== "laddered") throw new Error("laddered");
    expect(d.consecutiveErrors).toBe(CEILING_CONSECUTIVE_ERRORS);
    expect(d.done).toBe(true);
  });

  it("a single mistap at an L1 start does NOT end the domain — the ceiling still needs 2 errors", () => {
    // Age 5 starts Gf at L1: wrong there ends the basal descent (nothing to
    // credit) but §0 sanctions only the 2-error ceiling / cap as terminations.
    let s = startSession({ sessionSeed: "floor", age: 5 });
    const first = nextAction(s);
    if (first.kind !== "administer" || first.signal !== "gf")
      throw new Error("gf");
    expect(first.level).toBe(1);
    s = applyResponse(s, wrongResponse(first));
    const afterOne = s.domains.gf;
    if (afterOne.kind !== "laddered") throw new Error("laddered");
    expect(afterOne.done).toBe(false); // one accidental mistap ≠ a floored index
    expect(afterOne.basalPhase).toBe(false);
    expect(afterOne.basalCreditLevels).toEqual([]);
    // A recovery at L1 climbs normally.
    const second = nextAction(s);
    if (second.kind !== "administer") throw new Error("administer");
    expect(second.level).toBe(1);
    s = applyResponse(s, correctResponse(second));
    const recovered = s.domains.gf;
    if (recovered.kind !== "laddered") throw new Error("laddered");
    expect(recovered.level).toBe(2);
    expect(recovered.done).toBe(false);
  });

  it("all-wrong floors out at L1 via the normal 2-error ceiling", () => {
    const { final } = recordRun(
      startSession({ sessionSeed: "floor", age: 5 }),
      wrongResponse,
    );
    const d = final.domains.gf;
    if (d.kind !== "laddered") throw new Error("expected laddered");
    expect(d.items.length).toBe(2); // wrong, wrong → ceiling
    expect(d.basalCreditLevels).toEqual([]);
    expect(d.level).toBe(1);
    expect(d.done).toBe(true);
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

describe("Gsm over the v2 ladder (direction-carrying rows)", () => {
  it("administers the row's length/direction/path and passes them to the generator", () => {
    const { actions } = recordRun(
      startSession({ sessionSeed: "gsm-ladder", age: 13 }),
      correctResponse,
    );
    const gsm = actions.filter((a) => a.signal === "gsm");
    // Age 13 starts Gsm at L6; each correct answer climbs one ladder row.
    let level = startLevel("gsm", 13);
    for (const a of gsm) {
      const row = gsmLevel(level);
      expect(a.spanLength).toBe(row.length);
      expect(a.direction).toBe(row.direction);
      if (a.item.signal !== "gsm") throw new Error("expected gsm item");
      expect(a.item.stimulus.sequence.length).toBe(row.length);
      expect(a.item.stimulus.direction).toBe(row.direction);
      expect(a.item.stimulus.path).toBe(row.path);
      level = Math.min(MAX_LEVEL, level + 1);
    }
  });

  it("a child under 8 is NEVER administered a backward item (substitution)", () => {
    for (const age of [5, 6, 7]) {
      const { actions } = recordRun(
        startSession({ sessionSeed: `young-${age}`, age }),
        correctResponse,
      );
      const gsm = actions.filter((a) => a.signal === "gsm");
      expect(gsm.length).toBeGreaterThan(0);
      for (const a of gsm) {
        expect(a.direction).toBe("forward");
        if (a.item.signal === "gsm") {
          expect(a.item.stimulus.direction).toBe("forward");
        }
      }
    }
  });

  it("from age 8 the ladder's backward rows are served backward", () => {
    const { actions } = recordRun(
      startSession({ sessionSeed: "bwd", age: 13 }),
      correctResponse,
    );
    // Start L6 (5 fwd) → L7 (5 bwd) on the first correct.
    const dirs = actions
      .filter((a) => a.signal === "gsm")
      .map((a) => a.direction);
    expect(dirs).toContain("backward");
  });
});

describe("Gs — fixed 2 scored rounds, no staircase (v2 §4)", () => {
  it("administers exactly GS_ROUNDS rounds with the per-age parameters and the same targets", () => {
    for (const age of [5, 9, 13]) {
      const { final, actions } = recordRun(
        startSession({ sessionSeed: `gs-${age}`, age }),
        correctResponse,
      );
      const gs = actions.filter((a) => a.signal === "gs");
      expect(gs.length).toBe(GS_ROUNDS);
      const cfg = gsForAge(age);
      const targetSets = gs.map((a) => {
        if (a.item.signal !== "gs") throw new Error("expected gs item");
        expect(a.item.stimulus.cellCount).toBe(cfg.cellCount);
        expect(a.item.meta.windowSec).toBe(cfg.windowSec);
        return a.item.stimulus.targets.join(",");
      });
      // Round 2 = fresh layout, SAME target symbols.
      expect(new Set(targetSets).size).toBe(1);
      const layouts = gs.map((a) =>
        a.item.signal === "gs" ? a.item.stimulus.cells.join(",") : "",
      );
      expect(new Set(layouts).size).toBe(GS_ROUNDS);
      const d = final.domains.gs;
      expect(d.kind).toBe("gs");
      if (d.kind === "gs") expect(d.items.length).toBe(GS_ROUNDS);
    }
  });

  it("wrong answers do NOT shorten or ladder the Gs administration", () => {
    const { actions } = recordRun(
      startSession({ sessionSeed: "gs-wrong", age: 9 }),
      wrongResponse,
    );
    expect(actions.filter((a) => a.signal === "gs").length).toBe(GS_ROUNDS);
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
