/**
 * Solving-style modules (spec Дел 9.5). The report describes only the OBSERVED
 * speed-accuracy style — never a speculative „learning style“ (Прилог H: don't
 * infer a permanent trait from one measurement). One per `SolvingStyle`; `balanced`
 * doubles as the fallback so the slot is never empty.
 */

import type { ReportModule, SolvingStyle } from "@/features/report/types";

function style(
  style: SolvingStyle,
  priority: number,
  mk: string,
  sr: string,
): ReportModule {
  return {
    id: `style_${style}`,
    category: "style",
    style,
    priority,
    trigger: (f) => f.solvingStyle === style,
    text: { mk, sr },
  };
}

export const STYLE_MODULES: readonly ReportModule[] = [
  style(
    "slow-accurate",
    1,
    "{child} пристапува промислено — поминува повеќе време на нови типови задачи пред да одговори, со висока точност. Овој пристап му служи добро кога има простор да размислува без брзање.",
    "{child} pristupa promišljeno — provodi više vremena na novim tipovima zadataka pre nego što odgovori, s visokom tačnošću. Ovaj pristup dobro služi kada ima prostora da razmišlja bez žurbe.",
  ),
  style(
    "fast-accurate",
    1,
    "{child} работи брзо и сигурно — носи точни одлуки без долго двоумење. Одвреме-навреме кратка проверка пред одговорот ја држи таа точност и кај потешките задачи.",
    "{child} radi brzo i sigurno — donosi tačne odluke bez dugog dvoumljenja. S vremena na vreme kratka provera pre odgovora drži tu tačnost i kod težih zadataka.",
  ),
  style(
    "fast-errors",
    1,
    "{child} одговара брзо и со полет. Навиката „прочитај до крај, па одговори“ ѝ помага на таа брзина да се претвори во уште повеќе точни одговори.",
    "{child} odgovara brzo i s poletom. Navika „pročitaj do kraja, pa odgovori“ pomaže da se ta brzina pretvori u još više tačnih odgovora.",
  ),
  // balanced — also the fallback (priority 0, always eligible).
  {
    id: "style_balanced",
    category: "style",
    style: "balanced",
    priority: 0,
    trigger: () => true,
    text: {
      mk: "{child} наоѓа рамнотежа меѓу брзина и точност — приспособува колку време ќе одвои според тоа колку е нова задачата.",
      sr: "{child} nalazi ravnotežu između brzine i tačnosti — prilagođava koliko će vremena odvojiti prema tome koliko je zadatak nov.",
    },
  },
];
