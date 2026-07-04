/**
 * Repeat-test new-set generation (spec Дел 14.2 / 2.4). On a repeat the SAME child
 * must get a NEW item set — never the questions they already saw — so a retake
 * measures growth, not memory. The engine already fans one session seed out into
 * per-item seeds via `deriveSeed`; here we derive a FRESH session seed from the
 * stored one so every domain/level yields different items.
 *
 * Pure + deterministic: the same stored profile always yields the same next seed
 * (so a resumed repeat is reproducible), and that seed is provably different from
 * the one it came from (so the set is fresh). No randomness, no clock.
 */

import { deriveSeed } from "@/lib/prng";
import type { StoredProfile } from "./schema";

/**
 * The session seed to use for the next attempt after `prior`. Distinct from
 * `prior.setSeed` by construction (a labelled child seed), so the whole item tree
 * regenerates fresh while staying reproducible for a given prior profile.
 */
export function nextRepeatSeed(prior: StoredProfile): string {
  return deriveSeed(prior.setSeed, "repeat", prior.attempt + 1);
}

/**
 * The seed + attempt for a session, given the prior on-device profile (or null on
 * a first-ever run). First run: the caller's fresh random seed, attempt 1. Repeat:
 * a derived fresh seed, attempt = prior + 1.
 */
export function sessionSeedFor(
  prior: StoredProfile | null,
  freshSeed: string,
): { setSeed: string; attempt: number } {
  if (!prior) return { setSeed: freshSeed, attempt: 1 };
  return { setSeed: nextRepeatSeed(prior), attempt: prior.attempt + 1 };
}
