/**
 * Glr — Learning (paired-associate), calibration v2. Show K cue↔target pairs to
 * study, then a recall round keyed to that study set — administered
 * `meta.trials` times (2 or 3 study→recall rounds, from the ladder row, which
 * absorbs the old GLR_ROUNDS_BY_AGE).
 *
 * v2 symbol styles (KABC-II Atlantis/Rebus tradition):
 *   • pictorial — nameable-object glyphs on both sides (ages ≤ ~8 levels);
 *   • mixed     — pictorial cue ↔ abstract target;
 *   • abstract  — abstract glyphs on both sides.
 *
 * Distinctiveness guard: no two glyphs in one item set may be rotations or
 * reflections of each other — the conflict groups below mirror the renderer's
 * glyph geometry, and selection skips conflicting ids (tested).
 */

import { clampOptionCount, glrLevel } from "@/content/tasks/levels";
import { makeRng, pickN, shuffle, type Rng } from "@/lib/prng";
import { makeBase } from "./shared";
import type { GlrItem, GlrPair, GlrTrial } from "./types";

// ── Symbol pools (ids decode in the renderer's glyph sets) ────────────────────

/** Pictorial nameable objects (sun, house, fish, star, leaf, key, boat, bell,
 * flower, moon, cloud, cup) — ids 0..11. Cues draw 0–5, targets 6–11 so the
 * two sides of a pictorial pair never collide. */
export const GLR_PICTORIAL_CUES: readonly number[] = [0, 1, 2, 3, 4, 5];
export const GLR_PICTORIAL_TARGETS: readonly number[] = [6, 7, 8, 9, 10, 11];
export const GLR_PICTORIAL_ALL: readonly number[] = Array.from(
  { length: 12 },
  (_, i) => i,
);

/** Abstract target glyphs — ids 100..119. */
export const GLR_ABSTRACT_TARGETS: readonly number[] = Array.from(
  { length: 20 },
  (_, i) => 100 + i,
);
/** Abstract cue glyphs — ids 200..219 (a visually distinct second family). */
export const GLR_ABSTRACT_CUES: readonly number[] = Array.from(
  { length: 20 },
  (_, i) => 200 + i,
);

/**
 * Conflict groups: ids within one group are rotations/reflections of each other
 * in the renderer's glyph geometry (e.g. plus↔cross-diagonal, chevron pairs,
 * S↔Z curves). The generator never puts two ids from one group in a single
 * item; the guard is asserted by the distinctiveness test.
 */
export const GLR_CONFLICT_GROUPS: readonly (readonly number[])[] = [
  [103, 104], // plus ↔ × (target set)
  [110, 111], // chevron-right ↔ chevron-left
  [114, 115], // S-curve ↔ Z-curve
  [203, 204], // the cue set shares the body geometry → same pairs
  [210, 211],
  [214, 215],
];

const conflictGroupOf = (id: number): readonly number[] | undefined =>
  GLR_CONFLICT_GROUPS.find((g) => g.includes(id));

/** Pick `k` ids from a pool, skipping any id that conflicts with a picked one. */
function pickDistinct(rng: Rng, pool: readonly number[], k: number): number[] {
  const order = shuffle(rng, pool);
  const out: number[] = [];
  const blocked = new Set<number>();
  for (const id of order) {
    if (out.length >= k) break;
    if (blocked.has(id)) continue;
    out.push(id);
    const group = conflictGroupOf(id);
    if (group) for (const g of group) blocked.add(g);
  }
  return out;
}

export function generate(
  level: number,
  seed: string,
  opts?: { age?: number },
): GlrItem {
  const cfg = glrLevel(level);
  const k = cfg.pairs;
  const rng = makeRng(seed);

  let cues: number[];
  let targets: number[];
  if (cfg.symbolStyle === "pictorial") {
    cues = pickN(
      rng,
      GLR_PICTORIAL_CUES,
      Math.min(k, GLR_PICTORIAL_CUES.length),
    );
    targets = pickN(
      rng,
      GLR_PICTORIAL_TARGETS,
      Math.min(k, GLR_PICTORIAL_TARGETS.length),
    );
  } else if (cfg.symbolStyle === "mixed") {
    cues = pickN(rng, GLR_PICTORIAL_ALL, Math.min(k, GLR_PICTORIAL_ALL.length));
    targets = pickDistinct(rng, GLR_ABSTRACT_TARGETS, k);
  } else {
    cues = pickDistinct(rng, GLR_ABSTRACT_CUES, k);
    targets = pickDistinct(rng, GLR_ABSTRACT_TARGETS, k);
  }

  const pairs: GlrPair[] = cues.map((cue, i) => ({ cue, target: targets[i] }));

  // One recall round: shuffled cue order; per-trial options are the correct
  // target + fillers from the study set, clamped to the age's UX maximum.
  const optionsPerTrial = Math.min(
    targets.length,
    clampOptionCount(targets.length, opts?.age),
  );
  const recallOrder = shuffle(rng, pairs);
  const trials: GlrTrial[] = recallOrder.map((pair) => {
    const fillers = pickN(
      rng,
      targets.filter((t) => t !== pair.target),
      optionsPerTrial - 1,
    );
    const options = shuffle(rng, [pair.target, ...fillers]);
    return { cue: pair.cue, options, correct: options.indexOf(pair.target) };
  });
  const answer = trials.map((t) => t.correct);

  return {
    ...makeBase("glr", level, seed),
    stimulus: { pairs, trials },
    answer,
    meta: {
      pairCount: pairs.length,
      trials: cfg.trials,
      symbolStyle: cfg.symbolStyle,
    },
  };
}
