/**
 * Versioned difficulty configuration — CALIBRATION v2 (Phase 2.06).
 *
 * The single place per-domain difficulty is tuned. Each domain has a level 1→10
 * parameter table; a generator reads the row for its requested level and turns
 * those parameters into an item. As of v2 every ladder value is grounded in
 * published developmental research (Raven's CPM / Carpenter-Just-Shell rule
 * taxonomy, child mental-rotation studies, Corsi normative studies, WISC-V
 * processing-speed scaling, Tower of London child norms, KABC-II paired-associate
 * tradition, Bebras/CSTA/ScratchJr progressions) — it supersedes the spec's
 * Прилог A/B seed guesses (spec Дел 6.6 sanctions this; see Decisions D-129+).
 *
 * This file is DATA ONLY (no randomness, no generation logic) and is bumped with
 * {@link TASK_BANK_VERSION} whenever a change would alter generated items.
 *
 * Out of scope here (Phase 1.05 / seed-norms owns it): per-signal start levels,
 * the staircase/basal/ceiling rules, and any raw→index scoring. These tables only
 * describe "what an item at level L looks like" — plus the per-age UX constraints
 * (UX_BY_AGE) that both generators (option counts) and renderers (tap targets)
 * consume.
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
 * The scoring engine consumes this when weighting accuracy by item difficulty
 * (including the v2 basal credits); it is intentionally a simple, monotonic ramp.
 */
export const WEIGHT_BY_LEVEL: readonly number[] = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
];

/** Difficulty weight for a (clamped) level. */
export function difficultyWeight(level: number): number {
  return WEIGHT_BY_LEVEL[clampLevel(level) - 1];
}

// ─────────────────────────────────────────────────────────────────────────────
// Ages (task-bank local — content/tasks must not depend on content/norms)
// ─────────────────────────────────────────────────────────────────────────────

/** Supported age band; ages outside are clamped in (mirrors seed-norms). */
export const TASK_AGE_MIN = 5;
export const TASK_AGE_MAX = 13;

/** Clamp any age into the supported 5–13 band. */
export function clampTaskAge(age: number): number {
  if (!Number.isFinite(age)) return TASK_AGE_MIN;
  return Math.min(TASK_AGE_MAX, Math.max(TASK_AGE_MIN, Math.round(age)));
}

// ─────────────────────────────────────────────────────────────────────────────
// UX constraints by age (v2 §9) — ONE shared table for generators + renderers
// ─────────────────────────────────────────────────────────────────────────────

export interface UxConstraints {
  /** Maximum multiple-choice options an item may show at this age. */
  maxOptions: number;
  /** Minimum tap-target edge in px (NN/g child guidance for 5–6; brand ≥44). */
  minTapPx: number;
  /** On-screen clutter budget: "minimal" = one stimulus + options, nothing else. */
  clutter: "minimal" | "standard";
}

/**
 * v2 per-age UX constraints (research: NN/g child touch-target guidance; child
 * mental-rotation adaptations validated 2–3 options for ages 5–6).
 * Option counts BIND THE GENERATORS (an option set is clamped to `maxOptions`,
 * with the answer key + distractor set adapting deterministically); tap targets
 * and clutter bind the renderers.
 */
export const UX_BY_AGE: Readonly<Record<number, UxConstraints>> = {
  5: { maxOptions: 3, minTapPx: 72, clutter: "minimal" },
  6: { maxOptions: 3, minTapPx: 72, clutter: "minimal" },
  7: { maxOptions: 4, minTapPx: 48, clutter: "standard" },
  8: { maxOptions: 4, minTapPx: 48, clutter: "standard" },
  9: { maxOptions: 4, minTapPx: 48, clutter: "standard" },
  10: { maxOptions: 5, minTapPx: 44, clutter: "standard" },
  11: { maxOptions: 5, minTapPx: 44, clutter: "standard" },
  12: { maxOptions: 5, minTapPx: 44, clutter: "standard" },
  13: { maxOptions: 5, minTapPx: 44, clutter: "standard" },
};

/** UX constraints for a (clamped) age. */
export function uxForAge(age: number): UxConstraints {
  return UX_BY_AGE[clampTaskAge(age)];
}

/**
 * Clamp an option count to the age's UX maximum. Callers that generate without
 * an age (dev tooling) pass `undefined` and get the level value unclamped.
 */
export function clampOptionCount(count: number, age?: number): number {
  if (age === undefined) return count;
  return Math.min(count, uxForAge(age).maxOptions);
}

// ─────────────────────────────────────────────────────────────────────────────
// Gf — Logic: matrix reasoning + numeric series  (v2 §1)
// Research: Carpenter/Just/Shell rule taxonomy; Raven's CPM medians 14/36 (5½) →
// 28/36 (11); ×-series not fluent before ~grade 3–4.
// ─────────────────────────────────────────────────────────────────────────────

/** Carpenter-taxonomy rule classes a matrix level may draw on. */
export type MatrixRuleClass =
  | "constancy"
  | "progression"
  | "additionSubtraction"
  | "distributionOfThree"
  | "distributionOfTwo";

/** v2 numeric-series rule classes (one per level — see the GF table). */
export type SeriesRuleClass =
  | "plusOneTwo" // +1 / +2                         (L1)
  | "plusK" // +k, k≤5                              (L2)
  | "minusK" // −k                                  (L3)
  | "alternating" // alternating +/−                (L4)
  | "timesTwo" // ×2                                (L5)
  | "timesK" // ×k                                  (L6)
  | "interleaved" // two interleaved sub-series     (L7)
  | "timesThenPlus" // mixed ×-then-+               (L8)
  | "secondOrder" // second-order differences       (L9)
  | "fibonacci"; // Fibonacci-type / recursive      (L10)

export interface GfLevel {
  /** Matrix side: 2 = 2×2, 3 = 3×3. */
  matrixSize: number;
  /** How many attributes vary across the matrix (1–3). */
  matrixAttrCount: number;
  /** Rule classes legal at this level (varying attr i takes ruleTypes[i], progression fallback). */
  ruleTypes: readonly MatrixRuleClass[];
  /** Whether an XOR-style (distribution-of-two) rule may be used (3×3 only). */
  allowXor: boolean;
  /**
   * 1 = distractor differs in the ruled attribute obviously;
   * 2 = differs in one attribute; 3 = near-miss (one sub-feature, smallest step).
   * At 3, colour is never the single differing attribute (never colour-only).
   */
  distractorSubtlety: 1 | 2 | 3;
  /** Rule family for the numeric-series family at this level. */
  seriesRule: SeriesRuleClass;
  /** Visible terms shown before the hidden next term. */
  seriesVisible: number;
}

const GF: readonly GfLevel[] = [
  // L1
  {
    matrixSize: 2,
    matrixAttrCount: 1,
    ruleTypes: ["constancy"],
    allowXor: false,
    distractorSubtlety: 1,
    seriesRule: "plusOneTwo",
    seriesVisible: 4,
  },
  // L2
  {
    matrixSize: 2,
    matrixAttrCount: 1,
    ruleTypes: ["constancy", "progression"],
    allowXor: false,
    distractorSubtlety: 1,
    seriesRule: "plusK",
    seriesVisible: 4,
  },
  // L3
  {
    matrixSize: 2,
    matrixAttrCount: 1,
    ruleTypes: ["progression"],
    allowXor: false,
    distractorSubtlety: 2,
    seriesRule: "minusK",
    seriesVisible: 4,
  },
  // L4
  {
    matrixSize: 3,
    matrixAttrCount: 1,
    ruleTypes: ["progression"],
    allowXor: false,
    distractorSubtlety: 2,
    seriesRule: "alternating",
    seriesVisible: 5,
  },
  // L5
  {
    matrixSize: 3,
    matrixAttrCount: 2,
    ruleTypes: ["progression", "additionSubtraction"],
    allowXor: false,
    distractorSubtlety: 2,
    seriesRule: "timesTwo",
    seriesVisible: 4,
  },
  // L6
  {
    matrixSize: 3,
    matrixAttrCount: 2,
    ruleTypes: ["additionSubtraction", "distributionOfThree"],
    allowXor: false,
    distractorSubtlety: 2,
    seriesRule: "timesK",
    seriesVisible: 4,
  },
  // L7 — distribution-of-three + one progression combined
  {
    matrixSize: 3,
    matrixAttrCount: 2,
    ruleTypes: ["distributionOfThree", "progression"],
    allowXor: false,
    distractorSubtlety: 2,
    seriesRule: "interleaved",
    seriesVisible: 6,
  },
  // L8
  {
    matrixSize: 3,
    matrixAttrCount: 3,
    ruleTypes: ["distributionOfTwo"],
    allowXor: true,
    distractorSubtlety: 2,
    seriesRule: "timesThenPlus",
    seriesVisible: 5,
  },
  // L9 — two rules combined
  {
    matrixSize: 3,
    matrixAttrCount: 3,
    ruleTypes: ["distributionOfThree", "distributionOfTwo"],
    allowXor: true,
    distractorSubtlety: 3,
    seriesRule: "secondOrder",
    seriesVisible: 5,
  },
  // L10 — distribution-of-two + 2 companion rules
  {
    matrixSize: 3,
    matrixAttrCount: 3,
    ruleTypes: ["distributionOfTwo", "progression", "distributionOfThree"],
    allowXor: true,
    distractorSubtlety: 3,
    seriesRule: "fibonacci",
    seriesVisible: 5,
  },
];

/**
 * ×-based series are not age-appropriate before ~grade 3–4: below this age the
 * series family is capped at {@link GF_SERIES_MAX_LEVEL_UNDER_9} and the
 * generator substitutes a matrix item when the staircase would exceed the cap.
 */
export const GF_SERIES_TIMES_FROM_AGE = 9;
export const GF_SERIES_MAX_LEVEL_UNDER_9 = 4;

/** Below this age series render as countable object groups, never numerals. */
export const GF_SERIES_OBJECTS_UNDER_AGE = 7;

// ─────────────────────────────────────────────────────────────────────────────
// Gv — Spatial: mental rotation + odd-one-out over BLOCK FIGURES  (v2 §2)
// Research: rotation discrimination 0–45° at 5, 90° ~7, 135° ~9–10, 180° ~12;
// mirror (chiral) rejection unreliable before ~8; complexity 2–3 → 6–7 segments.
// ─────────────────────────────────────────────────────────────────────────────

export interface GvLevel {
  /** Rotation angles the correct option may use (degrees). */
  angles: readonly number[];
  /** Block-figure complexity: [min, max] unit segments in the polyomino figure. */
  segments: readonly [number, number];
  /** Options shown (clamped by the age's UX maximum). */
  optionCount: number;
  /** Whether mirror-image foils appear at all (from L4; unreliable before ~8). */
  mirrorDistractor: boolean;
  /** How many of the foils are true mirrors of the base. */
  mirrorFoilCount: 0 | 1 | 2;
}

const GV: readonly GvLevel[] = [
  {
    angles: [0, 45],
    segments: [2, 3],
    optionCount: 2,
    mirrorDistractor: false,
    mirrorFoilCount: 0,
  },
  {
    angles: [45],
    segments: [3, 3],
    optionCount: 3,
    mirrorDistractor: false,
    mirrorFoilCount: 0,
  },
  {
    angles: [90],
    segments: [3, 4],
    optionCount: 4,
    mirrorDistractor: false,
    mirrorFoilCount: 0,
  },
  {
    angles: [90],
    segments: [4, 4],
    optionCount: 4,
    mirrorDistractor: true,
    mirrorFoilCount: 1,
  },
  {
    angles: [120],
    segments: [4, 5],
    optionCount: 4,
    mirrorDistractor: true,
    mirrorFoilCount: 1,
  },
  {
    angles: [135],
    segments: [5, 5],
    optionCount: 4,
    mirrorDistractor: true,
    mirrorFoilCount: 1,
  },
  {
    angles: [135],
    segments: [5, 5],
    optionCount: 4,
    mirrorDistractor: true,
    mirrorFoilCount: 1,
  },
  {
    angles: [180],
    segments: [5, 6],
    optionCount: 4,
    mirrorDistractor: true,
    mirrorFoilCount: 1,
  },
  {
    angles: [180],
    segments: [6, 6],
    optionCount: 4,
    mirrorDistractor: true,
    mirrorFoilCount: 2,
  },
  {
    angles: [180],
    segments: [6, 7],
    optionCount: 5,
    mirrorDistractor: true,
    mirrorFoilCount: 2,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Gsm — Memory: Corsi span  (v2 §3)
// Research: forward Corsi ~3.5 (5) → ~6 (13), plateau ~6.9 early adolescence
// (Farrell Pagulayan 2006; Isaacs & Vargha-Khadem 1989); backward ≈ forward
// (Kessels), reliably testable from 8; crisscross paths are an independent
// difficulty lever (Busch 2005; Orsini).
// ─────────────────────────────────────────────────────────────────────────────

export type GsmPathKind = "simple" | "crisscross";

export interface GsmLevel {
  /** Sequence length flashed on the board. */
  length: number;
  /** Recall order asked of the child. */
  direction: "forward" | "backward";
  /** crisscross = consecutive taps forced to non-adjacent tiles. */
  path: GsmPathKind;
}

const GSM: readonly GsmLevel[] = [
  { length: 2, direction: "forward", path: "simple" },
  { length: 3, direction: "forward", path: "simple" },
  { length: 3, direction: "backward", path: "simple" },
  { length: 4, direction: "forward", path: "simple" },
  { length: 4, direction: "backward", path: "simple" },
  { length: 5, direction: "forward", path: "simple" },
  { length: 5, direction: "backward", path: "simple" },
  { length: 6, direction: "forward", path: "crisscross" },
  { length: 7, direction: "forward", path: "crisscross" },
  { length: 7, direction: "backward", path: "crisscross" },
];

/** Backward Corsi runs only from this age (single source; norms re-exports it). */
export const GSM_BACKWARD_FROM_AGE = 8;

/**
 * Under-8 substitution rule (v2 §3): every `backward` level is served as
 * `forward + crisscross` at the same length. Deterministic, encoded here in the
 * level lookup so the engine and the tests share one source.
 */
export function gsmLevelForAge(level: number, age?: number): GsmLevel {
  const row = GSM[clampLevel(level) - 1];
  if (
    age !== undefined &&
    clampTaskAge(age) < GSM_BACKWARD_FROM_AGE &&
    row.direction === "backward"
  ) {
    return { length: row.length, direction: "forward", path: "crisscross" };
  }
  return row;
}

/** Simplified 6-tile board for ages 5–6; the standard 9-tile board from 7. */
export const GSM_TILE_COUNT_YOUNG = 6;
export const GSM_TILE_COUNT_STANDARD = 9;
export const GSM_STANDARD_BOARD_FROM_AGE = 7;

/** Corsi board size for an age (6 tiles at 5–6, canonical 9 from 7). */
export function gsmTileCount(age?: number): number {
  if (age === undefined) return GSM_TILE_COUNT_STANDARD;
  return clampTaskAge(age) < GSM_STANDARD_BOARD_FROM_AGE
    ? GSM_TILE_COUNT_YOUNG
    : GSM_TILE_COUNT_STANDARD;
}

/** Per-tile highlight duration in ms (inside the researched 300–1000 ms band). */
export const GSM_PRESENTATION_MS = 700;
/** Inter-stimulus interval between highlights in ms (researched 300–500 ms band). */
export const GSM_ISI_MS = 400;

// ─────────────────────────────────────────────────────────────────────────────
// Gs — Processing speed: symbol search  (v2 §4)
// Research: WISC-V scales speeded-task length by age; throughput roughly doubles
// 7 → 13. Gs is FIXED-BY-AGE (speeded-subtest convention: no staircase, no
// basal): one per-age parameter row, 1 practice + 2 scored rounds.
// ─────────────────────────────────────────────────────────────────────────────

/** Distractor-similarity tier: 1 = unrelated, 2 = rotations/reflections of the
 * target glyph, 3 = near-miss one-detail variants. */
export type GsSimilarityTier = 1 | 2 | 3;

export interface GsLevel {
  /** Total cells in the grid. */
  cellCount: number;
  /** Distractors per target (target:distractor density 1:N). */
  distractorsPerTarget: number;
  /** Similarity tier range [min, max]; a mixed range draws from both tiers. */
  similarity: readonly [GsSimilarityTier, GsSimilarityTier];
  /** How many distinct symbols are designated targets. */
  targetSymbolCount: number;
  /** Visible-timer window in seconds (the one allowed timer). */
  windowSec: number;
}

/** The v2 per-age Gs parameter table (absorbs GS_LEVEL_BY_AGE + GS_WINDOW_SEC). */
export const GS_BY_AGE: Readonly<Record<number, GsLevel>> = {
  5: {
    cellCount: 12,
    distractorsPerTarget: 2,
    similarity: [1, 1],
    targetSymbolCount: 1,
    windowSec: 40,
  },
  6: {
    cellCount: 15,
    distractorsPerTarget: 2,
    similarity: [1, 1],
    targetSymbolCount: 1,
    windowSec: 35,
  },
  7: {
    cellCount: 18,
    distractorsPerTarget: 2,
    similarity: [1, 2],
    targetSymbolCount: 1,
    windowSec: 30,
  },
  8: {
    cellCount: 20,
    distractorsPerTarget: 3,
    similarity: [2, 2],
    targetSymbolCount: 2,
    windowSec: 25,
  },
  9: {
    cellCount: 22,
    distractorsPerTarget: 3,
    similarity: [2, 2],
    targetSymbolCount: 2,
    windowSec: 25,
  },
  10: {
    cellCount: 24,
    distractorsPerTarget: 3,
    similarity: [2, 2],
    targetSymbolCount: 2,
    windowSec: 22,
  },
  11: {
    cellCount: 24,
    distractorsPerTarget: 4,
    similarity: [2, 3],
    targetSymbolCount: 2,
    windowSec: 20,
  },
  12: {
    cellCount: 26,
    distractorsPerTarget: 4,
    similarity: [3, 3],
    targetSymbolCount: 2,
    windowSec: 20,
  },
  13: {
    cellCount: 28,
    distractorsPerTarget: 4,
    similarity: [3, 3],
    targetSymbolCount: 2,
    windowSec: 20,
  },
};

/** Gs parameters for a (clamped) age. */
export function gsForAge(age: number): GsLevel {
  return GS_BY_AGE[clampTaskAge(age)];
}

/** Scored Gs rounds (WISC convention: fixed length, round 2 = fresh layout). */
export const GS_ROUNDS = 2;

/** Grid columns by age — young grids use fewer columns so cells stay ≥72 px. */
export function gsColumns(age?: number): number {
  if (age !== undefined && clampTaskAge(age) <= 6) return 4;
  return 6;
}

/** Nominal 1–10 level recorded on Gs items (age-pegged; Gs has no ladder). */
export function gsNominalLevel(age: number): number {
  return clampLevel(clampTaskAge(age) - 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// EF — Planning: Tower of London  (v2 §6)
// Research: 2-move at 5, 3-move ~7–8, 4-move ~9–10, 5-move ~11–12, 6–7-move 13+
// (Krikorian 1994; Anderson 1996; De Luca 2003; TOLDX). Standard 3-ball/3-peg
// with capacities 3/2/1 suits the whole range.
// ─────────────────────────────────────────────────────────────────────────────

export interface EfLevel {
  /** Target minimum number of moves (the difficulty lever). */
  minMoves: number;
  /**
   * A constrained problem's optimal path requires ≥1 counter-intuitive move
   * (moving a ball away from its goal peg first): the greedy "always place a
   * correct ball if possible" strategy must NOT reach minMoves.
   */
  constrained: boolean;
  /** L2: prefer a goal arrangement that shares ≥1 ball position with the start. */
  distractorGoal: boolean;
}

/** Classic Tower of London peg capacities (3 balls, pegs hold 3 / 2 / 1). */
export const EF_PEG_CAPACITIES: readonly number[] = [3, 2, 1];
/** Number of distinct coloured balls. */
export const EF_BALL_COUNT = 3;

const EF: readonly EfLevel[] = [
  { minMoves: 2, constrained: false, distractorGoal: false },
  { minMoves: 2, constrained: false, distractorGoal: true },
  { minMoves: 3, constrained: false, distractorGoal: false },
  { minMoves: 3, constrained: true, distractorGoal: false },
  { minMoves: 4, constrained: false, distractorGoal: false },
  { minMoves: 4, constrained: true, distractorGoal: false },
  { minMoves: 5, constrained: false, distractorGoal: false },
  { minMoves: 5, constrained: true, distractorGoal: false },
  // 6- and 7-move problems are INHERENTLY constrained in the 3-ball/3-peg
  // space (exhaustively verified: every ≥6-move-optimal pair requires vacating
  // a goal peg) — encoded honestly so meta.constrained matches the ladder.
  { minMoves: 6, constrained: true, distractorGoal: false },
  { minMoves: 7, constrained: true, distractorGoal: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Glr — Learning: paired-associate  (v2 §7 — [provisional] throughout)
// Research: KABC-II Atlantis/Rebus tradition; pairs grow ~3–4 (5) → 8+ (13);
// trials-to-criterion shrink 3–4 → 2; pictorial → abstract with age.
// ─────────────────────────────────────────────────────────────────────────────

export type GlrSymbolStyle = "pictorial" | "mixed" | "abstract";

export interface GlrLevel {
  /** Number of cue↔target pairs to learn. */
  pairs: number;
  /** Study→recall rounds for one item (absorbs the old GLR_ROUNDS_BY_AGE). */
  trials: 2 | 3;
  /** pictorial = nameable objects; mixed = pictorial cue ↔ abstract target. */
  symbolStyle: GlrSymbolStyle;
}

const GLR: readonly GlrLevel[] = [
  { pairs: 4, trials: 3, symbolStyle: "pictorial" },
  { pairs: 4, trials: 2, symbolStyle: "pictorial" },
  { pairs: 5, trials: 3, symbolStyle: "pictorial" },
  { pairs: 6, trials: 3, symbolStyle: "pictorial" },
  { pairs: 6, trials: 2, symbolStyle: "mixed" },
  { pairs: 6, trials: 2, symbolStyle: "abstract" },
  { pairs: 8, trials: 3, symbolStyle: "abstract" },
  { pairs: 8, trials: 2, symbolStyle: "abstract" },
  { pairs: 10, trials: 3, symbolStyle: "abstract" },
  { pairs: 10, trials: 2, symbolStyle: "abstract" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CT — STEM: computational thinking  (v2 §8)
// Research: Bebras bands (Kits 6–8 / Castors 8–10 / Benjamin 10–12 / Cadet
// 12–14) + CSTA 1A + ScratchJr/Scratch: sequencing 5–6, debugging 7, loops 8,
// events 9, conditionals 10, nested 11, counters 12, efficiency 13.
// ─────────────────────────────────────────────────────────────────────────────

export type CtFamily =
  | "sequence"
  | "debug"
  | "loop"
  | "loopEvent"
  | "condition"
  | "conditionLoop"
  | "nestedLoop"
  | "counter"
  | "optimize";

export interface CtLevel {
  /** The task families legal at this level (picked deterministically by seed). */
  family: readonly CtFamily[];
  /** Board side for robot tasks. */
  gridSize: number;
  /** Target path/program length. */
  programLength: number;
  /** Direction changes in the target path. */
  turns: number;
  /** Blocked cells on the board. */
  obstacles: number;
  /** Loop body length (moves) and repeat count for loop families. */
  loopBody: number;
  loopTimes: number;
  /** Distinct condition rules + input length for condition families. */
  conditionRules: number;
  conditionInput: number;
}

const CT: readonly CtLevel[] = [
  // L1 — sequence: 2–3 steps, 1 turn, 0 obstacles
  {
    family: ["sequence"],
    gridSize: 3,
    programLength: 3,
    turns: 1,
    obstacles: 0,
    loopBody: 2,
    loopTimes: 2,
    conditionRules: 2,
    conditionInput: 3,
  },
  // L2 — sequence: 4–5 steps, 1–2 turns
  {
    family: ["sequence"],
    gridSize: 4,
    programLength: 5,
    turns: 2,
    obstacles: 0,
    loopBody: 2,
    loopTimes: 2,
    conditionRules: 2,
    conditionInput: 3,
  },
  // L3 — sequence + debug: 5 steps, 2 turns, 1 obstacle
  {
    family: ["sequence", "debug"],
    gridSize: 4,
    programLength: 5,
    turns: 2,
    obstacles: 1,
    loopBody: 2,
    loopTimes: 2,
    conditionRules: 2,
    conditionInput: 3,
  },
  // L4 — loop (repeat n): body 2–3, 6-step path
  {
    family: ["loop"],
    gridSize: 4,
    programLength: 6,
    turns: 2,
    obstacles: 0,
    loopBody: 2,
    loopTimes: 3,
    conditionRules: 2,
    conditionInput: 4,
  },
  // L5 — loop + loopEvent: 8-step, nested-turn path
  {
    family: ["loop", "loopEvent"],
    gridSize: 5,
    programLength: 8,
    turns: 3,
    obstacles: 0,
    loopBody: 2,
    loopTimes: 4,
    conditionRules: 2,
    conditionInput: 4,
  },
  // L6 — condition: branching, 1 condition rule (if X → A, else → B)
  {
    family: ["condition"],
    gridSize: 5,
    programLength: 6,
    turns: 2,
    obstacles: 1,
    loopBody: 2,
    loopTimes: 3,
    conditionRules: 2,
    conditionInput: 4,
  },
  // L7 — conditionLoop: condition + loop combined
  {
    family: ["conditionLoop"],
    gridSize: 5,
    programLength: 8,
    turns: 3,
    obstacles: 1,
    loopBody: 3,
    loopTimes: 2,
    conditionRules: 2,
    conditionInput: 6,
  },
  // L8 — nestedLoop: loop-in-loop, 2 conditions max
  {
    family: ["nestedLoop"],
    gridSize: 6,
    programLength: 8,
    turns: 3,
    obstacles: 1,
    loopBody: 2,
    loopTimes: 2,
    conditionRules: 2,
    conditionInput: 6,
  },
  // L9 — counter: variable/counter + nested structure
  {
    family: ["counter"],
    gridSize: 6,
    programLength: 9,
    turns: 3,
    obstacles: 1,
    loopBody: 3,
    loopTimes: 3,
    conditionRules: 3,
    conditionInput: 6,
  },
  // L10 — optimize: shortest-equivalent-program / multi-constraint path
  {
    family: ["optimize"],
    gridSize: 6,
    programLength: 10,
    turns: 4,
    obstacles: 2,
    loopBody: 3,
    loopTimes: 3,
    conditionRules: 3,
    conditionInput: 6,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Accessors — every generator reads its row through these (level auto-clamped).
// ─────────────────────────────────────────────────────────────────────────────

export const gfLevel = (level: number): GfLevel => GF[clampLevel(level) - 1];
export const gvLevel = (level: number): GvLevel => GV[clampLevel(level) - 1];
export const gsmLevel = (level: number): GsmLevel => GSM[clampLevel(level) - 1];
export const efLevel = (level: number): EfLevel => EF[clampLevel(level) - 1];
export const glrLevel = (level: number): GlrLevel => GLR[clampLevel(level) - 1];
export const ctLevel = (level: number): CtLevel => CT[clampLevel(level) - 1];
