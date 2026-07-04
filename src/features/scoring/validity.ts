/**
 * Validity flags + graduated session verdict (spec Дел 7.1, calibration v2).
 * Flags guard against a confident profile built on garbage data; they are
 * quality metadata, never framed negatively toward the child (this layer emits
 * codes only — wording is 1.07).
 *
 *   too_fast        > the resolved fraction of answers under the resolved
 *                     (device-relative) too-fast threshold      → STRONG (session)
 *   same_position   > 60% of MC answers same option slot         → mild
 *   idle_pauses     > N excluded long idle gaps                  → mild
 *   gs_mashing      ~all Gs cells tapped                         → mild   (Gs only)
 *   gs_omission     > age band's OMISSION cut-off of Gs targets missed
 *                                                                → mild   (Gs only)
 *   random_accuracy a whole MC domain at chance level            → mild   (per signal)
 *
 * Two calibration layers compose over the flags, reconciled so age is counted once
 * (Phase 3.01R, D-146):
 *   • v2 (Phase 2.06) sets the AGE-BANDED cut-off VALUES (ATTENTION_BANDS,
 *     [provisional]): the omission cut-off, the too-fast commission (STRONG)
 *     fraction, and — via the option-count clamp — chance accuracy.
 *   • Phase 3.01 adds two NON-age modifiers on top: parent-assist (reading aloud)
 *     relaxes the too-fast fraction + the idle count, and the device tap baseline
 *     makes the too-fast MS device-relative (spec Дел 7.2 / 7.4, D-071). The young
 *     5–7 relaxation now applies ONLY to the idle count (2.06 does not age-band
 *     idle); it no longer touches the too-fast fraction, which the 2.06 band already
 *     ages. With no parent-assist / device context the thresholds are the pure
 *     post-2.06 age-banded values, and the too-fast comparison uses each item's raw
 *     elapsed time against the resolved threshold — device-relative when a baseline
 *     is present, not an absolute-ms bias.
 *
 * Verdict: any strong flag ⇒ `strong` (no confident profile, the UI shows the
 * graceful retry); else any flag ⇒ `mild` (usable, soft note); else `ok`.
 */

import {
  AGE_MIN,
  GS_MASHING_FRACTION,
  GS_TYPICAL_MISS_FRACTION,
  RANDOM_ACCURACY_DELTA,
  RANDOM_ACCURACY_MIN_ITEMS,
  SAME_POSITION_FRACTION,
  attentionBand,
  chanceAccuracyForAge,
  clampAge,
  resolveValidityThresholds,
  type ScoredSignal,
  type ValidityContext,
} from "@/content/norms";
import type { GradedItem } from "@/features/assessment/types";
import { correctCount } from "./raw";
import type { SessionValidity, ValidityFlag } from "./types";

/** Multiple-choice reasoning domains used for the same-position + random checks. */
const MC_SIGNALS: readonly ScoredSignal[] = ["gf", "gv", "ct"];

export interface ValidityResult {
  session: SessionValidity;
  flags: ValidityFlag[];
}

/**
 * Compute validity flags + verdict from every graded item in the session.
 *
 * @param ctx  Age / parent-assist / device-baseline context. `age` bands the
 *             omission, chance-accuracy AND too-fast commission checks (2.06);
 *             parent-assist and the device baseline modulate the time-based
 *             thresholds on top (Phase 3.01). Omit `age` (or pass `{}`) and the
 *             age-banded checks fall back to the youngest band while the too-fast
 *             fraction falls back to the flat ageless default — the base case the
 *             ageless unit tests pin.
 */
export function computeValidity(
  allItems: readonly GradedItem[],
  ctx: ValidityContext = {},
): ValidityResult {
  const age = clampAge(ctx.age ?? AGE_MIN);
  const band = attentionBand(age);
  const flags: ValidityFlag[] = [];
  const total = allItems.length;
  const { tooFastMs, tooFastFractionStrong, maxIdlePauses } =
    resolveValidityThresholds(ctx);

  // too-fast — > the resolved fraction of answers under the resolved
  // (device-relative) threshold ⇒ strong. Compared against raw elapsed so the
  // same *relative* speed gets the same verdict across devices when a baseline
  // is present (§7.2, D-071).
  if (total > 0) {
    const tooFast = allItems.filter((it) => it.rawElapsedMs < tooFastMs).length;
    if (tooFast / total > tooFastFractionStrong) {
      flags.push({ code: "too_fast", severity: "strong" });
    }
  }

  // mostly-same-choice — > 60% of MC answers on one option position.
  const positions = allItems
    .map((it) => it.optionIndex)
    .filter((p): p is number => p !== undefined);
  if (positions.length > 0) {
    const counts = new Map<number, number>();
    for (const p of positions) counts.set(p, (counts.get(p) ?? 0) + 1);
    const maxCount = Math.max(...counts.values());
    if (maxCount / positions.length > SAME_POSITION_FRACTION) {
      flags.push({ code: "same_position", severity: "mild" });
    }
  }

  // too-many idle pauses — long gaps already excluded from time; many ⇒ flag.
  // The tolerated count is relaxed for young / assisted sessions (Дел 7.4).
  const excludedGaps = allItems.reduce((a, it) => a + it.excludedIdleGaps, 0);
  if (excludedGaps > maxIdlePauses) {
    flags.push({ code: "idle_pauses", severity: "mild" });
  }

  // Gs mashing + omission — over the scored rounds together.
  const gsItems = allItems.filter((it) => it.signal === "gs" && it.gs);
  if (gsItems.length > 0) {
    let tapped = 0;
    let cells = 0;
    let found = 0;
    let targets = 0;
    for (const it of gsItems) {
      tapped += it.gs!.tappedCount;
      cells += it.gs!.cellCount;
      found += it.gs!.found;
      targets += it.gs!.targetCount;
    }
    if (cells > 0 && tapped / cells >= GS_MASHING_FRACTION) {
      flags.push({ code: "gs_mashing", signal: "gs", severity: "mild" });
    }
    // Symbol search is throughput-scored (a typical child leaves ~35% of the
    // grid uncleared), so the CPT-derived omission cut-off applies to misses
    // BEYOND that typical baseline.
    if (
      targets > 0 &&
      1 - found / targets > GS_TYPICAL_MISS_FRACTION + band.omission
    ) {
      flags.push({ code: "gs_omission", signal: "gs", severity: "mild" });
    }
  }

  // random-level accuracy across a whole MC domain ⇒ reduced confidence (per signal).
  const chance = chanceAccuracyForAge(age);
  for (const signal of MC_SIGNALS) {
    const items = allItems.filter((it) => it.signal === signal);
    if (items.length >= RANDOM_ACCURACY_MIN_ITEMS) {
      const acc = correctCount(items) / items.length;
      if (Math.abs(acc - chance) <= RANDOM_ACCURACY_DELTA) {
        flags.push({ code: "random_accuracy", signal, severity: "mild" });
      }
    }
  }

  const session: SessionValidity = flags.some((f) => f.severity === "strong")
    ? "strong"
    : flags.length > 0
      ? "mild"
      : "ok";

  return { session, flags };
}
