/**
 * Gv — Spatial. Two families (spec A.2, Дел 4):
 *   • rotation  — pick the option that is the prompt shape, just rotated. The
 *                 distractors are mirror images and a different shape, so exactly
 *                 ONE option is a pure rotation of the base.
 *   • oddOneOut — four shapes, three rotations of one base and one mirror; pick
 *                 the mirror (the one that "doesn't belong").
 *
 * The base is an asymmetric (chiral) polygon emitted as coordinate geometry, so
 * rotation is exact and it renders identically anywhere (handover §3 / spec A.2).
 * No image, no SVG — points only.
 */

import { gvLevel } from "@/content/tasks/levels";
import { deriveSeed, makeRng, pick, shuffle, type Rng } from "@/lib/prng";
import {
  makeBase,
  reflectPoint,
  rotatePoint,
  round,
  samePointSet,
  transformPolygon,
} from "./shared";
import type { GvItem, GvOption, Point } from "./types";

const ALL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

const rotateAll = (pts: Point[], deg: number): Point[] =>
  pts.map((p) => rotatePoint(p, deg));

/** Build an asymmetric polygon of `verts` vertices on a normalized grid. */
function makeShape(rng: Rng, verts: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < verts; i++) {
    const baseAngle = (i / verts) * 2 * Math.PI;
    // Keep vertices in angular order (jitter < half the slice) so the polygon
    // is simple, but vary radius freely to break all symmetry.
    const jitter = (rng() - 0.5) * ((2 * Math.PI) / verts) * 0.7;
    const ang = baseAngle + jitter;
    const radius = 0.4 + rng() * 0.6;
    pts.push({
      x: round(Math.cos(ang) * radius),
      y: round(Math.sin(ang) * radius),
    });
  }
  return pts;
}

/** A shape is chiral if its mirror equals no rotation of itself. */
function isChiral(shape: Point[]): boolean {
  const mirror = shape.map(reflectPoint);
  return !ALL_ANGLES.some((a) => samePointSet(mirror, rotateAll(shape, a)));
}

/** Generate a chiral base shape, re-seeding until one is found. */
function chiralShape(seed: string, verts: number): Point[] {
  for (let i = 0; i < 30; i++) {
    const shape = makeShape(makeRng(deriveSeed(seed, "shape", i)), verts);
    if (isChiral(shape)) return shape;
  }
  // Extremely unlikely fallback: an explicitly asymmetric "flag" polygon.
  return [
    { x: -0.6, y: -0.6 },
    { x: 0.6, y: -0.6 },
    { x: 0.6, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0.6 },
    { x: -0.6, y: 0.6 },
  ].slice(0, Math.max(4, verts));
}

/** True if `shape` is congruent (rotation or reflection) to `base`. */
function congruent(shape: Point[], base: Point[]): boolean {
  const mirror = base.map(reflectPoint);
  return ALL_ANGLES.some(
    (a) =>
      samePointSet(shape, rotateAll(base, a)) ||
      samePointSet(shape, rotateAll(mirror, a)),
  );
}

/** Distinct angles for distractors, avoiding the correct angle. */
function distractorAngles(rng: Rng, exclude: number, n: number): number[] {
  const pool = shuffle(
    rng,
    ALL_ANGLES.filter((a) => a !== exclude),
  );
  return pool.slice(0, n);
}

function option(
  base: Point[],
  shapeId: number,
  reflect: boolean,
  deg: number,
): GvOption {
  return {
    points: transformPolygon(base, reflect, deg),
    transform: { shapeId, reflect, rotateDeg: deg },
  };
}

/** Ensure all option polygons are visually distinct (guard against symmetry). */
function allDistinct(options: GvOption[]): boolean {
  for (let i = 0; i < options.length; i++)
    for (let j = i + 1; j < options.length; j++)
      if (samePointSet(options[i].points, options[j].points)) return false;
  return true;
}

function generateRotation(level: number, seed: string): GvItem {
  const cfg = gvLevel(level);
  const rng = makeRng(deriveSeed(seed, "gv-rot"));
  const base = chiralShape(deriveSeed(seed, "base0"), cfg.vertices);

  // A different shape for the "wrong shape" distractor.
  let other = chiralShape(deriveSeed(seed, "base1"), cfg.vertices);
  for (let i = 0; i < 10 && congruent(other, base); i++)
    other = chiralShape(deriveSeed(seed, "base1", i), cfg.vertices);

  let options: GvOption[] = [];
  let correctAngle = pick(rng, cfg.angles);
  for (let attempt = 0; attempt < 12; attempt++) {
    correctAngle = pick(rng, cfg.angles);
    const [mirrorA, otherA, mirrorB] = distractorAngles(rng, correctAngle, 3);
    options = [
      option(base, 0, false, correctAngle), // correct: pure rotation of base
      option(base, 0, true, mirrorA), // mirror (chiral → not a rotation)
      option(other, 1, false, otherA), // different shape
      option(base, 0, true, mirrorB), // mirror at another angle
    ];
    if (allDistinct(options)) break;
  }

  const correct = options[0];
  const shuffled = shuffle(rng, options);
  const answer = shuffled.indexOf(correct);

  return {
    ...makeBase("gv", level, seed),
    stimulus: { family: "rotation", base },
    options: shuffled,
    answer,
    meta: { family: "rotation", correctAngle },
  };
}

function generateOddOneOut(level: number, seed: string): GvItem {
  const cfg = gvLevel(level);
  const rng = makeRng(deriveSeed(seed, "gv-odd"));
  const base = chiralShape(deriveSeed(seed, "base0"), cfg.vertices);

  let options: GvOption[] = [];
  for (let attempt = 0; attempt < 12; attempt++) {
    const angles = shuffle(rng, ALL_ANGLES).slice(0, 4);
    options = [
      option(base, 0, false, angles[0]), // rotation
      option(base, 0, false, angles[1]), // rotation
      option(base, 0, false, angles[2]), // rotation
      option(base, 0, true, angles[3]), // the odd one (mirror)
    ];
    if (allDistinct(options)) break;
  }

  const odd = options[3];
  const shuffled = shuffle(rng, options);
  const answer = shuffled.indexOf(odd);

  return {
    ...makeBase("gv", level, seed),
    stimulus: { family: "oddOneOut", base },
    options: shuffled,
    answer,
    meta: { family: "oddOneOut" },
  };
}

/**
 * Generate a Gv item. Family is chosen deterministically from the seed unless
 * `opts.family` ("rotation" | "oddOneOut") forces one.
 */
export function generate(
  level: number,
  seed: string,
  opts?: { family?: string },
): GvItem {
  const family =
    opts?.family ??
    (makeRng(`${seed}|gv-family`)() < 0.5 ? "rotation" : "oddOneOut");
  return family === "oddOneOut"
    ? generateOddOneOut(level, seed)
    : generateRotation(level, seed);
}
