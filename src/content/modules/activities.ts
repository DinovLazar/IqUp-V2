/**
 * Home-activity modules (Прилог C). At least one concrete activity for EVERY index
 * — not only the growth zone — so the assembled report always carries five activity
 * sets. Authored without jargon; no banned tokens (the seed „отворени проблеми“ is
 * rephrased as „задачи со повеќе можни решенија“ to stay in the no-attack voice).
 *
 * Exactly one module per index keeps per-index coverage trivially guaranteed.
 */

import type {
  IndexKey,
  LocalizedText,
  ReportModule,
} from "@/features/report/types";

function activity(index: IndexKey, items: LocalizedText[]): ReportModule {
  return {
    id: `activity_${index}`,
    category: "activity",
    index,
    priority: 1,
    trigger: (f) => f.indexValue[index] !== undefined, // always eligible
    activities: items,
  };
}

export const ACTIVITY_MODULES: readonly ReportModule[] = [
  activity("logic", [
    { mk: "логички загатки „што следи“" },
    { mk: "игри со редослед и обрасци" },
    { mk: "задачи со повеќе можни решенија, без зададено време" },
  ]),
  activity("spatial", [
    { mk: "коцки и конструкција" },
    { mk: "оригами по чекори" },
    { mk: "лавиринти и сложувалки" },
  ]),
  activity("memory", [
    { mk: "игри на низи (бои, броеви, чекори)" },
    { mk: "играта „кажи го наназад“" },
    { mk: "меморија-картички во пар" },
  ]),
  activity("planning", [
    { mk: "едноставни игри „прво план, па потег“" },
    { mk: "подредување чекори кон цел (рецепт, градба)" },
    { mk: "игри со ред на потези (на пр. дама)" },
  ]),
  activity("stem", [
    { mk: "разиграни задачи со редослед на чекори" },
    { mk: "едноставни „ако-тогаш“ игри" },
    { mk: "први чекори со блок-програмирање за деца" },
  ]),
];
