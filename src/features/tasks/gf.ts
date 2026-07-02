/**
 * Gf — Logic (fluid reasoning), calibration v2. Two families:
 *   • matrix  — an N×N grid whose cells follow per-attribute rules drawn from the
 *               Carpenter/Just/Shell taxonomy (constancy, progression, figure
 *               addition/subtraction, distribution-of-three, distribution-of-two
 *               /XOR); one cell is blanked and the options differ from the key
 *               per the level's distractor-subtlety tier.
 *   • series  — a numeric sequence with a hidden next term; rendered as
 *               countable object groups for ages < 7 (never numerals) and capped
 *               at L4 below age 9 (×-rules are not fluent before ~grade 3–4) —
 *               the generator substitutes a matrix item above the cap.
 *
 * Pure & deterministic: every choice flows from `seed`. The structured rules are
 * stored in `meta` so the test suite can independently re-derive the key.
 */

import {
  GF_SERIES_MAX_LEVEL_UNDER_9,
  GF_SERIES_OBJECTS_UNDER_AGE,
  GF_SERIES_TIMES_FROM_AGE,
  clampOptionCount,
  clampTaskAge,
  gfLevel,
  type MatrixRuleClass,
  type SeriesRuleClass,
} from "@/content/tasks/levels";
import {
  deriveSeed,
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
  ShapeKind,
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
/** v2: colour is drawn from the 4-hue colourblind-safer subset (renderer maps
 * 0..3 → magenta / blue / yellow / teal — never magenta+violet or yellow+orange). */
const COLOR_DOMAIN = 4;
const ROTATIONS = [0, 90, 180, 270] as const;
/** v2: count uses ≤5 elements per cell. */
const COUNT_MIN = 1;
const COUNT_MAX = 5;
/** v2: size steps small / medium / large. */
const SIZE_DOMAIN = 3;

const ALL_ATTRS: readonly MatrixAttr[] = [
  "shape",
  "count",
  "colorIndex",
  "rotation",
  "size",
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
    case "addSub": {
      const col0 = rule.addCol0 ?? [];
      const col1 = rule.addCol1 ?? [];
      const sign = rule.addSign ?? 1;
      if (c === 0) v = col0[r];
      else if (c === 1) v = col1[r];
      else v = col0[r] + sign * col1[r];
      break;
    }
    case "distThree": {
      const values = rule.distValues ?? [0, 1, 2];
      const latin = rule.latin ?? [];
      v = values[latin[r]?.[c] ?? 0];
      break;
    }
  }
  if (rule.domainSize > 0 && rule.kind !== "distThree") {
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
    size: ((values.size % SIZE_DOMAIN) + SIZE_DOMAIN) % SIZE_DOMAIN,
  };
}

/** Build the cell at (r,c) by evaluating every attribute's rule. */
function buildCell(rules: MatrixAttrRule[], r: number, c: number): MatrixCell {
  const values = {} as Record<MatrixAttr, number>;
  for (const rule of rules) values[rule.attr] = matrixAttrValue(rule, r, c);
  return cellFrom(values);
}

/** Domain size used for an attribute's cyclic wrap (0 = numeric count). */
function domainOf(attr: MatrixAttr): number {
  if (attr === "count") return 0;
  if (attr === "colorIndex") return COLOR_DOMAIN;
  if (attr === "shape") return SHAPE_DOMAIN;
  if (attr === "size") return SIZE_DOMAIN;
  return 4; // rotation
}

/** A constant rule for an inactive (non-varying) attribute. */
function constantRule(rng: Rng, attr: MatrixAttr): MatrixAttrRule {
  const domainSize = domainOf(attr);
  const base =
    attr === "count"
      ? intInRange(rng, COUNT_MIN, 3)
      : intInRange(rng, 0, domainSize - 1);
  return { attr, kind: "constant", base, stepR: 0, stepC: 0, domainSize };
}

/** A progression rule (row / col / both) that stays in-domain for `count`. */
function progressionRule(rng: Rng, attr: MatrixAttr): MatrixAttrRule {
  const domainSize = domainOf(attr);
  // `count` is numeric (no cyclic wrap): base ≤ 2 + single-axis step 1 keeps
  // every cell within [1, 5] over a 3-wide grid (2 + 2·1 = 4).
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
  const kind = pick(rng, ["progRow", "progCol", "progBoth"] as const);
  const base = intInRange(rng, 0, domainSize - 1);
  const stepR =
    kind === "progRow" || kind === "progBoth" ? intInRange(rng, 1, 2) : 0;
  const stepC =
    kind === "progCol" || kind === "progBoth" ? intInRange(rng, 1, 2) : 0;
  // Guard degenerate wrap: a step that is a multiple of the domain would make
  // the "progression" a constant — bump it to 1.
  const fix = (s: number) => (s % domainSize === 0 && s !== 0 ? 1 : s);
  return { attr, kind, base, stepR: fix(stepR), stepC: fix(stepC), domainSize };
}

/** Figure addition/subtraction on `count`: col2 = col0 ± col1 (3×3 only). */
function addSubRule(rng: Rng, size: number): MatrixAttrRule {
  const sign: 1 | -1 = pick(rng, [1, -1] as const);
  const addCol0: number[] = [];
  const addCol1: number[] = [];
  for (let r = 0; r < size; r++) {
    if (sign === 1) {
      addCol0.push(intInRange(rng, 1, 2));
      addCol1.push(intInRange(rng, 1, 2));
    } else {
      const a = intInRange(rng, 3, COUNT_MAX);
      addCol0.push(a);
      addCol1.push(intInRange(rng, 1, a - 1));
    }
  }
  return {
    attr: "count",
    kind: "addSub",
    base: 0,
    stepR: 0,
    stepC: 0,
    domainSize: 0,
    addCol0,
    addCol1,
    addSign: sign,
  };
}

/** Distribution-of-three: each row and column holds the same 3 values (Latin square). */
function distThreeRule(rng: Rng, attr: MatrixAttr): MatrixAttrRule {
  const domainSize = domainOf(attr);
  const distValues = pickN(
    rng,
    Array.from({ length: domainSize }, (_, i) => i),
    3,
  );
  const perm = shuffle(rng, [0, 1, 2]);
  const shift = intInRange(rng, 0, 2);
  const latin = [0, 1, 2].map((r) =>
    [0, 1, 2].map((c) => perm[(c + r + shift) % 3]),
  );
  return {
    attr,
    kind: "distThree",
    base: 0,
    stepR: 0,
    stepC: 0,
    domainSize,
    distValues,
    latin,
  };
}

/** Distribution-of-two (XOR) on a binary sub-domain of the attribute. */
function distTwoRule(rng: Rng, attr: MatrixAttr, size: number): MatrixAttrRule {
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

/** Attributes a rule class may act on (addSub is numeric-only, etc.). */
function attrPoolFor(cls: MatrixRuleClass): readonly MatrixAttr[] {
  switch (cls) {
    case "additionSubtraction":
      return ["count"];
    case "distributionOfThree":
      return ["shape", "colorIndex", "rotation", "size"];
    case "distributionOfTwo":
      return ["colorIndex", "rotation", "shape"];
    default:
      return ALL_ATTRS;
  }
}

/** Build the concrete rule for a class on an attribute. */
function ruleFor(
  rng: Rng,
  cls: MatrixRuleClass,
  attr: MatrixAttr,
  size: number,
): MatrixAttrRule {
  switch (cls) {
    case "constancy":
      return constantRule(rng, attr);
    case "progression":
      return progressionRule(rng, attr);
    case "additionSubtraction":
      return addSubRule(rng, size);
    case "distributionOfThree":
      return distThreeRule(rng, attr);
    case "distributionOfTwo":
      return distTwoRule(rng, attr, size);
  }
}

const cellKey = (cell: MatrixCell): string =>
  `${cell.shape}|${cell.count}|${cell.colorIndex}|${cell.rotation}|${cell.size}`;

/** Smallest-step near-miss mutation of one attribute (subtlety 3). */
function nearMissAttr(
  rng: Rng,
  cell: MatrixCell,
  attr: MatrixAttr,
): MatrixCell {
  const next = { ...cell };
  switch (attr) {
    case "shape": {
      const i = SHAPES.indexOf(cell.shape);
      next.shape =
        SHAPES[(i + pick(rng, [1, SHAPE_DOMAIN - 1])) % SHAPE_DOMAIN];
      break;
    }
    case "count":
      next.count =
        cell.count >= COUNT_MAX
          ? cell.count - 1
          : cell.count <= COUNT_MIN
            ? cell.count + 1
            : cell.count + pick(rng, [1, -1]);
      break;
    case "colorIndex":
      next.colorIndex =
        (cell.colorIndex + pick(rng, [1, COLOR_DOMAIN - 1])) % COLOR_DOMAIN;
      break;
    case "rotation": {
      const i = ROTATIONS.indexOf(cell.rotation as (typeof ROTATIONS)[number]);
      next.rotation = ROTATIONS[(i + pick(rng, [1, 3])) % 4];
      break;
    }
    case "size":
      next.size =
        cell.size >= SIZE_DOMAIN - 1
          ? cell.size - 1
          : cell.size <= 0
            ? cell.size + 1
            : cell.size + pick(rng, [1, -1]);
      break;
  }
  return next;
}

/** Obvious (far-value) mutation of one attribute (subtlety 1/2). */
function farAttr(rng: Rng, cell: MatrixCell, attr: MatrixAttr): MatrixCell {
  const next = { ...cell };
  switch (attr) {
    case "shape":
      next.shape = pick(
        rng,
        SHAPES.filter((s) => s !== cell.shape),
      );
      break;
    case "count": {
      const others: number[] = [];
      for (let v = COUNT_MIN; v <= COUNT_MAX; v++)
        if (Math.abs(v - cell.count) >= 2) others.push(v);
      next.count = others.length > 0 ? pick(rng, others) : cell.count + 1;
      break;
    }
    case "colorIndex": {
      const others: number[] = [];
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
    case "size": {
      const others: number[] = [];
      for (let v = 0; v < SIZE_DOMAIN; v++) if (v !== cell.size) others.push(v);
      next.size = pick(rng, others);
      break;
    }
  }
  return next;
}

function generateMatrix(
  level: number,
  seed: string,
  age?: number,
): GfMatrixItem {
  const cfg = gfLevel(level);
  const rng = makeRng(seed);
  const size = cfg.matrixSize;

  // Assign rule classes to varying attribute slots: the level's classes (seed-
  // picked when the level offers more classes than slots), padded with
  // progression companions when it offers fewer (e.g. L8's lone distTwo).
  const chosen = pickN(
    rng,
    cfg.ruleTypes,
    Math.min(cfg.matrixAttrCount, cfg.ruleTypes.length),
  );
  const classes: MatrixRuleClass[] = [...chosen];
  while (classes.length < cfg.matrixAttrCount) classes.push("progression");

  // Pick a compatible, distinct attribute per class. Constrained classes claim
  // their attribute FIRST (addSub can only act on count); a class whose pool is
  // exhausted degrades to a progression companion on a free attribute.
  const POOL_RANK: Record<MatrixRuleClass, number> = {
    additionSubtraction: 0,
    distributionOfTwo: 1,
    distributionOfThree: 2,
    progression: 3,
    constancy: 4,
  };
  const assignOrder = classes
    .map((cls, slot) => ({ cls, slot }))
    .sort((a, b) => POOL_RANK[a.cls] - POOL_RANK[b.cls]);
  const used = new Set<MatrixAttr>();
  const bySlot: { cls: MatrixRuleClass; attr: MatrixAttr }[] = [];
  for (const { cls, slot } of assignOrder) {
    let effective = cls;
    let pool = attrPoolFor(cls).filter((a) => !used.has(a));
    if (pool.length === 0) {
      effective = "progression";
      pool = ALL_ATTRS.filter((a) => !used.has(a));
    }
    const attr = pick(rng, pool);
    used.add(attr);
    bySlot[slot] = { cls: effective, attr };
  }
  const assigned = bySlot;

  const rules = ALL_ATTRS.map((attr) => {
    const hit = assigned.find((a) => a.attr === attr);
    return hit ? ruleFor(rng, hit.cls, attr, size) : constantRule(rng, attr);
  });

  // Realise the whole grid, then blank the last cell (classic «?» position).
  const grid: MatrixCell[] = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) grid.push(buildCell(rules, r, c));
  const blankIndex = size * size - 1;
  const correct = grid[blankIndex];

  // Distractors per the level's subtlety tier. The primary (headline-ruled)
  // attribute is assigned[0]; colour is never the single differing attribute at
  // subtlety 3 (never colour-only — brand/a11y rule).
  const optionCount = clampOptionCount(4, age);
  const primaryAttr = assigned[0]?.attr ?? "shape";
  const mutationAttrs: MatrixAttr[] =
    cfg.distractorSubtlety === 1
      ? [primaryAttr]
      : shuffle(
          rng,
          ALL_ATTRS.filter(
            (a) => cfg.distractorSubtlety !== 3 || a !== "colorIndex",
          ),
        );

  const distractors: MatrixCell[] = [];
  const usedKeys = new Set<string>([cellKey(correct)]);
  let guard = 0;
  while (distractors.length < optionCount - 1 && guard++ < 200) {
    const attr = mutationAttrs[distractors.length % mutationAttrs.length];
    const cand =
      cfg.distractorSubtlety === 3
        ? nearMissAttr(rng, correct, attr)
        : farAttr(rng, correct, attr);
    const key = cellKey(cand);
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      distractors.push(cand);
    }
  }
  // Defensive top-up (key collisions exhausted the tier): widen to any attr.
  guard = 0;
  while (distractors.length < optionCount - 1 && guard++ < 200) {
    const attr = pick(
      rng,
      ALL_ATTRS.filter(
        (a) => cfg.distractorSubtlety !== 3 || a !== "colorIndex",
      ),
    );
    const cand = farAttr(rng, correct, attr);
    const key = cellKey(cand);
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      distractors.push(cand);
    }
  }

  const options = shuffle(rng, [correct, ...distractors]);
  const answer = options.findIndex((o) => cellKey(o) === cellKey(correct));

  const cells: (MatrixCell | null)[] = grid.slice();
  cells[blankIndex] = null;

  const ruleType = assigned.map((a) => `${a.attr}:${a.cls}`).join(",");

  return {
    ...makeBase("gf", level, seed),
    stimulus: { family: "matrix", size, cells, blankIndex },
    options,
    answer,
    meta: {
      family: "matrix",
      ruleType: ruleType || "constancy",
      rules,
      distractorSubtlety: cfg.distractorSubtlety,
    },
  };
}

// ── Numeric series ────────────────────────────────────────────────────────────

/** Max object count drawable as a tidy group (object-notation constraint). */
const OBJECT_TERM_MAX = 12;

/** Compute the visible terms and the hidden next term for a v2 series rule. */
export function buildSeries(
  rule: SeriesRuleClass,
  visible: number,
  rng: Rng,
): { terms: number[]; next: number } {
  const n = visible + 1; // include the hidden term, then split it off
  const terms: number[] = [];
  switch (rule) {
    case "plusOneTwo": {
      const s = intInRange(rng, 1, 3);
      const k = intInRange(rng, 1, 2);
      for (let i = 0; i < n; i++) terms.push(s + i * k);
      break;
    }
    case "plusK": {
      const s = intInRange(rng, 1, 9);
      const k = intInRange(rng, 2, 5);
      for (let i = 0; i < n; i++) terms.push(s + i * k);
      break;
    }
    case "minusK": {
      const k = intInRange(rng, 1, 3);
      const s = k * n + intInRange(rng, 1, 4);
      for (let i = 0; i < n; i++) terms.push(s - i * k);
      break;
    }
    case "alternating": {
      let v = intInRange(rng, 2, 6);
      const a = intInRange(rng, 2, 4);
      let b = intInRange(rng, 1, 3);
      while (b === a) b = intInRange(rng, 1, 3);
      terms.push(v);
      for (let i = 1; i < n; i++) {
        v += i % 2 === 1 ? a : -b;
        terms.push(v);
      }
      break;
    }
    case "timesTwo": {
      const s = intInRange(rng, 1, 4);
      for (let i = 0; i < n; i++) terms.push(s * 2 ** i);
      break;
    }
    case "timesK": {
      const s = intInRange(rng, 1, 4);
      const k = intInRange(rng, 2, 3);
      for (let i = 0; i < n; i++) terms.push(s * k ** i);
      break;
    }
    case "interleaved": {
      const a0 = intInRange(rng, 1, 5);
      const ka = intInRange(rng, 1, 3);
      const b0 = intInRange(rng, 6, 12);
      let kb = intInRange(rng, 1, 3);
      while (kb === ka) kb = intInRange(rng, 1, 3);
      for (let i = 0; i < n; i++) {
        const j = Math.floor(i / 2);
        terms.push(i % 2 === 0 ? a0 + j * ka : b0 + j * kb);
      }
      break;
    }
    case "timesThenPlus": {
      let v = intInRange(rng, 1, 3);
      const p = intInRange(rng, 1, 3);
      terms.push(v);
      for (let i = 1; i < n; i++) {
        v = i % 2 === 1 ? v * 2 : v + p;
        terms.push(v);
      }
      break;
    }
    case "secondOrder": {
      const t0 = intInRange(rng, 1, 5);
      const d1 = intInRange(rng, 1, 4);
      const d2 = intInRange(rng, 1, 3);
      for (let i = 0; i < n; i++)
        terms.push(t0 + i * d1 + (d2 * i * (i - 1)) / 2);
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
  }
  const next = terms[terms.length - 1];
  return { terms: terms.slice(0, visible), next };
}

function generateSeries(
  level: number,
  seed: string,
  age?: number,
): GfSeriesItem {
  const cfg = gfLevel(level);
  const notation: "objects" | "digits" =
    age !== undefined && clampTaskAge(age) < GF_SERIES_OBJECTS_UNDER_AGE
      ? "objects"
      : "digits";

  // Object notation must stay countable: retry deterministic parameter draws
  // until every term (and the answer) fits the drawable range.
  let terms: number[] = [];
  let next = 0;
  for (let attempt = 0; attempt < 30; attempt++) {
    const rng = makeRng(deriveSeed(seed, "series", attempt));
    const built = buildSeries(cfg.seriesRule, cfg.seriesVisible, rng);
    terms = built.terms;
    next = built.next;
    if (notation === "digits") break;
    const all = [...terms, next];
    if (all.every((t) => t >= 1 && t <= OBJECT_TERM_MAX)) break;
  }

  const rng = makeRng(deriveSeed(seed, "series-options"));
  const optionCount = clampOptionCount(4, age);
  const floor = notation === "objects" ? 1 : undefined;
  const ceil = notation === "objects" ? OBJECT_TERM_MAX : undefined;
  const inRange = (v: number) =>
    (floor === undefined || v >= floor) && (ceil === undefined || v <= ceil);

  // Plausible distractors near the true next term.
  const lastDiff = terms[terms.length - 1] - terms[terms.length - 2];
  const pool = [
    next + lastDiff,
    next - lastDiff,
    next + 1,
    next - 1,
    next * 2 - terms[terms.length - 1],
    terms[terms.length - 1] * 2,
  ].filter((v) => inRange(v));
  const distractors: number[] = [];
  const used = new Set<number>([next]);
  for (const cand of shuffle(rng, pool)) {
    if (distractors.length >= optionCount - 1) break;
    if (!used.has(cand)) {
      used.add(cand);
      distractors.push(cand);
    }
  }
  // Top up if the pool collided: walk outward from `next` within range.
  let delta = 2;
  let guard = 0;
  while (distractors.length < optionCount - 1 && guard++ < 100) {
    const cand = next + delta;
    if (inRange(cand) && !used.has(cand)) {
      used.add(cand);
      distractors.push(cand);
    }
    delta = delta > 0 ? -delta : -delta + 1;
  }

  const options = shuffle(rng, [next, ...distractors]);
  const answer = options.indexOf(next);

  return {
    ...makeBase("gf", level, seed),
    stimulus: { family: "series", terms, notation },
    options,
    answer,
    meta: { family: "series", ruleType: cfg.seriesRule },
  };
}

/** Whether the series family is legal at this level for this age (v2 §1). */
export function seriesAllowed(level: number, age?: number): boolean {
  if (age === undefined) return true;
  return (
    clampTaskAge(age) >= GF_SERIES_TIMES_FROM_AGE ||
    level <= GF_SERIES_MAX_LEVEL_UNDER_9
  );
}

/**
 * Generate a Gf item. Family is chosen deterministically from the seed unless
 * `opts.family` ("matrix" | "series") forces one. Below age 9 the series family
 * is capped at L4 — above the cap a matrix item is substituted (×-rules are not
 * age-appropriate; the substitution also applies to a forced "series").
 */
export function generate(
  level: number,
  seed: string,
  opts?: { family?: string; age?: number },
): GfItem {
  const age = opts?.age;
  const family =
    opts?.family ??
    (makeRng(`${seed}|gf-family`)() < 0.5 ? "matrix" : "series");
  if (family === "series" && seriesAllowed(level, age)) {
    return generateSeries(level, seed, age);
  }
  return generateMatrix(level, seed, age);
}
