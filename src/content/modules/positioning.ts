/**
 * Positioning modules (spec Дел 11 / Дел 12 / Прилог E). Expert, no-jargon IQ UP!
 * positioning, selected by the age + profile-strength program mapping. The visible
 * copy names the right program through the voice (Прилог E examples); the `programHook`
 * carries the internal age→program reasoning, which is NEVER printed to the parent
 * verbatim („контекст за тимот", Дел 11).
 */

import type { ProgramKey, ReportModule } from "@/features/report/types";
import { selectProgramKey } from "@/features/report/program";

interface ProgramSpec {
  key: ProgramKey;
  name: string;
  tier: "basic" | "plus";
  text: string;
  hook: string;
}

const PROGRAMS: ProgramSpec[] = [
  {
    key: "mali",
    name: "Мали истражувачи ПЛУС",
    tier: "basic",
    text: "На возраста на {child}, програмата „Мали истражувачи ПЛУС“ на IQ UP! постепено ги гради основите — логичко размислување, фокус и снаоѓање во простор — преку игра. Профилот покажува каде таа поддршка би имала најголем ефект.",
    hook: "5–6 г → Мали истражувачи ПЛУС (единствена програма за возраста; нема одделна основна).",
  },
  {
    key: "bibi",
    name: "Магичната лабораторија на Биби и Боби",
    tier: "basic",
    text: "На возраста на {child}, програмата „Магичната лабораторија на Биби и Боби“ систематски ги развива логичкото мислење и решавањето нови задачи — токму силните страни во профилот.",
    hook: "7–9 г, основна → Магичната лабораторија на Биби и Боби.",
  },
  {
    key: "bibi-plus",
    name: "Магичната лабораторија на Биби и Боби ПЛУС",
    tier: "plus",
    text: "Профилот на {child} е над типичното за возраста — напредната верзија „Биби и Боби ПЛУС“ нуди побогати предизвици што ја надградуваат таа предност, чекор по чекор и без брзање.",
    hook: "8–10 г, силен профил / горен крај на возраста → Биби и Боби ПЛУС.",
  },
  {
    key: "oliver",
    name: "Научните авантури на Оливер",
    tier: "basic",
    text: "На возраста на {child}, „Научните авантури на Оливер“ ги поврзуваат логиката и истражувачкото учење со првите чекори во програмирање — насочено кон силните страни во профилот.",
    hook: "10–12 г, основна → Научните авантури на Оливер.",
  },
  {
    key: "oliver-plus",
    name: "Научните авантури на Оливер ПЛУС",
    tier: "plus",
    text: "Профилот на {child} покажува склоност кон алгоритамско размислување — „Научните авантури на Оливер ПЛУС“ ја надградуваат таа предност преку напредни проекти и програмирање.",
    hook: "11–13 г, силен профил / горен крај на возраста → Оливер ПЛУС.",
  },
];

const PROGRAM_MODULES: readonly ReportModule[] = PROGRAMS.map((p) => ({
  id: `positioning_${p.key}`,
  category: "positioning" as const,
  program: p.key,
  programName: { mk: p.name },
  programTier: p.tier,
  priority: 1,
  trigger: (f) => selectProgramKey(f) === p.key,
  text: { mk: p.text },
  programHook: p.hook,
}));

export const POSITIONING_MODULES: readonly ReportModule[] = [
  ...PROGRAM_MODULES,
  // Fallback (slot is never empty).
  {
    id: "positioning_fallback",
    category: "positioning",
    program: "bibi",
    programName: { mk: "Програмите на IQ UP!" },
    programTier: "basic",
    priority: 0,
    trigger: () => true,
    text: {
      mk: "Програмите на IQ UP! се создадени за постепен развој на размислувањето и учењето. Профилот на {child} покажува каде таа поддршка би имала најголем ефект.",
    },
    programHook:
      "Резервно позиционирање — програмата се одредува по возраст и профил (Дел 11).",
  },
];
