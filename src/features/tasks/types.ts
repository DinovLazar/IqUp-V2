/**
 * The Item contract — the single shared shape every generator produces.
 *
 * Like `src/lib/pentagon.ts`, this module is PURE DATA: no React, no DOM, no
 * SVG/markup strings, no CSS. A generator returns the stimulus as structured
 * data / coordinate geometry, the option set where applicable, the verified
 * correct answer, and a small `meta` bag of scoring/render hints. Phase 1.06
 * renders these; Phase 1.05 scores them.
 *
 * ── The 8 signals → 7 generators ──────────────────────────────────────────────
 * The engine measures 8 fine signals (spec Дел 3.1) but only 7 are *testable*
 * tasks. Signal #5, **Attention, has no generator on purpose** — it is a DERIVED
 * indicator computed in Phase 1.05 from timing variability + misses + impulsive
 * errors (spec Дел 4: «Внимание (изведено) … Без посебен тест»). A real CPT is
 * 10–15 min and unreliable on an unsupervised phone; deriving it is more honest
 * and safer. So {@link Signal} deliberately omits "attention".
 */

/** A point on a normalized coordinate grid (geometry stimuli). */
export interface Point {
  x: number;
  y: number;
}

/** The 7 testable signals (Attention is derived in 1.05 — see file header). */
export type Signal = "gf" | "gv" | "gsm" | "gs" | "ef" | "glr" | "ct";

/** Abstract stimulus shapes (rendered to SVG in 1.06; arbitrary tokens here). */
export type ShapeKind =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "star"
  | "hexagon"
  | "pentagon"
  | "cross";

/** Grid move tokens, shared by Gs answer geometry and all CT tasks. */
export type Move = "up" | "down" | "left" | "right";

/** Fields every item carries regardless of signal. */
export interface ItemBase {
  signal: Signal;
  /** Difficulty level 1–10 (already clamped). */
  level: number;
  /** The exact seed string used to generate this item (reproducibility). */
  seed: string;
  /** True for un-scored worked examples (spec Дел 7.2). */
  practice: boolean;
  /** Level-proportional difficulty weight (config; consumed by 1.05 scoring). */
  difficultyWeight: number;
  /** Task-bank version, stored with each anonymous record (spec Дел 19.4). */
  taskBankVersion: string;
}

// ── Gf — Logic ────────────────────────────────────────────────────────────────

/** A single matrix cell: a combination of attribute values. */
export interface MatrixCell {
  shape: ShapeKind;
  /** Repeat count of the shape (1..n). */
  count: number;
  /** Abstract palette index (renderer maps to a concrete colour). */
  colorIndex: number;
  /** Orientation in degrees: 0 | 90 | 180 | 270. */
  rotation: number;
}

/** The four attribute names a matrix rule can act on. */
export type MatrixAttr = "shape" | "count" | "colorIndex" | "rotation";

/** How one attribute varies across the matrix. */
export type MatrixRuleKind =
  | "constant"
  | "progRow"
  | "progCol"
  | "progBoth"
  | "xor";

/** A per-attribute rule, sufficient to re-derive every cell's value. */
export interface MatrixAttrRule {
  attr: MatrixAttr;
  kind: MatrixRuleKind;
  /** Base value at cell (0,0). For categorical attrs this indexes a domain. */
  base: number;
  /** Step down rows (progRow / progBoth). */
  stepR: number;
  /** Step across columns (progCol / progBoth). */
  stepC: number;
  /** Cyclic domain size for categorical attrs (e.g. shape pool size). 0 = numeric. */
  domainSize: number;
  /** For `xor`: the two input columns' per-row values (length = matrix size). */
  xorCol0?: number[];
  xorCol1?: number[];
}

export interface GfMatrixStimulus {
  family: "matrix";
  /** Matrix side (2 or 3). */
  size: number;
  /** Row-major cells; exactly one entry is null (the blank to fill). */
  cells: (MatrixCell | null)[];
  /** Index of the blanked cell in `cells`. */
  blankIndex: number;
}

export interface GfSeriesStimulus {
  family: "series";
  /** Visible terms; the hidden next term is the answer. */
  terms: number[];
}

export type GfStimulus = GfMatrixStimulus | GfSeriesStimulus;

export interface GfMatrixMeta {
  family: "matrix";
  ruleType: string;
  /** The per-attribute rules — used by the test suite to re-derive the key. */
  rules: MatrixAttrRule[];
}

export interface GfSeriesMeta {
  family: "series";
  ruleType: SeriesRuleType;
}

export type SeriesRuleType =
  | "arithmetic"
  | "geometric"
  | "alternating"
  | "fibonacci"
  | "quadratic";

export interface GfMatrixItem extends ItemBase {
  signal: "gf";
  stimulus: GfMatrixStimulus;
  /** Four candidate cells; exactly one completes the pattern. */
  options: MatrixCell[];
  /** Index into `options` of the correct cell. */
  answer: number;
  meta: GfMatrixMeta;
}

export interface GfSeriesItem extends ItemBase {
  signal: "gf";
  stimulus: GfSeriesStimulus;
  /** Four candidate numbers; exactly one is the next term. */
  options: number[];
  answer: number;
  meta: GfSeriesMeta;
}

export type GfItem = GfMatrixItem | GfSeriesItem;

// ── Gv — Spatial ──────────────────────────────────────────────────────────────

/** A transform describing how an option was derived from a base shape. */
export interface ShapeTransform {
  /** Which base shape (0 = the prompt shape; >0 = a different shape). */
  shapeId: number;
  /** Whether the shape was reflected (mirror) — a chiral, non-rotation change. */
  reflect: boolean;
  /** Rotation applied, in degrees. */
  rotateDeg: number;
}

export interface GvOption {
  /** The option's polygon as explicit coordinate geometry. */
  points: Point[];
  /** How it was derived from the base (lets the test re-verify exactness). */
  transform: ShapeTransform;
}

export interface GvRotationStimulus {
  family: "rotation";
  /** The reference (prompt) shape at orientation 0. */
  base: Point[];
}

export interface GvOddOneOutStimulus {
  family: "oddOneOut";
  /** No separate prompt — the answer is the option that doesn't belong. */
  base: Point[];
}

export type GvStimulus = GvRotationStimulus | GvOddOneOutStimulus;

export interface GvMeta {
  family: "rotation" | "oddOneOut";
  /** The rotation angle of the correct option (rotation family). */
  correctAngle?: number;
}

export interface GvItem extends ItemBase {
  signal: "gv";
  stimulus: GvStimulus;
  options: GvOption[];
  /**
   * rotation family: index of the option that is a pure rotation of the base.
   * oddOneOut family: index of the reflected (odd) option.
   */
  answer: number;
  meta: GvMeta;
}

// ── Gsm — Memory (Corsi) ──────────────────────────────────────────────────────

export type CorsiDirection = "forward" | "backward";

export interface GsmStimulus {
  /** Fixed Corsi board: tile positions on a normalized grid. */
  tiles: Point[];
  /** Ordered tile indices to flash (the to-be-remembered sequence). */
  sequence: number[];
  direction: CorsiDirection;
}

export interface GsmMeta {
  direction: CorsiDirection;
  /** Per-tile presentation cadence in ms (render concern; not implemented here). */
  presentationMs: number;
}

export interface GsmItem extends ItemBase {
  signal: "gsm";
  stimulus: GsmStimulus;
  /** Expected tap order: the sequence, reversed for `backward`. */
  answer: number[];
  meta: GsmMeta;
}

// ── Gs — Processing speed (symbol search) ─────────────────────────────────────

export interface GsStimulus {
  cellCount: number;
  columns: number;
  /** Symbol id in each cell (indexes an abstract symbol set). */
  cells: number[];
  /** The symbol id(s) the child must find. */
  targets: number[];
}

export interface GsMeta {
  /** Visible-timer window in seconds (the only task with a timer; built in 1.06). */
  windowSec: readonly [number, number];
  hasVisibleTimer: true;
  /** Target/distractor similarity hint for the renderer (0..1). */
  similarity: number;
}

export interface GsItem extends ItemBase {
  signal: "gs";
  stimulus: GsStimulus;
  /** Answer key: indices of every cell containing a target symbol. */
  answer: number[];
  meta: GsMeta;
}

// ── EF — Planning (Tower of London) ───────────────────────────────────────────

/** A single move: take the top ball from peg `from` and place it on peg `to`. */
export interface TowerMove {
  from: number;
  to: number;
}

/** A board state: one stack of ball colour-ids per peg (bottom → top). */
export type TowerState = number[][];

export interface EfStimulus {
  pegCapacities: number[];
  start: TowerState;
  goal: TowerState;
}

export interface EfMeta {
  /** Number of balls in play. */
  ballCount: number;
}

export interface EfItem extends ItemBase {
  signal: "ef";
  stimulus: EfStimulus;
  /** Answer reference: the verified minimum move count + one optimal solution. */
  answer: {
    minMoves: number;
    optimalPath: TowerMove[];
  };
  meta: EfMeta;
}

// ── Glr — Learning (paired-associate) ─────────────────────────────────────────

export interface GlrPair {
  /** Cue symbol id (study side shown as the prompt). */
  cue: number;
  /** Target symbol id (the response to learn). */
  target: number;
}

export interface GlrTrial {
  /** The cue shown for this recall trial. */
  cue: number;
  /** Candidate target symbol ids (one correct). */
  options: number[];
  /** Index into `options` of the correct target. */
  correct: number;
}

export interface GlrStimulus {
  /** The study set: pairs to memorize. */
  pairs: GlrPair[];
  /** One recall round, keyed to the study set. */
  trials: GlrTrial[];
}

export interface GlrMeta {
  pairCount: number;
}

export interface GlrItem extends ItemBase {
  signal: "glr";
  stimulus: GlrStimulus;
  /** Correct option index per recall trial (aligned with `stimulus.trials`). */
  answer: number[];
  meta: GlrMeta;
}

// ── CT — STEM (5 sub-types) ───────────────────────────────────────────────────

export type CtSubtype = "sequence" | "debug" | "loop" | "condition" | "maze";

/** A move-program: an ordered list of grid moves. */
export type Program = Move[];

export interface CtSequenceStimulus {
  subtype: "sequence";
  gridSize: number;
  start: Point;
  goal: Point;
  /** Candidate move-programs; exactly one reaches the goal. */
  options: Program[];
}

export interface CtDebugStimulus {
  subtype: "debug";
  gridSize: number;
  start: Point;
  goal: Point;
  /** The program to debug; exactly one step is an illegal (off-grid) move. */
  program: Program;
}

/** A loop expression: repeat `body` `times` times. */
export interface LoopExpr {
  body: Move[];
  times: number;
}

export interface CtLoopStimulus {
  subtype: "loop";
  /** The flat repeated sequence to be matched to a loop. */
  sequence: Move[];
  /** Candidate loop expressions; exactly one expands to `sequence`. */
  options: LoopExpr[];
}

/** A condition→action rule (abstract tokens; language-neutral). */
export interface ConditionRule {
  /** Stimulus condition id (e.g. an abstract colour index). */
  when: number;
  /** Resulting action. */
  then: Move;
}

export interface CtConditionStimulus {
  subtype: "condition";
  /** The if→then mapping. */
  rules: ConditionRule[];
  /** The input sequence of conditions to map. */
  input: number[];
  /** Candidate output action sequences; exactly one applies the mapping. */
  options: Move[][];
}

export interface CtMazeCellWalls {
  n: boolean;
  e: boolean;
  s: boolean;
  w: boolean;
}

export interface CtMazeStimulus {
  subtype: "maze";
  size: number;
  /** Per-cell walls, row-major (index = y*size + x). */
  cells: CtMazeCellWalls[];
  start: Point;
  goal: Point;
}

export type CtStimulus =
  | CtSequenceStimulus
  | CtDebugStimulus
  | CtLoopStimulus
  | CtConditionStimulus
  | CtMazeStimulus;

export interface CtMeta {
  ctSubtype: CtSubtype;
}

/** CT answer shape varies by sub-type (all verified at generation). */
export type CtAnswer =
  // sequence / loop / condition → index of the correct option
  | { kind: "optionIndex"; value: number }
  // debug → index of the wrong step in the program
  | { kind: "stepIndex"; value: number }
  // maze → the unique solution path (cells + moves)
  | { kind: "path"; cells: Point[]; moves: Move[] };

export interface CtItem extends ItemBase {
  signal: "ct";
  stimulus: CtStimulus;
  answer: CtAnswer;
  meta: CtMeta;
}

// ── The unified Item ──────────────────────────────────────────────────────────

/** A generated task item — discriminated by `signal` (and family/subtype). */
export type Item =
  | GfItem
  | GvItem
  | GsmItem
  | GsItem
  | EfItem
  | GlrItem
  | CtItem;

/** Options accepted by the unified entry point and per-generator functions. */
export interface GenerateOpts {
  /** Gf / Gv: force a stimulus family (else chosen deterministically by seed). */
  family?: string;
  /** CT: force a sub-type (else chosen deterministically by seed). */
  subtype?: CtSubtype;
  /** Gsm: override sequence length (else from the level table). */
  length?: number;
  /** Gsm: override direction (else "forward"). */
  direction?: CorsiDirection;
}
