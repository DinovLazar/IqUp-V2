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
    { mk: "логички загатки „што следи“", sr: "logičke zagonetke „šta sledi“" },
    {
      mk: "игри со редослед и обрасци",
      sr: "igre s redosledom i obrascima",
    },
    {
      mk: "задачи со повеќе можни решенија, без зададено време",
      sr: "zadaci s više mogućih rešenja, bez zadatog vremena",
    },
  ]),
  activity("spatial", [
    { mk: "коцки и конструкција", sr: "kocke i konstrukcija" },
    { mk: "оригами по чекори", sr: "origami po koracima" },
    { mk: "лавиринти и сложувалки", sr: "lavirinti i slagalice" },
  ]),
  activity("memory", [
    {
      mk: "игри на низи (бои, броеви, чекори)",
      sr: "igre nizova (boje, brojevi, koraci)",
    },
    { mk: "играта „кажи го наназад“", sr: "igra „reci unazad“" },
    { mk: "меморија-картички во пар", sr: "memorijske kartice u paru" },
  ]),
  activity("planning", [
    {
      mk: "едноставни игри „прво план, па потег“",
      sr: "jednostavne igre „prvo plan, pa potez“",
    },
    {
      mk: "подредување чекори кон цел (рецепт, градба)",
      sr: "ređanje koraka ka cilju (recept, gradnja)",
    },
    {
      mk: "игри со ред на потези (на пр. дама)",
      sr: "igre s redom poteza (npr. dame)",
    },
  ]),
  activity("stem", [
    {
      mk: "разиграни задачи со редослед на чекори",
      sr: "razigrani zadaci s redosledom koraka",
    },
    { mk: "едноставни „ако-тогаш“ игри", sr: "jednostavne „ako-onda“ igre" },
    {
      mk: "први чекори со блок-програмирање за деца",
      sr: "prvi koraci u blok-programiranju za decu",
    },
  ]),
];
