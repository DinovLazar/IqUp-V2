/**
 * Gs — Processing speed (symbol search). A grid of cells drawn from a small
 * symbol set; the child taps every cell holding a target symbol within a visible
 * 20–25 s window. Spec A.4, Дел 4, Дел 8.
 *
 * We emit only the grid + the answer key (target cell indices). The visible
 * timer and the (correct − 0.5·errors)/time score are Phase 1.06 / 1.05.
 */

import { GS_COLUMNS, GS_WINDOW_SEC, gsLevel } from "@/content/tasks/levels";
import { makeRng, pick, pickN, type Rng } from "@/lib/prng";
import { makeBase } from "./shared";
import type { GsItem } from "./types";

/** Choose a symbol id for each cell, then read the answer key off the grid. */
function fillGrid(
  rng: Rng,
  cellCount: number,
  targets: number[],
  distractors: number[],
  targetCellCount: number,
): { cells: number[]; answer: number[] } {
  // Pick which cells are targets, then fill the rest from the distractor pool.
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

export function generate(level: number, seed: string): GsItem {
  const cfg = gsLevel(level);
  const rng = makeRng(seed);

  const symbols = Array.from({ length: cfg.symbolSetSize }, (_, i) => i);
  const targets = pickN(rng, symbols, cfg.targetSymbolCount);
  const targetSet = new Set(targets);
  const distractors = symbols.filter((s) => !targetSet.has(s));

  const targetCellCount = Math.min(
    cfg.cellCount - 1,
    Math.max(1, Math.round(cfg.cellCount * cfg.targetDensity)),
  );
  const { cells, answer } = fillGrid(
    rng,
    cfg.cellCount,
    targets,
    distractors,
    targetCellCount,
  );

  return {
    ...makeBase("gs", level, seed),
    stimulus: {
      cellCount: cfg.cellCount,
      columns: GS_COLUMNS,
      cells,
      targets,
    },
    answer,
    meta: {
      windowSec: GS_WINDOW_SEC,
      hasVisibleTimer: true,
      similarity: cfg.similarity,
    },
  };
}
