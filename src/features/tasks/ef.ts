/**
 * EF — Planning (Tower of London), calibration v2. 3 pegs (capacities 3/2/1),
 * 3 coloured balls. Generate a start and a goal state at the level's EXACT
 * minimum-move distance (BFS-verified over the tiny state space), honouring the
 * level's structural properties:
 *
 *   • constrained (L4/L6/L8): every optimal path requires ≥1 counter-intuitive
 *     move — moving a ball somewhere other than its goal peg (or off it). The
 *     greedy "always place a correct ball if possible" strategy therefore
 *     cannot reach minMoves. Verified by enumerating all optimal paths.
 *   • distractorGoal (L2): the goal shares ≥1 ball position with the start, so
 *     the child must notice which balls actually move.
 *
 * `minMoves` is both the answer reference and the difficulty target; one optimal
 * solution path is stored; the test suite re-verifies with its own BFS.
 */

import {
  EF_BALL_COUNT,
  EF_PEG_CAPACITIES,
  efLevel,
} from "@/content/tasks/levels";
import { deriveSeed, makeRng, pick, shuffle, type Rng } from "@/lib/prng";
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

/** The peg each ball occupies in a state (ball id → peg index). */
function ballPegs(state: TowerState): number[] {
  const pegs: number[] = [];
  state.forEach((peg, i) => peg.forEach((ball) => (pegs[ball] = i)));
  return pegs;
}

/**
 * Constrained-problem verification (v2 §6): true iff EVERY optimal path
 * start→goal contains ≥1 counter-intuitive move — moving a ball AWAY from its
 * goal peg (it already sits on the peg where it finally belongs, but must
 * vacate first, e.g. to let another ball slide underneath). The greedy "always
 * place a correct ball if possible" strategy never vacates a correctly-placed
 * ball, so it cannot reach minMoves on a constrained problem. (Instrumental
 * moves onto a third peg are NOT counter-intuitive — with 3 balls, any ≥4-move
 * problem needs one, so they can't be the discriminator.)
 */
export function isConstrained(
  start: TowerState,
  goal: TowerState,
  caps: readonly number[],
): boolean {
  const goalPegOf = ballPegs(goal);
  const fromGoal = bfs(goal, caps);
  if (fromGoal.dist.get(stateKey(start)) === undefined) return false; // unreachable — never emitted
  const goalKey = stateKey(goal);

  // DFS over distance-decreasing (optimal) edges, refusing any move that lifts
  // a ball OFF its goal peg. If the goal is still reachable, some optimal path
  // needs no counter-intuitive move → not constrained.
  const visited = new Set<string>();
  const dfs = (state: TowerState): boolean => {
    const key = stateKey(state);
    if (key === goalKey) return true;
    if (visited.has(key)) return false;
    visited.add(key);
    const d = fromGoal.dist.get(key) as number;
    for (const { move, next } of neighbors(state, caps)) {
      const nd = fromGoal.dist.get(stateKey(next));
      if (nd === undefined || nd !== d - 1) continue; // not on an optimal path
      const ball = state[move.from][state[move.from].length - 1];
      if (move.from === goalPegOf[ball]) continue; // vacates its goal peg — counter-intuitive
      if (dfs(next)) return true;
    }
    return false;
  };
  const intuitivePathExists = dfs(start);
  return !intuitivePathExists;
}

/** How many balls sit in the exact same (peg, height) slot in both states. */
function sharedBallPositions(a: TowerState, b: TowerState): number {
  let shared = 0;
  a.forEach((peg, i) =>
    peg.forEach((ball, h) => {
      if (b[i]?.[h] === ball) shared += 1;
    }),
  );
  return shared;
}

export function generate(level: number, seed: string): EfItem {
  const caps = EF_PEG_CAPACITIES;
  const cfg = efLevel(level);
  const target = cfg.minMoves;

  // Try starts until one has a goal at the exact target distance satisfying the
  // level's structural properties; degrade gracefully (property, then distance).
  let best: {
    start: TowerState;
    search: Bfs;
    goalKey: string;
    constrained: boolean;
  } | null = null;
  let fallback: { start: TowerState; search: Bfs; goalKey: string } | null =
    null;

  for (let attempt = 0; attempt < 240 && !best; attempt++) {
    const rng = makeRng(deriveSeed(seed, "ef-start", attempt));
    const start = randomState(rng, caps, EF_BALL_COUNT);
    const search = bfs(start, caps);
    const exact = search.byDist.get(target) ?? [];
    if (exact.length === 0) {
      if (!fallback) {
        const maxD = Math.max(...search.byDist.keys());
        fallback = {
          start,
          search,
          goalKey: (search.byDist.get(maxD) as string[])[0],
        };
      }
      continue;
    }
    const ordered = shuffle(rng, exact);
    for (const goalKey of ordered) {
      const goal = search.states.get(goalKey) as TowerState;
      const constrained = isConstrained(start, goal, caps);
      if (constrained !== cfg.constrained) continue;
      if (cfg.distractorGoal && sharedBallPositions(start, goal) === 0)
        continue;
      best = { start, search, goalKey, constrained };
      break;
    }
    if (!best && !fallback) {
      // Remember a distance-exact goal in case no attempt matches the property.
      fallback = { start, search, goalKey: ordered[0] };
    }
  }

  // Every attempt records either a property-exact `best` or a distance/depth
  // `fallback`, so one of the two always exists after the loop.
  const { start, search, goalKey } = (best ?? fallback) as {
    start: TowerState;
    search: Bfs;
    goalKey: string;
  };
  const goal = search.states.get(goalKey) as TowerState;
  const optimalPath = reconstruct(search, goalKey);

  return {
    ...makeBase("ef", level, seed),
    stimulus: { pegCapacities: caps.slice(), start, goal },
    answer: { minMoves: optimalPath.length, optimalPath },
    meta: {
      ballCount: EF_BALL_COUNT,
      constrained: best ? best.constrained : isConstrained(start, goal, caps),
    },
  };
}
