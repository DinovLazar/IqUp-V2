import { describe, expect, it } from "vitest";
import { gfLevel, gvLevel } from "@/content/tasks/levels";
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
  `${c.shape}|${c.count}|${c.colorIndex}|${c.rotation}|${c.size}`;
const diffAttrs = (a: MatrixCell, b: MatrixCell): string[] => {
  const out: string[] = [];
  if (a.shape !== b.shape) out.push("shape");
  if (a.count !== b.count) out.push("count");
  if (a.colorIndex !== b.colorIndex) out.push("colorIndex");
  if (a.rotation !== b.rotation) out.push("rotation");
  if (a.size !== b.size) out.push("size");
  return out;
};

// independent geometry for Gv
const r3 = (n: number) => Math.round(n * 1000) / 1000 + 0;
function rot(p: Point, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  return {
    x: r3(p.x * Math.cos(rad) - p.y * Math.sin(rad)),
    y: r3(p.x * Math.sin(rad) + p.y * Math.cos(rad)),
  };
}
const mirror = (pts: Point[]): Point[] =>
  pts.map((p) => ({ x: r3(-p.x), y: r3(p.y) }));
function normalize(pts: Point[]): string {
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  return pts
    .map((p) => `${r3(p.x - cx)},${r3(p.y - cy)}`)
    .sort()
    .join(" ");
}
// 45°-step foil angles + the v2 ladder's 120° discrimination step.
const ANGLES = [0, 45, 90, 120, 135, 180, 225, 240, 270, 300, 315];
function isRotationOf(shape: Point[], base: Point[]): boolean {
  const target = normalize(shape);
  return ANGLES.some((a) => normalize(base.map((p) => rot(p, a))) === target);
}
const isMirrorOf = (shape: Point[], base: Point[]): boolean =>
  isRotationOf(shape, mirror(base));

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
          expect(diffAttrs(correct, opt)).toHaveLength(1);
        });
      }
    }
  });

  it("subtlety 3: colour is never the single differing attribute (v2)", () => {
    for (const level of LEVELS) {
      if (gfLevel(level).distractorSubtlety !== 3) continue;
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "gf",
          level,
          seed,
          family: "matrix",
        });
        if (!isGfMatrix(item)) continue;
        const correct = item.options[item.answer];
        item.options.forEach((opt, i) => {
          if (i === item.answer) return;
          expect(diffAttrs(correct, opt)).not.toEqual(["colorIndex"]);
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

  it("object-notation options stay countable (1–12, never negative)", () => {
    for (const level of [1, 2, 3, 4]) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "gf",
          level,
          seed,
          family: "series",
          age: 5,
        });
        if (!isGfSeries(item)) continue;
        expect(item.stimulus.notation).toBe("objects");
        for (const term of [...item.stimulus.terms, ...item.options]) {
          expect(term).toBeGreaterThanOrEqual(1);
          expect(term).toBeLessThanOrEqual(12);
        }
      }
    }
  });
});

describe("distractors — Gv", () => {
  it("rotation family: exactly one pure rotation (the answer); mirror foils are TRUE mirrors (v2)", () => {
    for (const level of LEVELS) {
      const cfg = gvLevel(level);
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

        // Mirror foils: declared count, and each is a true mirror of the base.
        const mirrors = item.options.filter((o) => o.transform.reflect);
        const expectedMirrors = cfg.mirrorDistractor
          ? Math.min(cfg.mirrorFoilCount, item.options.length - 1)
          : 0;
        expect(mirrors).toHaveLength(expectedMirrors);
        expect(item.meta.mirrorFoilCount).toBe(expectedMirrors);
        for (const foil of mirrors) {
          expect(isMirrorOf(foil.points, base)).toBe(true);
        }
      }
    }
  });

  it("oddOneOut family: the odd option is the only non-rotation (mirror from L4, other shape below)", () => {
    for (const level of LEVELS) {
      const cfg = gvLevel(level);
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
        const odd = item.options[item.answer];
        if (cfg.mirrorDistractor) {
          expect(odd.transform.reflect).toBe(true);
          expect(isMirrorOf(odd.points, base)).toBe(true);
        } else {
          // Below L4 mirror discrimination is unreliable → a different figure.
          expect(odd.transform.shapeId).toBeGreaterThan(0);
        }
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
  it("every option-set family has distinct options", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        for (const subtype of [
          "sequence",
          "loopEvent",
          "condition",
          "conditionLoop",
          "counter",
          "optimize",
        ] as const) {
          const item = generateItem({ signal: "ct", level, seed, subtype });
          if (item.signal !== "ct") continue;
          const s = item.stimulus;
          if ("options" in s && Array.isArray(s.options)) {
            const keys = (s.options as readonly Move2[][]).map((o) =>
              o.join(""),
            );
            expect(new Set(keys).size).toBe(keys.length);
          }
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
        const nested = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "nestedLoop",
        });
        if (
          nested.signal === "ct" &&
          nested.stimulus.subtype === "nestedLoop"
        ) {
          const keys = nested.stimulus.options.map(
            (o) =>
              `${o.outerTimes}|${o.pre.join("")}|${o.innerTimes}|${o.innerBody.join("")}|${o.post.join("")}`,
          );
          expect(new Set(keys).size).toBe(keys.length);
        }
      }
    }
  });
});

type Move2 = "up" | "down" | "left" | "right";
