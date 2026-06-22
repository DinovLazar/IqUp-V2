/**
 * CT — STEM (computational thinking). Five symbol/grid-based sub-types, all
 * language-neutral (no text emitted — instructions are the renderer's job via
 * i18n in 1.06). Spec A.8, Дел 4.
 *
 *   • sequence  — pick the move-program that drives the robot to the goal.
 *   • debug     — one step crashes into a wall; tap that step's index.
 *   • loop      — pick the loop expression equal to a flat repeated sequence.
 *   • condition — apply an if→then mapping to an input; pick the output.
 *   • maze      — a perfect-maze grid with a single solution path.
 *
 * Every answer key is verified by construction (and re-verified by the tests):
 * exactly one option reaches the goal / expands to the sequence / applies the
 * mapping; the debug bug is the first illegal move; the maze path is the unique
 * route through a spanning-tree maze.
 */

import { ctLevel } from "@/content/tasks/levels";
import {
  deriveSeed,
  intInRange,
  makeRng,
  pick,
  shuffle,
  type Rng,
} from "@/lib/prng";
import { makeBase } from "./shared";
import type {
  CtItem,
  CtMazeCellWalls,
  CtSubtype,
  LoopExpr,
  Move,
  Point,
  Program,
} from "./types";

const MOVES: readonly Move[] = ["up", "down", "left", "right"];
const DELTA: Record<Move, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const inBounds = (p: Point, size: number): boolean =>
  p.x >= 0 && p.y >= 0 && p.x < size && p.y < size;
const applyMove = (p: Point, m: Move): Point => ({
  x: p.x + DELTA[m].dx,
  y: p.y + DELTA[m].dy,
});
const eq = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;
const isBorder = (p: Point, size: number): boolean =>
  p.x === 0 || p.y === 0 || p.x === size - 1 || p.y === size - 1;

const legalMovesFrom = (p: Point, size: number): Move[] =>
  MOVES.filter((m) => inBounds(applyMove(p, m), size));
const exitingMovesFrom = (p: Point, size: number): Move[] =>
  MOVES.filter((m) => !inBounds(applyMove(p, m), size));

/** Run a program; return the final cell, or null if a move leaves the grid. */
function runProgram(start: Point, prog: Program, size: number): Point | null {
  let p = start;
  for (const m of prog) {
    const np = applyMove(p, m);
    if (!inBounds(np, size)) return null;
    p = np;
  }
  return p;
}

const reachesGoal = (
  start: Point,
  prog: Program,
  goal: Point,
  size: number,
): boolean => {
  const end = runProgram(start, prog, size);
  return end !== null && eq(end, goal);
};

const programEq = (a: Program, b: Program): boolean =>
  a.length === b.length && a.every((m, i) => m === b[i]);

/** A monotonic L-shaped path from start to goal (always within bounds). */
function manhattanPath(start: Point, goal: Point): Program {
  const moves: Move[] = [];
  for (let dx = goal.x - start.x; dx !== 0; dx += dx > 0 ? -1 : 1)
    moves.push(dx > 0 ? "right" : "left");
  for (let dy = goal.y - start.y; dy !== 0; dy += dy > 0 ? -1 : 1)
    moves.push(dy > 0 ? "down" : "up");
  return moves;
}

/** A random legal walk of `n` moves; returns moves and the visited cells. */
function legalWalk(
  rng: Rng,
  start: Point,
  n: number,
  size: number,
): { moves: Move[]; positions: Point[] } {
  const moves: Move[] = [];
  const positions: Point[] = [start];
  let p = start;
  for (let i = 0; i < n; i++) {
    const m = pick(rng, legalMovesFrom(p, size));
    moves.push(m);
    p = applyMove(p, m);
    positions.push(p);
  }
  return { moves, positions };
}

// ── sequence ──────────────────────────────────────────────────────────────────

function generateSequence(level: number, seed: string): CtItem {
  const cfg = ctLevel(level);
  const rng = makeRng(deriveSeed(seed, "sequence"));
  const size = cfg.gridSize;

  const start: Point = {
    x: intInRange(rng, 0, size - 1),
    y: intInRange(rng, 0, size - 1),
  };
  let goal: Point = start;
  while (eq(goal, start))
    goal = { x: intInRange(rng, 0, size - 1), y: intInRange(rng, 0, size - 1) };

  const correct = manhattanPath(start, goal);

  // Distractors: mutated programs that do NOT reach the goal.
  const distractors: Program[] = [];
  const seen = new Set<string>([correct.join("")]);
  let guard = 0;
  while (distractors.length < 3 && guard++ < 300) {
    const cand = correct.slice();
    const i = intInRange(rng, 0, cand.length - 1);
    cand[i] = pick(
      rng,
      MOVES.filter((m) => m !== cand[i]),
    );
    const key = cand.join("");
    if (!seen.has(key) && !reachesGoal(start, cand, goal, size)) {
      seen.add(key);
      distractors.push(cand);
    }
  }

  const options = shuffle(rng, [correct, ...distractors]);
  const answer = options.findIndex((o) => programEq(o, correct));

  return {
    ...makeBase("ct", level, seed),
    stimulus: { subtype: "sequence", gridSize: size, start, goal, options },
    answer: { kind: "optionIndex", value: answer },
    meta: { ctSubtype: "sequence" },
  };
}

// ── debug ─────────────────────────────────────────────────────────────────────

function generateDebug(level: number, seed: string): CtItem {
  const cfg = ctLevel(level);
  const size = cfg.gridSize;
  const len = cfg.programLength;

  // A fully-legal walk whose move `b` (from a border cell) we swap for an
  // off-grid move. Under "stop on first illegal move", the bug is exactly b.
  let walk!: { moves: Move[]; positions: Point[] };
  let borderIdx: number[] = [];
  let start: Point = { x: 0, y: 0 };
  for (let attempt = 0; attempt < 40; attempt++) {
    const rng = makeRng(deriveSeed(seed, "debug", attempt));
    start = {
      x: intInRange(rng, 0, size - 1),
      y: intInRange(rng, 0, size - 1),
    };
    walk = legalWalk(rng, start, len, size);
    borderIdx = walk.positions
      .slice(0, len)
      .map((p, i) =>
        isBorder(p, size) && exitingMovesFrom(p, size).length > 0 ? i : -1,
      )
      .filter((i) => i >= 0);
    if (borderIdx.length > 0) break;
  }
  // Defensive corner fallback (border guaranteed at index 0).
  if (borderIdx.length === 0) {
    const rng = makeRng(deriveSeed(seed, "debug", "corner"));
    start = { x: 0, y: 0 };
    walk = legalWalk(rng, start, len, size);
    borderIdx = [0];
  }

  const rng = makeRng(deriveSeed(seed, "debug-bug"));
  const b = pick(rng, borderIdx);
  const bug = pick(rng, exitingMovesFrom(walk.positions[b], size));

  const program = walk.moves.slice();
  program[b] = bug; // the one wrong arrow (crashes off the grid)
  const goal = walk.positions[len]; // where the intended (legal) program ends

  return {
    ...makeBase("ct", level, seed),
    stimulus: { subtype: "debug", gridSize: size, start, goal, program },
    answer: { kind: "stepIndex", value: b },
    meta: { ctSubtype: "debug" },
  };
}

// ── loop ──────────────────────────────────────────────────────────────────────

const expandLoop = (l: LoopExpr): Move[] =>
  Array.from({ length: l.times }, () => l.body).flat();
const moveSeqEq = (a: Move[], b: Move[]): boolean =>
  a.length === b.length && a.every((m, i) => m === b[i]);

function generateLoop(level: number, seed: string): CtItem {
  const cfg = ctLevel(level);
  const rng = makeRng(deriveSeed(seed, "loop"));

  const body = Array.from({ length: cfg.loopBody }, () => pick(rng, MOVES));
  const times = cfg.loopTimes;
  const flat = expandLoop({ body, times });

  // Distractors: wrong repeat counts and a wrong body — none expands to `flat`.
  const altBody = body.slice();
  const j = intInRange(rng, 0, altBody.length - 1);
  altBody[j] = pick(
    rng,
    MOVES.filter((m) => m !== altBody[j]),
  );
  const candidates: LoopExpr[] = [
    { body, times: times + 1 },
    { body, times: Math.max(1, times - 1) },
    { body: altBody, times },
  ];
  const options = shuffle(rng, [{ body, times }, ...candidates]);
  const answer = options.findIndex((o) => moveSeqEq(expandLoop(o), flat));

  return {
    ...makeBase("ct", level, seed),
    stimulus: { subtype: "loop", sequence: flat, options },
    answer: { kind: "optionIndex", value: answer },
    meta: { ctSubtype: "loop" },
  };
}

// ── condition ─────────────────────────────────────────────────────────────────

function generateCondition(level: number, seed: string): CtItem {
  const cfg = ctLevel(level);
  const rng = makeRng(deriveSeed(seed, "condition"));

  const rules = Array.from({ length: cfg.conditionRules }, (_, i) => ({
    when: i,
    then: pick(rng, MOVES),
  }));
  const mapping = new Map(rules.map((r) => [r.when, r.then]));
  const input = Array.from({ length: cfg.conditionInput }, () =>
    intInRange(rng, 0, cfg.conditionRules - 1),
  );
  const correct = input.map((c) => mapping.get(c) as Move);

  // Distractors: outputs with one (or more) mismapped position.
  const distractors: Move[][] = [];
  const seen = new Set<string>([correct.join("")]);
  let guard = 0;
  while (distractors.length < 3 && guard++ < 200) {
    const cand = correct.slice();
    const i = intInRange(rng, 0, cand.length - 1);
    cand[i] = pick(
      rng,
      MOVES.filter((m) => m !== cand[i]),
    );
    const key = cand.join("");
    if (!seen.has(key)) {
      seen.add(key);
      distractors.push(cand);
    }
  }

  const options = shuffle(rng, [correct, ...distractors]);
  const answer = options.findIndex((o) => moveSeqEq(o, correct));

  return {
    ...makeBase("ct", level, seed),
    stimulus: { subtype: "condition", rules, input, options },
    answer: { kind: "optionIndex", value: answer },
    meta: { ctSubtype: "condition" },
  };
}

// ── maze ──────────────────────────────────────────────────────────────────────

const idx = (x: number, y: number, size: number): number => y * size + x;

/** Carve a perfect maze (spanning tree) with a randomized DFS backtracker. */
function carveMaze(rng: Rng, size: number): CtMazeCellWalls[] {
  const cells: CtMazeCellWalls[] = Array.from({ length: size * size }, () => ({
    n: true,
    e: true,
    s: true,
    w: true,
  }));
  const visited = new Set<number>();
  const stack: Point[] = [{ x: 0, y: 0 }];
  visited.add(idx(0, 0, size));

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const candidates = MOVES.map((m) => ({ m, np: applyMove(cur, m) })).filter(
      ({ np }) => inBounds(np, size) && !visited.has(idx(np.x, np.y, size)),
    );
    if (candidates.length === 0) {
      stack.pop();
      continue;
    }
    const { m, np } = pick(rng, candidates);
    // Knock down the wall between cur and np on both sides.
    const a = cells[idx(cur.x, cur.y, size)];
    const b = cells[idx(np.x, np.y, size)];
    if (m === "up") {
      a.n = false;
      b.s = false;
    } else if (m === "down") {
      a.s = false;
      b.n = false;
    } else if (m === "left") {
      a.w = false;
      b.e = false;
    } else {
      a.e = false;
      b.w = false;
    }
    visited.add(idx(np.x, np.y, size));
    stack.push(np);
  }
  return cells;
}

/** Open neighbours of a cell, derived from its walls. */
function mazeNeighbors(
  cells: CtMazeCellWalls[],
  p: Point,
  size: number,
): Move[] {
  const w = cells[idx(p.x, p.y, size)];
  const open: Move[] = [];
  if (!w.n) open.push("up");
  if (!w.s) open.push("down");
  if (!w.w) open.push("left");
  if (!w.e) open.push("right");
  return open;
}

/** The unique path start→goal through a spanning-tree maze (DFS). */
function solveMaze(
  cells: CtMazeCellWalls[],
  start: Point,
  goal: Point,
  size: number,
): { cells: Point[]; moves: Move[] } | null {
  const path: Point[] = [];
  const moves: Move[] = [];
  const visited = new Set<number>();
  const dfs = (p: Point, from: Move | null): boolean => {
    visited.add(idx(p.x, p.y, size));
    path.push(p);
    if (from) moves.push(from);
    if (eq(p, goal)) return true;
    for (const m of mazeNeighbors(cells, p, size)) {
      const np = applyMove(p, m);
      if (visited.has(idx(np.x, np.y, size))) continue;
      if (dfs(np, m)) return true;
    }
    path.pop();
    if (from) moves.pop();
    return false;
  };
  return dfs(start, null) ? { cells: path, moves } : null;
}

function generateMaze(level: number, seed: string): CtItem {
  const size = ctLevel(level).mazeSize;
  const rng = makeRng(deriveSeed(seed, "maze"));
  const cells = carveMaze(rng, size);
  const start: Point = { x: 0, y: 0 };
  const goal: Point = { x: size - 1, y: size - 1 };
  const solution = solveMaze(cells, start, goal, size);
  // A perfect maze is connected, so a solution always exists.
  const path = solution ?? { cells: [start], moves: [] };

  return {
    ...makeBase("ct", level, seed),
    stimulus: { subtype: "maze", size, cells, start, goal },
    answer: { kind: "path", cells: path.cells, moves: path.moves },
    meta: { ctSubtype: "maze" },
  };
}

// ── dispatch ──────────────────────────────────────────────────────────────────

const SUBTYPES: readonly CtSubtype[] = [
  "sequence",
  "debug",
  "loop",
  "condition",
  "maze",
];

const BUILDERS: Record<CtSubtype, (level: number, seed: string) => CtItem> = {
  sequence: generateSequence,
  debug: generateDebug,
  loop: generateLoop,
  condition: generateCondition,
  maze: generateMaze,
};

/**
 * Generate a CT item. Sub-type is chosen deterministically from the seed unless
 * `opts.subtype` forces one.
 */
export function generate(
  level: number,
  seed: string,
  opts?: { subtype?: CtSubtype },
): CtItem {
  const subtype =
    opts?.subtype ??
    SUBTYPES[Math.floor(makeRng(`${seed}|ct-subtype`)() * SUBTYPES.length)];
  return BUILDERS[subtype](level, seed);
}
