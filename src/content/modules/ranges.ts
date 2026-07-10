/**
 * Indicative range captions per band (spec Дел 10.2 — hybrid presentation).
 *
 * Parent-facing, derived deterministically from the 1.05 band — **never a number**
 * (no false precision, no clinical IQ). These caption the per-index bars next to
 * the word label.
 */

import type { Band, LocalizedText } from "@/features/report/types";

export const RANGE_BY_BAND: Record<Band, LocalizedText> = {
  exceptional: {
    mk: "меѓу највисоките за возраста",
    sr: "među najvišima za uzrast",
  },
  strong: { mk: "над типичното за возраста", sr: "iznad tipičnog za uzrast" },
  solid: { mk: "типично за возраста", sr: "tipično za uzrast" },
  development: {
    mk: "со простор за раст за возраста",
    sr: "sa prostorom za rast za uzrast",
  },
};
