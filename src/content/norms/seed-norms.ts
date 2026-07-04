/**
 * Seed norms & scoring config — the SINGLE tuning surface for Phase 1.05.
 *
 * Every tunable number the adaptive engine and the scoring layer use lives here,
 * and EVERY value is a **seed / initial reference value** (spec Дел 6.6 / Дел
 * 19.4): a defensible starting point to be **recalibrated** from pilot data and
 * the anonymous score corpus. Nothing here is a measured norm yet — that is what
 * `normsStage: "seed"` in the result announces.
 *
 * Like the rest of the engine this is PURE DATA: no randomness, no clock, no env.
 * Age-keyed tables are accessed through the small `byAge` helper, which clamps
 * the age into the supported 5–13 band first.
 *
 * Seed sources / rationale are logged in `Decisions.md` (D-054 … D-060).
 */

import type { IndexKey } from "@/lib/indices";
import type { Signal } from "@/features/tasks";

/** Bumped when a scoring formula or composite changes (carried in result.meta). */
export const SCORING_VERSION = "1.0.0";
/** Bumped when any seed norm / threshold here changes (carried in result.meta). */
export const NORMS_VERSION = "1.0.0";

/** Supported age band (years). Ages outside are clamped in. */
export const AGE_MIN = 5;
export const AGE_MAX = 13;

/** The derived 8th signal — measured, never administered (spec Дел 3.1 #5). */
export type ScoredSignal = Signal | "attention";

/** Clamp any age to the supported 5–13 band. */
export function clampAge(age: number): number {
  if (!Number.isFinite(age)) return AGE_MIN;
  return Math.min(AGE_MAX, Math.max(AGE_MIN, Math.round(age)));
}

/** An age-keyed seed table (ages 5–13). */
export type AgeTable<T> = Readonly<Record<number, T>>;

/** Read an age-keyed table with the age clamped into range first. */
export function byAge<T>(table: AgeTable<T>, age: number): T {
  return table[clampAge(age)];
}

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE — start levels, span expectations, caps, termination
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SEED — start level by age for the laddered domains (spec Дел 5 / Прилог A, the
 * Gf table). Used as the **shared default for every level-laddered domain** (Gf,
 * Gv, EF, CT). The Gf curve as a shared start default beyond Gf is a seed
 * assumption (D-054): per-domain start curves should be split out once pilot data
 * shows the domains diverge.
 */
export const START_LEVEL_BY_AGE: AgeTable<number> = {
  5: 1,
  6: 2,
  7: 2,
  8: 3,
  9: 4,
  10: 5,
  11: 6,
  12: 7,
  13: 8,
};

/**
 * SEED — expected forward Corsi span by age (Прилог B.1). The spec lists half-step
 * bands (e.g. 6→"4–5"); each is resolved **down to the lower integer** (D-055) so
 * the seed expectation sits at the safely-attainable end of the published band —
 * pre-calibration this keeps early results from reading as "below typical."
 *
 *   spec band:  5→4  6→4-5  7→5  8→5  9→5-6  10→6  11→6  12→6-7  13→7
 *   resolved:   5→4  6→4    7→5  8→5  9→5    10→6  11→6  12→6    13→7
 */
export const EXPECTED_FORWARD_SPAN_BY_AGE: AgeTable<number> = {
  5: 4,
  6: 4,
  7: 5,
  8: 5,
  9: 5,
  10: 6,
  11: 6,
  12: 6,
  13: 7,
};

/** SEED — backward expected span ≈ forward − this, applied from `BACKWARD_FROM_AGE`. */
export const BACKWARD_SPAN_OFFSET = 2;
/** Backward Corsi runs only from this age up (spec Дел 5). */
export const BACKWARD_FROM_AGE = 8;
/** Hard span bounds (the 6-tile board comfortably supports up to 9). */
export const GSM_MIN_SPAN = 2;
export const GSM_MAX_SPAN = 9;

/**
 * SEED — item caps per laddered domain, by age cluster (spec Дел 5: 5–6 short,
 * 7–9 mid, 10–13 longer; target 4–6 items). Per spec Дел 3.2 the lone-signal
 * indices (Gf→Logic, Gv→Spatial) get a slightly higher cap than the shared-index
 * domains (EF, CT) for stability (D-056).
 */
export type AgeCluster = "young" | "mid" | "older";

/** Map an age to its battery-length cluster. */
export function ageCluster(age: number): AgeCluster {
  const a = clampAge(age);
  if (a <= 6) return "young";
  if (a <= 9) return "mid";
  return "older";
}

/** SEED — lone-signal laddered domains (their index rests on one signal). */
export const LONE_SIGNAL_DOMAINS: readonly Signal[] = ["gf", "gv"];

/** SEED — item caps: lone-signal domains slightly higher than shared ones. */
export const ITEM_CAPS: Readonly<
  Record<"lone" | "shared", Record<AgeCluster, number>>
> = {
  lone: { young: 5, mid: 6, older: 6 },
  shared: { young: 4, mid: 5, older: 5 },
};

/** Item cap for a laddered domain at an age. */
export function itemCap(signal: Signal, age: number): number {
  const kind = LONE_SIGNAL_DOMAINS.includes(signal) ? "lone" : "shared";
  return ITEM_CAPS[kind][ageCluster(age)];
}

/** SEED — terminate a laddered domain after this many consecutive errors (spec Дел 5). */
export const CEILING_CONSECUTIVE_ERRORS = 2;
/** SEED — terminate a Corsi direction after this many consecutive errors. */
export const SPAN_CEILING_CONSECUTIVE_ERRORS = 2;
/**
 * SEED — backstop trial cap per Corsi direction. The consecutive-error rule
 * normally ends a direction first, but a child sitting exactly at their span
 * boundary oscillates pass/fail and never hits two errors in a row — this caps
 * that staircase so a direction never runs long (worst case 6 + 6 from age 8).
 */
export const GSM_MAX_TRIALS_PER_DIRECTION = 6;

/**
 * SEED — Gs grid level by age (the grid grows 18→28 cells across the 1.04 Gs level
 * table; Прилог A.4). Gs is administered as ONE timed grid sized by age, not a
 * ladder, so age picks a fixed level row.
 */
export const GS_LEVEL_BY_AGE: AgeTable<number> = {
  5: 1,
  6: 2,
  7: 3,
  8: 4,
  9: 5,
  10: 6,
  11: 7,
  12: 8,
  13: 9,
};

/**
 * SEED — Glr difficulty level by age (pairs grow 4→8 across the 1.04 Glr level
 * table; Прилог A.6) and the number of recall rounds (spec: 2–3). Younger ⇒ 2
 * rounds, 9+ ⇒ 3 rounds (D-057).
 */
export const GLR_LEVEL_BY_AGE: AgeTable<number> = {
  5: 1,
  6: 2,
  7: 3,
  8: 4,
  9: 5,
  10: 6,
  11: 7,
  12: 8,
  13: 9,
};
export const GLR_ROUNDS_BY_AGE: AgeTable<number> = {
  5: 2,
  6: 2,
  7: 2,
  8: 2,
  9: 3,
  10: 3,
  11: 3,
  12: 3,
  13: 3,
};

/**
 * SEED — the order domains are administered (spec Дел 5 leaves the order open).
 * Interleaves heavy reasoning (Gf) with lighter memory/spatial/speed beats so the
 * battery doesn't front-load fatigue. Tunable; deterministic regardless (D-058).
 */
export const DOMAIN_ORDER: readonly Signal[] = [
  "gf",
  "gsm",
  "gv",
  "gs",
  "ef",
  "glr",
  "ct",
];

// ─────────────────────────────────────────────────────────────────────────────
// TIME RULES (spec Дел 8) — math only; the engine never runs a clock
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SEED — an idle gap longer than this (ms) is treated as a real pause and excluded
 * from a task's effective time (spec Дел 8 rule 3 / Дел 7.1). Set above the
 * ~20–25 s gentle-nudge window so only inactivity that *continues past* the nudge
 * is formally excluded (D-059).
 */
export const IDLE_GAP_EXCLUDE_MS = 30_000;

// ─────────────────────────────────────────────────────────────────────────────
// RAW → 0–100 INDEX (spec Дел 6.2 / Прилог B.2) — three formula families
// ─────────────────────────────────────────────────────────────────────────────

/** Every signal index is clamped into this band; the number is never shown raw. */
export const INDEX_MIN = 8;
export const INDEX_MAX = 99;

/** accuracy family: index = base + accuracy_weighted · scale  (1.0 → 95). */
export const ACCURACY_INDEX = { base: 20, scale: 75 } as const;
/** span family: index = base + (span − expected) · perUnit  (span = expected → 50). */
export const SPAN_INDEX = { base: 50, perUnit: 14 } as const;
/** speed family: index = base + (netPerMin − expected) · perUnit  (= expected → 50). */
export const SPEED_INDEX = { base: 50, perUnit: 6 } as const;

/** Which raw→index family each scored signal uses (D-060 marks the seed mappings). */
export const INDEX_FAMILY: Readonly<
  Record<ScoredSignal, "accuracy" | "span" | "speed">
> = {
  gf: "accuracy",
  gv: "accuracy",
  ct: "accuracy",
  ef: "accuracy", // SEED: EF efficiency ratio (minMoves/moves) mapped to accuracy family
  glr: "accuracy", // SEED: Glr recall accuracy mapped to accuracy family
  attention: "accuracy", // SEED: attention 0–1 score mapped to accuracy family
  gsm: "span",
  gs: "speed",
};

/**
 * SEED — expected Gs net throughput in (correct − 0.5·errors) per MINUTE, by age.
 * The spec gives the Gs raw score but not an expected rate, so this whole table is
 * a seed (D-060). Per-minute units keep the ×6 speed multiplier in a sensible
 * range (a few items/min off typical ⇒ a meaningful, not explosive, index shift).
 */
export const GS_EXPECTED_NET_PER_MIN_BY_AGE: AgeTable<number> = {
  5: 8,
  6: 10,
  7: 12,
  8: 13,
  9: 14,
  10: 16,
  11: 17,
  12: 18,
  13: 20,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITE INDICES (spec Дел 6.3) — keyed by lib/indices IndexKey
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Composite weights (spec Дел 6.3). Keyed by the canonical `IndexKey` from
 * `src/lib/indices.ts` (logic / spatial / memory / planning / stem) — the single
 * source of index identity, NOT redefined here. A composite is a weighted sum of
 * the named signals' 0–100 indices.
 */
export const COMPOSITE_WEIGHTS: Readonly<
  Record<IndexKey, Partial<Record<ScoredSignal, number>>>
> = {
  logic: { gf: 1 },
  spatial: { gv: 1 },
  memory: { gsm: 0.7, attention: 0.3 },
  planning: { ef: 0.6, gs: 0.4 },
  stem: { ct: 0.5, glr: 0.5 },
};

// ─────────────────────────────────────────────────────────────────────────────
// BANDS (spec Дел 6.4) — word label per index; enum matches band-label.tsx
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SEED-but-spec'd band cut-offs (spec Дел 6.4). The enum values
 * (development/solid/strong/exceptional) match `components/ui/band-label.tsx`
 * exactly so the result feeds the UI kit with no adapter.
 */
export const BAND_THRESHOLDS = {
  exceptional: 80, // 80–100
  strong: 64, // 64–79
  solid: 45, // 45–63
  // < 45 → development
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// CONFIDENCE (spec Дел 6.5) — high / medium / low; enum matches confidence-label.tsx
// ─────────────────────────────────────────────────────────────────────────────

/** SEED — laddered/Corsi item counts for the confidence tiers. */
export const CONFIDENCE_ITEMS = {
  /** ≥ this many scored items in a contributing domain ⇒ high evidence. */
  high: 4,
  /** ≥ this (and < high) ⇒ medium evidence; below ⇒ low. */
  medium: 3,
} as const;

/** SEED — Glr recall rounds for the confidence tiers. */
export const CONFIDENCE_GLR_ROUNDS = { high: 3, medium: 2 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// VALIDITY (spec Дел 7.1) — flags + graduated verdict
// ─────────────────────────────────────────────────────────────────────────────

/** SEED — per-item reaction time below this (ms) counts as "too fast" (spec Дел 7.1). */
export const TOO_FAST_MS = 500;
/** SEED — > this fraction of answers too-fast ⇒ STRONG session flag (spec: >30%). */
export const TOO_FAST_FRACTION_STRONG = 0.3;
/** SEED — > this fraction of multiple-choice answers on the same option position ⇒ flag (spec: >60%). */
export const SAME_POSITION_FRACTION = 0.6;
/** SEED — more than this many excluded idle pauses ⇒ flag (spec Дел 7.1). */
export const MAX_IDLE_PAUSES = 3;
/** SEED — Gs: tapping ≥ this fraction of all cells ⇒ "mashing" flag on Gs (spec Дел 7.1). */
export const GS_MASHING_FRACTION = 0.9;

/** SEED — chance accuracy for a 4-option multiple-choice domain. */
export const CHANCE_ACCURACY_4OPT = 0.25;
/** SEED — accuracy within ±this of chance (with enough items) ⇒ random-level ⇒ reduced confidence. */
export const RANDOM_ACCURACY_DELTA = 0.1;
/** SEED — minimum scored items before random-level accuracy is judged. */
export const RANDOM_ACCURACY_MIN_ITEMS = 3;

// ─────────────────────────────────────────────────────────────────────────────
// VALIDITY THRESHOLD MODULATION (Phase 3.01) — age band · parent-assist · device
// ─────────────────────────────────────────────────────────────────────────────
//
// Spec Дел 6.4 / 7.2 / 7.4 / 8: the §7.1 thresholds are not one-size-fits-all.
// Young children (5–7) pause and mis-tap more; a parent reading items aloud
// (`parentAssistMode`, typically 5–7yo) adds legitimate pauses + quick post-read
// taps; and "too fast" is only meaningful RELATIVE to how fast the child taps on
// THEIR device (§7.2 device calibration, D-071). These mechanics RELAX the base
// thresholds so young / assisted / slow-device sessions are not false-flagged,
// while leaving the BASE case (mid/older age, unassisted, no calibration)
// byte-identical to the 1.05 thresholds above — so existing behaviour and every
// existing test are preserved. Every value here is a SEED (Дел 6.6) to recalibrate
// from pilot data; the 1.05 base thresholds are UNCHANGED (this phase adds
// mechanics, it does not re-tune the seed values — D-129/D-133).

/** Ages at/below this get the relaxed "young" validity band (spec Дел 7.4). */
export const YOUNG_VALIDITY_MAX_AGE = 7;

/** SEED — too-fast fraction for a STRONG verdict, relaxed for the young band. */
export const TOO_FAST_FRACTION_STRONG_YOUNG = 0.45;
/** SEED — and relaxed further when a parent reads items aloud (Дел 7.4). */
export const TOO_FAST_FRACTION_STRONG_ASSISTED = 0.5;

/** SEED — max excluded idle pauses before the flag, relaxed for young / assisted. */
export const MAX_IDLE_PAUSES_YOUNG = 5;
export const MAX_IDLE_PAUSES_ASSISTED = 6;

/**
 * SEED — device-relative "too fast" (spec Дел 7.2 / D-071): an item answered in
 * less than `baselineTapMs · TOO_FAST_BASELINE_MULT` had no time for real
 * cognition on THIS device. The threshold SCALES with the child's own tap
 * cadence, so the same *relative* behaviour (e.g. answering at 2× one's baseline)
 * gets the same verdict on a fast and a slow device — not the absolute-ms bias
 * that would penalise a slow device or miss mashing on a fast one. Clamped to
 * [floor, ceil] so a very fast device still has an impossibility floor and a very
 * slow baseline can't flag everything. With NO calibration, the absolute
 * `TOO_FAST_MS` (500) is used — identical to 1.05.
 */
export const TOO_FAST_BASELINE_MULT = 2.5;
export const TOO_FAST_MS_FLOOR = 250;
export const TOO_FAST_MS_CEIL = 1_500;

/** Session context that modulates the §7.1 validity thresholds (absent ⇒ base). */
export interface ValidityContext {
  /** Child age (years) — the young band relaxes thresholds for 5–7yo. */
  age?: number;
  /** Parent reads items aloud (typically 5–7yo) — relaxes time-based thresholds. */
  parentAssistMode?: boolean;
  /** Device tap baseline (ms) from the first practice item (§7.2, D-071). */
  deviceBaselineMs?: number;
}

/** The resolved, context-modulated §7.1 thresholds a session is judged against. */
export interface ValidityThresholds {
  /** Per-item raw-elapsed threshold (ms) under which a response is "too fast". */
  tooFastMs: number;
  /** Fraction of too-fast answers that tips the session to a STRONG verdict. */
  tooFastFractionStrong: number;
  /** Excluded idle pauses tolerated before the idle-count flag. */
  maxIdlePauses: number;
}

const isYoungBand = (age: number | undefined): boolean =>
  age !== undefined && clampAge(age) <= YOUNG_VALIDITY_MAX_AGE;

/**
 * Resolve the §7.1 thresholds for a session from its age / assist / device
 * context. Relaxations are the MOST lenient applicable (assisted ≥ young ≥ base)
 * so a young *and* assisted session gets the fullest protection; the device
 * baseline sets the too-fast MS independently. `{}` ⇒ the exact 1.05 base values.
 */
export function resolveValidityThresholds(
  ctx: ValidityContext = {},
): ValidityThresholds {
  const young = isYoungBand(ctx.age);
  const assisted = ctx.parentAssistMode === true;

  const tooFastFractionStrong = assisted
    ? TOO_FAST_FRACTION_STRONG_ASSISTED
    : young
      ? TOO_FAST_FRACTION_STRONG_YOUNG
      : TOO_FAST_FRACTION_STRONG;

  const maxIdlePauses = assisted
    ? MAX_IDLE_PAUSES_ASSISTED
    : young
      ? MAX_IDLE_PAUSES_YOUNG
      : MAX_IDLE_PAUSES;

  const tooFastMs =
    ctx.deviceBaselineMs !== undefined && ctx.deviceBaselineMs > 0
      ? Math.min(
          TOO_FAST_MS_CEIL,
          Math.max(
            TOO_FAST_MS_FLOOR,
            Math.round(ctx.deviceBaselineMs * TOO_FAST_BASELINE_MULT),
          ),
        )
      : TOO_FAST_MS;

  return { tooFastMs, tooFastFractionStrong, maxIdlePauses };
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENTION (derived signal — spec Дел 3.1 #5 / Дел 4 / Дел 8)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SEED — attention = clamp01(1 − normVariability − impulsiveErrorRate), where
 * normVariability = min(1, CV / cvCap) and CV is the coefficient of variation of
 * effective times across the reasoning items below.
 */
export const ATTENTION = {
  /** CV at/above this maps to full normalised variability (1.0). */
  cvCap: 1.0,
  /** Signals whose effective-time variability feeds attention. */
  variabilitySignals: ["gf", "gv", "ef", "ct"] as readonly Signal[],
  /** Signals whose too-fast-and-wrong rate feeds the impulsive-error term (clean binary MC). */
  impulsiveSignals: ["gf", "gv", "ct"] as readonly Signal[],
} as const;
