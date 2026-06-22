/**
 * EF — Planning (Tower of London). 3 pegs (capacities 3/2/1), 3 coloured balls.
 * Generate a start and a goal state, then compute the TRUE minimum move count by
 * breadth-first search over the (tiny) state space. Spec A.5, Дел 4.
 *
 * `minMoves` is both the answer reference and the difficulty target (config gives
 * 2→5 by level). The goal is guaranteed reachable (BFS finds it) and one optimal
 * solution path is stored; the test suite re-verifies minMoves with its own BFS.
 */

import {
  EF_BALL_COUNT,
  EF_PEG_CAPACITIES,
  efLevel,
} from "@/content/tasks/levels";
import { deriveSeed, intInRange, makeRng, pick, type Rng } from "@/lib/prng";
import { makeBase } from "./shared";
import type { EfItem, TowerMove, TowerState } from "./types";

const stateKey = (s: TowerState): string =>
  s.map((peg) => peg.join(".")).join("|");
const cloneState = (s: TowerState): TowerState => s.map((peg) => peg.slice());

/** All legal moves from a state, paired with the resulting state. */
function neighbors(
  state: TowerState,
  caps: readonly number[],
): { move: TowerMove; next: TowerState }[] {
  const out: { move: TowerMove; next: TowerState }[] = [];
  for (let from = 0; from < state.length; from++) {
    if (state[from].length === 0) continue;
    for (let to = 0; to < state.length; to++) {
      if (to === from || state[to].length >= caps[to]) continue;
      const next = cloneState(state);
      next[to].push(next[from].pop() as number);
      out.push({ move: { from, to }, next });
    }
  }
  return out;
}

/** A random valid state: each ball pushed onto a peg that still has capacity. */
function randomState(
  rng: Rng,
  caps: readonly number[],
  balls: number,
): TowerState {
  const pegs: TowerState = caps.map(() => []);
  for (let ball = 0; ball < balls; ball++) {
    const open = pegs
      .map((peg, i) => (peg.length < caps[i] ? i : -1))
      .filter((i) => i >= 0);
    pegs[pick(rng, open)].push(ball);
  }
  return pegs;
}

interface Bfs {
  dist: Map<string, number>;
  prev: Map<string, { key: string; move: TowerMove }>;
  byDist: Map<number, string[]>;
  states: Map<string, TowerState>;
}

/** BFS over the whole reachable space from `start`. */
function bfs(start: TowerState, caps: readonly number[]): Bfs {
  const dist = new Map<string, number>();
  const prev = new Map<string, { key: string; move: TowerMove }>();
  const byDist = new Map<number, string[]>();
  const states = new Map<string, TowerState>();
  const startKey = stateKey(start);
  dist.set(startKey, 0);
  states.set(startKey, start);
  byDist.set(0, [startKey]);
  const queue: TowerState[] = [start];
  while (queue.length > 0) {
    const cur = queue.shift() as TowerState;
    const curKey = stateKey(cur);
    const d = dist.get(curKey) as number;
    for (const { move, next } of neighbors(cur, caps)) {
      const k = stateKey(next);
      if (dist.has(k)) continue;
      dist.set(k, d + 1);
      prev.set(k, { key: curKey, move });
      states.set(k, next);
      const bucket = byDist.get(d + 1) ?? [];
      bucket.push(k);
      byDist.set(d + 1, bucket);
      queue.push(next);
    }
  }
  return { dist, prev, byDist, states };
}

/** Reconstruct one optimal move sequence start → goal via BFS parent pointers. */
function reconstruct(search: Bfs, goalKey: string): TowerMove[] {
  const moves: TowerMove[] = [];
  let k = goalKey;
  while (search.prev.has(k)) {
    const step = search.prev.get(k)!;
    moves.push(step.move);
    k = step.key;
  }
  return moves.reverse();
}

export function generate(level: number, seed: string): EfItem {
  const caps = EF_PEG_CAPACITIES;
  const target = efLevel(level).minMoves;

  // Try starts until one has a goal at the exact target distance; otherwise fall
  // back to that start's farthest state (minMoves stays the true BFS distance).
  let start!: TowerState;
  let search!: Bfs;
  let goalKey = "";
  for (let attempt = 0; attempt < 80; attempt++) {
    const rng = makeRng(deriveSeed(seed, "ef-start", attempt));
    start = randomState(rng, caps, EF_BALL_COUNT);
    search = bfs(start, caps);
    const exact = search.byDist.get(target);
    if (exact && exact.length > 0) {
      goalKey = exact[intInRange(rng, 0, exact.length - 1)];
      break;
    }
  }
  if (!goalKey) {
    // Fallback: deepest reachable state from the last start tried.
    const maxD = Math.max(...search.byDist.keys());
    goalKey = (search.byDist.get(maxD) as string[])[0];
  }

  const goal = search.states.get(goalKey) as TowerState;
  const optimalPath = reconstruct(search, goalKey);

  return {
    ...makeBase("ef", level, seed),
    stimulus: { pegCapacities: caps.slice(), start, goal },
    answer: { minMoves: optimalPath.length, optimalPath },
    meta: { ballCount: EF_BALL_COUNT },
  };
}
