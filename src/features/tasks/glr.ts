/**
 * Glr — Learning (paired-associate). Show K symbol↔symbol pairs to study, then a
 * recall round keyed to that study set. Spec A.6, Дел 4.
 *
 * The "2–3 trials + learning slope" is flow/scoring (1.06 / 1.05). Here we
 * produce ONE recall round: each cue is shown with all K targets as options, and
 * the answer key marks the correct target per trial.
 */

import { glrLevel } from "@/content/tasks/levels";
import { makeRng, pickN, shuffle } from "@/lib/prng";
import { makeBase } from "./shared";
import type { GlrItem, GlrPair, GlrTrial } from "./types";

/** Disjoint symbol pools: cues are shapes, targets a different icon family. */
const CUE_POOL = Array.from({ length: 10 }, (_, i) => i); // 0..9
const TARGET_POOL = Array.from({ length: 10 }, (_, i) => 100 + i); // 100..109

export function generate(level: number, seed: string): GlrItem {
  const k = glrLevel(level).pairs;
  const rng = makeRng(seed);

  const cues = pickN(rng, CUE_POOL, k);
  const targets = pickN(rng, TARGET_POOL, k);
  const pairs: GlrPair[] = cues.map((cue, i) => ({ cue, target: targets[i] }));

  // Recall round: shuffle the order of cues; each trial offers all K targets.
  const studyOrder = shuffle(rng, pairs);
  const trials: GlrTrial[] = studyOrder.map((pair) => {
    const options = shuffle(rng, targets);
    return { cue: pair.cue, options, correct: options.indexOf(pair.target) };
  });
  const answer = trials.map((t) => t.correct);

  return {
    ...makeBase("glr", level, seed),
    stimulus: { pairs, trials },
    answer,
    meta: { pairCount: k },
  };
}
