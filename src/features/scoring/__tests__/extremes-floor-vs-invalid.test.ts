/**
 * Phase 3.01 — extremes: a genuine FLOOR session must read differently from an
 * INVALID (fast/random masher) session (spec Дел 7.3 vs 7.1). A child who is
 * engaged and deliberate but gets everything wrong has hit the floor ("these were
 * too new for the moment") and STILL gets a confident, gently-framed profile; a
 * masher answering under the too-fast floor gets a `strong` verdict and the
 * graceful-retry branch with NO profile. The DISTINGUISHER is the validity verdict.
 */

import { describe, expect, it } from "vitest";
import {
  flatTypical,
  scoreProfile,
  strongInvalid,
  type Profile,
} from "@/features/assessment/fixtures";
import { assembleReport } from "@/features/report";

/** Engaged but struggling: deliberate timing (4 s), yet every answer is wrong. */
const engagedFloor: Profile = {
  ...flatTypical,
  label: "engaged-floor",
  age: 7,
  sessionSeed: "floor-engaged",
  ladder: { gf: 0, gv: 0, ef: 0, ct: 0 },
  gsmForward: 0,
  gsFoundFrac: 0,
  gsFalseTaps: 0,
  glrFinalFrac: 0,
  // NB: no forceFast, no gsMash — the timing is genuine, so this is NOT a masher.
};

describe("floor vs invalid — the validity verdict separates them (Дел 7.3 / 7.1)", () => {
  it("an engaged floor session is NOT strong and keeps its floor markers", () => {
    const r = scoreProfile(engagedFloor);
    expect(r.validity.session).not.toBe("strong");
    expect(r.signals.gf.floor).toBe(true);
    expect(r.indices.logic.floor).toBe(true);
    // floor ≠ ceiling
    expect(r.signals.gf.ceiling).toBe(false);
  });

  it("a masher IS strong — the verdict, not the score, is what differs", () => {
    const masher = scoreProfile(strongInvalid);
    expect(masher.validity.session).toBe("strong");
    // the two engaged-vs-masher sessions land on different verdicts
    expect(scoreProfile(engagedFloor).validity.session).not.toBe(
      masher.validity.session,
    );
  });

  it("report: the floor session gets a gentle profile; the masher gets retry", () => {
    const floorReport = assembleReport(scoreProfile(engagedFloor));
    expect(floorReport.variant).toBe("profile"); // a real, confident profile
    expect(floorReport.partA?.extreme?.kind).toBe("floor");
    expect(floorReport.validity.retry).toBe(false);

    const masherReport = assembleReport(scoreProfile(strongInvalid));
    expect(masherReport.variant).toBe("retry");
    expect(masherReport.partA).toBeNull(); // no confident profile at all
    expect(masherReport.validity.retry).toBe(true);
  });
});
