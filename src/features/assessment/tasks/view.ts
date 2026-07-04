/**
 * Pure presenters + response builders for the task renderers — the node-testable
 * core of Phase 1.06 (the React `.tsx` renderers stay thin, mirroring the
 * `pentagon.ts` / `pentagon.tsx` split). NO React, NO randomness, NO clock: a
 * function of the deterministic {@link Item} only, so `view(item)` is stable and
 * the interaction → response mapping can be asserted against the answer key in
 * plain node tests.
 *
 * The cardinal rule shows up here structurally: response builders carry the
 * child's *answer*, never time. Timing is merged in by the screen via
 * {@link withTiming}; only Gs scoring ever looks at it (spec Дел 6.4 / Дел 8).
 */

import type { GvItem, Item, Point, TowerMove } from "@/features/tasks";
import type { CapturedTiming } from "@/features/timing";
import type { RawResponse } from "@/features/assessment";

// ── Geometry helpers (Gv polygons, shared) ─────────────────────────────────────

function centroidOf(points: readonly Point[]): Point {
  const n = points.length || 1;
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / n, y: sy / n };
}

function recenter(points: readonly Point[]): Point[] {
  const c = centroidOf(points);
  return points.map((p) => ({ x: p.x - c.x, y: p.y - c.y }));
}

function maxRadius(points: readonly Point[]): number {
  return points.reduce((m, p) => Math.max(m, Math.hypot(p.x, p.y)), 0);
}

/** Recenter a polygon and scale it by a shared factor into a `box`×`box` SVG. */
export function placePolygon(
  points: readonly Point[],
  scale: number,
  box: number,
): Point[] {
  const half = box / 2;
  return recenter(points).map((p) => ({
    x: +(half + p.x * scale).toFixed(2),
    y: +(half + p.y * scale).toFixed(2),
  }));
}

export function pointsToPath(points: readonly Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export interface GvOptionView {
  /** Original option index (into item.options / item.answer space). */
  index: number;
  /** Polygon points laid out in the SVG box. */
  points: Point[];
  path: string;
}

export interface GvView {
  family: "rotation" | "oddOneOut";
  box: number;
  /** Prompt shape for the rotation family (null for odd-one-out). */
  prompt: { points: Point[]; path: string } | null;
  options: GvOptionView[];
}

/**
 * Deterministic Gv view: recenter every polygon and scale them all by ONE factor
 * so a pure rotation reads as identical-size (only orientation differs) and a
 * mirror reads as mirrored — never a size cue. Options keep their original index,
 * so tapping them maps straight to the answer key.
 */
export function buildGvView(item: GvItem, box = 120): GvView {
  const margin = 0.78; // leave a breathing border inside the box
  const all: Point[][] = item.options.map((o) => o.points);
  const promptPts =
    item.stimulus.family === "rotation" ? item.stimulus.base : null;
  if (promptPts) all.push(promptPts);

  const globalMax = all.reduce(
    (m, pts) => Math.max(m, maxRadius(recenter(pts))),
    0,
  );
  const scale = globalMax > 0 ? ((box / 2) * margin) / globalMax : 1;

  const options: GvOptionView[] = item.options.map((o, index) => {
    const points = placePolygon(o.points, scale, box);
    return { index, points, path: pointsToPath(points) };
  });

  const prompt = promptPts
    ? (() => {
        const points = placePolygon(promptPts, scale, box);
        return { points, path: pointsToPath(points) };
      })()
    : null;

  return { family: item.stimulus.family, box, prompt, options };
}

// ── Instruction keys (item → i18n key under "task") ────────────────────────────

const CT_KEY: Record<string, string> = {
  sequence: "ctSequence",
  debug: "ctDebug",
  loop: "ctLoop",
  loopEvent: "ctLoopEvent",
  condition: "ctCondition",
  conditionLoop: "ctConditionLoop",
  nestedLoop: "ctNestedLoop",
  counter: "ctCounter",
  optimize: "ctOptimize",
};

/** The `task.*` message key for an item's calm, plain-MK instruction line. */
export function instructionKey(item: Item): string {
  switch (item.signal) {
    case "gf":
      return item.stimulus.family === "matrix"
        ? "gfMatrix"
        : item.stimulus.notation === "objects"
          ? "gfSeriesObjects"
          : "gfSeries";
    case "gv":
      return item.stimulus.family === "rotation" ? "gvRotation" : "gvOddOneOut";
    case "gsm":
      return item.meta.direction === "backward" ? "gsmBackward" : "gsmForward";
    case "gs":
      return "gsTitle";
    case "ef":
      return "efInstruction";
    case "glr":
      return "glrStudy";
    case "ct":
      return CT_KEY[item.stimulus.subtype];
  }
}

/** Whether the calm "нема брзање" hint applies — every task except timed Gs. */
export function showsNoRush(item: Item): boolean {
  return item.signal !== "gs";
}

// ── Gs grid layout ─────────────────────────────────────────────────────────────

/** Rows in the Gs grid for a given cell count + column count. */
export function gsRowCount(cellCount: number, columns: number): number {
  return Math.ceil(cellCount / Math.max(1, columns));
}

// ── Response builders: interaction → signal fields (no timing) ─────────────────

/** The signal-specific part of a {@link RawResponse} — timing is merged later. */
export type ResponseFields =
  | { signal: "gf" | "gv"; optionIndex: number }
  | { signal: "ct"; optionIndex?: number; stepIndex?: number }
  | { signal: "gsm"; tapOrder: number[] }
  | { signal: "gs"; selectedCells: number[] }
  | { signal: "ef"; moves: TowerMove[] }
  | { signal: "glr"; rounds: number[][] };

export const choiceResponse = (
  signal: "gf" | "gv",
  optionIndex: number,
): ResponseFields => ({ signal, optionIndex });

export const ctOptionResponse = (optionIndex: number): ResponseFields => ({
  signal: "ct",
  optionIndex,
});
export const ctStepResponse = (stepIndex: number): ResponseFields => ({
  signal: "ct",
  stepIndex,
});
export const corsiResponse = (tapOrder: number[]): ResponseFields => ({
  signal: "gsm",
  tapOrder,
});
export const searchResponse = (selectedCells: number[]): ResponseFields => ({
  signal: "gs",
  selectedCells,
});
export const towerResponse = (moves: TowerMove[]): ResponseFields => ({
  signal: "ef",
  moves,
});
export const recallResponse = (rounds: number[][]): ResponseFields => ({
  signal: "glr",
  rounds,
});

/** Merge captured timing onto the signal fields → the engine's `RawResponse`. */
export function withTiming(
  fields: ResponseFields,
  timing: CapturedTiming,
): RawResponse {
  return { ...fields, ...timing } as RawResponse;
}

// ── Answer-key derivations (for tests, practice reveal, and self-checks) ────────

function ctCorrect(item: Extract<Item, { signal: "ct" }>): ResponseFields {
  switch (item.answer.kind) {
    case "optionIndex":
      return ctOptionResponse(item.answer.value);
    case "stepIndex":
      return ctStepResponse(item.answer.value);
  }
}

function ctWrong(item: Extract<Item, { signal: "ct" }>): ResponseFields {
  switch (item.answer.kind) {
    case "optionIndex":
      return ctOptionResponse(item.answer.value === 0 ? 1 : 0);
    case "stepIndex":
      return ctStepResponse(item.answer.value === 0 ? 1 : 0);
  }
}

/** The interaction fields that represent the verified-correct answer. */
export function correctFields(item: Item): ResponseFields {
  switch (item.signal) {
    case "gf":
    case "gv":
      return choiceResponse(item.signal, item.answer);
    case "ct":
      return ctCorrect(item);
    case "gsm":
      return corsiResponse(item.answer);
    case "gs":
      return searchResponse(item.answer);
    case "ef":
      return towerResponse(item.answer.optimalPath);
    case "glr":
      return recallResponse([item.answer, item.answer]);
  }
}

/** An interaction that is deliberately wrong (for the wrong-grades-wrong tests). */
export function wrongFields(item: Item): ResponseFields {
  switch (item.signal) {
    case "gf":
    case "gv":
      return choiceResponse(item.signal, item.answer === 0 ? 1 : 0);
    case "ct":
      return ctWrong(item);
    case "gsm":
      return corsiResponse([]);
    case "gs":
      return searchResponse([]);
    case "ef":
      return towerResponse([]);
    case "glr":
      return recallResponse([
        item.answer.map((c, i) => nextOption(item, i, c)),
        item.answer.map((c, i) => nextOption(item, i, c)),
      ]);
  }
}

function nextOption(
  item: Extract<Item, { signal: "glr" }>,
  trialIndex: number,
  correct: number,
): number {
  const optionCount = item.stimulus.trials[trialIndex].options.length;
  return (correct + 1) % optionCount;
}
