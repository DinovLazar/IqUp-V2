/**
 * Gf — Logic (fluid reasoning). Two families (spec A.1, Дел 4):
 *   • matrix  — an N×N grid whose cells follow per-row/column rules; one cell is
 *               blanked, and 4 options each differ from the key by exactly one
 *               attribute, so the answer is unambiguous.
 *   • series  — a numeric sequence with a hidden next term; 4 options.
 *
 * Pure & deterministic: every choice flows from `seed`. The structured rules are
 * stored in `meta` so the test suite can independently re-derive the key.
 */

import { gfLevel } from "@/content/tasks/levels";
import {
  intInRange,
  makeRng,
  pick,
  pickN,
  shuffle,
  type Rng,
} from "@/lib/prng";
import { makeBase } from "./shared";
import type {
  GfItem,
  GfMatrixItem,
  GfSeriesItem,
  MatrixAttr,
  MatrixAttrRule,
  MatrixCell,
  MatrixRuleKind,
  ShapeKind,
  SeriesRuleType,
} from "./types";

/** Attribute value pools (abstract tokens; the renderer maps them to visuals). */
const SHAPES: readonly ShapeKind[] = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "star",
  "hexagon",
];
const SHAPE_DOMAIN = SHAPES.length;
const COLOR_DOMAIN = 6;
const ROTATIONS = [0, 90, 180, 270] as const;
const COUNT_MIN = 1;
const COUNT_MAX = 6;

const ALL_ATTRS: readonly MatrixAttr[] = [
  "shape",
  "count",
  "colorIndex",
  "rotation",
];

// ── Matrix rule evaluation ────────────────────────────────────────────────────

/**
 * The raw value of one attribute at cell (row r, col c) under its rule.
 * Categorical attrs (domainSize > 0) wrap cyclically; `count` (domainSize 0)
 * is additive and clamped by the caller.
 */
export function matrixAttrValue(
  rule: MatrixAttrRule,
  r: number,
  c: number,
): number {
  let v: number;
  switch (rule.kind) {
    case "constant":
      v = rule.base;
      break;
    case "progRow":
      v = rule.base + r * rule.stepR;
      break;
    case "progCol":
      v = rule.base + c * rule.stepC;
      break;
    case "progBoth":
      v = rule.base + r * rule.stepR + c * rule.stepC;
      break;
    case "xor": {
      const col0 = rule.xorCol0 ?? [];
      const col1 = rule.xorCol1 ?? [];
      if (c === 0) v = col0[r];
      else if (c === 1) v = col1[r];
      else v = col0[r] ^ col1[r];
      break;
    }
  }
  if (rule.domainSize > 0) {
    v = ((v % rule.domainSize) + rule.domainSize) % rule.domainSize;
  }
  return v;
}

/** Map raw attribute values to a concrete cell. */
function cellFrom(values: Record<MatrixAttr, number>): MatrixCell {
  return {
    shape: SHAPES[values.shape % SHAPE_DOMAIN],
    count: Math.min(COUNT_MAX, Math.max(COUNT_MIN, values.count)),
    colorIndex: values.colorIndex,
    rotation: ROTATIONS[((values.rotation % 4) + 4) % 4],
  };
}

/** Build the cell at (r,c) by evaluating every attribute's rule. */
function buildCell(rules: MatrixAttrRule[], r: number, c: number): MatrixCell {
  const values = {} as Record<MatrixAttr, number>;
  for (const rule of rules) values[rule.attr] = matrixAttrValue(rule, r, c);
  return cellFrom(values);
}

/** Domain size used for an attribute's cyclic wrap (0 = numeric count). */
function domainOf(attr: MatrixAttr, xor: boolean): number {
  if (attr === "count") return 0;
  if (attr === "colorIndex") return xor ? 2 : COLOR_DOMAIN;
  if (attr === "shape") return SHAPE_DOMAIN;
  return 4; // rotation
}

/** Pick a progression rule kind for a varying attribute. */
function progKind(rng: Rng): MatrixRuleKind {
  return pick(rng, ["progRow", "progCol", "progBoth"] as const);
}

function makeAttrRule(
  rng: Rng,
  attr: MatrixAttr,
  varying: boolean,
  size: number,
  allowXor: boolean,
): MatrixAttrRule {
  // XOR is only meaningful on a 3-wide binary attribute (use colorIndex).
  const useXor = varying && allowXor && attr === "colorIndex" && size === 3;
  if (useXor) {
    return {
      attr,
      kind: "xor",
      base: 0,
      stepR: 0,
      stepC: 0,
      domainSize: 2,
      xorCol0: Array.from({ length: size }, () => intInRange(rng, 0, 1)),
      xorCol1: Array.from({ length: size }, () => intInRange(rng, 0, 1)),
    };
  }

  const domainSize = domainOf(attr, false);
  if (!varying) {
    const base =
      attr === "count"
        ? intInRange(rng, COUNT_MIN, 3)
        : intInRange(rng, 0, domainSize - 1);
    return { attr, kind: "constant", base, stepR: 0, stepC: 0, domainSize };
  }

  // `count` is numeric (no cyclic wrap), so constrain its rule to keep every
  // cell within [COUNT_MIN, COUNT_MAX] — no clamping mid-pattern. With base ≤ 2,
  // a single-axis step of 1 over a 3-wide grid peaks at 2 + 2·1 = 4.
  if (attr === "count") {
    const kind = pick(rng, ["progRow", "progCol"] as const);
    const base = intInRange(rng, COUNT_MIN, 2);
    return {
      attr,
      kind,
      base,
      stepR: kind === "progRow" ? 1 : 0,
      stepC: kind === "progCol" ? 1 : 0,
      domainSize,
    };
  }

  const kind = progKind(rng);
  const base = intInRange(rng, 0, domainSize - 1);
  const stepR =
    kind === "progRow" || kind === "progBoth" ? intInRange(rng, 1, 2) : 0;
  const stepC =
    kind === "progCol" || kind === "progBoth" ? intInRange(rng, 1, 2) : 0;
  return { attr, kind, base, stepR, stepC, domainSize };
}

/** A different valid value for one attribute of a cell (for a distractor). */
function mutateAttr(rng: Rng, cell: MatrixCell, attr: MatrixAttr): MatrixCell {
  const next = { ...cell };
  switch (attr) {
    case "shape":
      next.shape = pick(
        rng,
        SHAPES.filter((s) => s !== cell.shape),
      );
      break;
    case "count": {
      const others = [];
      for (let v = COUNT_MIN; v <= COUNT_MAX; v++)
        if (v !== cell.count) others.push(v);
      next.count = pick(rng, others);
      break;
    }
    case "colorIndex": {
      const others = [];
      for (let v = 0; v < COLOR_DOMAIN; v++)
        if (v !== cell.colorIndex) others.push(v);
      next.colorIndex = pick(rng, others);
      break;
    }
    case "rotation":
      next.rotation = pick(
        rng,
        ROTATIONS.filter((d) => d !== cell.rotation),
      );
      break;
  }
  return next;
}

function cellKey(cell: MatrixCell): string {
  return `${cell.shape}|${cell.count}|${cell.colorIndex}|${cell.rotation}`;
}

function generateMatrix(level: number, seed: string): GfMatrixItem {
  const cfg = gfLevel(level);
  const rng = makeRng(seed);
  const size = cfg.matrixSize;

  // Choose which attributes vary; the rest are held constant.
  const varying = new Set(pickN(rng, ALL_ATTRS, cfg.matrixAttrCount));
  const rules = ALL_ATTRS.map((attr) =>
    makeAttrRule(rng, attr, varying.has(attr), size, cfg.matrixAllowXor),
  );

  // Realise the whole grid, then blank the last cell (classic «?» position).
  const grid: MatrixCell[] = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) grid.push(buildCell(rules, r, c));
  const blankIndex = size * size - 1;
  const correct = grid[blankIndex];

  // Distractors: each changes exactly one attribute of the correct cell.
  const distractors: MatrixCell[] = [];
  const used = new Set<string>([cellKey(correct)]);
  const attrOrder = shuffle(rng, ALL_ATTRS);
  let guard = 0;
  while (distractors.length < 3 && guard++ < 100) {
    const attr = attrOrder[distractors.length % attrOrder.length];
    const cand = mutateAttr(rng, correct, attr);
    const key = cellKey(cand);
    if (!used.has(key)) {
      used.add(key);
      distractors.push(cand);
    }
  }

  const options = shuffle(rng, [correct, ...distractors]);
  const answer = options.findIndex((o) => cellKey(o) === cellKey(correct));

  const cells: (MatrixCell | null)[] = grid.slice();
  cells[blankIndex] = null;

  const ruleType = rules
    .filter((r) => r.kind !== "constant")
    .map((r) => `${r.attr}:${r.kind}`)
    .join(",");

  return {
    ...makeBase("gf", level, seed),
    stimulus: { family: "matrix", size, cells, blankIndex },
    options,
    answer,
    meta: { family: "matrix", ruleType: ruleType || "constant", rules },
  };
}

// ── Numeric series ────────────────────────────────────────────────────────────

/** Compute the visible terms and the hidden next term for a series rule. */
export function buildSeries(
  rule: SeriesRuleType,
  visible: number,
  rng: Rng,
): { terms: number[]; next: number } {
  const n = visible + 1; // include the hidden term, then split it off
  const terms: number[] = [];
  switch (rule) {
    case "arithmetic": {
      const s = intInRange(rng, 1, 9);
      const k = intInRange(rng, 2, 5);
      for (let i = 0; i < n; i++) terms.push(s + i * k);
      break;
    }
    case "geometric": {
      const s = intInRange(rng, 1, 4);
      const k = intInRange(rng, 2, 3);
      for (let i = 0; i < n; i++) terms.push(s * k ** i);
      break;
    }
    case "alternating": {
      let v = intInRange(rng, 1, 6);
      const a = intInRange(rng, 2, 5);
      let b = intInRange(rng, 2, 5);
      while (b === a) b = intInRange(rng, 2, 5);
      terms.push(v);
      for (let i = 1; i < n; i++) {
        v += i % 2 === 1 ? a : b;
        terms.push(v);
      }
      break;
    }
    case "fibonacci": {
      let p = intInRange(rng, 1, 4);
      let q = intInRange(rng, 1, 4);
      terms.push(p, q);
      for (let i = 2; i < n; i++) {
        const nx = p + q;
        terms.push(nx);
        p = q;
        q = nx;
      }
      break;
    }
    case "quadratic": {
      const t0 = intInRange(rng, 1, 5);
      const d1 = intInRange(rng, 1, 4);
      const d2 = intInRange(rng, 1, 3);
      for (let i = 0; i < n; i++)
        terms.push(t0 + i * d1 + (d2 * i * (i - 1)) / 2);
      break;
    }
  }
  const next = terms[terms.length - 1];
  return { terms: terms.slice(0, visible), next };
}

function generateSeries(level: number, seed: string): GfSeriesItem {
  const cfg = gfLevel(level);
  const rng = makeRng(seed);
  const { terms, next } = buildSeries(cfg.seriesRule, cfg.seriesVisible, rng);

  // Plausible distractors near the true next term.
  const lastDiff = terms[terms.length - 1] - terms[terms.length - 2];
  const pool = [
    next + lastDiff,
    next - lastDiff,
    next + 1,
    next - 1,
    next * 2 - terms[terms.length - 1],
    terms[terms.length - 1] * 2,
  ];
  const distractors: number[] = [];
  const used = new Set<number>([next]);
  for (const cand of shuffle(rng, pool)) {
    if (distractors.length >= 3) break;
    if (!used.has(cand)) {
      used.add(cand);
      distractors.push(cand);
    }
  }
  // Top up if the pool collided (rare): walk outward from `next`.
  let delta = 2;
  while (distractors.length < 3) {
    const cand = next + delta;
    if (!used.has(cand)) {
      used.add(cand);
      distractors.push(cand);
    }
    delta = delta > 0 ? -delta : -delta + 1;
  }

  const options = shuffle(rng, [next, ...distractors]);
  const answer = options.indexOf(next);

  return {
    ...makeBase("gf", level, seed),
    stimulus: { family: "series", terms },
    options,
    answer,
    meta: { family: "series", ruleType: cfg.seriesRule },
  };
}

/**
 * Generate a Gf item. Family is chosen deterministically from the seed unless
 * `opts.family` ("matrix" | "series") forces one.
 */
export function generate(
  level: number,
  seed: string,
  opts?: { family?: string },
): GfItem {
  const family =
    opts?.family ??
    (makeRng(`${seed}|gf-family`)() < 0.5 ? "matrix" : "series");
  return family === "series"
    ? generateSeries(level, seed)
    : generateMatrix(level, seed);
}
