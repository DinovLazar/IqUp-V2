/**
 * CT — STEM (computational thinking), calibration v2. Nine symbol/board-based
 * task families, all language-neutral (no text emitted — instructions are the
 * renderer's job via i18n), mapped to the Bebras/CSTA/ScratchJr progression:
 *
 *   • sequence      — pick the move-program that drives the robot to the star.
 *   • debug         — one step crashes (off-grid / into an obstacle); tap it.
 *   • loop          — pick the loop expression equal to a flat repeated sequence.
 *   • loopEvent     — pick the loop BODY that, repeated, lands on the event tile.
 *   • condition     — apply an if→then mapping to an input; pick the output.
 *   • conditionLoop — the same mapping over a looped (repeating) input pattern.
 *   • nestedLoop    — pick the loop-in-loop expression equal to a flat sequence.
 *   • counter       — a growing (counter-driven) program; pick the next segment.
 *   • optimize      — pick the SHORTEST program that still reaches the star.
 *
 * Every answer key is verified by construction (and re-verified by the tests):
 * exactly one option reaches the goal / expands to the sequence / applies the
 * mapping / continues the counter / is minimal; the debug bug is the one
 * illegal move. The v1 maze family is retired (v2 §8 has no maze).
 */

import {
  clampOptionCount,
  ctLevel,
  type CtFamily,
} from "@/content/tasks/levels";
import {
  deriveSeed,
  intInRange,
  makeRng,
  pick,
  pickN,
  shuffle,
} from "@/lib/prng";
import { makeBase } from "./shared";
import type {
  CtItem,
  LoopExpr,
  Move,
  NestedLoopExpr,
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
const PERPENDICULAR: Record<Move, readonly Move[]> = {
  up: ["left", "right"],
  down: ["left", "right"],
  left: ["up", "down"],
  right: ["up", "down"],
};

const inBounds = (p: Point, size: number): boolean =>
  p.x >= 0 && p.y >= 0 && p.x < size && p.y < size;
const applyMove = (p: Point, m: Move): Point => ({
  x: p.x + DELTA[m].dx,
  y: p.y + DELTA[m].dy,
});
const eq = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;
const pKey = (p: Point): string => `${p.x},${p.y}`;

const blockedSet = (obstacles: readonly Point[]): Set<string> =>
  new Set(obstacles.map(pKey));

/** Run a program; null if a move leaves the grid or enters an obstacle. */
function runProgram(
  start: Point,
  prog: Program,
  size: number,
  obstacles: readonly Point[],
): Point | null {
  const blocked = blockedSet(obstacles);
  let p = start;
  for (const m of prog) {
    const np = applyMove(p, m);
    if (!inBounds(np, size) || blocked.has(pKey(np))) return null;
    p = np;
  }
  return p;
}

const reachesGoal = (
  start: Point,
  prog: Program,
  goal: Point,
  size: number,
  obstacles: readonly Point[],
): boolean => {
  const end = runProgram(start, prog, size, obstacles);
  return end !== null && eq(end, goal);
};

const programEq = (a: Program, b: Program): boolean =>
  a.length === b.length && a.every((m, i) => m === b[i]);
const moveSeqEq = (a: Move[], b: Move[]): boolean =>
  a.length === b.length && a.every((m, i) => m === b[i]);

// ── Path construction (straight runs with an exact turn count) ────────────────

interface BoardPath {
  start: Point;
  goal: Point;
  moves: Move[];
  /** All visited cells, start first. */
  positions: Point[];
  obstacles: Point[];
}

/**
 * A self-avoiding path of `len` moves with exactly `turns` direction changes
 * that fits the grid, plus `obstacleCount` obstacles placed adjacent to (never
 * on) the path so wrong programs actually crash.
 */
function pathWithTurns(
  seed: string,
  label: string,
  size: number,
  len: number,
  turns: number,
  obstacleCount: number,
): BoardPath {
  for (let attempt = 0; attempt < 80; attempt++) {
    const rng = makeRng(deriveSeed(seed, label, attempt));
    const runCount = Math.min(turns + 1, len);
    // Compose len into runCount positive runs.
    const runs = Array.from({ length: runCount }, () => 1);
    for (let extra = len - runCount; extra > 0; extra--) {
      runs[intInRange(rng, 0, runCount - 1)] += 1;
    }
    // Perpendicular direction changes at each turn.
    const dirs: Move[] = [pick(rng, MOVES)];
    for (let i = 1; i < runCount; i++) {
      dirs.push(pick(rng, PERPENDICULAR[dirs[i - 1]]));
    }
    const moves: Move[] = [];
    runs.forEach((r, i) => {
      for (let j = 0; j < r; j++) moves.push(dirs[i]);
    });
    // Fit onto the grid: relative walk → bounding box → pick a legal start.
    const rel: Point[] = [{ x: 0, y: 0 }];
    for (const m of moves) rel.push(applyMove(rel[rel.length - 1], m));
    const xs = rel.map((p) => p.x);
    const ys = rel.map((p) => p.y);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    if (w >= size || h >= size) continue;
    const startX = intInRange(
      rng,
      -Math.min(...xs),
      size - 1 - Math.max(...xs),
    );
    const startY = intInRange(
      rng,
      -Math.min(...ys),
      size - 1 - Math.max(...ys),
    );
    const positions = rel.map((p) => ({ x: p.x + startX, y: p.y + startY }));
    // Self-avoiding (distinct cells) so the drawn path is legible.
    const seen = new Set(positions.map(pKey));
    if (seen.size !== positions.length) continue;

    // Obstacles: adjacent to the path but never on it (fallback: any off-path).
    const onPath = seen;
    const nearCandidates: Point[] = [];
    const nearSeen = new Set<string>();
    for (const p of positions) {
      for (const m of MOVES) {
        const np = applyMove(p, m);
        const k = pKey(np);
        if (!inBounds(np, size) || onPath.has(k) || nearSeen.has(k)) continue;
        nearSeen.add(k);
        nearCandidates.push(np);
      }
    }
    const obstacles: Point[] = [];
    const pool = shuffle(rng, nearCandidates);
    for (const c of pool) {
      if (obstacles.length >= obstacleCount) break;
      obstacles.push(c);
    }
    if (obstacles.length < obstacleCount) {
      for (let y = 0; y < size && obstacles.length < obstacleCount; y++) {
        for (let x = 0; x < size && obstacles.length < obstacleCount; x++) {
          const c = { x, y };
          if (!onPath.has(pKey(c)) && !obstacles.some((o) => eq(o, c))) {
            obstacles.push(c);
          }
        }
      }
    }
    return {
      start: positions[0],
      goal: positions[positions.length - 1],
      moves,
      positions,
      obstacles,
    };
  }
  // Deterministic degenerate fallback: a straight run along the top row.
  const moves = Array.from(
    { length: Math.min(len, size - 1) },
    () => "right" as Move,
  );
  const positions = [{ x: 0, y: 0 }];
  for (const m of moves)
    positions.push(applyMove(positions[positions.length - 1], m));
  return {
    start: positions[0],
    goal: positions[positions.length - 1],
    moves,
    positions,
    obstacles: [],
  };
}

// ── sequence ──────────────────────────────────────────────────────────────────

function generateSequence(level: number, seed: string, age?: number): CtItem {
  const cfg = ctLevel(level);
  const size = cfg.gridSize;
  const path = pathWithTurns(
    seed,
    "sequence",
    size,
    cfg.programLength,
    cfg.turns,
    cfg.obstacles,
  );
  const rng = makeRng(deriveSeed(seed, "sequence-options"));
  const correct = path.moves;
  const optionCount = clampOptionCount(4, age);

  const distractors: Program[] = [];
  const seen = new Set<string>([correct.join("")]);
  let guard = 0;
  while (distractors.length < optionCount - 1 && guard++ < 300) {
    const cand = correct.slice();
    const i = intInRange(rng, 0, cand.length - 1);
    cand[i] = pick(
      rng,
      MOVES.filter((m) => m !== cand[i]),
    );
    const key = cand.join("");
    if (
      !seen.has(key) &&
      !reachesGoal(path.start, cand, path.goal, size, path.obstacles)
    ) {
      seen.add(key);
      distractors.push(cand);
    }
  }

  const options = shuffle(rng, [correct, ...distractors]);
  const answer = options.findIndex((o) => programEq(o, correct));

  return {
    ...makeBase("ct", level, seed),
    stimulus: {
      subtype: "sequence",
      gridSize: size,
      start: path.start,
      goal: path.goal,
      obstacles: path.obstacles,
      options,
    },
    answer: { kind: "optionIndex", value: answer },
    meta: { ctSubtype: "sequence" },
  };
}

// ── debug ─────────────────────────────────────────────────────────────────────

function generateDebug(level: number, seed: string): CtItem {
  const cfg = ctLevel(level);
  const size = cfg.gridSize;
  const path = pathWithTurns(
    seed,
    "debug",
    size,
    cfg.programLength,
    cfg.turns,
    Math.max(1, cfg.obstacles),
  );
  const blocked = blockedSet(path.obstacles);

  // Pick a step whose position offers an immediately-crashing replacement move
  // (off-grid or into an obstacle) — under "stop on the first illegal move" the
  // bug is exactly that step.
  const rng = makeRng(deriveSeed(seed, "debug-bug"));
  const candidates: { index: number; crash: Move }[] = [];
  path.moves.forEach((m, i) => {
    const from = path.positions[i];
    for (const alt of MOVES) {
      if (alt === m) continue;
      const np = applyMove(from, alt);
      if (!inBounds(np, size) || blocked.has(pKey(np))) {
        candidates.push({ index: i, crash: alt });
      }
    }
  });
  // A path on any finite board always borders the edge somewhere, so
  // candidates is non-empty in practice; guard defensively anyway.
  const chosen =
    candidates.length > 0
      ? pick(rng, candidates)
      : { index: 0, crash: "up" as Move };

  const program = path.moves.slice();
  program[chosen.index] = chosen.crash;

  return {
    ...makeBase("ct", level, seed),
    stimulus: {
      subtype: "debug",
      gridSize: size,
      start: path.start,
      goal: path.goal,
      obstacles: path.obstacles,
      program,
    },
    answer: { kind: "stepIndex", value: chosen.index },
    meta: { ctSubtype: "debug" },
  };
}

// ── loop ──────────────────────────────────────────────────────────────────────

const expandLoop = (l: LoopExpr): Move[] =>
  Array.from({ length: l.times }, () => l.body).flat();

function generateLoop(level: number, seed: string, age?: number): CtItem {
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
  const optionCount = clampOptionCount(4, age);
  const candidates: LoopExpr[] = [
    { body, times: times + 1 },
    { body: altBody, times },
    { body, times: Math.max(1, times - 1) },
  ].slice(0, optionCount - 1);
  const options = shuffle(rng, [{ body, times }, ...candidates]);
  const answer = options.findIndex((o) => moveSeqEq(expandLoop(o), flat));

  return {
    ...makeBase("ct", level, seed),
    stimulus: { subtype: "loop", sequence: flat, options },
    answer: { kind: "optionIndex", value: answer },
    meta: { ctSubtype: "loop" },
  };
}

// ── loopEvent ─────────────────────────────────────────────────────────────────

/** Every position a repeated body visits, rep by rep (flat step list). */
function loopTrajectory(start: Point, body: Move[], reps: number): Point[] {
  const out: Point[] = [];
  let p = start;
  for (let r = 0; r < reps; r++) {
    for (const m of body) {
      p = applyMove(p, m);
      out.push(p);
    }
  }
  return out;
}

function generateLoopEvent(level: number, seed: string, age?: number): CtItem {
  const cfg = ctLevel(level);
  const size = cfg.gridSize;
  const reps = cfg.loopTimes;

  let start: Point = { x: 0, y: 0 };
  let body: Move[] = ["right"];
  let eventTile: Point = { x: size - 1, y: 0 };
  let obstacles: Point[] = [];
  let placed = false;
  for (let attempt = 0; attempt < 80 && !placed; attempt++) {
    const rng = makeRng(deriveSeed(seed, "loop-event", attempt));
    const cand = Array.from({ length: cfg.loopBody }, () => pick(rng, MOVES));
    const net = cand.reduce(
      (a, m) => ({ x: a.x + DELTA[m].dx, y: a.y + DELTA[m].dy }),
      { x: 0, y: 0 },
    );
    if (net.x === 0 && net.y === 0) continue; // must make progress
    // Constructive placement: fit the relative trajectory onto the grid.
    const rel = loopTrajectory({ x: 0, y: 0 }, cand, reps);
    const xs = [0, ...rel.map((p) => p.x)];
    const ys = [0, ...rel.map((p) => p.y)];
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    if (w >= size || h >= size) continue; // this body can't fit at these reps
    start = {
      x: intInRange(rng, -Math.min(...xs), size - 1 - Math.max(...xs)),
      y: intInRange(rng, -Math.min(...ys), size - 1 - Math.max(...ys)),
    };
    const steps = loopTrajectory(start, cand, reps);
    const last = steps[steps.length - 1];
    // The event must fire only at the very end of the final rep.
    if (steps.slice(0, -1).some((p) => eq(p, last)) || eq(start, last))
      continue;
    body = cand;
    eventTile = last;
    // Obstacles: off the trajectory (and not on start/event).
    const onTraj = new Set([pKey(start), ...steps.map(pKey)]);
    const free: Point[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!onTraj.has(pKey({ x, y }))) free.push({ x, y });
      }
    }
    obstacles = pickN(rng, free, Math.min(cfg.obstacles, free.length));
    placed = true;
  }
  if (!placed) {
    // Deterministic degenerate fallback: a single "right" body across the row.
    start = { x: 0, y: 0 };
    body = ["right"];
    eventTile = { x: Math.min(reps, size - 1), y: 0 };
    obstacles = [];
  }

  // Distractor bodies: mutations that never land on the event tile (or crash).
  const rng = makeRng(deriveSeed(seed, "loop-event-options"));
  const optionCount = clampOptionCount(4, age);
  const blocked = blockedSet(obstacles);
  const failsToReach = (cand: Move[]): boolean => {
    let p = start;
    for (let r = 0; r < reps; r++) {
      for (const m of cand) {
        p = applyMove(p, m);
        if (!inBounds(p, size) || blocked.has(pKey(p))) return true; // crashes
        if (eq(p, eventTile)) return false; // reaches the event — not a foil
      }
    }
    return true; // never reached the event
  };
  const distractors: Move[][] = [];
  const seen = new Set<string>([body.join("")]);
  let guard = 0;
  while (distractors.length < optionCount - 1 && guard++ < 300) {
    const cand = body.slice();
    const i = intInRange(rng, 0, cand.length - 1);
    cand[i] = pick(
      rng,
      MOVES.filter((m) => m !== cand[i]),
    );
    const key = cand.join("");
    if (!seen.has(key) && failsToReach(cand)) {
      seen.add(key);
      distractors.push(cand);
    }
  }

  const options = shuffle(rng, [body, ...distractors]);
  const answer = options.findIndex((o) => moveSeqEq(o, body));

  return {
    ...makeBase("ct", level, seed),
    stimulus: {
      subtype: "loopEvent",
      gridSize: size,
      start,
      eventTile,
      obstacles,
      options,
    },
    answer: { kind: "optionIndex", value: answer },
    meta: { ctSubtype: "loopEvent" },
  };
}

// ── condition / conditionLoop ─────────────────────────────────────────────────

function generateCondition(
  level: number,
  seed: string,
  subtype: "condition" | "conditionLoop",
  age?: number,
): CtItem {
  const cfg = ctLevel(level);
  const rng = makeRng(deriveSeed(seed, subtype));

  // Rules with at least two distinct outputs (so the mapping is non-trivial).
  let rules = Array.from({ length: cfg.conditionRules }, (_, i) => ({
    when: i,
    then: pick(rng, MOVES),
  }));
  let guard = 0;
  while (new Set(rules.map((r) => r.then)).size < 2 && guard++ < 20) {
    rules = rules.map((r) => ({ when: r.when, then: pick(rng, MOVES) }));
  }
  const mapping = new Map(rules.map((r) => [r.when, r.then]));

  let input: number[];
  let patternLength: number | undefined;
  if (subtype === "conditionLoop") {
    // The input repeats a base pattern — recognising the loop is the point.
    patternLength = cfg.conditionInput % 3 === 0 ? 3 : 2;
    const reps = Math.max(2, Math.floor(cfg.conditionInput / patternLength));
    let pattern = Array.from({ length: patternLength }, () =>
      intInRange(rng, 0, cfg.conditionRules - 1),
    );
    guard = 0;
    while (new Set(pattern).size < 2 && guard++ < 20) {
      pattern = Array.from({ length: patternLength }, () =>
        intInRange(rng, 0, cfg.conditionRules - 1),
      );
    }
    input = Array.from({ length: reps }, () => pattern).flat();
  } else {
    input = Array.from({ length: cfg.conditionInput }, () =>
      intInRange(rng, 0, cfg.conditionRules - 1),
    );
    // Every rule appears at least once (fairness: the legend is fully used).
    for (let r = 0; r < cfg.conditionRules && r < input.length; r++) {
      if (!input.includes(r)) input[r] = r;
    }
  }
  const correct = input.map((c) => mapping.get(c) as Move);

  const optionCount = clampOptionCount(4, age);
  const distractors: Move[][] = [];
  const seen = new Set<string>([correct.join("")]);
  guard = 0;
  while (distractors.length < optionCount - 1 && guard++ < 200) {
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
    stimulus: { subtype, rules, input, patternLength, options },
    answer: { kind: "optionIndex", value: answer },
    meta: { ctSubtype: subtype },
  };
}

// ── nestedLoop ────────────────────────────────────────────────────────────────

export const expandNestedLoop = (e: NestedLoopExpr): Move[] => {
  const once = [
    ...e.pre,
    ...Array.from({ length: e.innerTimes }, () => e.innerBody).flat(),
    ...e.post,
  ];
  return Array.from({ length: e.outerTimes }, () => once).flat();
};

function generateNestedLoop(level: number, seed: string, age?: number): CtItem {
  const cfg = ctLevel(level);

  let expr: NestedLoopExpr = {
    outerTimes: 2,
    pre: ["right"],
    innerTimes: 2,
    innerBody: ["down"],
    post: [],
  };
  for (let attempt = 0; attempt < 60; attempt++) {
    const rng = makeRng(deriveSeed(seed, "nested", attempt));
    const cand: NestedLoopExpr = {
      outerTimes: intInRange(rng, 2, 3),
      pre: intInRange(rng, 0, 1) === 1 ? [pick(rng, MOVES)] : [],
      innerTimes: intInRange(rng, 2, 3),
      innerBody: Array.from({ length: intInRange(rng, 1, 2) }, () =>
        pick(rng, MOVES),
      ),
      post: intInRange(rng, 0, 1) === 1 ? [pick(rng, MOVES)] : [],
    };
    if (cand.pre.length + cand.post.length === 0) continue; // trivial nesting
    const total = expandNestedLoop(cand).length;
    if (total < cfg.programLength - 2 || total > cfg.programLength + 4)
      continue;
    expr = cand;
    break;
  }
  const flat = expandNestedLoop(expr);

  const rng = makeRng(deriveSeed(seed, "nested-options"));
  const optionCount = clampOptionCount(4, age);
  const mutatedBody = expr.innerBody.slice();
  const j = intInRange(rng, 0, mutatedBody.length - 1);
  mutatedBody[j] = pick(
    rng,
    MOVES.filter((m) => m !== mutatedBody[j]),
  );
  const candidates: NestedLoopExpr[] = [
    { ...expr, outerTimes: expr.outerTimes === 2 ? 3 : 2 },
    { ...expr, innerTimes: expr.innerTimes === 2 ? 3 : 2 },
    { ...expr, innerBody: mutatedBody },
  ]
    .filter((c) => !moveSeqEq(expandNestedLoop(c), flat))
    .slice(0, optionCount - 1);

  const options = shuffle(rng, [expr, ...candidates]);
  const answer = options.findIndex((o) => moveSeqEq(expandNestedLoop(o), flat));

  return {
    ...makeBase("ct", level, seed),
    stimulus: { subtype: "nestedLoop", sequence: flat, options },
    answer: { kind: "optionIndex", value: answer },
    meta: { ctSubtype: "nestedLoop" },
  };
}

// ── counter ───────────────────────────────────────────────────────────────────

function generateCounter(level: number, seed: string, age?: number): CtItem {
  const cfg = ctLevel(level);
  const rng = makeRng(deriveSeed(seed, "counter"));

  const unit = pick(rng, MOVES);
  const sep = pick(rng, PERPENDICULAR[unit]);
  const shown = Math.max(2, cfg.loopTimes); // segments 1..k are visible
  const sequence: Move[] = [];
  const segmentLengths: number[] = [];
  for (let i = 1; i <= shown; i++) {
    const seg = [...Array.from({ length: i }, () => unit), sep];
    sequence.push(...seg);
    segmentLengths.push(seg.length);
  }
  const correct: Move[] = [
    ...Array.from({ length: shown + 1 }, () => unit),
    sep,
  ];

  const optionCount = clampOptionCount(4, age);
  const opposite: Record<Move, Move> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };
  const candidates: Move[][] = [
    [...Array.from({ length: shown }, () => unit), sep], // repeats the last
    [...Array.from({ length: shown + 2 }, () => unit), sep], // skips a step
    [...Array.from({ length: shown + 1 }, () => opposite[unit]), sep], // flipped
  ].slice(0, optionCount - 1);

  const options = shuffle(rng, [correct, ...candidates]);
  const answer = options.findIndex((o) => moveSeqEq(o, correct));

  return {
    ...makeBase("ct", level, seed),
    stimulus: { subtype: "counter", sequence, segmentLengths, options },
    answer: { kind: "optionIndex", value: answer },
    meta: { ctSubtype: "counter" },
  };
}

// ── optimize ──────────────────────────────────────────────────────────────────

/** BFS shortest path start→goal avoiding obstacles; null if unreachable. */
function shortestPath(
  start: Point,
  goal: Point,
  size: number,
  obstacles: readonly Point[],
): Move[] | null {
  const blocked = blockedSet(obstacles);
  const prev = new Map<string, { key: string; move: Move }>();
  const seen = new Set<string>([pKey(start)]);
  const queue: Point[] = [start];
  while (queue.length > 0) {
    const cur = queue.shift() as Point;
    if (eq(cur, goal)) {
      const moves: Move[] = [];
      let k = pKey(cur);
      while (prev.has(k)) {
        const step = prev.get(k) as { key: string; move: Move };
        moves.push(step.move);
        k = step.key;
      }
      return moves.reverse();
    }
    for (const m of MOVES) {
      const np = applyMove(cur, m);
      const k = pKey(np);
      if (!inBounds(np, size) || blocked.has(k) || seen.has(k)) continue;
      seen.add(k);
      prev.set(k, { key: pKey(cur), move: m });
      queue.push(np);
    }
  }
  return null;
}

function generateOptimize(level: number, seed: string, age?: number): CtItem {
  const cfg = ctLevel(level);
  const size = cfg.gridSize;

  let start: Point = { x: 0, y: 0 };
  let goal: Point = { x: size - 1, y: size - 1 };
  let obstacles: Point[] = [];
  let optimal: Move[] = [];
  for (let attempt = 0; attempt < 80; attempt++) {
    const rng = makeRng(deriveSeed(seed, "optimize", attempt));
    start = {
      x: intInRange(rng, 0, size - 1),
      y: intInRange(rng, 0, size - 1),
    };
    goal = { x: intInRange(rng, 0, size - 1), y: intInRange(rng, 0, size - 1) };
    const manhattan = Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y);
    if (manhattan < 4) continue;
    const free: Point[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const c = { x, y };
        if (!eq(c, start) && !eq(c, goal)) free.push(c);
      }
    }
    const candObstacles = pickN(
      rng,
      free,
      Math.min(cfg.obstacles, free.length),
    );
    const path = shortestPath(start, goal, size, candObstacles);
    if (!path) continue;
    obstacles = candObstacles;
    optimal = path;
    break;
  }

  const rng = makeRng(deriveSeed(seed, "optimize-options"));
  // The redundant (working but wasteful) program: a back-and-forth detour
  // spliced into the optimal path at a legal point.
  const redundant = ((): Program => {
    const blocked = blockedSet(obstacles);
    const positions: Point[] = [start];
    for (const m of optimal)
      positions.push(applyMove(positions[positions.length - 1], m));
    for (const at of shuffle(
      rng,
      Array.from({ length: positions.length }, (_, i) => i),
    )) {
      for (const d of shuffle(rng, MOVES)) {
        const np = applyMove(positions[at], d);
        if (!inBounds(np, size) || blocked.has(pKey(np))) continue;
        const detour: Move[] = [
          d,
          { up: "down", down: "up", left: "right", right: "left" }[d] as Move,
        ];
        return [...optimal.slice(0, at), ...detour, ...optimal.slice(at)];
      }
    }
    return [...optimal, "up", "down"];
  })();

  const optionCount = clampOptionCount(4, age);
  // Distractors: (a) reaches the goal but longer (the redundant program),
  // (b) optimal length but never arrives, (c) one move short of the goal.
  const mutated = optimal.slice();
  let guard = 0;
  do {
    const i = intInRange(rng, 0, mutated.length - 1);
    mutated[i] = pick(
      rng,
      MOVES.filter((m) => m !== mutated[i]),
    );
  } while (reachesGoal(start, mutated, goal, size, obstacles) && guard++ < 40);
  const candidates: Program[] = [
    redundant,
    mutated,
    optimal.slice(0, -1),
  ].slice(0, optionCount - 1);

  const options = shuffle(rng, [optimal, ...candidates]);
  const answer = options.findIndex(
    (o) =>
      o.length === optimal.length &&
      reachesGoal(start, o, goal, size, obstacles),
  );

  return {
    ...makeBase("ct", level, seed),
    stimulus: {
      subtype: "optimize",
      gridSize: size,
      start,
      goal,
      obstacles,
      redundantProgram: redundant,
      options,
    },
    answer: { kind: "optionIndex", value: answer },
    meta: { ctSubtype: "optimize" },
  };
}

// ── dispatch ──────────────────────────────────────────────────────────────────

type Builder = (level: number, seed: string, age?: number) => CtItem;

const BUILDERS: Record<CtFamily, Builder> = {
  sequence: generateSequence,
  debug: (l, s) => generateDebug(l, s),
  loop: generateLoop,
  loopEvent: generateLoopEvent,
  condition: (l, s, a) => generateCondition(l, s, "condition", a),
  conditionLoop: (l, s, a) => generateCondition(l, s, "conditionLoop", a),
  nestedLoop: generateNestedLoop,
  counter: generateCounter,
  optimize: generateOptimize,
};

/**
 * Generate a CT item. The family is chosen deterministically from the LEVEL's
 * legal family set unless `opts.subtype` forces one (tests / dev tooling may
 * force any family at any level — the parameters exist at every level).
 */
export function generate(
  level: number,
  seed: string,
  opts?: { subtype?: CtFamily; age?: number },
): CtItem {
  const families = ctLevel(level).family;
  const family =
    opts?.subtype ??
    families[Math.floor(makeRng(`${seed}|ct-family`)() * families.length)];
  return BUILDERS[family](level, seed, opts?.age);
}
