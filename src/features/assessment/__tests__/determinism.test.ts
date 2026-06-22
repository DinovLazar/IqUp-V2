import { describe, expect, it } from "vitest";
import { finalize } from "@/features/scoring";
import { runSession, startSession } from "../engine";
import {
  PROFILES,
  ceilingProfile,
  logicStrong,
  makeScript,
  scoreProfile,
} from "../fixtures";

describe("determinism — same seed + age + script ⇒ deep-equal result", () => {
  it("every canonical profile re-scores deep-equal", () => {
    for (const p of PROFILES) {
      expect(scoreProfile(p)).toEqual(scoreProfile(p));
    }
  });

  it("a hand-run session is reproducible end-to-end", () => {
    const run = () =>
      finalize(
        runSession(
          startSession({ sessionSeed: "repeat-42", age: 11 }),
          makeScript({ ...logicStrong, sessionSeed: "repeat-42", age: 11 }),
        ),
      );
    expect(run()).toEqual(run());
  });

  it("finalize is pure — same final state ⇒ deep-equal result", () => {
    const state = runSession(
      startSession({
        sessionSeed: ceilingProfile.sessionSeed,
        age: ceilingProfile.age,
      }),
      makeScript(ceilingProfile),
    );
    expect(finalize(state)).toEqual(finalize(state));
  });

  it("age changes the path (start levels, caps, span expectations) and the result", () => {
    const young = scoreProfile({ ...logicStrong, age: 6 });
    const old = scoreProfile({ ...logicStrong, age: 13 });
    expect(young).not.toEqual(old);
    expect(young.meta.age).toBe(6);
    expect(old.meta.age).toBe(13);
  });
});
