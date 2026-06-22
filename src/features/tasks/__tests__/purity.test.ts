import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  generateItem,
  generatePractice,
  TESTABLE_SIGNALS,
  type CtSubtype,
} from "@/features/tasks";

/** Recursively list .ts files under a dir, skipping the test folder. */
function listTs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTs(full));
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

const TASK_DIRS = ["src/features/tasks", "src/content/tasks"];
const TASK_FILES = [...TASK_DIRS.flatMap(listTs), "src/lib/prng.ts"];

/** Strip comments so we scan only executable code / string literals. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("purity — no non-deterministic sources in the task system", () => {
  it("no Math.random, Date, or environment reads anywhere", () => {
    for (const file of TASK_FILES) {
      const code = stripComments(readFileSync(file, "utf8"));
      expect(code, `${file} must not use Math.random`).not.toMatch(
        /Math\.random/,
      );
      expect(code, `${file} must not use Date`).not.toMatch(/\bDate\b/);
      expect(code, `${file} must not read process.env`).not.toMatch(
        /process\.env/,
      );
    }
  });

  it("emits pure data — no React, no SVG/markup, no .tsx", () => {
    for (const file of TASK_FILES) {
      expect(file.endsWith(".tsx")).toBe(false);
      const code = stripComments(readFileSync(file, "utf8"));
      expect(code, `${file} must not import React`).not.toMatch(
        /from\s+["']react/,
      );
      expect(code, `${file} must not emit SVG markup`).not.toMatch(/<svg/i);
    }
  });

  it("no hardcoded Cyrillic string literals in code", () => {
    for (const file of TASK_FILES) {
      const code = stripComments(readFileSync(file, "utf8"));
      expect(code, `${file} has Cyrillic outside comments`).not.toMatch(
        /[Ѐ-ӿ]/,
      );
    }
  });
});

describe("language neutrality — generators emit no text", () => {
  const strings: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") strings.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };

  const CT_SUBTYPES: CtSubtype[] = [
    "sequence",
    "debug",
    "loop",
    "condition",
    "maze",
  ];
  for (const signal of TESTABLE_SIGNALS)
    for (const level of [1, 5, 10])
      for (const seed of ["t1", "t2"]) {
        walk(generateItem({ signal, level, seed }));
        walk(generatePractice(signal, seed));
      }
  for (const subtype of CT_SUBTYPES)
    for (const level of [1, 5, 10])
      walk(generateItem({ signal: "ct", level, seed: "tc", subtype }));

  it("contains no Cyrillic in any emitted string", () => {
    for (const s of strings) expect(s).not.toMatch(/[Ѐ-ӿ]/);
  });

  it("emits only short ASCII tokens (no prose / no spaces)", () => {
    // The seed string is the one legitimately free-form field; everything else
    // is an enum-like token (shape names, move names, family/subtype). None
    // should contain spaces.
    for (const s of strings) {
      if (s.startsWith("t1") || s.startsWith("t2") || s.startsWith("tc"))
        continue; // seeds
      expect(s, `unexpected free text: "${s}"`).not.toMatch(/\s/);
    }
  });
});
