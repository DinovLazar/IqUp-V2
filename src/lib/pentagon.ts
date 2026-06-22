/**
 * Pentagon (radar) geometry — pure, framework-agnostic, dependency-free.
 *
 * This module owns ALL the pentagon math so the web SVG component (1.03) and the
 * @react-pdf report component (1.09) render the identical shape from the same
 * function — "same numbers in, same shape out" (handover §3). It uses only plain
 * numbers and {x,y} points; it must never import React, the DOM, or CSS.
 *
 * Convention (handover §3):
 *   angle(i)   = (-90 + i·72)°            // i = 0..4, vertex 0 at top, clockwise
 *   vertex(i)  = (cx + R·cos, cy + R·sin)
 *   profile(i) = (cx + R·(vᵢ/100)·cos, cy + R·(vᵢ/100)·sin)
 * Values are clamped to [6, 100] so a near-zero index still shows a visible vertex.
 */

export interface Point {
  x: number;
  y: number;
}

export const PENTAGON_SIDES = 5;
export const PROFILE_CLAMP_MIN = 6;
export const PROFILE_CLAMP_MAX = 100;

/** The five vertex angles in degrees: [-90, -18, 54, 126, 198]. */
export function pentagonAngles(sides: number = PENTAGON_SIDES): number[] {
  return Array.from({ length: sides }, (_, i) => -90 + (i * 360) / sides);
}

function polar(cx: number, cy: number, r: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** The five outer vertices at radius R. */
export function pentagonVertices(cx: number, cy: number, r: number): Point[] {
  return pentagonAngles().map((a) => polar(cx, cy, r, a));
}

/** Clamp a raw 0–100 index value into the renderable range. */
export function clampValue(
  v: number,
  min: number = PROFILE_CLAMP_MIN,
  max: number = PROFILE_CLAMP_MAX,
): number {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}

/**
 * The profile polygon points for `values` (0–100, in canonical index order).
 * Each value is clamped to [6, 100] before projection.
 */
export function pentagonProfilePoints(
  values: number[],
  cx: number,
  cy: number,
  r: number,
): Point[] {
  return pentagonAngles().map((a, i) => {
    const v = clampValue(values[i] ?? 0);
    return polar(cx, cy, r * (v / 100), a);
  });
}

/**
 * Concentric grid rings (default 0.33 / 0.66 / 1.0 · R). Each ring is the five
 * points of a pentagon at that radius — draw as a closed polygon.
 */
export function pentagonRings(
  cx: number,
  cy: number,
  r: number,
  ratios: number[] = [0.33, 0.66, 1],
): Point[][] {
  return ratios.map((ratio) =>
    pentagonAngles().map((a) => polar(cx, cy, r * ratio, a)),
  );
}

/** The five spokes from center to each outer vertex. */
export function pentagonSpokes(
  cx: number,
  cy: number,
  r: number,
): [Point, Point][] {
  return pentagonVertices(cx, cy, r).map((v) => [{ x: cx, y: cy }, v]);
}

/**
 * Outer points for placing vertex labels, pushed past the vertices (default
 * 1.34 · R) so the index name + color dot sit clear of the shape.
 */
export function pentagonLabelPoints(
  cx: number,
  cy: number,
  r: number,
  factor = 1.34,
): Point[] {
  return pentagonAngles().map((a) => polar(cx, cy, r * factor, a));
}

/** Format a point list into an SVG `points` attribute string ("x,y x,y …"). */
export function pointsToAttr(points: Point[]): string {
  return points.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
