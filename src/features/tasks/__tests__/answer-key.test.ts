import { describe, expect, it } from "vitest";
import {
  generateItem,
  isGfMatrix,
  isGfSeries,
  type Move,
  type Point,
} from "@/features/tasks";
import type {
  CtMazeCellWalls,
  MatrixAttrRule,
  MatrixCell,
  TowerMove,
  TowerState,
} from "@/features/tasks";

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

const SHAPES = ["circle", "square", "triangle", "diamond", "star", "hexagon"];

/** Independent evaluation of a matrix attribute rule at (r, c). */
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

function runProgram(start: Point, prog: Move[], n: number): Point | null {
  let p = start;
  for (const m of prog) {
    const np = step(p, m);
    if (!inBounds(np, n)) return null;
    p = np;
  }
  return p;
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
        let next: number;
        if (ruleType === "arithmetic") {
          next = t[t.length - 1] + (t[1] - t[0]);
        } else if (ruleType === "geometric") {
          next = t[t.length - 1] * (t[1] / t[0]);
        } else if (ruleType === "fibonacci") {
          next = t[t.length - 1] + t[t.length - 2];
        } else if (ruleType === "alternating") {
          // diffs alternate; the next diff repeats the one two steps back.
          const lastDiff = t[t.length - 2] - t[t.length - 3];
          next = t[t.length - 1] + lastDiff;
        } else {
          // quadratic: constant second difference.
          const d1 = t[t.length - 1] - t[t.length - 2];
          const d2 = t[t.length - 1] - 2 * t[t.length - 2] + t[t.length - 3];
          next = t[t.length - 1] + d1 + d2;
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
        });
        const bwd = generateItem({
          signal: "gsm",
          level,
          seed,
          length: 5,
          direction: "backward",
        });
        if (fwd.signal !== "gsm" || bwd.signal !== "gsm") continue;
        expect(fwd.answer).toEqual(fwd.stimulus.sequence);
        expect(bwd.answer).toEqual(bwd.stimulus.sequence.slice().reverse());
        // Same seed+length → same underlying sequence regardless of direction.
        expect(bwd.stimulus.sequence).toEqual(fwd.stimulus.sequence);
      }
    }
  });
});

// ── Gs ────────────────────────────────────────────────────────────────────────

describe("answer key — Gs (symbol search)", () => {
  it("every answer cell holds a target and no other cell does", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({ signal: "gs", level, seed });
        if (item.signal !== "gs") continue;
        const targets = new Set(item.stimulus.targets);
        const answerSet = new Set(item.answer);
        item.stimulus.cells.forEach((sym, i) => {
          expect(answerSet.has(i)).toBe(targets.has(sym));
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
});

// ── CT ────────────────────────────────────────────────────────────────────────

describe("answer key — CT sequence", () => {
  it("exactly one option reaches the goal and it is the answer", () => {
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
        const { start, goal, gridSize, options } = item.stimulus;
        const winners = options
          .map((prog, i) => ({ i, end: runProgram(start, prog, gridSize) }))
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
        const { start, gridSize, program } = item.stimulus;
        let p = start;
        let firstIllegal = -1;
        for (let i = 0; i < program.length; i++) {
          const np = step(p, program[i]);
          if (!inBounds(np, gridSize)) {
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

describe("answer key — CT condition", () => {
  it("exactly one option applies the mapping and it is the answer", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "condition",
        });
        if (item.signal !== "ct" || item.stimulus.subtype !== "condition")
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
      }
    }
  });
});

describe("answer key — CT maze", () => {
  it("the maze is a spanning tree and the path is the unique valid route", () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const item = generateItem({
          signal: "ct",
          level,
          seed,
          subtype: "maze",
        });
        if (item.signal !== "ct" || item.stimulus.subtype !== "maze") continue;
        const { size, cells, start, goal } = item.stimulus;
        const at = (x: number, y: number): CtMazeCellWalls =>
          cells[y * size + x];

        // Count passages (each open wall shared by two cells → count once).
        let edges = 0;
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            if (!at(x, y).e && x + 1 < size) edges++;
            if (!at(x, y).s && y + 1 < size) edges++;
          }
        // A perfect maze (spanning tree): V−1 edges.
        expect(edges).toBe(size * size - 1);

        // Connected (so it's a tree, not a forest with a cycle).
        const seen = new Set<number>([start.y * size + start.x]);
        const queue: Point[] = [start];
        while (queue.length) {
          const p = queue.shift() as Point;
          const w = at(p.x, p.y);
          const nb: Point[] = [];
          if (!w.n) nb.push({ x: p.x, y: p.y - 1 });
          if (!w.s) nb.push({ x: p.x, y: p.y + 1 });
          if (!w.w) nb.push({ x: p.x - 1, y: p.y });
          if (!w.e) nb.push({ x: p.x + 1, y: p.y });
          for (const q of nb) {
            const k = q.y * size + q.x;
            if (!seen.has(k)) {
              seen.add(k);
              queue.push(q);
            }
          }
        }
        expect(seen.size).toBe(size * size);

        // The stored path is a valid, wall-respecting route start → goal.
        if (item.answer.kind === "path") {
          const { cells: path, moves } = item.answer;
          expect(path[0]).toEqual(start);
          expect(path[path.length - 1]).toEqual(goal);
          expect(moves.length).toBe(path.length - 1);
          for (let i = 0; i < moves.length; i++) {
            const a = path[i];
            const b = path[i + 1];
            expect(step(a, moves[i])).toEqual(b);
            // The wall between a and b must be open.
            const wa = at(a.x, a.y);
            const open =
              (moves[i] === "up" && !wa.n) ||
              (moves[i] === "down" && !wa.s) ||
              (moves[i] === "left" && !wa.w) ||
              (moves[i] === "right" && !wa.e);
            expect(open).toBe(true);
          }
        }
      }
    }
  });
});
