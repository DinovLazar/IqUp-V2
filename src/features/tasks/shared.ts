/**
 * Shared, pure helpers for the generators: the common item-base builder and a
 * little coordinate geometry (rotation / reflection / point-set comparison) used
 * by the spatial and grid tasks. No randomness lives here — callers pass an Rng.
 */

import { TASK_BANK_VERSION } from "@/content/tasks";
import { clampLevel, difficultyWeight } from "@/content/tasks/levels";
import type { ItemBase, Point, Signal } from "./types";

/**
 * Build the fields every item shares (practice items are post-processed later).
 * Generic in the signal so the literal type ("gf", "ct", …) is preserved when
 * spread into a concrete item.
 */
export function makeBase<S extends Signal>(
  signal: S,
  level: number,
  seed: string,
): ItemBase & { signal: S } {
  const lvl = clampLevel(level);
  return {
    signal,
    level: lvl,
    seed,
    practice: false,
    difficultyWeight: difficultyWeight(lvl),
    taskBankVersion: TASK_BANK_VERSION,
  };
}

/** Round to a stable precision so float transforms compare cleanly. */
export function round(n: number, places = 3): number {
  const f = 10 ** places;
  // `+0` collapses the signed-zero (-0) that rotations can produce.
  return Math.round(n * f) / f + 0;
}

/** Rotate a point about the origin by `deg` degrees (clockwise on screen axes). */
export function rotatePoint(p: Point, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: round(p.x * cos - p.y * sin), y: round(p.x * sin + p.y * cos) };
}

/** Reflect a point across the vertical axis (x → −x): a chiral mirror. */
export function reflectPoint(p: Point): Point {
  return { x: round(-p.x), y: round(p.y) };
}

/** Centroid of a non-empty point list. */
export function centroid(points: Point[]): Point {
  const sx = points.reduce((a, p) => a + p.x, 0);
  const sy = points.reduce((a, p) => a + p.y, 0);
  return { x: sx / points.length, y: sy / points.length };
}

/** Translate a polygon so its centroid sits at the origin (for congruence checks). */
export function recenter(points: Point[]): Point[] {
  const c = centroid(points);
  return points.map((p) => ({ x: round(p.x - c.x), y: round(p.y - c.y) }));
}

/** Apply a reflect-then-rotate transform to a polygon. */
export function transformPolygon(
  points: Point[],
  reflect: boolean,
  rotateDeg: number,
): Point[] {
  const step1 = reflect ? points.map(reflectPoint) : points;
  return step1.map((p) => rotatePoint(p, rotateDeg));
}

/**
 * True if two polygons are the same shape regardless of vertex ordering and
 * absolute position — compare recentred, coordinate-sorted, rounded vertex sets.
 */
export function samePointSet(a: Point[], b: Point[]): boolean {
  if (a.length !== b.length) return false;
  const key = (pts: Point[]) =>
    recenter(pts)
      .map((p) => `${round(p.x)},${round(p.y)}`)
      .sort()
      .join(" ");
  return key(a) === key(b);
}
