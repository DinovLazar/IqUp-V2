/**
 * Phase 3.01 — repeat-test new-set generation (spec Дел 14.2). A repeat derives a
 * FRESH session seed from the stored one, so the SAME child never re-sees the same
 * questions. Proven at the engine level: same seed ⇒ same administered item set
 * (determinism), repeat seed ⇒ a disjoint item set (freshness).
 */

import { describe, expect, it } from "vitest";
import {
  nextAction,
  runSession,
  startFlow,
  startSession,
  type SessionState,
} from "@/features/assessment";
import { correctResponse } from "@/features/assessment/fixtures";
import { nextRepeatSeed, sessionSeedFor } from "../repeat";
import { buildStoredProfile } from "../summary";
import { scoreProfile, flatTypical } from "@/features/assessment/fixtures";

/** Every administered item's seed across a whole scored session, in order. */
function administeredSeeds(sessionSeed: string, age = 9): string[] {
  const final: SessionState = runSession(
    startSession({ sessionSeed, age }),
    correctResponse,
  );
  const seeds: string[] = [];
  for (const signal of final.order) {
    // v2 domains are either `laddered` or `gs`; both carry an `items` list (Gsm
    // is laddered now, its rows carry direction), so one walk covers them all.
    const d = final.domains[signal];
    seeds.push(...d.items.map((i) => i.itemSeed));
  }
  return seeds;
}

const priorProfile = buildStoredProfile(scoreProfile(flatTypical), {
  setSeed: "child-run-1",
  attempt: 1,
});

describe("repeat seed derivation (Дел 14.2)", () => {
  it("is deterministic — same prior ⇒ same next seed", () => {
    expect(nextRepeatSeed(priorProfile)).toBe(nextRepeatSeed(priorProfile));
  });

  it("the next seed differs from the one it came from", () => {
    expect(nextRepeatSeed(priorProfile)).not.toBe(priorProfile.setSeed);
  });

  it("sessionSeedFor: first run keeps the fresh seed; a repeat derives + increments", () => {
    expect(sessionSeedFor(null, "fresh")).toEqual({
      setSeed: "fresh",
      attempt: 1,
    });
    expect(sessionSeedFor(priorProfile, "ignored")).toEqual({
      setSeed: nextRepeatSeed(priorProfile),
      attempt: 2,
    });
  });
});

describe("determinism + freshness at the engine level", () => {
  it("same seed ⇒ identical administered item set (determinism)", () => {
    expect(administeredSeeds("child-run-1")).toEqual(
      administeredSeeds("child-run-1"),
    );
  });

  it("a repeat ⇒ a DISJOINT item set (no repeated items for the same child)", () => {
    const first = administeredSeeds(priorProfile.setSeed);
    const repeat = administeredSeeds(nextRepeatSeed(priorProfile));
    expect(repeat).not.toEqual(first);
    // no seed appears in both runs ⇒ no item is re-shown
    const overlap = repeat.filter((s) => first.includes(s));
    expect(overlap).toHaveLength(0);
    expect(first.length).toBeGreaterThan(0);
  });

  it("the first administered item's CONTENT differs, not just its seed", () => {
    // Peek the actual generated stimulus (not the seed string) so this proves the
    // QUESTIONS differ — not merely that the seed prefixes differ.
    const firstItem = (seed: string) => {
      const action = nextAction(startFlow({ sessionSeed: seed, age: 9 }));
      return action.kind === "administer" ? action.item : null;
    };
    const original = firstItem(priorProfile.setSeed);
    const repeat = firstItem(nextRepeatSeed(priorProfile));
    expect(original).not.toBeNull();
    expect(repeat).not.toEqual(original); // different stimulus, not just a different seed
  });
});
