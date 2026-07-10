/**
 * Strength modules (Прилог C — силни страни). One set per index, varied by band
 * where it changes the message (Исклучително vs Силно read differently); a default
 * covers the remaining bands; a global fallback guarantees the slot is never empty.
 *
 * Voice: brand §9 / spec Дел 12 — expert, warm, no jargon, never „клинички IQ“.
 * The `{child}` token resolves to „вашето дете“ / „vaše dete“ (resolved-decision 2);
 * the Serbian copy keeps it in subject/object position so the neuter „vaše dete“
 * agrees (Feat-Serbian-Localization).
 */

import type { Band, IndexKey, ReportModule } from "@/features/report/types";

function strength(
  index: IndexKey,
  band: Band | null,
  priority: number,
  mk: string,
  sr: string,
): ReportModule {
  return {
    id: band ? `strength_${index}_${band}` : `strength_${index}_default`,
    category: "strength",
    index,
    band: band ?? undefined,
    priority,
    trigger: (f) =>
      f.topStrengthIndex === index &&
      (band === null || f.indexBand[index] === band),
    text: { mk, sr },
  };
}

export const STRENGTH_MODULES: readonly ReportModule[] = [
  // ── Логичко мислење ─────────────────────────────────────────────────────────
  strength(
    "logic",
    "exceptional",
    3,
    "Логичкото мислење е изразена силна страна — {child} брзо доловува правила и решава нови задачи што претходно не ги видело. Ваквата леснотија со обрасци е основата на математиката и на снаоѓањето со секоја нова задача.",
    "Logičko mišljenje je izražena snažna strana — {child} brzo uočava pravila i rešava nove zadatke koje ranije nije videlo. Takva lakoća s obrascima je osnova matematike i snalaženja u svakom novom zadatku.",
  ),
  strength(
    "logic",
    "strong",
    3,
    "{child} лесно препознава обрасци и го наоѓа правилото зад редоследот — солидна предност во логичкото мислење, што се гледа во математиката и во решавањето нови задачи.",
    "{child} lako prepoznaje obrasce i pronalazi pravilo iza niza — solidna prednost u logičkom mišljenju, koja se vidi u matematici i u rešavanju novih zadataka.",
  ),
  strength(
    "logic",
    null,
    1,
    "Логичкото мислење работи добро кај {child} — препознава обрасци и носи прибрани одлуки кога ќе сретне нешто ново.",
    "{child} se dobro snalazi s logičkim mišljenjem — prepoznaje obrasce i donosi staložene odluke kada naiđe na nešto novo.",
  ),

  // ── Просторно мислење ───────────────────────────────────────────────────────
  strength(
    "spatial",
    "exceptional",
    3,
    "Просторното мислење е најсилната боја во профилот — {child} мисли во слики и со леснотија врти и склопува облици во умот. Тоа е предноста зад геометријата, конструкцијата и инженерството.",
    "Prostorno mišljenje je najjača boja u profilu — {child} misli u slikama i s lakoćom okreće i sklapa oblike u umu. To je prednost iza geometrije, konstrukcije i inženjerstva.",
  ),
  strength(
    "spatial",
    "strong",
    3,
    "{child} мисли во слики и простор — лесно замислува како изгледа нешто завртено или склопено. Силна основа за геометрија и конструкција.",
    "{child} misli u slikama i prostoru — lako zamišlja kako nešto izgleda okrenuto ili sklopljeno. Snažna osnova za geometriju i konstrukciju.",
  ),
  strength(
    "spatial",
    null,
    1,
    "Просторното мислење е меѓу посилните страни — {child} добро се снаоѓа со облици, форми и распоред во простор.",
    "Prostorno mišljenje je među jačim stranama — {child} se dobro snalazi s oblicima, formama i rasporedom u prostoru.",
  ),

  // ── Меморија и фокус ────────────────────────────────────────────────────────
  strength(
    "memory",
    "exceptional",
    3,
    "Меморијата и фокусот се впечатлива силна страна — {child} задржува повеќе чекори во умот и работи по нив без да го изгуби редоследот. Тоа директно помага во следење подолги упатства.",
    "Memorija i fokus su upečatljiva snažna strana — {child} zadržava više koraka u umu i radi po njima ne gubeći redosled. To direktno pomaže u praćenju dužih uputstava.",
  ),
  strength(
    "memory",
    "strong",
    3,
    "{child} задржува и реди информации во умот додека работи — солидна способност што помага во следење упатства со повеќе чекори.",
    "{child} zadržava i uređuje informacije u umu dok radi — solidna sposobnost koja pomaže u praćenju uputstava s više koraka.",
  ),
  strength(
    "memory",
    null,
    1,
    "Меморијата и фокусот се добро поставени — {child} го следи редоследот и се враќа на задачата кога нешто ќе го прекине.",
    "Memorija i fokus su dobro postavljeni — {child} prati redosled i vraća se na zadatak kada ga nešto prekine.",
  ),

  // ── Планирање и брзина ──────────────────────────────────────────────────────
  strength(
    "planning",
    "exceptional",
    3,
    "Планирањето е изразена силна страна — {child} замислува неколку чекори однапред и се движи по јасна стратегија, наместо обид по обид. Тоа се гледа во подреден пристап кон посложени задачи.",
    "Planiranje je izražena snažna strana — {child} zamišlja nekoliko koraka unapred i kreće se po jasnoj strategiji, umesto pokušaj za pokušajem. To se vidi u urednom pristupu složenijim zadacima.",
  ),
  strength(
    "planning",
    "strong",
    3,
    "{child} планира пред да дејствува — замислува редослед на чекори и се држи до него. Корисна навика за посложени, повеќечекорни задачи.",
    "{child} planira pre nego što deluje — zamišlja redosled koraka i drži ga se. Korisna navika za složenije zadatke s više koraka.",
  ),
  strength(
    "planning",
    null,
    1,
    "Планирањето и темпото се добро избалансирани кај {child} — пристапува со ред и стигнува до целта без брзање.",
    "{child} ima dobro izbalansirano planiranje i tempo — pristupa uredno i stiže do cilja bez žurbe.",
  ),

  // ── Учење и STEM ────────────────────────────────────────────────────────────
  strength(
    "stem",
    "exceptional",
    3,
    "Учењето и STEM-размислувањето се изразена силна страна — {child} брзо ги фаќа новите правила и логиката зад нив. Одличен профил за истражувачко учење и за програмирање.",
    "Učenje i STEM-mišljenje su izražena snažna strana — {child} brzo hvata nova pravila i logiku iza njih. Odličan profil za istraživačko učenje i za programiranje.",
  ),
  strength(
    "stem",
    "strong",
    3,
    "{child} брзо доловува нови правила и ја гледа логиката зад чекорите — силна основа за STEM-размислување и за првите чекори во програмирање.",
    "{child} brzo uočava nova pravila i vidi logiku iza koraka — snažna osnova za STEM-mišljenje i za prve korake u programiranju.",
  ),
  strength(
    "stem",
    null,
    1,
    "Учењето и STEM-размислувањето одат добро — {child} прифаќа нови правила и ги применува со разбирање.",
    "Učenje i STEM-mišljenje idu dobro — {child} prihvata nova pravila i primenjuje ih s razumevanjem.",
  ),

  // ── Fallback (slot is never empty) ──────────────────────────────────────────
  {
    id: "strength_fallback",
    category: "strength",
    priority: 0,
    trigger: () => true,
    text: {
      mk: "{child} покажува јасна силна страна во профилот — област каде што размислувањето тече со леснотија и сигурност.",
      sr: "{child} pokazuje jasnu snažnu stranu u profilu — oblast u kojoj razmišljanje teče s lakoćom i sigurnošću.",
    },
  },
];
