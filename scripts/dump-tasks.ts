/**
 * Eyeball a few generated items as JSON — one per signal across a few levels,
 * each CT family, per-age start-level samples (v2: ages 5 / 9 / 13, so the age
 * clamps + Gs per-age rows are visible), and a practice example. Useful for
 * sanity-checking; the Vitest suite, not this script, is the real correctness
 * gate.
 *
 * Run:  npx tsx scripts/dump-tasks.ts
 *       npx tsx scripts/dump-tasks.ts gf 5 my-seed [age]
 */

import {
  START_LEVELS,
  startLevel,
  type LadderedSignal,
} from "../src/content/norms";
import { gsNominalLevel } from "../src/content/tasks";
import {
  generateItem,
  generatePractice,
  TESTABLE_SIGNALS,
  type CtFamily,
  type Signal,
} from "../src/features/tasks";

const CT_FAMILIES: CtFamily[] = [
  "sequence",
  "debug",
  "loop",
  "loopEvent",
  "condition",
  "conditionLoop",
  "nestedLoop",
  "counter",
  "optimize",
];

const SAMPLE_AGES = [5, 9, 13] as const;

const print = (label: string, value: unknown) => {
  console.log(`\n=== ${label} ===\n${JSON.stringify(value, null, 2)}`);
};

function dumpAll() {
  for (const signal of TESTABLE_SIGNALS) {
    for (const level of [1, 5, 10]) {
      print(
        `${signal} · level ${level}`,
        generateItem({ signal, level, seed: "demo" }),
      );
    }
  }
  for (const subtype of CT_FAMILIES) {
    print(
      `ct · ${subtype}`,
      generateItem({ signal: "ct", level: 5, seed: "demo", subtype }),
    );
  }
  // Per-age start-level samples (the v2 age clamps + Gs per-age rows).
  for (const age of SAMPLE_AGES) {
    for (const signal of TESTABLE_SIGNALS) {
      const level =
        signal === "gs"
          ? gsNominalLevel(age)
          : startLevel(signal as LadderedSignal, age);
      print(
        `${signal} · age ${age} · start level ${level}`,
        generateItem({ signal, level, seed: `demo-age-${age}`, age }),
      );
    }
  }
  for (const signal of TESTABLE_SIGNALS) {
    const level =
      signal === "gs"
        ? gsNominalLevel(9)
        : START_LEVELS[signal as LadderedSignal][9];
    print(
      `${signal} · practice (age 9)`,
      generatePractice(signal, "demo-practice", { level, age: 9 }),
    );
  }
}

function dumpOne(signal: Signal, level: number, seed: string, age?: number) {
  print(
    `${signal} · level ${level} · seed "${seed}"${age ? ` · age ${age}` : ""}`,
    generateItem({ signal, level, seed, age }),
  );
}

const [, , sigArg, levelArg, seedArg, ageArg] = process.argv;
if (sigArg) {
  dumpOne(
    (sigArg as Signal) ?? "gf",
    Number(levelArg ?? 1),
    seedArg ?? "demo",
    ageArg ? Number(ageArg) : undefined,
  );
} else {
  dumpAll();
}
