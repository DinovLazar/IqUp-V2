/**
 * Validity-copy modules (spec Дел 7.1 — graduated outcomes).
 *
 *  • mild  — the report is otherwise normal; a soft note is appended.
 *  • strong — replaces the confident profile with a graceful retry message + a
 *    „Повтори“ affordance (the assembler emits the `variant: "retry"` model).
 *
 * The flag is stored anonymously as data quality; never shown to the child
 * negatively.
 */

import type { ReportModule } from "@/features/report/types";

export const VALIDITY_MODULES: readonly ReportModule[] = [
  {
    id: "validity_mild",
    category: "validity",
    validityVariant: "mild",
    priority: 1,
    trigger: (f) => f.mildFlag,
    text: {
      mk: "Некои одговори беа многу брзи — за најточен профил, пробајте повторно во мирен момент.",
    },
  },
  {
    id: "validity_strong",
    category: "validity",
    validityVariant: "strong",
    priority: 1,
    trigger: (f) => f.strongFlag,
    text: {
      mk: "Резултатите не се доволно репрезентативни за сигурен профил. Препорачуваме да пробате повторно во мирна средина, со малку повеќе време.",
    },
  },
];
