/**
 * Growth modules (Прилог C — зони за раст). One per index, always in the no-attack
 * frame (spec Дел 12 / brand §9): never „слабост / проблем / заостанува“, always
 * „областа со најмногу простор за раст…“. A higher-priority „all strong“ variant
 * replaces the deficit framing when even the lowest index is itself strong, and a
 * fallback guarantees the slot is never empty. Serbian mirrors the same growth-not-
 * deficit voice (never „slabost / problem / zaostaje“).
 */

import type { IndexKey, ReportModule } from "@/features/report/types";

function growth(index: IndexKey, mk: string, sr: string): ReportModule {
  return {
    id: `growth_${index}`,
    category: "growth",
    index,
    priority: 1,
    trigger: (f) => f.primaryGrowthIndex === index,
    text: { mk, sr },
  };
}

export const GROWTH_MODULES: readonly ReportModule[] = [
  growth(
    "logic",
    "Логичкото мислење е областа со најмногу простор за раст во овој профил — вообичаено и убаво се зајакнува со загатки „што следи“ и игри со редослед, без брзање.",
    "Logičko mišljenje je oblast s najviše prostora za rast u ovom profilu — obično se lepo jača zagonetkama „šta sledi“ i igrama s redosledom, bez žurbe.",
  ),
  growth(
    "spatial",
    "Просторното мислење е областа со највеќе простор за раст — лесно се развива со коцки, оригами и градба, чекор по чекор.",
    "Prostorno mišljenje je oblast s najviše prostora za rast — lako se razvija kockama, origamijem i gradnjom, korak po korak.",
  ),
  growth(
    "memory",
    "Способноста да задржува и реди информации е областа со најмногу простор за раст кај {child} — вообичаено и лесно се зајакнува со игри на низи и со „кажи го наназад“.",
    "{child} ima najviše prostora za rast u sposobnosti da zadrži i uređuje informacije — to se obično lako jača igrama nizova i igrom „reci unazad“.",
  ),
  growth(
    "planning",
    "Планирањето на чекори однапред е областа со највеќе простор за раст — расте со едноставни игри каде прво се прави план, па се дејствува.",
    "Planiranje koraka unapred je oblast s najviše prostora za rast — raste uz jednostavne igre gde se prvo pravi plan, pa se deluje.",
  ),
  growth(
    "stem",
    "Учењето нови правила преку повторување е областа со највеќе простор за раст — се зајакнува со кратки, разиграни задачи што ја градат истата вештина постепено.",
    "Učenje novih pravila kroz ponavljanje je oblast s najviše prostora za rast — jača kratkim, razigranim zadacima koji istu veštinu grade postepeno.",
  ),

  // Strong-all profile: there is no real deficit — frame the next challenge.
  {
    id: "growth_all_strong",
    category: "growth",
    priority: 2,
    trigger: (f) => f.growthIsStrong,
    text: {
      mk: "Сите области се добро развиени за возраста — следниот чекор се поголеми, побогати предизвици што ќе го одржат интересот на {child}.",
      sr: "Sve oblasti su dobro razvijene za uzrast — sledeći korak su veći, bogatiji izazovi koji će {child} držati zainteresovanim.",
    },
  },

  // Fallback (slot is never empty).
  {
    id: "growth_fallback",
    category: "growth",
    priority: 0,
    trigger: () => true,
    text: {
      mk: "Секој профил има област со најмногу простор за раст — место каде малку вежбање носи најбрз напредок. Тоа е можност, не недостаток.",
      sr: "Svaki profil ima oblast s najviše prostora za rast — mesto gde malo vežbanja donosi najbrži napredak. To je prilika, ne nedostatak.",
    },
  },
];
