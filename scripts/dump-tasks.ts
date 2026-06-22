/**
 * Eyeball a few generated items as JSON — one per signal across a few levels,
 * plus each CT sub-type and a practice example. Useful now for sanity-checking
 * and later for feeding the 1.06 renderer sample data. The Vitest suite, not this
 * script, is the real correctness gate.
 *
 * Run:  npx tsx scripts/dump-tasks.ts
 *       npx tsx scripts/dump-tasks.ts gf 5 my-seed
 */

import {
  generateItem,
  generatePractice,
  TESTABLE_SIGNALS,
  type CtSubtype,
  type Signal,
} from "../src/features/tasks";

const CT_SUBTYPES: CtSubtype[] = [
  "sequence",
  "debug",
  "loop",
  "condition",
  "maze",
];

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
  for (const subtype of CT_SUBTYPES) {
    print(
      `ct · ${subtype}`,
      generateItem({ signal: "ct", level: 5, seed: "demo", subtype }),
    );
  }
  for (const signal of TESTABLE_SIGNALS) {
    print(`${signal} · practice`, generatePractice(signal, "demo-practice"));
  }
}

function dumpOne(signal: Signal, level: number, seed: string) {
  print(
    `${signal} · level ${level} · seed "${seed}"`,
    generateItem({ signal, level, seed }),
  );
}

const [, , sigArg, levelArg, seedArg] = process.argv;
if (sigArg) {
  dumpOne((sigArg as Signal) ?? "gf", Number(levelArg ?? 1), seedArg ?? "demo");
} else {
  dumpAll();
}
