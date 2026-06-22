/**
 * Grading — turn a raw response into a {@link GradedItem} by comparing it against
 * the item's own verified answer key. The key (built + checked in the task bank)
 * is the single source of truth for correctness, so scoring DERIVES correct/wrong
 * rather than trusting a caller-supplied flag.
 *
 * Time enters only as `effectiveTimeMs` / `tooFast` metadata and the Gs throughput
 * observation — it never flips a correct answer to wrong (spec Дел 6.4 / Дел 8).
 */

import { TOO_FAST_MS } from "@/content/norms";
import type {
  CtItem,
  EfItem,
  Item,
  Move,
  TowerMove,
  TowerState,
} from "@/features/tasks";
import { countExcludedGaps, effectiveTime } from "./time";
import type {
  ErrorType,
  GradedItem,
  RawResponse,
} from "@/features/assessment/types";

const numbersEqual = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const movesEqual = (a: readonly Move[], b: readonly Move[]): boolean =>
  a.length === b.length && a.every((m, i) => m === b[i]);

const towerEqual = (a: TowerState, b: TowerState): boolean =>
  a.length === b.length && a.every((peg, i) => numbersEqual(peg, b[i]));

/** Replay a child's Tower-of-London moves, skipping any illegal ones (UI prevents them). */
function applyTowerMoves(
  start: TowerState,
  moves: readonly TowerMove[],
  caps: readonly number[],
): TowerState {
  const state: TowerState = start.map((peg) => peg.slice());
  for (const { from, to } of moves) {
    if (from < 0 || from >= state.length || to < 0 || to >= state.length)
      continue;
    if (from === to || state[from].length === 0) continue;
    if (state[to].length >= caps[to]) continue;
    state[to].push(state[from].pop() as number);
  }
  return state;
}

/** Correctness of a CT response against its (sub-type-specific) verified key. */
function gradeCt(
  item: CtItem,
  r: Extract<RawResponse, { signal: "ct" }>,
): { correct: boolean; optionIndex?: number } {
  const { answer } = item;
  switch (answer.kind) {
    case "optionIndex":
      return {
        correct: r.optionIndex === answer.value,
        optionIndex: r.optionIndex,
      };
    case "stepIndex":
      return { correct: r.stepIndex === answer.value };
    case "path":
      return {
        correct: r.path !== undefined && movesEqual(r.path, answer.moves),
      };
  }
}

/** EF: replay the moves, check goal reached, measure optimality vs minMoves. */
function gradeEf(
  item: EfItem,
  r: Extract<RawResponse, { signal: "ef" }>,
): { solved: boolean; movesUsed: number; minMoves: number } {
  const final = applyTowerMoves(
    item.stimulus.start,
    r.moves,
    item.stimulus.pegCapacities,
  );
  return {
    solved: towerEqual(final, item.stimulus.goal),
    movesUsed: r.moves.length,
    minMoves: item.answer.minMoves,
  };
}

/** Classify an incorrect answer (correct answers carry no error type). */
function classifyError(
  correct: boolean,
  tooFast: boolean,
  unsolved = false,
): ErrorType | undefined {
  if (correct) return undefined;
  if (tooFast) return "impulsive";
  return unsolved ? "unsolved" : "wrong";
}

/**
 * Grade one administered item against a raw response.
 * Throws only on a response whose signal does not match the item (a programmer
 * error, not a child action).
 */
export function gradeItem(item: Item, response: RawResponse): GradedItem {
  if (response.signal !== item.signal) {
    throw new Error(
      `response signal "${response.signal}" does not match item "${item.signal}"`,
    );
  }
  const effectiveTimeMs = effectiveTime(response.elapsedMs, response.idleGaps);
  const tooFast = response.elapsedMs < TOO_FAST_MS;

  const base = {
    signal: item.signal,
    itemSeed: item.seed,
    effectiveTimeMs,
    rawElapsedMs: response.elapsedMs,
    excludedIdleGaps: countExcludedGaps(response.idleGaps),
    tooFast,
    difficultyWeight: item.difficultyWeight,
  };

  // ── Multiple-choice reasoning (Gf, Gv) ──────────────────────────────────────
  if (item.signal === "gf" || item.signal === "gv") {
    const r = response as Extract<RawResponse, { signal: "gf" | "gv" }>;
    const correct = r.optionIndex === item.answer;
    return {
      ...base,
      level: item.level,
      correct,
      optionIndex: r.optionIndex,
      errorType: classifyError(correct, tooFast),
    };
  }

  // ── CT (STEM) — sub-type-specific key ───────────────────────────────────────
  if (item.signal === "ct") {
    const r = response as Extract<RawResponse, { signal: "ct" }>;
    const { correct, optionIndex } = gradeCt(item, r);
    return {
      ...base,
      level: item.level,
      correct,
      optionIndex,
      errorType: classifyError(correct, tooFast),
    };
  }

  // ── Corsi span (Gsm) ────────────────────────────────────────────────────────
  if (item.signal === "gsm") {
    const r = response as Extract<RawResponse, { signal: "gsm" }>;
    const correct = numbersEqual(r.tapOrder, item.answer);
    return {
      ...base,
      spanLength: item.stimulus.sequence.length,
      direction: item.meta.direction,
      correct,
      errorType: classifyError(correct, tooFast),
    };
  }

  // ── Symbol search (Gs) — net throughput, the one time-dependent signal ───────
  if (item.signal === "gs") {
    const r = response as Extract<RawResponse, { signal: "gs" }>;
    const targetSet = new Set(item.answer);
    const selected = new Set(r.selectedCells);
    let found = 0;
    let falseTaps = 0;
    for (const cell of selected) {
      if (targetSet.has(cell)) found += 1;
      else falseTaps += 1;
    }
    const correct = found === targetSet.size && falseTaps === 0;
    return {
      ...base,
      level: item.level,
      correct,
      errorType: classifyError(correct, tooFast),
      gs: {
        found,
        falseTaps,
        targetCount: targetSet.size,
        tappedCount: selected.size,
        cellCount: item.stimulus.cellCount,
      },
    };
  }

  // ── Planning (EF, Tower of London) — ladders on goal-reached ─────────────────
  if (item.signal === "ef") {
    const r = response as Extract<RawResponse, { signal: "ef" }>;
    const { solved, movesUsed, minMoves } = gradeEf(item, r);
    return {
      ...base,
      level: item.level,
      correct: solved,
      errorType: classifyError(solved, tooFast, !solved),
      ef: { minMoves, movesUsed, solved },
    };
  }

  // ── Paired-associate learning (Glr) — per-round recall accuracy ──────────────
  {
    const r = response as Extract<RawResponse, { signal: "glr" }>;
    const key = item.answer; // correct option index per trial
    const roundAccuracies = r.rounds.map((round) => {
      if (key.length === 0) return 0;
      const hits = key.reduce(
        (acc, correctIdx, i) => acc + (round[i] === correctIdx ? 1 : 0),
        0,
      );
      return hits / key.length;
    });
    const lastRound = r.rounds[r.rounds.length - 1] ?? [];
    const correct =
      key.length > 0 &&
      key.every((correctIdx, i) => lastRound[i] === correctIdx);
    return {
      ...base,
      level: item.level,
      correct,
      errorType: classifyError(correct, tooFast),
      glr: { roundAccuracies },
    };
  }
}
