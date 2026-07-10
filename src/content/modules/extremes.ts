/**
 * Extreme-copy modules (spec Дел 7.3). Ceiling is positive — „го достигна врвот за
 * оваа возраст"; the score is read as „барем толку висок“. Floor is gentle and
 * never „падна / под просек“ — „задачите беа премногу нови за момент“. These attach
 * to Part A only when the matching extreme is present.
 */

import type { ReportModule } from "@/features/report/types";

export const EXTREME_MODULES: readonly ReportModule[] = [
  {
    id: "extreme_ceiling",
    category: "extreme",
    extreme: "ceiling",
    priority: 1,
    trigger: (f) => f.anyCeiling,
    text: {
      mk: "{child} го достигна врвот на тестот за оваа возраст — резултатот е „барем толку висок“. Има простор за поголеми предизвици, па следниот чекор се побогати, посложени задачи.",
      sr: "{child} je dostiglo vrh testa za ovaj uzrast — rezultat je „barem toliko visok“. Ima prostora za veće izazove, pa su sledeći korak bogatiji, složeniji zadaci.",
    },
  },
  {
    id: "extreme_floor",
    category: "extreme",
    extreme: "floor",
    priority: 1,
    trigger: (f) => f.anyFloor,
    text: {
      mk: "Задачите беа премногу нови за момент — тоа е сосема во ред. Со малку запознавање и вежбање во мирна средина, {child} брзо ќе се снајде.",
      sr: "Zadaci su za trenutak bili previše novi — to je sasvim u redu. Uz malo upoznavanja i vežbanja u mirnom okruženju, {child} će se brzo snaći.",
    },
  },
];
