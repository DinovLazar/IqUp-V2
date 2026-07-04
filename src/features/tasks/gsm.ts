/**
 * Gsm — Memory (Corsi span), calibration v2. A canonical 9-tile board (fixed,
 * irregular, non-grid — the standard Corsi layout) from age 7, the simplified
 * 6-tile board for ages 5–6. A sequence of tiles flashes (700 ms highlight +
 * 400 ms ISI — render concerns, recorded as metadata), then the child taps it
 * back (in order, or reversed for `backward`).
 *
 * The v2 ladder row supplies length + direction + path; `crisscross` paths
 * force consecutive flashes onto non-adjacent tiles (a validated difficulty
 * lever independent of length). The under-8 backward→forward+crisscross
 * substitution lives in the level lookup (`gsmLevelForAge`), applied by the
 * engine — the CALLER passes length/direction/path; the row is the fallback.
 */

import {
  GSM_ISI_MS,
  GSM_PRESENTATION_MS,
  GSM_TILE_COUNT_YOUNG,
  gsmLevelForAge,
  gsmTileCount,
  type GsmPathKind,
} from "@/content/tasks/levels";
import { intInRange, makeRng, type Rng } from "@/lib/prng";
import { makeBase } from "./shared";
import type { CorsiDirection, GsmItem, Point } from "./types";

/**
 * The simplified 6-tile board for ages 5–6 (kept from v1): tiles scattered on a
 * 0–100 normalized grid so no three are collinear.
 */
export const TILE_POSITIONS_YOUNG: readonly Point[] = [
  { x: 18, y: 22 },
  { x: 72, y: 16 },
  { x: 42, y: 46 },
  { x: 86, y: 58 },
  { x: 22, y: 74 },
  { x: 64, y: 88 },
];

/**
 * The canonical 9-tile Corsi board (v2, from age 7): ONE fixed, irregular,
 * non-grid layout used for every item — the standard Corsi arrangement.
 */
export const TILE_POSITIONS_STANDARD: readonly Point[] = [
  { x: 15, y: 15 },
  { x: 50, y: 10 },
  { x: 85, y: 20 },
  { x: 20, y: 45 },
  { x: 58, y: 42 },
  { x: 88, y: 55 },
  { x: 12, y: 78 },
  { x: 45, y: 85 },
  { x: 78, y: 82 },
];

/** Tiles closer than this (0–100 units) count as adjacent for crisscross paths. */
export const CRISSCROSS_MIN_DISTANCE = 40;

const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Build a tile sequence of `length`: never the same tile twice in a row, and on
 * a crisscross path consecutive tiles are additionally forced non-adjacent
 * (distance ≥ CRISSCROSS_MIN_DISTANCE).
 */
function buildSequence(
  rng: Rng,
  length: number,
  tiles: readonly Point[],
  path: GsmPathKind,
): number[] {
  const seq: number[] = [];
  let prev = -1;
  for (let i = 0; i < length; i++) {
    let tile = intInRange(rng, 0, tiles.length - 1);
    let guard = 0;
    const ok = (t: number): boolean => {
      if (t === prev) return false;
      if (path === "crisscross" && prev >= 0) {
        return dist(tiles[t], tiles[prev]) >= CRISSCROSS_MIN_DISTANCE;
      }
      return true;
    };
    while (!ok(tile) && guard++ < 60) {
      tile = intInRange(rng, 0, tiles.length - 1);
    }
    // Deterministic fallback: first tile satisfying the constraint.
    if (!ok(tile)) {
      for (let t = 0; t < tiles.length; t++) {
        if (ok(t)) {
          tile = t;
          break;
        }
      }
    }
    seq.push(tile);
    prev = tile;
  }
  return seq;
}

/**
 * Generate a Gsm item.
 * @param opts.age       drives the board size (6 tiles at 5–6, 9 from 7)
 * @param opts.length    sequence length (default: the level row)
 * @param opts.direction "forward" | "backward" (default: the level row,
 *                       under-8 substituted via gsmLevelForAge)
 * @param opts.path      "simple" | "crisscross" (default: the level row)
 */
export function generate(
  level: number,
  seed: string,
  opts?: {
    age?: number;
    length?: number;
    direction?: CorsiDirection;
    path?: GsmPathKind;
  },
): GsmItem {
  const row = gsmLevelForAge(level, opts?.age);
  const length = Math.max(1, opts?.length ?? row.length);
  const direction: CorsiDirection = opts?.direction ?? row.direction;
  const path: GsmPathKind = opts?.path ?? row.path;
  const tiles =
    gsmTileCount(opts?.age) === GSM_TILE_COUNT_YOUNG
      ? TILE_POSITIONS_YOUNG
      : TILE_POSITIONS_STANDARD;
  const rng = makeRng(seed);

  const sequence = buildSequence(rng, length, tiles, path);
  const answer =
    direction === "backward" ? sequence.slice().reverse() : sequence.slice();

  return {
    ...makeBase("gsm", level, seed),
    stimulus: { tiles: tiles.slice(), sequence, direction, path },
    answer,
    meta: {
      direction,
      path,
      presentationMs: GSM_PRESENTATION_MS,
      isiMs: GSM_ISI_MS,
    },
  };
}
