/**
 * STEM modules (spec Дел 9.3 / 9.4 Дел Б) — two slots:
 *
 *  • readiness — a STEM-readiness summary, varied by the „Учење и STEM“ band.
 *  • bridge — the narrative STEM bridge, led by the strongest of spatial / logic /
 *    CT thinking. Deliberately BROADER than coding (Дел 9.3): spatial reasoning and
 *    logical problem-solving are connected to STEM, not only „potential for coding“.
 *    This is narrative only — it never changes an index formula (Дел 6.3).
 */

import type { Band, ReportModule, StemLead } from "@/features/report/types";

// ── STEM readiness (by the stem band) ────────────────────────────────────────

function readiness(
  band: Band | null,
  priority: number,
  mk: string,
): ReportModule {
  return {
    id: band ? `stem_readiness_${band}` : "stem_readiness_fallback",
    category: "stem-readiness",
    band: band ?? undefined,
    priority,
    trigger: (f) => band === null || f.indexBand.stem === band,
    text: { mk },
  };
}

export const STEM_READINESS_MODULES: readonly ReportModule[] = [
  readiness(
    "exceptional",
    1,
    "Во делот учење и STEM, {child} покажува висока подготвеност — брзо ја фаќа логиката зад новите чекори и ужива во неа.",
  ),
  readiness(
    "strong",
    1,
    "Подготвеноста за STEM-размислување е силна — {child} се снаоѓа со редослед, правила и условна логика, основите на алгоритамското размислување.",
  ),
  readiness(
    "solid",
    1,
    "Подготвеноста за STEM-размислување е солидна за возраста — {child} ги разбира основните чекори и расте со малку повеќе вежбање.",
  ),
  readiness(
    "development",
    1,
    "Учењето и STEM-размислувањето имаат убав простор за раст — со разиграни задачи од редослед и едноставна логика, основите брзо се поставуваат.",
  ),
  readiness(
    null,
    0,
    "STEM-размислувањето кај {child} се гради чекор по чекор — секоја нова разиграна задача ја зацврстува основата.",
  ),
];

// ── STEM bridge (by the lead thinking) ───────────────────────────────────────

function bridge(lead: StemLead, priority: number, mk: string): ReportModule {
  return {
    id: `stem_bridge_${lead}`,
    category: "stem-bridge",
    stemLead: lead,
    priority,
    trigger: (f) => f.stemLead === lead,
    text: { mk },
  };
}

export const STEM_BRIDGE_MODULES: readonly ReportModule[] = [
  bridge(
    "spatial",
    1,
    "Просторното размислување на {child} е токму она на кое се потпира инженерството и конструкцијата, а логиката зад чекорите покажува дека размислувањето за „како функционира нешто“ веќе работи добро — мост кон STEM што е поширок од само програмирање.",
  ),
  bridge(
    "logic",
    1,
    "Логичкото мислење на {child} — гледањето правило зад редоследот — е истата вештина што STEM ја бара секој ден: од математика до првите чекори во програмирање и робо-логика.",
  ),
  bridge(
    "ct",
    1,
    "{child} веќе размислува во чекори, циклуси и услови — јадрото на алгоритамското размислување. Тоа е директен мост кон STEM, програмирање и робо-активности.",
  ),
  // default — also the fallback (priority 0, always eligible).
  {
    id: "stem_bridge_default",
    category: "stem-bridge",
    stemLead: "default",
    priority: 0,
    trigger: () => true,
    text: {
      mk: "Учењето и STEM-размислувањето се поврзуваат со секојдневното решавање нови задачи кај {child} — секоја разиграна логичка игра е чекор кон STEM.",
    },
  },
];
