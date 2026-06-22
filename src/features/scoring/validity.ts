/**
 * Validity flags + graduated session verdict (spec Дел 7.1). Flags guard against a
 * confident profile built on garbage data; they are quality metadata, never framed
 * negatively toward the child (this layer emits codes only — wording is 1.07).
 *
 *   too_fast        > 30% of answers under ~500 ms        → STRONG  (session)
 *   same_position   > 60% of MC answers same option slot  → mild
 *   idle_pauses     > N excluded long idle gaps           → mild
 *   gs_mashing      ~all Gs cells tapped                  → mild    (Gs only)
 *   random_accuracy a whole MC domain at chance level     → mild    (per signal)
 *
 * Verdict: any strong flag ⇒ `strong` (no confident profile, 1.06 shows retry);
 * else any flag ⇒ `mild` (usable, soft note); else `ok`.
 */

import {
  CHANCE_ACCURACY_4OPT,
  GS_MASHING_FRACTION,
  MAX_IDLE_PAUSES,
  RANDOM_ACCURACY_DELTA,
  RANDOM_ACCURACY_MIN_ITEMS,
  SAME_POSITION_FRACTION,
  TOO_FAST_FRACTION_STRONG,
  type ScoredSignal,
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

/** Compute validity flags + verdict from every graded item in the session. */
export function computeValidity(
  allItems: readonly GradedItem[],
): ValidityResult {
  const flags: ValidityFlag[] = [];
  const total = allItems.length;

  // too-fast — > 30% of answers under the RT floor ⇒ strong.
  if (total > 0) {
    const tooFast = allItems.filter((it) => it.tooFast).length;
    if (tooFast / total > TOO_FAST_FRACTION_STRONG) {
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
  const excludedGaps = allItems.reduce((a, it) => a + it.excludedIdleGaps, 0);
  if (excludedGaps > MAX_IDLE_PAUSES) {
    flags.push({ code: "idle_pauses", severity: "mild" });
  }

  // Gs mashing — tapping ~all cells invalidates the speed grid.
  const gsItem = allItems.find((it) => it.signal === "gs");
  if (gsItem?.gs && gsItem.gs.cellCount > 0) {
    if (gsItem.gs.tappedCount / gsItem.gs.cellCount >= GS_MASHING_FRACTION) {
      flags.push({ code: "gs_mashing", signal: "gs", severity: "mild" });
    }
  }

  // random-level accuracy across a whole MC domain ⇒ reduced confidence (per signal).
  for (const signal of MC_SIGNALS) {
    const items = allItems.filter((it) => it.signal === signal);
    if (items.length >= RANDOM_ACCURACY_MIN_ITEMS) {
      const acc = correctCount(items) / items.length;
      if (Math.abs(acc - CHANCE_ACCURACY_4OPT) <= RANDOM_ACCURACY_DELTA) {
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
