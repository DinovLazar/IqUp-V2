/**
 * Report module library — barrel (spec Дел 9.2 / Прилог C). Versioned MK content,
 * authored to the brand §9 voice with a fallback per category so assembly is never
 * empty for any reachable feature combination.
 *
 * `MODULE_LIBRARY` is the flat list (used by the assembler's selectors and by the
 * voice/purity test scans); the per-category arrays and `RANGE_BY_BAND` are the
 * typed accessors. The module schema + trigger predicate type live in
 * `@/features/report/types`.
 */

import type { ModuleCategory, ReportModule } from "@/features/report/types";

import { STRENGTH_MODULES } from "./strengths";
import { GROWTH_MODULES } from "./growth";
import { STYLE_MODULES } from "./styles";
import { STEM_BRIDGE_MODULES, STEM_READINESS_MODULES } from "./stem";
import { ACTIVITY_MODULES } from "./activities";
import { POSITIONING_MODULES } from "./positioning";
import { CTA_MODULES } from "./cta";
import { EXTREME_MODULES } from "./extremes";
import { VALIDITY_MODULES } from "./validity";

export { MODULE_LIBRARY_VERSION } from "./version";
export { RANGE_BY_BAND } from "./ranges";
export { STRENGTH_MODULES } from "./strengths";
export { GROWTH_MODULES } from "./growth";
export { STYLE_MODULES } from "./styles";
export { STEM_BRIDGE_MODULES, STEM_READINESS_MODULES } from "./stem";
export { ACTIVITY_MODULES } from "./activities";
export { POSITIONING_MODULES } from "./positioning";
export { CTA_MODULES } from "./cta";
export { EXTREME_MODULES } from "./extremes";
export { VALIDITY_MODULES } from "./validity";

/** The full library, flat — every authored module across all categories. */
export const MODULE_LIBRARY: readonly ReportModule[] = [
  ...STRENGTH_MODULES,
  ...GROWTH_MODULES,
  ...STYLE_MODULES,
  ...STEM_BRIDGE_MODULES,
  ...STEM_READINESS_MODULES,
  ...ACTIVITY_MODULES,
  ...POSITIONING_MODULES,
  ...CTA_MODULES,
  ...EXTREME_MODULES,
  ...VALIDITY_MODULES,
];

/** Modules of one category. */
export function modulesOf(category: ModuleCategory): readonly ReportModule[] {
  return MODULE_LIBRARY.filter((m) => m.category === category);
}
