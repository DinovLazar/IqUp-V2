/**
 * CTA modules (spec Дел 9.2 — dynamic demo-class call to action). The button copy
 * is pulled from the same assembled report and tied to the child's growth zone, so
 * it reads more relevant than a generic button (anchor: „Закажи демо час: зајакни
 * го фокусот преку логика“). One per growth index + a fallback.
 *
 * TEXT ONLY — the booking URL and `?grad={city}` are assembled downstream in
 * 1.08/1.09 (the booking URL is still a pending Cowork asset).
 */

import type { IndexKey, ReportModule } from "@/features/report/types";

function cta(index: IndexKey, mk: string): ReportModule {
  return {
    id: `cta_${index}`,
    category: "cta",
    index,
    priority: 1,
    trigger: (f) => f.primaryGrowthIndex === index,
    ctaText: { mk },
  };
}

export const CTA_MODULES: readonly ReportModule[] = [
  cta("logic", "Закажи демо час: зајакни го логичкото мислење преку игра"),
  cta(
    "spatial",
    "Закажи демо час: зајакни го просторното мислење преку градба и облици",
  ),
  cta(
    "memory",
    "Закажи демо час: зајакни ги меморијата и фокусот преку игри на низи",
  ),
  cta("planning", "Закажи демо час: зајакни го планирањето чекор по чекор"),
  cta(
    "stem",
    "Закажи демо час: зајакни го STEM-размислувањето преку разиграни задачи",
  ),

  // Fallback (slot is never empty).
  {
    id: "cta_fallback",
    category: "cta",
    priority: 0,
    trigger: () => true,
    ctaText: { mk: "Закажи бесплатен демо час" },
  },
];
