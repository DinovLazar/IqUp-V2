/**
 * Norms & scoring config — CALIBRATION v2 (Phase 2.06).
 *
 * (The filename keeps its 1.05 name to avoid an import churn; the "seed" framing
 * is superseded: as of v2 the start levels, expectations, caps and thresholds are
 * grounded in published developmental research — Raven's CPM medians, Corsi
 * normative studies (Farrell Pagulayan 2006; Isaacs & Vargha-Khadem 1989;
 * Kessels 2008), WISC-V speeded-subtest scaling, Tower of London child norms,
 * KABC-II paired-associate tradition, Bebras/CSTA bands, and RT-variability
 * development research. Values that are interpolated/extrapolated rather than
 * directly research-backed are marked `[provisional]` and registered in
 * {@link PROVISIONAL_NORMS} — the Phase-3 pilot-recalibration worklist.)
 *
 * Like the rest of the engine this is PURE DATA: no randomness, no clock, no env.
 * Age-keyed tables are accessed through the small `byAge` helper, which clamps
 * the age into the supported 5–13 band first.
 */

import type { IndexKey } from "@/lib/indices";
import type { Signal } from "@/features/tasks";
import {
  GSM_BACKWARD_FROM_AGE,
  WEIGHT_BY_LEVEL,
  clampLevel,
  uxForAge,
} from "@/content/tasks/levels";

/** Bumped when a scoring formula or composite changes (carried in result.meta).
 * v2: level-weighted EF/Glr scores, per-age accuracy anchors, banded attention
 * normalisation, Corsi backward offset 2 → 0.5, two-round Gs aggregation. */
export const SCORING_VERSION = "2.0.0";
/** Bumped when any norm / threshold here changes (carried in result.meta).
 * v2 = the research calibration; MAJOR because items + answer keys change. */
export const NORMS_VERSION = "2.0.0";

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

/** An age-keyed table (ages 5–13). */
export type AgeTable<T> = Readonly<Record<number, T>>;

/** Read an age-keyed table with the age clamped into range first. */
export function byAge<T>(table: AgeTable<T>, age: number): T {
  return table[clampAge(age)];
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVISIONAL-NORMS REGISTER (v2 §10) — the Phase-3 pilot recalibration worklist
// ─────────────────────────────────────────────────────────────────────────────

export interface ProvisionalNorm {
  /** Stable key — the completeness test pins the exact set. */
  key: string;
  /** What is provisional and why (interpolated / extrapolated / tuned). */
  reason: string;
}

/**
 * Every norm value below that is interpolated/extrapolated/tuned rather than
 * directly research-backed. Pilot recalibration (Phase 3) works this list off;
 * a norms test asserts the register is non-empty and lists exactly these keys.
 */
export const PROVISIONAL_NORMS: readonly ProvisionalNorm[] = [
  {
    key: "corsi-expected-span-ages-8-13",
    reason:
      "Ages 8–13 interpolated between the Isaacs & Vargha-Khadem age-7 point (4.1) and the Farrell Pagulayan grade-8 endpoint (6.9 plateau).",
  },
  {
    key: "corsi-backward-offset",
    reason:
      "Kessels 2008 shows Corsi backward ≈ forward; the 0.5 offset is a conservative estimate, not a published value (the old 2 was a digit-span convention).",
  },
  {
    key: "glr-ladder-starts-expectations",
    reason:
      "KABC-II per-age pair counts are proprietary; the whole Glr ladder, start levels and expectations are reconstructed from the PAL literature.",
  },
  {
    key: "attention-cv-bands",
    reason:
      "Per-age RT-CV bands are inferred from group means (ABCD, SART/flanker studies); no published clean age-banded tables exist.",
  },
  {
    key: "attention-omission-commission-cutoffs",
    reason:
      "Omission/commission validity cut-offs extrapolated from CPT error-rate development; not directly normed.",
  },
  {
    key: "gs-expected-net-per-min",
    reason:
      "Derived from the v2 per-age grid geometry assuming a typical child clears ~60–70% of targets; pilot-calibrate.",
  },
  {
    key: "accuracy-index-anchors",
    reason:
      "The accuracy scale (75) and the closed-form expected weighted accuracy per signal/age (incl. the attention expected score 0.5) are tuned so a typical staircase run lands at index ≈ 50 — they are anchor constants, not research-given.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE — per-signal start levels, caps, termination (v2 §0–§8)
// ─────────────────────────────────────────────────────────────────────────────

/** Every laddered signal (all but the fixed-by-age, speeded Gs). */
export type LadderedSignal = Exclude<Signal, "gs">;

/**
 * v2 per-signal start levels (replaces the shared START_LEVEL_BY_AGE — the
 * research shows starts differ by domain; a 13-year-old starts Gf at L7 but CT
 * at L9). Glr values are [provisional] (see PROVISIONAL_NORMS).
 */
export const START_LEVELS: Readonly<Record<LadderedSignal, AgeTable<number>>> =
  {
    gf: { 5: 1, 6: 1, 7: 2, 8: 3, 9: 4, 10: 5, 11: 6, 12: 6, 13: 7 },
    gv: { 5: 1, 6: 2, 7: 3, 8: 4, 9: 5, 10: 6, 11: 7, 12: 8, 13: 8 },
    gsm: { 5: 1, 6: 2, 7: 2, 8: 3, 9: 4, 10: 4, 11: 5, 12: 6, 13: 6 },
    ef: { 5: 1, 6: 1, 7: 3, 8: 3, 9: 4, 10: 5, 11: 6, 12: 7, 13: 7 },
    glr: { 5: 1, 6: 1, 7: 3, 8: 3, 9: 4, 10: 6, 11: 6, 12: 7, 13: 7 },
    ct: { 5: 1, 6: 2, 7: 3, 8: 4, 9: 5, 10: 6, 11: 7, 12: 8, 13: 9 },
  };

/** Start level for a laddered signal at a (clamped) age. */
export function startLevel(signal: LadderedSignal, age: number): number {
  return byAge(START_LEVELS[signal], age);
}

/**
 * v2 expected forward Corsi span by age. Ages 5–7 are research points (Farrell
 * Pagulayan; Isaacs & Vargha-Khadem); ages 8–13 are interpolated [provisional].
 */
export const EXPECTED_FORWARD_SPAN_BY_AGE: AgeTable<number> = {
  5: 3.5,
  6: 4,
  7: 4.1,
  8: 4.5,
  9: 5,
  10: 5.3,
  11: 5.5,
  12: 5.8,
  13: 6,
};

/**
 * Corsi backward expectation = forward − this [provisional]. Kessels 2008:
 * backward is NOT meaningfully harder than forward — the old offset of 2 was a
 * digit-span convention and is deleted; 0.5 is a conservative Corsi-specific
 * estimate.
 */
export const CORSI_BACKWARD_OFFSET = 0.5;

/** Backward Corsi runs only from this age (single source: the task-bank config). */
export const BACKWARD_FROM_AGE = GSM_BACKWARD_FROM_AGE;

/** Top span the v2 Gsm ladder reaches (L9/L10 length 7) — the ceiling marker. */
export const GSM_MAX_SPAN = 7;

/** Age clusters (battery length + session guards). */
export type AgeCluster = "young" | "mid" | "older";

/** Map an age to its battery-length cluster. */
export function ageCluster(age: number): AgeCluster {
  const a = clampAge(age);
  if (a <= 6) return "young";
  if (a <= 9) return "mid";
  return "older";
}

/** Lone-signal laddered domains (their index rests on one signal) get +1 cap. */
export const LONE_SIGNAL_DOMAINS: readonly Signal[] = ["gf", "gv"];

/**
 * v2 item caps (scored items per laddered domain, §0): sized to land inside the
 * attention-span session guards (young ≈ 8–10 min, mid ≈ 12–14, older ≈ 16–18).
 */
export const ITEM_CAPS: Readonly<
  Record<"lone" | "shared", Record<AgeCluster, number>>
> = {
  lone: { young: 5, mid: 6, older: 7 },
  shared: { young: 4, mid: 5, older: 6 },
};

/** Item cap for a laddered domain at an age. */
export function itemCap(signal: Signal, age: number): number {
  const kind = LONE_SIGNAL_DOMAINS.includes(signal) ? "lone" : "shared";
  return ITEM_CAPS[kind][ageCluster(age)];
}

/** Terminate a laddered domain after this many consecutive errors (post-basal). */
export const CEILING_CONSECUTIVE_ERRORS = 2;

/**
 * Backstop trial cap per Corsi direction (kept from v1): the v2 item caps end
 * the domain first in practice, but no direction may ever run past this.
 */
export const GSM_MAX_TRIALS_PER_DIRECTION = 6;

/**
 * The order domains are administered (spec Дел 5 leaves the order open).
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
 * An idle gap longer than this (ms) is treated as a real pause and excluded
 * from a task's effective time (spec Дел 8 rule 3 / Дел 7.1). Set above the
 * ~20–25 s gentle-nudge window so only inactivity that *continues past* the
 * nudge is formally excluded (D-059). Unchanged in v2.
 */
export const IDLE_GAP_EXCLUDE_MS = 30_000;

// ─────────────────────────────────────────────────────────────────────────────
// RAW → 0–100 INDEX (v2) — three formula families, anchored so 50 = typical
// for the EXACT age under the v2 ladders and start levels.
// ─────────────────────────────────────────────────────────────────────────────

/** Every signal index is clamped into this band; the number is never shown raw. */
export const INDEX_MIN = 8;
export const INDEX_MAX = 99;

/**
 * accuracy family (v2): a PIECEWISE-linear map anchored at the per-signal,
 * per-age expectation — [0, expected] → [bottom, center] and [expected, 1] →
 * [center, top]. `expectedAcc` is the closed-form typical staircase outcome
 * (see {@link expectedWeightedAccuracy}), so a typical child lands at 50 at
 * every age AND a perfect run reaches the top band at every age (a fixed slope
 * would compress the ceiling for older ages, whose expectation is higher).
 * The anchor constants are [provisional].
 */
export const ACCURACY_INDEX = { center: 50, top: 95, bottom: 20 } as const;
/** span family: index = base + (span − expected) · perUnit (span = expected → 50). */
export const SPAN_INDEX = { base: 50, perUnit: 14 } as const;
/** speed family: index = base + (netPerMin − expected) · perUnit (= expected → 50). */
export const SPEED_INDEX = { base: 50, perUnit: 6 } as const;

/** Which raw→index family each scored signal uses. */
export const INDEX_FAMILY: Readonly<
  Record<ScoredSignal, "accuracy" | "span" | "speed">
> = {
  gf: "accuracy",
  gv: "accuracy",
  ct: "accuracy",
  ef: "accuracy", // level-weighted planning efficiency (v2)
  glr: "accuracy", // level-weighted recall accuracy (v2)
  attention: "accuracy",
  gsm: "span",
  gs: "speed",
};

/** The attention score of a typical child (CV at band midpoint, no impulsive
 * errors) — the accuracy-family anchor for the derived signal [provisional]. */
export const ATTENTION_EXPECTED_SCORE = 0.5;

/**
 * Closed-form expected level-weighted accuracy of a TYPICAL child for a
 * laddered accuracy-family signal at an age: the child alternates pass (at the
 * start level S) / fail (at S+1) up to the item cap, with basal credit for
 * every level below S. Used as the per-signal, per-age accuracy anchor so a
 * typical run maps to index ≈ 50 [provisional — anchor construction, not a
 * research value].
 */
export function expectedWeightedAccuracy(
  signal: Exclude<LadderedSignal, "gsm">,
  age: number,
): number {
  const s = startLevel(signal, age);
  const cap = itemCap(signal, age);
  const passes = Math.ceil(cap / 2);
  const fails = Math.floor(cap / 2);
  const wPass = WEIGHT_BY_LEVEL[clampLevel(s) - 1];
  const wFail = WEIGHT_BY_LEVEL[clampLevel(s + 1) - 1];
  let credit = 0;
  for (let l = 1; l < clampLevel(s); l++) credit += WEIGHT_BY_LEVEL[l - 1];
  const num = credit + passes * wPass;
  const den = num + fails * wFail;
  return den > 0 ? num / den : 0;
}

/**
 * v2 expected Gs net throughput in (correct − 0.5·errors) per MINUTE, by age
 * [provisional — pilot-calibrate]. Derived from the v2 per-age grid table
 * (GS_BY_AGE): expected = 0.65 · gridTargets(age) · 60 / windowSec(age) — a
 * typical child clears ~65% of the grid's targets in the window; anchors the
 * speed index so that child lands at ≈ 50. (Not strictly monotone: the grid's
 * target count dips where the 1:N density coarsens — a geometry artifact the
 * pilot will smooth.)
 */
export const GS_EXPECTED_NET_PER_MIN_BY_AGE: AgeTable<number> = {
  5: 4,
  6: 5.5,
  7: 8,
  8: 8,
  9: 9.5,
  10: 10.5,
  11: 10,
  12: 10,
  13: 11.5,
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
 * Spec'd band cut-offs (Дел 6.4). The enum values
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

/** Laddered/Corsi item counts for the confidence tiers. */
export const CONFIDENCE_ITEMS = {
  /** ≥ this many scored items in a contributing domain ⇒ high evidence. */
  high: 4,
  /** ≥ this (and < high) ⇒ medium evidence; below ⇒ low. */
  medium: 3,
} as const;

/** Glr recall rounds (summed across items in v2) for the confidence tiers. */
export const CONFIDENCE_GLR_ROUNDS = { high: 3, medium: 2 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// VALIDITY (spec Дел 7.1) — flags + graduated verdict, v2 age-banded
// ─────────────────────────────────────────────────────────────────────────────

/** Per-item reaction time below this (ms) counts as "too fast" (unchanged). */
export const TOO_FAST_MS = 500;
/**
 * AGELESS FALLBACK fraction of too-fast answers that tips a session to a STRONG
 * verdict — used ONLY when no age is supplied (a non-production edge; a real
 * session always carries the child's age). When an age IS present the too-fast
 * cut-off is 2.06's age-banded `ATTENTION_BANDS[].commission` value — the single
 * source of the age axis (see `resolveValidityThresholds`). This flat value is
 * kept as the deterministic no-age default the ageless unit tests pin (0.30 = the
 * pre-2.06 flat cut-off, which also equals the mid 9–10 commission band).
 */
export const TOO_FAST_FRACTION_STRONG = 0.3;
/** > this fraction of MC answers on the same option position ⇒ flag (spec: >60%). */
export const SAME_POSITION_FRACTION = 0.6;
/** More than this many excluded idle pauses ⇒ flag (spec Дел 7.1; unchanged). */
export const MAX_IDLE_PAUSES = 3;
/** Gs: tapping ≥ this fraction of all cells ⇒ "mashing" flag on Gs (unchanged). */
export const GS_MASHING_FRACTION = 0.9;

/**
 * The miss fraction a TYPICAL child leaves on the Gs grid (symbol search is
 * throughput-scored: ~65% capture is normal — unlike CPT go-trials, where the
 * omission bands originate). The omission validity flag fires only on misses
 * beyond this baseline + the age band's omission cut-off [provisional].
 */
export const GS_TYPICAL_MISS_FRACTION = 0.35;

/**
 * Chance accuracy for the multiple-choice domains, by age: young ages see at
 * most 3 options (UX_BY_AGE), so chance is higher for them.
 */
export function chanceAccuracyForAge(age: number): number {
  return 1 / Math.min(4, uxForAge(clampAge(age)).maxOptions);
}
/** Accuracy within ±this of chance (with enough items) ⇒ random-level ⇒ flag. */
export const RANDOM_ACCURACY_DELTA = 0.1;
/** Minimum scored items before random-level accuracy is judged. */
export const RANDOM_ACCURACY_MIN_ITEMS = 3;

// ─────────────────────────────────────────────────────────────────────────────
// VALIDITY THRESHOLD MODULATION (Phase 3.01, reconciled with 2.06 — D-146)
//   age band (2.06) · parent-assist (3.01) · device (3.01)
// ─────────────────────────────────────────────────────────────────────────────
//
// Spec Дел 6.4 / 7.2 / 7.4 / 8: the §7.1 thresholds are not one-size-fits-all.
// Three axes modulate the too-fast + idle flags, and they compose WITHOUT
// double-counting age (Phase 3.01R reconciliation, D-146):
//   • AGE — the single source is 2.06's calibrated `ATTENTION_BANDS[].commission`
//     cut-off (younger ⇒ more lenient). 3.01's original flat young-band relaxation
//     of the too-fast FRACTION is DROPPED here — it duplicated the 2.06 band.
//   • PARENT-ASSIST — a parent reading items aloud (`parentAssistMode`, typically
//     5–7yo) adds legitimate pauses + quick post-read taps; it RELAXES the fraction
//     and the idle count ON TOP of the age band.
//   • DEVICE — "too fast" is only meaningful RELATIVE to how fast the child taps on
//     THEIR device (§7.2 device calibration, D-071); the too-fast MS scales with
//     the tap baseline.
// The idle-pause count is NOT age-banded by 2.06, so 3.01's young / assisted idle
// relaxation is kept unchanged (it duplicates no 2.06 axis). Every value here is a
// SEED (Дел 6.6) to recalibrate from pilot data; no 2.06-calibrated VALUE is
// re-tuned — this reconciles mechanics only (D-141/D-133/D-146).

/**
 * Ages at/below this get the relaxed "young" IDLE-pause allowance (spec Дел 7.4).
 * This young band no longer relaxes the too-fast FRACTION — 2.06's age-banded
 * commission cut-off already encodes age there, and a second young relaxation would
 * double-count it (D-146). It survives ONLY for the idle-pause count, which 2.06
 * does not age-band.
 */
export const YOUNG_VALIDITY_MAX_AGE = 7;

/**
 * SEED — the allowance ADDED to the age-banded too-fast fraction when a parent
 * reads items aloud (Дел 7.4): legitimate pauses + quick post-read taps push the
 * too-fast rate up, so the STRONG cut-off relaxes by this much ON TOP of the age
 * band (e.g. a 5–6yo's 0.40 band ⇒ 0.50 assisted — the pre-reconciliation assisted
 * value). Parent-assist is the only non-age axis that shifts the fraction.
 */
export const TOO_FAST_FRACTION_ASSIST_DELTA = 0.1;
/** SEED — hard ceiling on the resolved too-fast fraction (age band + assist). */
export const TOO_FAST_FRACTION_STRONG_MAX = 0.6;

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
 * context, composing the three axes without double-counting age (D-146):
 *   • too-fast FRACTION — the age band's `commission` cut-off (2.06) is the base;
 *     parent-assist adds `TOO_FAST_FRACTION_ASSIST_DELTA` on top; clamped. No young
 *     relaxation (age is already in the band). No age ⇒ the flat ageless fallback.
 *   • idle count — 2.06 does not age-band this, so the young / assisted relaxation
 *     is applied here as before (most lenient applicable: assisted ≥ young ≥ base).
 *   • too-fast MS — device-relative from the tap baseline, else the absolute floor.
 * `finalize(state)` always supplies the age, so with no parent-assist / device it
 * reproduces the pure post-2.06 age-banded verdict exactly.
 */
export function resolveValidityThresholds(
  ctx: ValidityContext = {},
): ValidityThresholds {
  const young = isYoungBand(ctx.age);
  const assisted = ctx.parentAssistMode === true;

  // Too-fast fraction: AGE axis = 2.06's per-band commission cut-off (single source
  // of age); parent-assist adds its allowance on top; clamped. No young relaxation.
  const ageBandFraction =
    ctx.age !== undefined
      ? attentionBand(clampAge(ctx.age)).commission
      : TOO_FAST_FRACTION_STRONG;
  const tooFastFractionStrong = Math.min(
    TOO_FAST_FRACTION_STRONG_MAX,
    ageBandFraction + (assisted ? TOO_FAST_FRACTION_ASSIST_DELTA : 0),
  );

  // Idle pauses: 2.06 does not age-band this, so 3.01's young / assisted relaxation
  // is kept as-is (it duplicates no 2.06 axis).
  const maxIdlePauses = assisted
    ? MAX_IDLE_PAUSES_ASSISTED
    : young
      ? MAX_IDLE_PAUSES_YOUNG
      : MAX_IDLE_PAUSES;

  // Too-fast ms: device-relative (§7.2, D-071); absolute 500 ms floor with no baseline.
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
// ATTENTION (derived signal) — v2 age-banded (all [provisional — extrapolated])
// ─────────────────────────────────────────────────────────────────────────────

export interface AttentionBand {
  /** Inclusive age range this band covers. */
  ages: readonly [number, number];
  /** Expected RT coefficient-of-variation range on go items. */
  cv: readonly [number, number];
  /** Omission flag: Gs target-miss fraction above this ⇒ validity flag. */
  omission: number;
  /** Commission flag: too-fast answer fraction above this ⇒ strong flag. */
  commission: number;
}

/**
 * v2 per-age-band attention/validity thresholds [provisional — extrapolated
 * from group means; see PROVISIONAL_NORMS]. The attention signal normalises
 * its CV against the band midpoint; the Дел 7.1 flags use the omission /
 * commission cut-offs instead of flat values.
 */
export const ATTENTION_BANDS: readonly AttentionBand[] = [
  { ages: [5, 6], cv: [0.4, 0.55], omission: 0.3, commission: 0.4 },
  { ages: [7, 8], cv: [0.35, 0.45], omission: 0.25, commission: 0.35 },
  { ages: [9, 10], cv: [0.3, 0.4], omission: 0.2, commission: 0.3 },
  { ages: [11, 13], cv: [0.25, 0.35], omission: 0.15, commission: 0.25 },
];

/** The attention band covering a (clamped) age. */
export function attentionBand(age: number): AttentionBand {
  const a = clampAge(age);
  const band = ATTENTION_BANDS.find(
    (b) => a >= b.ages[0] && a <= b.ages[1],
  ) as AttentionBand;
  return band;
}

/** Midpoint of the band's expected CV range — the normalisation anchor. A CV at
 * the midpoint maps to normalised variability 0.5 (⇒ attention score 0.5 with
 * no impulsive errors ⇒ index ≈ 50). */
export function expectedCvMidpoint(age: number): number {
  const band = attentionBand(age);
  return (band.cv[0] + band.cv[1]) / 2;
}

/** Which signals feed the derived-attention inputs (unchanged from v1). */
export const ATTENTION = {
  /** Signals whose effective-time variability feeds attention. */
  variabilitySignals: ["gf", "gv", "ef", "ct"] as readonly Signal[],
  /** Signals whose too-fast-and-wrong rate feeds the impulsive-error term. */
  impulsiveSignals: ["gf", "gv", "ct"] as readonly Signal[],
} as const;
