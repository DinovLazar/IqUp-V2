/**
 * Gv — Spatial, calibration v2. Two families over structured BLOCK FIGURES
 * (polyomino-style: `segments` unit squares joined edge-to-edge into an
 * asymmetric figure, emitted as an outline polygon in coordinate geometry):
 *
 *   • rotation  — pick the option that is the prompt figure, just rotated.
 *                 From L4 the foils include true mirror images (chirality-
 *                 verified); below L4 foils are different figures (mirror
 *                 discrimination is not reliable before ~8).
 *   • oddOneOut — options are rotations of one base figure plus one odd option:
 *                 a different figure below L4, the mirror from L4.
 *
 * Rotation is mathematically exact (a transform of coordinates), so the figure
 * renders identically anywhere. No image, no SVG — points only.
 */

import { clampOptionCount, gvLevel } from "@/content/tasks/levels";
import {
  deriveSeed,
  intInRange,
  makeRng,
  pick,
  shuffle,
  type Rng,
} from "@/lib/prng";
import {
  makeBase,
  reflectPoint,
  rotatePoint,
  samePointSet,
  transformPolygon,
} from "./shared";
import type { GvItem, GvOption, Point } from "./types";

const ALL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

const rotateAll = (pts: Point[], deg: number): Point[] =>
  pts.map((p) => rotatePoint(p, deg));

// ── Polyomino block figures ───────────────────────────────────────────────────

const cellKey = (x: number, y: number): string => `${x},${y}`;

/**
 * Grow an edge-connected set of `n` unit cells. Candidates that would create a
 * "pinch" (two cells touching only at a corner) are rejected so the outline is
 * a single simple loop.
 */
function growCells(rng: Rng, n: number): Point[] | null {
  const cells: Point[] = [{ x: 0, y: 0 }];
  const set = new Set<string>([cellKey(0, 0)]);
  const createsPinch = (c: Point): boolean => {
    for (const [dx, dy] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const) {
      const diag = cellKey(c.x + dx, c.y + dy);
      if (!set.has(diag)) continue;
      const sideA = set.has(cellKey(c.x + dx, c.y));
      const sideB = set.has(cellKey(c.x, c.y + dy));
      if (!sideA && !sideB) return true;
    }
    return false;
  };
  let guard = 0;
  while (cells.length < n && guard++ < 200) {
    const frontier: Point[] = [];
    const seen = new Set<string>();
    for (const c of cells) {
      for (const [dx, dy] of [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ] as const) {
        const p = { x: c.x + dx, y: c.y + dy };
        const k = cellKey(p.x, p.y);
        if (set.has(k) || seen.has(k)) continue;
        seen.add(k);
        if (!createsPinch(p)) frontier.push(p);
      }
    }
    if (frontier.length === 0) return null;
    // Stable candidate order (insertion is deterministic) → deterministic pick.
    const next = pick(rng, frontier);
    cells.push(next);
    set.add(cellKey(next.x, next.y));
  }
  return cells.length === n ? cells : null;
}

/** Trace the outline polygon of a pinch-free cell set (interior on the right). */
function outlineOf(cells: Point[]): Point[] {
  const set = new Set(cells.map((c) => cellKey(c.x, c.y)));
  const has = (x: number, y: number) => set.has(cellKey(x, y));
  // Directed boundary edges: from-vertex → to-vertex.
  const edges = new Map<string, Point>();
  const vKey = (p: Point) => `${p.x},${p.y}`;
  for (const { x, y } of cells) {
    if (!has(x, y - 1)) edges.set(vKey({ x, y }), { x: x + 1, y });
    if (!has(x + 1, y))
      edges.set(vKey({ x: x + 1, y }), { x: x + 1, y: y + 1 });
    if (!has(x, y + 1))
      edges.set(vKey({ x: x + 1, y: y + 1 }), { x, y: y + 1 });
    if (!has(x - 1, y)) edges.set(vKey({ x, y: y + 1 }), { x, y });
  }
  const startKey = edges.keys().next().value as string;
  const [sx, sy] = startKey.split(",").map(Number);
  const loop: Point[] = [{ x: sx, y: sy }];
  let cur = edges.get(startKey) as Point;
  let guard = 0;
  while (vKey(cur) !== startKey && guard++ < 200) {
    loop.push(cur);
    cur = edges.get(vKey(cur)) as Point;
  }
  // Merge collinear runs into single segments.
  const simplified: Point[] = [];
  for (let i = 0; i < loop.length; i++) {
    const prev = loop[(i - 1 + loop.length) % loop.length];
    const here = loop[i];
    const next = loop[(i + 1) % loop.length];
    const collinear =
      (prev.x === here.x && here.x === next.x) ||
      (prev.y === here.y && here.y === next.y);
    if (!collinear) simplified.push(here);
  }
  // Recenter on the vertex centroid so rotations pivot around the figure.
  const cx = simplified.reduce((a, p) => a + p.x, 0) / simplified.length;
  const cy = simplified.reduce((a, p) => a + p.y, 0) / simplified.length;
  return simplified.map((p) => ({
    x: Math.round((p.x - cx) * 1000) / 1000,
    y: Math.round((p.y - cy) * 1000) / 1000,
  }));
}

/** A figure is chiral if its mirror equals no rotation of itself. */
function isChiral(shape: Point[]): boolean {
  const mirror = shape.map(reflectPoint);
  return !ALL_ANGLES.some((a) => samePointSet(mirror, rotateAll(shape, a)));
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

export interface BlockFigure {
  points: Point[];
  segments: number;
}

/**
 * Build a deterministic block figure of `[min,max]` segments. When
 * `requireChiral` (mirror foils in play) the figure's mirror is verified to
 * equal no rotation of itself.
 */
export function blockFigure(
  seed: string,
  label: string,
  segments: readonly [number, number],
  requireChiral: boolean,
): BlockFigure {
  for (let attempt = 0; attempt < 60; attempt++) {
    const rng = makeRng(deriveSeed(seed, label, attempt));
    const n = intInRange(rng, segments[0], segments[1]);
    // Chirality needs ≥4 cells (all dominoes/trominoes are achiral).
    const cells = growCells(rng, requireChiral ? Math.max(4, n) : n);
    if (!cells) continue;
    const points = outlineOf(cells);
    if (requireChiral && !isChiral(points)) continue;
    return { points, segments: cells.length };
  }
  // Deterministic fallback: an L-tetromino (chiral).
  return {
    points: [
      { x: -0.5, y: -1.5 },
      { x: 0.5, y: -1.5 },
      { x: 0.5, y: 1.5 },
      { x: -1.5, y: 1.5 },
      { x: -1.5, y: 0.5 },
      { x: -0.5, y: 0.5 },
    ],
    segments: 4,
  };
}

// ── Options ───────────────────────────────────────────────────────────────────

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

/**
 * Distinct different-shape figures, non-congruent to the base and each other.
 * Small cell counts have very few free polyominoes (one domino, two trominoes),
 * so exhausted attempts widen the segment range by ±1 before giving up.
 */
function otherFigures(
  seed: string,
  count: number,
  segments: readonly [number, number],
  base: Point[],
): Point[][] {
  const ranges: (readonly [number, number])[] = [
    segments,
    [segments[0], segments[1] + 1],
    [Math.max(2, segments[0] - 1), segments[1] + 1],
  ];
  const out: Point[][] = [];
  for (let i = 0; i < count; i++) {
    let fig = blockFigure(seed, `other${i}`, segments, false).points;
    for (let attempt = 0; attempt < 30; attempt++) {
      const clash = congruent(fig, base) || out.some((o) => congruent(fig, o));
      if (!clash) break;
      const range = ranges[Math.min(2, Math.floor(attempt / 10))];
      fig = blockFigure(seed, `other${i}-${attempt}`, range, false).points;
    }
    out.push(fig);
  }
  return out;
}

function generateRotation(level: number, seed: string, age?: number): GvItem {
  const cfg = gvLevel(level);
  const rng = makeRng(deriveSeed(seed, "gv-rot"));
  const optionCount = clampOptionCount(cfg.optionCount, age);
  const mirrors = cfg.mirrorDistractor
    ? Math.min(cfg.mirrorFoilCount, optionCount - 1)
    : 0;
  const otherCount = optionCount - 1 - mirrors;

  const fig = blockFigure(seed, "base0", cfg.segments, mirrors > 0);
  const base = fig.points;
  const others = otherFigures(seed, otherCount, cfg.segments, base);

  let options: GvOption[] = [];
  let correctAngle: number = cfg.angles[0];
  for (let attempt = 0; attempt < 16; attempt++) {
    correctAngle = pick(rng, cfg.angles);
    const anglePool = shuffle(rng, ALL_ANGLES);
    options = [option(base, 0, false, correctAngle)];
    for (let m = 0; m < mirrors; m++) {
      options.push(option(base, 0, true, anglePool[m % anglePool.length]));
    }
    others.forEach((o, i) => {
      options.push(
        option(o, i + 1, false, anglePool[(mirrors + i) % anglePool.length]),
      );
    });
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
    meta: {
      family: "rotation",
      correctAngle,
      mirrorFoilCount: mirrors,
      segments: fig.segments,
    },
  };
}

function generateOddOneOut(level: number, seed: string, age?: number): GvItem {
  const cfg = gvLevel(level);
  const rng = makeRng(deriveSeed(seed, "gv-odd"));
  const optionCount = clampOptionCount(cfg.optionCount, age);
  // From L4 the odd one is the MIRROR of the base; below it is a different shape.
  const mirrorOdd = cfg.mirrorDistractor;

  const fig = blockFigure(seed, "base0", cfg.segments, mirrorOdd);
  const base = fig.points;
  const otherFig = mirrorOdd
    ? null
    : otherFigures(seed, 1, cfg.segments, base)[0];

  let options: GvOption[] = [];
  for (let attempt = 0; attempt < 16; attempt++) {
    const angles = shuffle(rng, ALL_ANGLES);
    options = [];
    for (let i = 0; i < optionCount - 1; i++) {
      options.push(option(base, 0, false, angles[i]));
    }
    options.push(
      mirrorOdd
        ? option(base, 0, true, angles[optionCount - 1])
        : option(otherFig as Point[], 1, false, angles[optionCount - 1]),
    );
    if (allDistinct(options)) break;
  }

  const odd = options[options.length - 1];
  const shuffled = shuffle(rng, options);
  const answer = shuffled.indexOf(odd);

  return {
    ...makeBase("gv", level, seed),
    stimulus: { family: "oddOneOut", base },
    options: shuffled,
    answer,
    meta: {
      family: "oddOneOut",
      mirrorFoilCount: mirrorOdd ? 1 : 0,
      segments: fig.segments,
    },
  };
}

/**
 * Generate a Gv item. Family is chosen deterministically from the seed unless
 * `opts.family` ("rotation" | "oddOneOut") forces one.
 */
export function generate(
  level: number,
  seed: string,
  opts?: { family?: string; age?: number },
): GvItem {
  const family =
    opts?.family ??
    (makeRng(`${seed}|gv-family`)() < 0.5 ? "rotation" : "oddOneOut");
  return family === "oddOneOut"
    ? generateOddOneOut(level, seed, opts?.age)
    : generateRotation(level, seed, opts?.age);
}
