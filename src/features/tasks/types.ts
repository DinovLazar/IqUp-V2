/**
 * The Item contract — the single shared shape every generator produces.
 *
 * Like `src/lib/pentagon.ts`, this module is PURE DATA: no React, no DOM, no
 * SVG/markup strings, no CSS. A generator returns the stimulus as structured
 * data / coordinate geometry, the option set where applicable, the verified
 * correct answer, and a small `meta` bag of scoring/render hints. Phase 1.06
 * renders these; Phase 1.05 scores them. Task bank v2 (Phase 2.06) extends the
 * shapes for the research calibration: composed matrix cells (+size attribute,
 * addition/subtraction + distribution rules), object-notation series, polyomino
 * block figures with mirror foils, Corsi path kinds + the 9-tile board, Gs
 * similarity-tier symbol descriptors, constrained ToL problems, Glr
 * trials/symbol styles, and the 9 CT task families (maze retired).
 *
 * ── The 8 signals → 7 generators ──────────────────────────────────────────────
 * The engine measures 8 fine signals (spec Дел 3.1) but only 7 are *testable*
 * tasks. Signal #5, **Attention, has no generator on purpose** — it is a DERIVED
 * indicator computed in scoring from timing variability + misses + impulsive
 * errors (spec Дел 4: «Внимание (изведено) … Без посебен тест»). A real CPT is
 * 10–15 min and unreliable on an unsupervised phone; deriving it is more honest
 * and safer. So {@link Signal} deliberately omits "attention".
 */

import type {
  CtFamily,
  GsSimilarityTier,
  GsmPathKind,
  GlrSymbolStyle,
  SeriesRuleClass,
} from "@/content/tasks/levels";

/** A point on a normalized coordinate grid (geometry stimuli). */
export interface Point {
  x: number;
  y: number;
}

/** The 7 testable signals (Attention is derived in scoring — see file header). */
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

/** Grid move tokens, shared by all CT robot tasks. */
export type Move = "up" | "down" | "left" | "right";

/** Fields every item carries regardless of signal. */
export interface ItemBase {
  signal: Signal;
  /** Difficulty level 1–10 (already clamped; Gs: the age-pegged nominal level). */
  level: number;
  /** The exact seed string used to generate this item (reproducibility). */
  seed: string;
  /** True for un-scored worked examples (spec Дел 7.2). */
  practice: boolean;
  /** Level-proportional difficulty weight (config; consumed by scoring). */
  difficultyWeight: number;
  /** Task-bank version, stored with each anonymous record (spec Дел 19.4). */
  taskBankVersion: string;
}

// ── Gf — Logic ────────────────────────────────────────────────────────────────

/** A single matrix cell: a combination of attribute values (v2 adds size). */
export interface MatrixCell {
  shape: ShapeKind;
  /** Repeat count of the shape (1..5 in v2). */
  count: number;
  /** Abstract palette index (renderer maps to the 4-hue colourblind-safer set). */
  colorIndex: number;
  /** Orientation in degrees: 0 | 90 | 180 | 270. */
  rotation: number;
  /** Size step: 0 = small, 1 = medium, 2 = large. */
  size: number;
}

/** The five attribute names a matrix rule can act on (v2 adds size). */
export type MatrixAttr = "shape" | "count" | "colorIndex" | "rotation" | "size";

/** How one attribute varies across the matrix (v2 adds addSub + distThree). */
export type MatrixRuleKind =
  | "constant"
  | "progRow"
  | "progCol"
  | "progBoth"
  | "xor"
  | "addSub"
  | "distThree";

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
  /** For `xor` (distribution-of-two): the two input columns' per-row values. */
  xorCol0?: number[];
  xorCol1?: number[];
  /** For `addSub`: per-row operand columns and the operation sign. */
  addCol0?: number[];
  addCol1?: number[];
  addSign?: 1 | -1;
  /** For `distThree`: the 3 domain values + the Latin-square arrangement. */
  distValues?: number[];
  latin?: number[][];
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
  /** "objects" = render terms as countable object groups (ages < 7), never numerals. */
  notation: "objects" | "digits";
}

export type GfStimulus = GfMatrixStimulus | GfSeriesStimulus;

export interface GfMatrixMeta {
  family: "matrix";
  ruleType: string;
  /** The per-attribute rules — used by the test suite to re-derive the key. */
  rules: MatrixAttrRule[];
  /** Distractor subtlety tier (1–3) the options were built with. */
  distractorSubtlety: 1 | 2 | 3;
}

export interface GfSeriesMeta {
  family: "series";
  ruleType: SeriesRuleClass;
}

export interface GfMatrixItem extends ItemBase {
  signal: "gf";
  stimulus: GfMatrixStimulus;
  /** Candidate cells (age-clamped count); exactly one completes the pattern. */
  options: MatrixCell[];
  /** Index into `options` of the correct cell. */
  answer: number;
  meta: GfMatrixMeta;
}

export interface GfSeriesItem extends ItemBase {
  signal: "gf";
  stimulus: GfSeriesStimulus;
  /** Candidate numbers (age-clamped count); exactly one is the next term. */
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
  /** The option's outline polygon as explicit coordinate geometry. */
  points: Point[];
  /** How it was derived from the base (lets the test re-verify exactness). */
  transform: ShapeTransform;
}

export interface GvRotationStimulus {
  family: "rotation";
  /** The reference (prompt) block figure at orientation 0 (polyomino outline). */
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
  /** How many option foils are true mirrors of the base. */
  mirrorFoilCount: number;
  /** Unit segments in the block figure (complexity). */
  segments: number;
}

export interface GvItem extends ItemBase {
  signal: "gv";
  stimulus: GvStimulus;
  options: GvOption[];
  /**
   * rotation family: index of the option that is a pure rotation of the base.
   * oddOneOut family: index of the odd option (mirror from L4; other shape below).
   */
  answer: number;
  meta: GvMeta;
}

// ── Gsm — Memory (Corsi) ──────────────────────────────────────────────────────

export type CorsiDirection = "forward" | "backward";

export interface GsmStimulus {
  /** The Corsi board: tile positions on a normalized grid (6 young / 9 standard). */
  tiles: Point[];
  /** Ordered tile indices to flash (the to-be-remembered sequence). */
  sequence: number[];
  direction: CorsiDirection;
  /** crisscross = consecutive flashes on non-adjacent tiles. */
  path: GsmPathKind;
}

export interface GsmMeta {
  direction: CorsiDirection;
  path: GsmPathKind;
  /** Per-tile highlight duration in ms (render concern). */
  presentationMs: number;
  /** Inter-stimulus interval between highlights in ms (render concern). */
  isiMs: number;
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
  /** Symbol id per cell — encodes family + variant (see gs.ts SYMBOL ids). */
  cells: number[];
  /** The symbol id(s) the child must find (base variants of target families). */
  targets: number[];
}

export interface GsMeta {
  /** Visible-timer window in seconds (the only task with a timer). */
  windowSec: number;
  hasVisibleTimer: true;
  /** Distractor-similarity tier range the grid was built with. */
  similarity: readonly [GsSimilarityTier, GsSimilarityTier];
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
  /** True when every optimal path needs a counter-intuitive (away-from-goal) move. */
  constrained: boolean;
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
  /** Candidate target symbol ids (one correct; count age-clamped). */
  options: number[];
  /** Index into `options` of the correct target. */
  correct: number;
}

export interface GlrStimulus {
  /** The study set: pairs to memorize. */
  pairs: GlrPair[];
  /** One recall round, keyed to the study set (re-run `meta.trials` times). */
  trials: GlrTrial[];
}

export interface GlrMeta {
  pairCount: number;
  /** Study→recall rounds this item is administered with (from the ladder row). */
  trials: 2 | 3;
  /** pictorial / mixed / abstract symbol style (from the ladder row). */
  symbolStyle: GlrSymbolStyle;
}

export interface GlrItem extends ItemBase {
  signal: "glr";
  stimulus: GlrStimulus;
  /** Correct option index per recall trial (aligned with `stimulus.trials`). */
  answer: number[];
  meta: GlrMeta;
}

// ── CT — STEM (9 task families, v2) ───────────────────────────────────────────

export type { CtFamily };

/** A move-program: an ordered list of grid moves. */
export type Program = Move[];

export interface CtSequenceStimulus {
  subtype: "sequence";
  gridSize: number;
  start: Point;
  goal: Point;
  /** Blocked cells the robot may not enter. */
  obstacles: Point[];
  /** Candidate move-programs; exactly one reaches the goal. */
  options: Program[];
}

export interface CtDebugStimulus {
  subtype: "debug";
  gridSize: number;
  start: Point;
  goal: Point;
  obstacles: Point[];
  /** The program to debug; exactly one step is an illegal (crashing) move. */
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

export interface CtLoopEventStimulus {
  subtype: "loopEvent";
  gridSize: number;
  start: Point;
  /** The event tile: the loop body repeats until the robot lands exactly here. */
  eventTile: Point;
  obstacles: Point[];
  /** Candidate loop bodies; exactly one, repeated, lands on the event tile. */
  options: Move[][];
}

/** A condition→action rule (abstract tokens; language-neutral). */
export interface ConditionRule {
  /** Stimulus condition id (an abstract colour+number token). */
  when: number;
  /** Resulting action. */
  then: Move;
}

export interface CtConditionStimulus {
  /** conditionLoop = the same mapping applied over a looped (repeating) input. */
  subtype: "condition" | "conditionLoop";
  /** The if→then mapping. */
  rules: ConditionRule[];
  /** The input sequence of conditions to map. */
  input: number[];
  /** conditionLoop: length of the repeating base pattern inside `input`. */
  patternLength?: number;
  /** Candidate output action sequences; exactly one applies the mapping. */
  options: Move[][];
}

/** A nested loop program: repeat outer × (pre + inner×body + post). */
export interface NestedLoopExpr {
  outerTimes: number;
  pre: Move[];
  innerTimes: number;
  innerBody: Move[];
  post: Move[];
}

export interface CtNestedLoopStimulus {
  subtype: "nestedLoop";
  /** The flat sequence to be matched to a nested loop. */
  sequence: Move[];
  /** Candidate nested-loop expressions; exactly one expands to `sequence`. */
  options: NestedLoopExpr[];
}

export interface CtCounterStimulus {
  subtype: "counter";
  /** The visible growing program (segments 1..k concatenated). */
  sequence: Move[];
  /** Segment lengths (for rendering the grouping); grows by the counter step. */
  segmentLengths: number[];
  /** Candidate next segments; exactly one continues the counter pattern. */
  options: Move[][];
}

export interface CtOptimizeStimulus {
  subtype: "optimize";
  gridSize: number;
  start: Point;
  goal: Point;
  obstacles: Point[];
  /** A working-but-wasteful program that reaches the goal. */
  redundantProgram: Program;
  /** Candidate programs; exactly one reaches the goal in the minimum moves. */
  options: Program[];
}

export type CtStimulus =
  | CtSequenceStimulus
  | CtDebugStimulus
  | CtLoopStimulus
  | CtLoopEventStimulus
  | CtConditionStimulus
  | CtNestedLoopStimulus
  | CtCounterStimulus
  | CtOptimizeStimulus;

export interface CtMeta {
  ctSubtype: CtFamily;
}

/** CT answer shape varies by family (all verified at generation). */
export type CtAnswer =
  // option-set families → index of the correct option
  | { kind: "optionIndex"; value: number }
  // debug → index of the wrong step in the program
  | { kind: "stepIndex"; value: number };

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
  /**
   * Child age (5–13). Drives the v2 age constraints: option-count clamps
   * (UX_BY_AGE), Gf series notation + the under-9 ×-series cap, the Corsi board
   * size + under-8 backward substitution, and the whole Gs parameter row.
   * Dev tooling may omit it — the level tables then apply unclamped.
   */
  age?: number;
  /** Gf / Gv: force a stimulus family (else chosen deterministically by seed). */
  family?: string;
  /** CT: force a family (else chosen deterministically from the level's set). */
  subtype?: CtFamily;
  /** Gsm: override sequence length (else from the level row). */
  length?: number;
  /** Gsm: override direction (else from the level row). */
  direction?: CorsiDirection;
  /** Gsm: override path kind (else from the level row). */
  path?: GsmPathKind;
  /** Gs: seed for target-symbol selection, shared across the 2 scored rounds so
   * both rounds hunt the same targets over a fresh layout. */
  targetSeed?: string;
}
