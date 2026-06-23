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
    },
  },
];
