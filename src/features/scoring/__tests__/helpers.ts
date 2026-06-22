/** Shared test helper: build a minimal {@link GradedItem} with sensible defaults. */

import type { Signal } from "@/features/tasks";
import type { GradedItem } from "@/features/assessment/types";

export function gradedItem(
  p: Partial<GradedItem> & { signal: Signal },
): GradedItem {
  return {
    itemSeed: "seed",
    correct: false,
    effectiveTimeMs: 1_000,
    rawElapsedMs: 1_000,
    excludedIdleGaps: 0,
    tooFast: false,
    difficultyWeight: 0.5,
    ...p,
  };
}
