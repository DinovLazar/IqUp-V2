/**
 * Confidence by domain (spec Дел 6.5) — each index carries high / medium / low,
 * from (a) the number of items in the contributing domain(s), (b) answer
 * consistency, and (c) session/domain validity (Дел 7). Random-level accuracy in a
 * contributing domain cuts that index's confidence; a `strong` session verdict
 * means no confident profile at all → every index drops to low.
 *
 * Enum values (high/medium/low) match `components/ui/confidence-label.tsx`.
 */

import {
  CONFIDENCE_GLR_ROUNDS,
  CONFIDENCE_ITEMS,
  type ScoredSignal,
} from "@/content/norms";
import { INDEX_ORDER, type IndexKey } from "@/lib/indices";
import type { Confidence } from "@/components/ui/confidence-label";
import { contributingSignals } from "./indices";
import type { ValidityResult } from "./validity";

/** Internal evidence strength: 0 = low, 1 = medium, 2 = high. */
export type Evidence = 0 | 1 | 2;

const toConfidence = (ev: Evidence): Confidence =>
  ev >= 2 ? "high" : ev === 1 ? "medium" : "low";

/** Evidence from a laddered / Corsi item count. */
export function evidenceFromCount(n: number): Evidence {
  if (n >= CONFIDENCE_ITEMS.high) return 2;
  if (n >= CONFIDENCE_ITEMS.medium) return 1;
  return 0;
}

/** Evidence from the number of Glr recall rounds completed. */
export function evidenceFromGlrRounds(rounds: number): Evidence {
  if (rounds >= CONFIDENCE_GLR_ROUNDS.high) return 2;
  if (rounds >= CONFIDENCE_GLR_ROUNDS.medium) return 1;
  return 0;
}

/**
 * Per-index confidence from per-signal evidence + validity. A composite is only as
 * confident as its weakest contributing signal; a random-accuracy flag forces the
 * flagged signal to low evidence; a strong session verdict forces all to low.
 */
export function computeConfidence(
  signalEvidence: Readonly<Record<ScoredSignal, Evidence>>,
  validity: ValidityResult,
): Record<IndexKey, Confidence> {
  const randomFlagged = new Set(
    validity.flags
      .filter((f) => f.code === "random_accuracy" && f.signal)
      .map((f) => f.signal as ScoredSignal),
  );

  const out = {} as Record<IndexKey, Confidence>;
  for (const key of INDEX_ORDER) {
    if (validity.session === "strong") {
      out[key] = "low";
      continue;
    }
    const evidences = contributingSignals(key).map(
      (signal): Evidence =>
        randomFlagged.has(signal) ? 0 : signalEvidence[signal],
    );
    const min = evidences.reduce<Evidence>((m, e) => (e < m ? e : m), 2);
    out[key] = toConfidence(min);
  }
  return out;
}
