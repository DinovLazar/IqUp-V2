import { describe, expect, it } from "vitest";
import { efLevel } from "@/content/tasks/levels";
import {
  generateItem,
  isGfMatrix,
  isGfSeries,
  type Move,
  type Point,
} from "@/features/tasks";
import type {
  MatrixAttrRule,
  MatrixCell,
  TowerMove,
  TowerState,
} from "@/features/tasks";
import { GLR_CONFLICT_GROUPS } from "@/features/tasks/glr";

const SEEDS = ["k1", "k2", "k3", "k4", "k5", "k6"];
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ── Independent re-implementations (deliberately NOT importing generator code) ──

/** Independent BFS over the Tower of London state space. */
function towerMinMoves(
  start: TowerState,
  goal: TowerState,
  caps: number[],
): number {
  const key = (s: TowerState) => s.map((p) => p.join(".")).join("|");
  const goalKey = key(goal);
  const seen = new Set([key(start)]);
  let frontier: TowerState[] = [start];
  let dist = 0;
  while (frontier.length) {
    if (frontier.some((s) => key(s) === goalKey)) return dist;
    const next: TowerState[] = [];
    for (const s of frontier) {
      for (let from = 0; from < s.length; from++) {
        if (!s[from].length) continue;
        for (let to = 0; to < s.length; to++) {
          if (to === from || s[to].length >= caps[to]) continue;
          const ns = s.map((p) => p.slice());
          ns[to].push(ns[from].pop() as number);
          const k = key(ns);
          if (!seen.has(k)) {
            seen.add(k);
            next.push(ns);
          }
        }
      }
    }
    frontier = next;
    dist++;
  }
  return Infinity;
}

function applyTowerPath(
  start: TowerState,
  path: TowerMove[],
  caps: number[],
): TowerState {
  const s = start.map((p) => p.slice());
  for (const { from, to } of path) {
    expect(s[from].length).toBeGreaterThan(0);
    expect(s[to].length).toBeLessThan(caps[to]);
    s[to].push(s[from].pop() as number);
  }
  return s;
}

/**
 * Independent constrained check (v2 §6): DFS over minimal paths that never
 * vacate a ball's goal peg. If none reaches the goal, greedy ("always place a
 * correct ball, never un-place one") cannot achieve minMoves → constrained.
 */
function greedyReachesOptimal(
  start: TowerState,
  goal: TowerState,
  caps: number[],
): boolean {
  const key = (s: TowerState) => s.map((p) => p.join(".")).join("|");
  const goalPeg: number[] = [];
  goal.forEach((peg, i) => peg.forEach((b) => (goalPeg[b] = i)));
  const min = towerMinMoves(start, goal, caps);
  const goalKey = key(goal);
  const seen = new Set<string>();
  const dfs = (s: TowerState, depth: number): boolean => {
    const k = key(s);
    if (k === goalKey) return true;
    if (depth >= min || seen.has(`${k}|${depth}`)) return false;
    seen.add(`${k}|${depth}`);
    for (let from = 0; from < s.length; from++) {
      if (!s[from].length) continue;
      const ball = s[from][s[from].length - 1];
      if (from === goalPeg[ball]) continue; // never vacate a goal peg
      for (let to = 0; to < s.length; to++) {
        if (to === from || s[to].length >= caps[to]) continue;
        const ns = s.map((p) => p.slice());
        ns[to].push(ns[from].pop() as number);
        if (dfs(ns, depth + 1)) return true;
      }
    }
    return false;
  };
  return dfs(start, 0);
}

const SHAPES = ["circle", "square", "triangle", "diamond", "star", "hexagon"];

/** Independent evaluation of a matrix attribute rule at (r, c) — v2 kinds. */
function evalRule(rule: MatrixAttrRule, r: number, c: number): number {
  let v = 0;
  if (rule.kind === "constant") v = rule.base;
  else if (rule.kind === "progRow") v = rule.base + r * rule.stepR;
  else if (rule.kind === "progCol") v = rule.base + c * rule.stepC;
  else if (rule.kind === "progBoth")
    v = rule.base + r * rule.stepR + c * rule.stepC;
  else if (rule.kind === "xor") {
    const a = rule.xorCol0 ?? [];
    const b = rule.xorCol1 ?? [];
    v = c === 0 ? a[r] : c === 1 ? b[r] : a[r] ^ b[r];
  } else if (rule.kind === "addSub") {
    const a = rule.addCol0 ?? [];
    const b = rule.addCol1 ?? [];
    const sign = rule.addSign ?? 1;
    v = c === 0 ? a[r] : c === 1 ? b[r] : a[r] + sign * b[r];
  } else if (rule.kind === "distThree") {
    const values = rule.distValues ?? [];
    const latin = rule.latin ?? [];
    return values[latin[r][c]];
  }
  if (rule.domainSize > 0)
    v = ((v % rule.domainSize) + rule.domainSize) % rule.domainSize;
  return v;
}

/** The numeric value a cell holds for one attribute (inverse of cellFrom). */
function cellValue(cell: MatrixCell, attr: MatrixAttrRule["attr"]): number {
  if (attr === "shape") return SHAPES.indexOf(cell.shape);
  if (attr === "count") return cell.count;
  if (attr === "colorIndex") return cell.colorIndex;
  if (attr === "size") return cell.size;
  return cell.rotation / 90;
}

// grid move helpers (independent)
const DELTA: Record<Move, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
const step = (p: Point, m: Move): Point => ({
  x: p.x + DELTA[m][0],
  y: p.y + DELTA[m][1],
});
const inBounds = (p: Point, n: number) =>
  p.x >= 0 && p.y >= 0 && p.x < n && p.y < n;
const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

function runProgram(
  start: Point,
  prog: readonly Move[],
  n: number,
  obstacles: readonly Point[] = [],
): Point | null {
  let p = start;
  for (const m of prog) {
    const np = step(p, m);
    if (!inBounds(np, n) || obstacles.some((o) => samePoint(o, np)))
      return null;
    p = np;
  }
  return p;
}

/** Independent BFS shortest-path length on the obstacle grid. */
function bfsShortest(
  start: Point,
  goal: Point,
  n: number,
  obstacles: readonly Point[],
): number {
  const key = (p: Point) => `${p.x},${p.y}`;
  const blocked = new Set(obstacles.map(key));
  const seen = new Set([key(start)]);
  let frontier = [start];
  let d = 0;
  while (frontier.length) {
    if (frontier.some((p) => samePoint(p, goal))) return d;
    const next: Point[] = [];
    for (const p of frontier) {
      for (const m of ["up", "down", "left", "right"] as Move[]) {
        const np = step(p, m);
        const k = key(np);
        if (!inBounds(np, n) || blocked.has(k) || seen.has(k)) continue;
        seen.add(k);
        next.push(np);
      }
    }
    frontier = next;
    d++;
  }
  return Infinity;
}

// ── EF ────────────────────────────────────────────────────────────────────────

describe("answer key — EF (Tower of London)", () => {
  it("minMoves matches an independent BFS and the optimal path solves the puzzle", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({ signal: "ef", level, seed });
        if (item.signal !== "ef") continue;
        const { start, goal, pegCapacities } = item.stimulus;
        const bfs = towerMinMoves(start, goal, pegCapacities);
        expect(item.answer.minMoves).toBe(bfs);
        expect(item.answer.minMoves).toBe(efLevel(level).minMoves);
        expect(item.answer.optimalPath.length).toBe(bfs);
        const end = applyTowerPath(
          start,
          item.answer.optimalPath,
          pegCapacities,
        );
        expect(end).toEqual(goal);
      }
    }
  });

  it("constrained levels are greedy-unsolvable at minMoves; plain levels are not (v2)", () => {
    for (const level of LEVELS) {
      const cfg = efLevel(level);
      for (const seed of SEEDS) {
        const item = generateItem({ signal: "ef", level, seed });
        if (item.signal !== "ef") continue;
        expect(item.meta.constrained).toBe(cfg.constrained);
        const greedyWins = greedyReachesOptimal(
          item.stimulus.start,
          item.stimulus.goal,
          item.stimulus.pegCapacities,
        );
        expect(greedyWins).toBe(!cfg.constrained);
      }
    }
  });
});

// ── Gf ────────────────────────────────────────────────────────────────────────

describe("answer key — Gf (matrix)", () => {
  it("the answer completes the grid and every visible cell obeys the declared rules", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "gf",
          level,
          seed,
          family: "matrix",
        });
        if (!isGfMatrix(item)) continue;
        const { size, cells, blankIndex } = item.stimulus;
        const rules = item.meta.rules;
        const correct = item.options[item.answer];

        // The full grid = visible cells with the answer placed in the blank.
        const full: (MatrixCell | null)[] = cells.slice();
        full[blankIndex] = correct;

        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const cell = full[r * size + c];
            expect(cell).not.toBeNull();
            for (const rule of rules) {
              expect(cellValue(cell as MatrixCell, rule.attr)).toBe(
                evalRule(rule, r, c),
              );
            }
          }
        }
      }
    }
  });
});

describe("answer key — Gf (series)", () => {
  it("the answer is the true next term, inferred independently from the visible terms", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "gf",
          level,
          seed,
          family: "series",
        });
        if (!isGfSeries(item)) continue;
        const t = item.stimulus.terms;
        const ruleType = item.meta.ruleType;
        const answer = item.options[item.answer];
        const last = t[t.length - 1];
        let next: number;
        switch (ruleType) {
          case "plusOneTwo":
          case "plusK":
          case "minusK":
            next = last + (t[1] - t[0]);
            break;
          case "alternating":
            // diffs alternate; the next diff repeats the one two steps back.
            next = last + (t[t.length - 2] - t[t.length - 3]);
            break;
          case "timesTwo":
          case "timesK":
            next = last * (t[1] / t[0]);
            break;
          case "interleaved":
            // sub-series A occupies the even positions; next continues A.
            next = t[t.length - 2] + (t[t.length - 2] - t[t.length - 4]);
            break;
          case "timesThenPlus":
            // ops alternate ×2 then +p from index 1; index 5 (the next) is ×2.
            next = last * 2;
            break;
          case "secondOrder": {
            const d1 = last - t[t.length - 2];
            const d2 = last - 2 * t[t.length - 2] + t[t.length - 3];
            next = last + d1 + d2;
            break;
          }
          case "fibonacci":
            next = last + t[t.length - 2];
            break;
        }
        expect(answer).toBe(next);
      }
    }
  });
});

// ── Gsm ───────────────────────────────────────────────────────────────────────

describe("answer key — Gsm (Corsi)", () => {
  it("forward answer equals the sequence; backward answer is its reversal", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const fwd = generateItem({
          signal: "gsm",
          level,
          seed,
          length: 5,
          direction: "forward",
          path: "simple",
        });
        const bwd = generateItem({
          signal: "gsm",
          level,
          seed,
          length: 5,
          direction: "backward",
          path: "simple",
        });
        if (fwd.signal !== "gsm" || bwd.signal !== "gsm") continue;
        expect(fwd.answer).toEqual(fwd.stimulus.sequence);
        expect(bwd.answer).toEqual(bwd.stimulus.sequence.slice().reverse());
        // Same seed+length+path → same underlying sequence either direction.
        expect(bwd.stimulus.sequence).toEqual(fwd.stimulus.sequence);
      }
    }
  });

  it("crisscross sequences keep consecutive tiles non-adjacent (v2)", () => {
    for (const seed of SEEDS) {
      for (const age of [5, 9, 13]) {
        const item = generateItem({
          signal: "gsm",
          level: 9, // length 7, crisscross
          seed,
          age,
        });
        if (item.signal !== "gsm") continue;
        const { tiles, sequence, path } = item.stimulus;
        expect(path).toBe("crisscross");
        for (let i = 1; i < sequence.length; i++) {
          const a = tiles[sequence[i - 1]];
          const b = tiles[sequence[i]];
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });
});

// ── Gs ────────────────────────────────────────────────────────────────────────

describe("answer key — Gs (symbol search)", () => {
  it("every answer cell holds a target and no other cell does", () => {
    for (let age = 5; age <= 13; age++) {
      for (const seed of SEEDS) {
        const item = generateItem({ signal: "gs", level: 1, seed, age });
        if (item.signal !== "gs") continue;
        const targets = new Set(item.stimulus.targets);
        const answerSet = new Set(item.answer);
        item.stimulus.cells.forEach((sym, i) => {
          expect(answerSet.has(i)).toBe(targets.has(sym));
        });
      }
    }
  });

  it("distractors are REAL tier variants: rotations/reflections (2) or near-miss details (3) of the target glyphs (v2)", () => {
    const familyOf = (id: number) => Math.floor(id / 6);
    const variantOf = (id: number) => id % 6;
    for (let age = 5; age <= 13; age++) {
      for (const seed of SEEDS) {
        const item = generateItem({ signal: "gs", level: 1, seed, age });
        if (item.signal !== "gs") continue;
        const [tMin, tMax] = item.meta.similarity;
        const targetFamilies = new Set(item.stimulus.targets.map(familyOf));
        // Targets are base variants.
        for (const target of item.stimulus.targets) {
          expect(variantOf(target)).toBe(0);
        }
        const answerSet = new Set(item.answer);
        item.stimulus.cells.forEach((sym, i) => {
          if (answerSet.has(i)) return; // a target cell
          const fam = familyOf(sym);
          const variant = variantOf(sym);
          if (targetFamilies.has(fam)) {
            // Same family as a target → must be a transform/detail variant.
            expect(variant).toBeGreaterThanOrEqual(1);
            const tier = variant <= 3 ? 2 : 3;
            expect(tier).toBeGreaterThanOrEqual(tMin);
            expect(tier).toBeLessThanOrEqual(tMax);
          } else {
            // Unrelated family → only legal when tier 1 is in range.
            expect(variant).toBe(0);
            expect(tMin).toBe(1);
          }
        });
      }
    }
  });
});

// ── Glr ───────────────────────────────────────────────────────────────────────

describe("answer key — Glr (paired-associate)", () => {
  it("each trial's correct option is the target paired with the cue", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({ signal: "glr", level, seed });
        if (item.signal !== "glr") continue;
        const map = new Map(item.stimulus.pairs.map((p) => [p.cue, p.target]));
        item.stimulus.trials.forEach((trial, i) => {
          expect(item.answer[i]).toBe(trial.correct);
          expect(trial.options[trial.correct]).toBe(map.get(trial.cue));
        });
      }
    }
  });

  it("no two glyphs in one item are rotations/reflections of each other (v2 guard)", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({ signal: "glr", level, seed });
        if (item.signal !== "glr") continue;
        const ids = new Set<number>();
        for (const pair of item.stimulus.pairs) {
          ids.add(pair.cue);
          ids.add(pair.target);
        }
        for (const group of GLR_CONFLICT_GROUPS) {
          const hits = group.filter((g) => ids.has(g));
          expect(hits.length).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

// ── CT ────────────────────────────────────────────────────────────────────────

describe("answer key — CT sequence", () => {
  it("exactly one option reaches the goal (obstacles respected) and it is the answer", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "sequence",
        });
        if (item.signal !== "ct" || item.stimulus.subtype !== "sequence")
          continue;
        const { start, goal, gridSize, obstacles, options } = item.stimulus;
        const winners = options
          .map((prog, i) => ({
            i,
            end: runProgram(start, prog, gridSize, obstacles),
          }))
          .filter(({ end }) => end !== null && samePoint(end as Point, goal));
        expect(winners).toHaveLength(1);
        if (item.answer.kind === "optionIndex")
          expect(winners[0].i).toBe(item.answer.value);
      }
    }
  });
});

describe("answer key — CT debug", () => {
  it("the answer is the first (and only executed) illegal step", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "debug",
        });
        if (item.signal !== "ct" || item.stimulus.subtype !== "debug") continue;
        const { start, gridSize, program, obstacles } = item.stimulus;
        let p = start;
        let firstIllegal = -1;
        for (let i = 0; i < program.length; i++) {
          const np = step(p, program[i]);
          if (
            !inBounds(np, gridSize) ||
            obstacles.some((o) => samePoint(o, np))
          ) {
            firstIllegal = i;
            break;
          }
          p = np;
        }
        expect(firstIllegal).toBeGreaterThanOrEqual(0);
        if (item.answer.kind === "stepIndex")
          expect(firstIllegal).toBe(item.answer.value);
      }
    }
  });
});

describe("answer key — CT loop", () => {
  it("exactly one option expands to the flat sequence and it is the answer", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "loop",
        });
        if (item.signal !== "ct" || item.stimulus.subtype !== "loop") continue;
        const flat = item.stimulus.sequence;
        const winners = item.stimulus.options
          .map((l, i) => ({
            i,
            exp: Array.from({ length: l.times }, () => l.body).flat(),
          }))
          .filter(
            ({ exp }) =>
              exp.length === flat.length && exp.every((m, k) => m === flat[k]),
          );
        expect(winners).toHaveLength(1);
        if (item.answer.kind === "optionIndex")
          expect(winners[0].i).toBe(item.answer.value);
      }
    }
  });
});

describe("answer key — CT loopEvent", () => {
  it("exactly one body, repeated, lands on the event tile and it is the answer", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "loopEvent",
        });
        if (item.signal !== "ct" || item.stimulus.subtype !== "loopEvent")
          continue;
        const { start, eventTile, gridSize, obstacles, options } =
          item.stimulus;
        const reaches = (body: readonly Move[]): boolean => {
          let p = start;
          for (let rep = 0; rep < 8; rep++) {
            for (const m of body) {
              const np = step(p, m);
              if (
                !inBounds(np, gridSize) ||
                obstacles.some((o) => samePoint(o, np))
              )
                return false;
              p = np;
              if (samePoint(p, eventTile)) return true;
            }
          }
          return false;
        };
        const winners = options
          .map((body, i) => ({ i, hit: reaches(body) }))
          .filter(({ hit }) => hit);
        expect(winners).toHaveLength(1);
        if (item.answer.kind === "optionIndex")
          expect(winners[0].i).toBe(item.answer.value);
      }
    }
  });
});

describe("answer key — CT condition + conditionLoop", () => {
  it("exactly one option applies the mapping and it is the answer", () => {
    for (const subtype of ["condition", "conditionLoop"] as const) {
      for (const level of LEVELS) {
        for (const seed of SEEDS) {
          const item = generateItem({ signal: "ct", level, seed, subtype });
          if (
            item.signal !== "ct" ||
            (item.stimulus.subtype !== "condition" &&
              item.stimulus.subtype !== "conditionLoop")
          )
            continue;
          const map = new Map(item.stimulus.rules.map((r) => [r.when, r.then]));
          const expected = item.stimulus.input.map((c) => map.get(c));
          const winners = item.stimulus.options
            .map((o, i) => ({ i, o }))
            .filter(
              ({ o }) =>
                o.length === expected.length &&
                o.every((m, k) => m === expected[k]),
            );
          expect(winners).toHaveLength(1);
          if (item.answer.kind === "optionIndex")
            expect(winners[0].i).toBe(item.answer.value);

          // conditionLoop: the input really repeats its base pattern.
          if (item.stimulus.subtype === "conditionLoop") {
            const p = item.stimulus.patternLength as number;
            expect(p).toBeGreaterThanOrEqual(2);
            const input = item.stimulus.input;
            expect(input.length % p).toBe(0);
            for (let i = p; i < input.length; i++) {
              expect(input[i]).toBe(input[i % p]);
            }
          }
        }
      }
    }
  });
});

describe("answer key — CT nestedLoop", () => {
  it("exactly one nested expression expands to the flat sequence", () => {
    const expand = (e: {
      outerTimes: number;
      pre: Move[];
      innerTimes: number;
      innerBody: Move[];
      post: Move[];
    }): Move[] => {
      const once = [
        ...e.pre,
        ...Array.from({ length: e.innerTimes }, () => e.innerBody).flat(),
        ...e.post,
      ];
      return Array.from({ length: e.outerTimes }, () => once).flat();
    };
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "nestedLoop",
        });
        if (item.signal !== "ct" || item.stimulus.subtype !== "nestedLoop")
          continue;
        const flat = item.stimulus.sequence;
        const winners = item.stimulus.options
          .map((e, i) => ({ i, exp: expand(e) }))
          .filter(
            ({ exp }) =>
              exp.length === flat.length && exp.every((m, k) => m === flat[k]),
          );
        expect(winners).toHaveLength(1);
        if (item.answer.kind === "optionIndex")
          expect(winners[0].i).toBe(item.answer.value);
      }
    }
  });
});

describe("answer key — CT counter", () => {
  it("the answer continues the growing (counter-driven) segment pattern", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "counter",
        });
        if (item.signal !== "ct" || item.stimulus.subtype !== "counter")
          continue;
        const { sequence, segmentLengths, options } = item.stimulus;
        // Reconstruct the segments and infer the unit + separator + count.
        const segments: Move[][] = [];
        let at = 0;
        for (const len of segmentLengths) {
          segments.push(sequence.slice(at, at + len));
          at += len;
        }
        const k = segments.length;
        const unit = segments[0][0];
        const sep = segments[0][segments[0].length - 1];
        segments.forEach((seg, i) => {
          expect(seg.length).toBe(i + 2); // (i+1) units + separator
          expect(seg.slice(0, -1).every((m) => m === unit)).toBe(true);
          expect(seg[seg.length - 1]).toBe(sep);
        });
        const expected = [...Array.from({ length: k + 1 }, () => unit), sep];
        const winners = options
          .map((o, i) => ({ i, o }))
          .filter(
            ({ o }) =>
              o.length === expected.length &&
              o.every((m, j) => m === expected[j]),
          );
        expect(winners).toHaveLength(1);
        if (item.answer.kind === "optionIndex")
          expect(winners[0].i).toBe(item.answer.value);
      }
    }
  });
});

describe("answer key — CT optimize", () => {
  it("exactly one option reaches the goal in the BFS-minimal move count", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "optimize",
        });
        if (item.signal !== "ct" || item.stimulus.subtype !== "optimize")
          continue;
        const { start, goal, gridSize, obstacles, options, redundantProgram } =
          item.stimulus;
        const minimal = bfsShortest(start, goal, gridSize, obstacles);
        expect(minimal).toBeLessThan(Infinity);
        // The redundant program works but is wasteful.
        const redundantEnd = runProgram(
          start,
          redundantProgram,
          gridSize,
          obstacles,
        );
        expect(redundantEnd).not.toBeNull();
        expect(samePoint(redundantEnd as Point, goal)).toBe(true);
        expect(redundantProgram.length).toBeGreaterThan(minimal);
        // Exactly one option is BOTH goal-reaching AND minimal.
        const winners = options
          .map((prog, i) => ({
            i,
            end: runProgram(start, prog, gridSize, obstacles),
            len: prog.length,
          }))
          .filter(
            ({ end, len }) =>
              end !== null && samePoint(end as Point, goal) && len === minimal,
          );
        expect(winners).toHaveLength(1);
        if (item.answer.kind === "optionIndex")
          expect(winners[0].i).toBe(item.answer.value);
      }
    }
  });
});
