/**
 * Versioned difficulty configuration — the single place per-domain difficulty is
 * tuned. Each domain has a level 1→10 parameter table; a generator reads the row
 * for its requested level and turns those parameters into an item.
 *
 * This file is DATA ONLY (no randomness, no generation logic) and is bumped with
 * {@link TASK_BANK_VERSION} whenever a change would alter generated items.
 *
 * Out of scope here (Phase 1.05 owns it): per-age start levels, the +1/−1 span
 * growth, basal/ceiling, and any raw→index scoring. These tables only describe
 * "what an item at level L looks like."
 */

/** Levels are always clamped into this inclusive range. */
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

/** Clamp any number to an integer level in [1, 10]. */
export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_LEVEL;
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));
}

/**
 * Level-proportional difficulty weight (0.1 … 1.0), attached to every item.
 * The 1.05 scoring engine consumes this when weighting accuracy by item
 * difficulty; it is intentionally a simple, monotonic ramp here.
 */
export const WEIGHT_BY_LEVEL: readonly number[] = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
];

/** Difficulty weight for a (clamped) level. */
export function difficultyWeight(level: number): number {
  return WEIGHT_BY_LEVEL[clampLevel(level) - 1];
}

// ─────────────────────────────────────────────────────────────────────────────
// Gf — Logic: matrix reasoning + numeric series  (spec A.1, Дел 4)
// ─────────────────────────────────────────────────────────────────────────────

export type SeriesRuleClass =
  | "arithmetic" // +k                       (L1–2)
  | "geometric" // ×k                        (L3)
  | "alternating" // differences alternate    (L4)
  | "fibonacci" // tₙ = tₙ₋₁ + tₙ₋₂          (L5–7)
  | "quadratic"; // constant 2nd difference   (L8–10)

export interface GfLevel {
  /** Matrix side: 2 = 2×2 (low), 3 = 3×3 (high). */
  matrixSize: number;
  /** How many attributes vary across the matrix (1–3). */
  matrixAttrCount: number;
  /** Whether an XOR-style rule may be used (3×3 only). */
  matrixAllowXor: boolean;
  /** Rule family for the numeric-series family at this level. */
  seriesRule: SeriesRuleClass;
  /** Visible terms shown before the hidden next term. */
  seriesVisible: number;
}

const GF: readonly GfLevel[] = [
  {
    matrixSize: 2,
    matrixAttrCount: 1,
    matrixAllowXor: false,
    seriesRule: "arithmetic",
    seriesVisible: 4,
  },
  {
    matrixSize: 2,
    matrixAttrCount: 1,
    matrixAllowXor: false,
    seriesRule: "arithmetic",
    seriesVisible: 4,
  },
  {
    matrixSize: 2,
    matrixAttrCount: 2,
    matrixAllowXor: false,
    seriesRule: "geometric",
    seriesVisible: 4,
  },
  {
    matrixSize: 3,
    matrixAttrCount: 2,
    matrixAllowXor: false,
    seriesRule: "alternating",
    seriesVisible: 5,
  },
  {
    matrixSize: 3,
    matrixAttrCount: 2,
    matrixAllowXor: false,
    seriesRule: "fibonacci",
    seriesVisible: 5,
  },
  {
    matrixSize: 3,
    matrixAttrCount: 2,
    matrixAllowXor: true,
    seriesRule: "fibonacci",
    seriesVisible: 5,
  },
  {
    matrixSize: 3,
    matrixAttrCount: 3,
    matrixAllowXor: true,
    seriesRule: "fibonacci",
    seriesVisible: 6,
  },
  {
    matrixSize: 3,
    matrixAttrCount: 3,
    matrixAllowXor: true,
    seriesRule: "quadratic",
    seriesVisible: 5,
  },
  {
    matrixSize: 3,
    matrixAttrCount: 3,
    matrixAllowXor: true,
    seriesRule: "quadratic",
    seriesVisible: 5,
  },
  {
    matrixSize: 3,
    matrixAttrCount: 3,
    matrixAllowXor: true,
    seriesRule: "quadratic",
    seriesVisible: 6,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Gv — Spatial: mental rotation + odd-one-out  (spec A.2, Дел 4)
// ─────────────────────────────────────────────────────────────────────────────

export interface GvLevel {
  /** Vertex count of the asymmetric base polygon — more = more complex. */
  vertices: number;
  /** Rotation angles the correct option may use (degrees). */
  angles: readonly number[];
  /** Options shown (always 4 for MVP). */
  optionCount: number;
}

const GV: readonly GvLevel[] = [
  { vertices: 4, angles: [90, 180], optionCount: 4 },
  { vertices: 4, angles: [90, 180], optionCount: 4 },
  { vertices: 5, angles: [90, 135, 180], optionCount: 4 },
  { vertices: 5, angles: [90, 135, 180], optionCount: 4 },
  { vertices: 6, angles: [90, 135, 180], optionCount: 4 },
  { vertices: 6, angles: [135, 180], optionCount: 4 },
  { vertices: 7, angles: [135, 180], optionCount: 4 },
  { vertices: 7, angles: [135, 180], optionCount: 4 },
  { vertices: 8, angles: [135, 180], optionCount: 4 },
  { vertices: 8, angles: [135, 180], optionCount: 4 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Gsm — Memory: Corsi span over a fixed 6-tile board  (spec A.3, Дел 4, Прилог B.1)
// ─────────────────────────────────────────────────────────────────────────────

export interface GsmLevel {
  /** Default sequence length for this level (caller may override via opts). */
  length: number;
}

/** The Corsi board is a fixed 6-tile layout (spec A.3). */
export const GSM_TILE_COUNT = 6;
/** Per-tile presentation cadence in ms — render concern, recorded as metadata. */
export const GSM_PRESENTATION_MS = 700;

const GSM: readonly GsmLevel[] = [
  { length: 2 },
  { length: 3 },
  { length: 3 },
  { length: 4 },
  { length: 4 },
  { length: 5 },
  { length: 5 },
  { length: 6 },
  { length: 6 },
  { length: 7 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Gs — Processing speed: symbol search grid  (spec A.4, Дел 4, Дел 8)
// ─────────────────────────────────────────────────────────────────────────────

export interface GsLevel {
  /** Total cells in the grid (spec: 18–28). */
  cellCount: number;
  /** Distinct symbols available (target + distractors). */
  symbolSetSize: number;
  /** How many distinct symbols are designated targets. */
  targetSymbolCount: number;
  /** Fraction of cells that should be targets (answer-key density). */
  targetDensity: number;
  /** Target/distractor visual similarity hint for the renderer (0..1). */
  similarity: number;
}

/** Fixed column count for the Gs grid (rows derive from cellCount). */
export const GS_COLUMNS = 6;
/** Visible-timer window in seconds — render concern, recorded as metadata. */
export const GS_WINDOW_SEC: readonly [number, number] = [20, 25];

const GS: readonly GsLevel[] = [
  {
    cellCount: 18,
    symbolSetSize: 4,
    targetSymbolCount: 1,
    targetDensity: 0.35,
    similarity: 0.1,
  },
  {
    cellCount: 18,
    symbolSetSize: 4,
    targetSymbolCount: 1,
    targetDensity: 0.35,
    similarity: 0.2,
  },
  {
    cellCount: 20,
    symbolSetSize: 5,
    targetSymbolCount: 1,
    targetDensity: 0.35,
    similarity: 0.3,
  },
  {
    cellCount: 22,
    symbolSetSize: 5,
    targetSymbolCount: 1,
    targetDensity: 0.33,
    similarity: 0.4,
  },
  {
    cellCount: 24,
    symbolSetSize: 6,
    targetSymbolCount: 2,
    targetDensity: 0.33,
    similarity: 0.5,
  },
  {
    cellCount: 24,
    symbolSetSize: 6,
    targetSymbolCount: 2,
    targetDensity: 0.33,
    similarity: 0.6,
  },
  {
    cellCount: 26,
    symbolSetSize: 7,
    targetSymbolCount: 2,
    targetDensity: 0.31,
    similarity: 0.7,
  },
  {
    cellCount: 26,
    symbolSetSize: 7,
    targetSymbolCount: 2,
    targetDensity: 0.31,
    similarity: 0.8,
  },
  {
    cellCount: 28,
    symbolSetSize: 8,
    targetSymbolCount: 2,
    targetDensity: 0.3,
    similarity: 0.9,
  },
  {
    cellCount: 28,
    symbolSetSize: 8,
    targetSymbolCount: 2,
    targetDensity: 0.3,
    similarity: 1.0,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EF — Planning: Tower of London  (spec A.5, Дел 4)
// ─────────────────────────────────────────────────────────────────────────────

export interface EfLevel {
  /** Target minimum number of moves (spec: 2 → 5 by level). */
  minMoves: number;
}

/** Classic Tower of London peg capacities (3 balls, pegs hold 3 / 2 / 1). */
export const EF_PEG_CAPACITIES: readonly number[] = [3, 2, 1];
/** Number of distinct coloured balls. */
export const EF_BALL_COUNT = 3;

const EF: readonly EfLevel[] = [
  { minMoves: 2 },
  { minMoves: 2 },
  { minMoves: 3 },
  { minMoves: 3 },
  { minMoves: 4 },
  { minMoves: 4 },
  { minMoves: 4 },
  { minMoves: 5 },
  { minMoves: 5 },
  { minMoves: 5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Glr — Learning: paired-associate  (spec A.6, Дел 4)
// ─────────────────────────────────────────────────────────────────────────────

export interface GlrLevel {
  /** Number of symbol↔symbol pairs to learn (spec: 4–8). */
  pairs: number;
}

const GLR: readonly GlrLevel[] = [
  { pairs: 4 },
  { pairs: 4 },
  { pairs: 5 },
  { pairs: 5 },
  { pairs: 6 },
  { pairs: 6 },
  { pairs: 7 },
  { pairs: 7 },
  { pairs: 8 },
  { pairs: 8 },
];

// ─────────────────────────────────────────────────────────────────────────────
// CT — STEM: sequence / debug / loop / condition / maze  (spec A.8, Дел 4)
// ─────────────────────────────────────────────────────────────────────────────

export interface CtLevel {
  /** Grid side for sequence/debug robot tasks. */
  gridSize: number;
  /** Move-program length for the debug task. */
  programLength: number;
  /** Loop body length (moves) and repeat count for the loop task. */
  loopBody: number;
  loopTimes: number;
  /** Distinct conditions in the mapping + input length for the condition task. */
  conditionRules: number;
  conditionInput: number;
  /** Maze side (cells). */
  mazeSize: number;
}

const CT: readonly CtLevel[] = [
  {
    gridSize: 3,
    programLength: 3,
    loopBody: 1,
    loopTimes: 2,
    conditionRules: 2,
    conditionInput: 2,
    mazeSize: 3,
  },
  {
    gridSize: 3,
    programLength: 4,
    loopBody: 1,
    loopTimes: 2,
    conditionRules: 2,
    conditionInput: 3,
    mazeSize: 4,
  },
  {
    gridSize: 4,
    programLength: 4,
    loopBody: 1,
    loopTimes: 3,
    conditionRules: 3,
    conditionInput: 3,
    mazeSize: 4,
  },
  {
    gridSize: 4,
    programLength: 5,
    loopBody: 2,
    loopTimes: 3,
    conditionRules: 3,
    conditionInput: 4,
    mazeSize: 5,
  },
  {
    gridSize: 5,
    programLength: 5,
    loopBody: 2,
    loopTimes: 3,
    conditionRules: 3,
    conditionInput: 4,
    mazeSize: 5,
  },
  {
    gridSize: 5,
    programLength: 6,
    loopBody: 2,
    loopTimes: 4,
    conditionRules: 4,
    conditionInput: 5,
    mazeSize: 6,
  },
  {
    gridSize: 5,
    programLength: 6,
    loopBody: 2,
    loopTimes: 4,
    conditionRules: 4,
    conditionInput: 5,
    mazeSize: 6,
  },
  {
    gridSize: 6,
    programLength: 7,
    loopBody: 2,
    loopTimes: 4,
    conditionRules: 4,
    conditionInput: 6,
    mazeSize: 7,
  },
  {
    gridSize: 6,
    programLength: 7,
    loopBody: 3,
    loopTimes: 5,
    conditionRules: 4,
    conditionInput: 6,
    mazeSize: 7,
  },
  {
    gridSize: 6,
    programLength: 8,
    loopBody: 3,
    loopTimes: 5,
    conditionRules: 4,
    conditionInput: 6,
    mazeSize: 8,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Accessors — every generator reads its row through these (level auto-clamped).
// ─────────────────────────────────────────────────────────────────────────────

export const gfLevel = (level: number): GfLevel => GF[clampLevel(level) - 1];
export const gvLevel = (level: number): GvLevel => GV[clampLevel(level) - 1];
export const gsmLevel = (level: number): GsmLevel => GSM[clampLevel(level) - 1];
export const gsLevel = (level: number): GsLevel => GS[clampLevel(level) - 1];
export const efLevel = (level: number): EfLevel => EF[clampLevel(level) - 1];
export const glrLevel = (level: number): GlrLevel => GLR[clampLevel(level) - 1];
export const ctLevel = (level: number): CtLevel => CT[clampLevel(level) - 1];
