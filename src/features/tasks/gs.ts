/**
 * Gs — Processing speed (symbol search), calibration v2. FIXED-BY-AGE (the
 * speeded exception: no staircase, no basal): the per-age parameter row
 * (GS_BY_AGE) sizes the grid, the target:distractor density, the distractor-
 * similarity tier and the visible window; the engine administers 1 practice +
 * 2 scored rounds (round 2 = a fresh layout over the same parameters and the
 * SAME target symbols, via the shared `targetSeed`).
 *
 * Similarity tiers are generator-real (v2 §4): symbol ids encode a FAMILY and a
 * VARIANT — tier 1 distractors are base variants of unrelated families, tier 2
 * are rotations/reflections of the target glyph, tier 3 are near-miss one-
 * detail variants. The renderer decodes family+variant into the two parametric
 * symbol families' transforms.
 *
 * We emit only the grid + the answer key (target cell indices). The visible
 * timer and the (correct − 0.5·errors)/time score live downstream.
 */

import {
  clampTaskAge,
  gsColumns,
  gsForAge,
  type GsSimilarityTier,
} from "@/content/tasks/levels";
import { makeRng, pick, pickN, type Rng } from "@/lib/prng";
import { makeBase } from "./shared";
import type { GsItem } from "./types";

/** Symbol-id scheme: id = family · GS_VARIANTS + variant. */
export const GS_FAMILY_COUNT = 6;
export const GS_VARIANTS = 6;
/** Variant indices within a family. */
export const GS_VARIANT = {
  base: 0,
  rot90: 1,
  rot180: 2,
  reflect: 3,
  detailA: 4,
  detailB: 5,
} as const;

export const gsSymbolFamily = (id: number): number =>
  Math.floor(id / GS_VARIANTS) % GS_FAMILY_COUNT;
export const gsSymbolVariant = (id: number): number => id % GS_VARIANTS;
const symbolId = (family: number, variant: number): number =>
  family * GS_VARIANTS + variant;

/** The distractor ids a similarity tier draws on, given the target families. */
function tierPool(tier: GsSimilarityTier, targetFamilies: number[]): number[] {
  const targets = new Set(targetFamilies);
  if (tier === 1) {
    // Unrelated: base variants of non-target families.
    const out: number[] = [];
    for (let f = 0; f < GS_FAMILY_COUNT; f++) {
      if (!targets.has(f)) out.push(symbolId(f, GS_VARIANT.base));
    }
    return out;
  }
  if (tier === 2) {
    // Rotations/reflections of the target glyph(s).
    return targetFamilies.flatMap((f) => [
      symbolId(f, GS_VARIANT.rot90),
      symbolId(f, GS_VARIANT.rot180),
      symbolId(f, GS_VARIANT.reflect),
    ]);
  }
  // Tier 3: near-miss one-detail variants of the target glyph(s).
  return targetFamilies.flatMap((f) => [
    symbolId(f, GS_VARIANT.detailA),
    symbolId(f, GS_VARIANT.detailB),
  ]);
}

/** Choose a symbol id for each cell, then read the answer key off the grid. */
function fillGrid(
  rng: Rng,
  cellCount: number,
  targets: number[],
  distractors: number[],
  targetCellCount: number,
): { cells: number[]; answer: number[] } {
  const targetCells = new Set(
    pickN(
      rng,
      Array.from({ length: cellCount }, (_, i) => i),
      targetCellCount,
    ),
  );
  const cells: number[] = [];
  for (let i = 0; i < cellCount; i++) {
    cells.push(
      targetCells.has(i) ? pick(rng, targets) : pick(rng, distractors),
    );
  }
  // Derive the key from the grid itself (the real answer = every target cell).
  const targetSet = new Set(targets);
  const answer = cells
    .map((sym, i) => (targetSet.has(sym) ? i : -1))
    .filter((i) => i >= 0);
  return { cells, answer };
}

/**
 * Generate a Gs item. `opts.age` selects the per-age parameter row (fallback:
 * the age-pegged nominal level, age = level + 4); `opts.targetSeed` keeps the
 * target symbols identical across the two scored rounds.
 */
export function generate(
  level: number,
  seed: string,
  opts?: { age?: number; targetSeed?: string },
): GsItem {
  const age = clampTaskAge(opts?.age ?? level + 4);
  const cfg = gsForAge(age);
  const rng = makeRng(seed);

  // Targets from the round-independent seed so both rounds hunt the same glyphs.
  const targetRng = makeRng(opts?.targetSeed ?? `${seed}|gs-targets`);
  const families = Array.from({ length: GS_FAMILY_COUNT }, (_, f) => f);
  const targetFamilies = pickN(targetRng, families, cfg.targetSymbolCount);
  const targets = targetFamilies.map((f) => symbolId(f, GS_VARIANT.base));

  // Distractor pool from the tier range (a mixed range draws on both tiers).
  const [tMin, tMax] = cfg.similarity;
  const pool: number[] = [];
  for (let t = tMin; t <= tMax; t++) {
    pool.push(...tierPool(t as GsSimilarityTier, targetFamilies));
  }

  const targetCellCount = Math.min(
    cfg.cellCount - 1,
    Math.max(1, Math.round(cfg.cellCount / (1 + cfg.distractorsPerTarget))),
  );
  const { cells, answer } = fillGrid(
    rng,
    cfg.cellCount,
    targets,
    pool,
    targetCellCount,
  );

  return {
    ...makeBase("gs", level, seed),
    stimulus: {
      cellCount: cfg.cellCount,
      columns: gsColumns(age),
      cells,
      targets,
    },
    answer,
    meta: {
      windowSec: cfg.windowSec,
      hasVisibleTimer: true,
      similarity: cfg.similarity,
    },
  };
}
