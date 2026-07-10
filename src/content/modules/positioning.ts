/**
 * Positioning modules (spec Дел 11 / Дел 12 / Прилог E). Expert, no-jargon IQ UP!
 * positioning, selected by the age + profile-strength program mapping. The visible
 * copy names the right program through the voice (Прилог E examples); the `programHook`
 * carries the internal age→program reasoning, which is NEVER printed to the parent
 * verbatim („контекст за тимот“, Дел 11).
 *
 * Serbian program names (Feat-Serbian-Localization) are TRANSLITERATIONS of the
 * existing Macedonian names into Serbian Latin — they are NOT official Serbian
 * program names. If IQ UP! supplies official Serbian names, swapping them here is a
 * copy-only change (flagged in the completion report).
 */

import type { ProgramKey, ReportModule } from "@/features/report/types";
import { selectProgramKey } from "@/features/report/program";

interface ProgramSpec {
  key: ProgramKey;
  name: string;
  nameSr: string;
  tier: "basic" | "plus";
  text: string;
  textSr: string;
  hook: string;
}

const PROGRAMS: ProgramSpec[] = [
  {
    key: "mali",
    name: "Мали истражувачи ПЛУС",
    nameSr: "Mali istraživači PLUS",
    tier: "basic",
    text: "На возраста на {child}, програмата „Мали истражувачи ПЛУС“ на IQ UP! постепено ги гради основите — логичко размислување, фокус и снаоѓање во простор — преку игра. Профилот покажува каде таа поддршка би имала најголем ефект.",
    textSr:
      "Na uzrastu na kojem je {child}, program „Mali istraživači PLUS“ IQ UP!-a postepeno gradi osnove — logičko mišljenje, fokus i snalaženje u prostoru — kroz igru. Profil pokazuje gde bi ta podrška imala najveći efekat.",
    hook: "5–6 г → Мали истражувачи ПЛУС (единствена програма за возраста; нема одделна основна).",
  },
  {
    key: "bibi",
    name: "Магичната лабораторија на Биби и Боби",
    nameSr: "Magična laboratorija Bibija i Bobija",
    tier: "basic",
    text: "На возраста на {child}, програмата „Магичната лабораторија на Биби и Боби“ систематски ги развива логичкото мислење и решавањето нови задачи — токму силните страни во профилот.",
    textSr:
      "Na uzrastu na kojem je {child}, program „Magična laboratorija Bibija i Bobija“ sistematski razvija logičko mišljenje i rešavanje novih zadataka — upravo snažne strane u profilu.",
    hook: "7–9 г, основна → Магичната лабораторија на Биби и Боби.",
  },
  {
    key: "bibi-plus",
    name: "Магичната лабораторија на Биби и Боби ПЛУС",
    nameSr: "Magična laboratorija Bibija i Bobija PLUS",
    tier: "plus",
    text: "Профилот на {child} е над типичното за возраста — напредната верзија „Биби и Боби ПЛУС“ нуди побогати предизвици што ја надградуваат таа предност, чекор по чекор и без брзање.",
    textSr:
      "{child} ima profil iznad tipičnog za uzrast — napredna verzija „Bibi i Bobi PLUS“ nudi bogatije izazove koji nadograđuju tu prednost, korak po korak i bez žurbe.",
    hook: "8–10 г, силен профил / горен крај на возраста → Биби и Боби ПЛУС.",
  },
  {
    key: "oliver",
    name: "Научните авантури на Оливер",
    nameSr: "Naučne avanture Olivera",
    tier: "basic",
    text: "На возраста на {child}, „Научните авантури на Оливер“ ги поврзуваат логиката и истражувачкото учење со првите чекори во програмирање — насочено кон силните страни во профилот.",
    textSr:
      "Na uzrastu na kojem je {child}, „Naučne avanture Olivera“ povezuju logiku i istraživačko učenje s prvim koracima u programiranju — usmereno ka snažnim stranama u profilu.",
    hook: "10–12 г, основна → Научните авантури на Оливер.",
  },
  {
    key: "oliver-plus",
    name: "Научните авантури на Оливер ПЛУС",
    nameSr: "Naučne avanture Olivera PLUS",
    tier: "plus",
    text: "Профилот на {child} покажува склоност кон алгоритамско размислување — „Научните авантури на Оливер ПЛУС“ ја надградуваат таа предност преку напредни проекти и програмирање.",
    textSr:
      "{child} u profilu pokazuje sklonost ka algoritamskom mišljenju — „Naučne avanture Olivera PLUS“ nadograđuju tu prednost kroz napredne projekte i programiranje.",
    hook: "11–13 г, силен профил / горен крај на возраста → Оливер ПЛУС.",
  },
];

const PROGRAM_MODULES: readonly ReportModule[] = PROGRAMS.map((p) => ({
  id: `positioning_${p.key}`,
  category: "positioning" as const,
  program: p.key,
  programName: { mk: p.name, sr: p.nameSr },
  programTier: p.tier,
  priority: 1,
  trigger: (f) => selectProgramKey(f) === p.key,
  text: { mk: p.text, sr: p.textSr },
  programHook: p.hook,
}));

export const POSITIONING_MODULES: readonly ReportModule[] = [
  ...PROGRAM_MODULES,
  // Fallback (slot is never empty).
  {
    id: "positioning_fallback",
    category: "positioning",
    program: "bibi",
    programName: { mk: "Програмите на IQ UP!", sr: "Programi IQ UP!" },
    programTier: "basic",
    priority: 0,
    trigger: () => true,
    text: {
      mk: "Програмите на IQ UP! се создадени за постепен развој на размислувањето и учењето. Профилот на {child} покажува каде таа поддршка би имала најголем ефект.",
      sr: "Programi IQ UP! stvoreni su za postepen razvoj mišljenja i učenja. {child} u profilu pokazuje gde bi ta podrška imala najveći efekat.",
    },
    programHook:
      "Резервно позиционирање — програмата се одредува по возраст и профил (Дел 11).",
  },
];
