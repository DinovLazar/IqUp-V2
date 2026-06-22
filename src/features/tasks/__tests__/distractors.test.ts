import { describe, expect, it } from "vitest";
import {
  generateItem,
  isGfMatrix,
  isGfSeries,
  type Point,
} from "@/features/tasks";
import type { MatrixCell } from "@/features/tasks";

const SEEDS = ["d1", "d2", "d3", "d4", "d5", "d6"];
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const cellKey = (c: MatrixCell) =>
  `${c.shape}|${c.count}|${c.colorIndex}|${c.rotation}`;
const diffCount = (a: MatrixCell, b: MatrixCell) =>
  (a.shape !== b.shape ? 1 : 0) +
  (a.count !== b.count ? 1 : 0) +
  (a.colorIndex !== b.colorIndex ? 1 : 0) +
  (a.rotation !== b.rotation ? 1 : 0);

// independent geometry for Gv
const r3 = (n: number) => Math.round(n * 1000) / 1000 + 0;
function rot(p: Point, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  return {
    x: r3(p.x * Math.cos(rad) - p.y * Math.sin(rad)),
    y: r3(p.x * Math.sin(rad) + p.y * Math.cos(rad)),
  };
}
function normalize(pts: Point[]): string {
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  return pts
    .map((p) => `${r3(p.x - cx)},${r3(p.y - cy)}`)
    .sort()
    .join(" ");
}
const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
function isRotationOf(shape: Point[], base: Point[]): boolean {
  const target = normalize(shape);
  return ANGLES.some((a) => normalize(base.map((p) => rot(p, a))) === target);
}

describe("distractors — Gf matrix", () => {
  it("the key is unique and each distractor differs by exactly one attribute", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "gf",
          level,
          seed,
          family: "matrix",
        });
        if (!isGfMatrix(item)) continue;
        const correct = item.options[item.answer];
        const keys = item.options.map(cellKey);
        // Unique key (no duplicate options, correct appears once).
        expect(new Set(keys).size).toBe(item.options.length);
        item.options.forEach((opt, i) => {
          if (i === item.answer) return;
          expect(diffCount(correct, opt)).toBe(1);
        });
      }
    }
  });
});

describe("distractors — Gf series", () => {
  it("options are distinct and the key appears once", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "gf",
          level,
          seed,
          family: "series",
        });
        if (!isGfSeries(item)) continue;
        expect(new Set(item.options).size).toBe(item.options.length);
        const key = item.options[item.answer];
        expect(item.options.filter((o) => o === key)).toHaveLength(1);
      }
    }
  });
});

describe("distractors — Gv", () => {
  it("rotation family: exactly one option is a pure rotation of the base (the answer)", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "gv",
          level,
          seed,
          family: "rotation",
        });
        if (item.signal !== "gv" || item.stimulus.family !== "rotation")
          continue;
        const base = item.stimulus.base;
        const rotations = item.options
          .map((o, i) => ({ i, isRot: isRotationOf(o.points, base) }))
          .filter((o) => o.isRot);
        expect(rotations).toHaveLength(1);
        expect(rotations[0].i).toBe(item.answer);
        // The answer's transform is a pure (non-reflected) rotation of the base.
        expect(item.options[item.answer].transform.reflect).toBe(false);
        expect(item.options[item.answer].transform.shapeId).toBe(0);
      }
    }
  });

  it("oddOneOut family: the odd option is the only non-rotation (the answer)", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "gv",
          level,
          seed,
          family: "oddOneOut",
        });
        if (item.signal !== "gv" || item.stimulus.family !== "oddOneOut")
          continue;
        const base = item.stimulus.base;
        const nonRotations = item.options
          .map((o, i) => ({ i, isRot: isRotationOf(o.points, base) }))
          .filter((o) => !o.isRot);
        expect(nonRotations).toHaveLength(1);
        expect(nonRotations[0].i).toBe(item.answer);
        expect(item.options[item.answer].transform.reflect).toBe(true);
      }
    }
  });

  it("all option polygons are visually distinct", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        for (const family of ["rotation", "oddOneOut"]) {
          const item = generateItem({ signal: "gv", level, seed, family });
          if (item.signal !== "gv") continue;
          const norms = item.options.map((o) => normalize(o.points));
          expect(new Set(norms).size).toBe(item.options.length);
        }
      }
    }
  });
});

describe("distractors — CT option tasks", () => {
  it("sequence / loop / condition options are distinct", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const seq = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "sequence",
        });
        if (seq.signal === "ct" && seq.stimulus.subtype === "sequence") {
          const keys = seq.stimulus.options.map((o) => o.join(""));
          expect(new Set(keys).size).toBe(keys.length);
        }
        const loop = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "loop",
        });
        if (loop.signal === "ct" && loop.stimulus.subtype === "loop") {
          const keys = loop.stimulus.options.map(
            (o) => `${o.body.join("")}x${o.times}`,
          );
          expect(new Set(keys).size).toBe(keys.length);
        }
        const cond = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "condition",
        });
        if (cond.signal === "ct" && cond.stimulus.subtype === "condition") {
          const keys = cond.stimulus.options.map((o) => o.join(""));
          expect(new Set(keys).size).toBe(keys.length);
        }
      }
    }
  });
});
