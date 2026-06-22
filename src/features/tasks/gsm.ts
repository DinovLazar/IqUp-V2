/**
 * Gsm — Memory (Corsi span). A fixed 6-tile board; a sequence of tiles flashes
 * (700 ms each — a render concern, recorded as metadata), then the child taps it
 * back (in order, or reversed for `backward`). Spec A.3, Дел 4, Прилог B.1.
 *
 * The CALLER supplies `length` and `direction`. The +1/−1 span growth and the
 * "backward from age 8" rule are adaptive logic and belong to Phase 1.05 — not
 * here. When called via the level table, length defaults to the level's row.
 */

import {
  GSM_PRESENTATION_MS,
  GSM_TILE_COUNT,
  gsmLevel,
} from "@/content/tasks/levels";
import { intInRange, makeRng, type Rng } from "@/lib/prng";
import { makeBase } from "./shared";
import type { CorsiDirection, GsmItem, Point } from "./types";

/**
 * The fixed Corsi board: 6 tiles scattered on a 0–100 normalized grid so no
 * three are collinear (the classic irregular layout). Identical for every item.
 */
const TILE_POSITIONS: readonly Point[] = [
  { x: 18, y: 22 },
  { x: 72, y: 16 },
  { x: 42, y: 46 },
  { x: 86, y: 58 },
  { x: 22, y: 74 },
  { x: 64, y: 88 },
];

/** Build a tile sequence of `length`, never flashing the same tile twice in a row. */
function buildSequence(rng: Rng, length: number): number[] {
  const seq: number[] = [];
  let prev = -1;
  for (let i = 0; i < length; i++) {
    let tile = intInRange(rng, 0, GSM_TILE_COUNT - 1);
    // Avoid an immediate repeat (poor UX and ambiguous to tap back).
    while (tile === prev) tile = intInRange(rng, 0, GSM_TILE_COUNT - 1);
    seq.push(tile);
    prev = tile;
  }
  return seq;
}

/**
 * Generate a Gsm item.
 * @param opts.length    sequence length (default: the level table's row)
 * @param opts.direction "forward" (default) or "backward"
 */
export function generate(
  level: number,
  seed: string,
  opts?: { length?: number; direction?: CorsiDirection },
): GsmItem {
  const length = Math.max(1, opts?.length ?? gsmLevel(level).length);
  const direction: CorsiDirection = opts?.direction ?? "forward";
  const rng = makeRng(seed);

  const sequence = buildSequence(rng, length);
  const answer =
    direction === "backward" ? sequence.slice().reverse() : sequence.slice();

  return {
    ...makeBase("gsm", level, seed),
    stimulus: { tiles: TILE_POSITIONS.slice(), sequence, direction },
    answer,
    meta: { direction, presentationMs: GSM_PRESENTATION_MS },
  };
}
