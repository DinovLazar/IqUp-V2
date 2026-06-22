import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Purity scan for the 1.05 engine + scoring + norms — mirrors the 1.04 task-bank
 * suite. Timing must enter ONLY as passed-in data; nothing here may read a live
 * clock, randomness, the environment, or the DOM. Fixtures are pure data too, so
 * they are scanned as well.
 */

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

const DIRS = [
  "src/features/assessment",
  "src/features/scoring",
  "src/content/norms",
];
const FILES = DIRS.flatMap(listTs);

/** Strip comments so we scan only executable code / string literals. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

/** The exact non-determinism / live-clock patterns the DoD bans. */
const FORBIDDEN: [RegExp, string][] = [
  [/Math\.random/, "Math.random"],
  [/\bnew Date\b/, "new Date"],
  [/\bDate\.now\b/, "Date.now"],
  [/\bDate\b/, "Date"],
  [/performance\.now/, "performance.now"],
  [/\bsetTimeout\b/, "setTimeout"],
  [/\bsetInterval\b/, "setInterval"],
  [/requestAnimationFrame/, "requestAnimationFrame"],
  [/\bwindow\b/, "window"],
  [/process\.env/, "process.env"],
];

describe("purity — 1.05 engine + scoring + norms", () => {
  it("scans a non-empty file set", () => {
    expect(FILES.length).toBeGreaterThan(10);
  });

  it("no live clock, randomness, env, or DOM access anywhere", () => {
    for (const file of FILES) {
      const code = stripComments(readFileSync(file, "utf8"));
      for (const [re, label] of FORBIDDEN) {
        expect(code, `${file} must not use ${label}`).not.toMatch(re);
      }
    }
  });

  it("emits no React / SVG / .tsx (pure data, like the task bank)", () => {
    for (const file of FILES) {
      expect(file.endsWith(".tsx")).toBe(false);
      const code = stripComments(readFileSync(file, "utf8"));
      // Type-only imports of UI enums are erased; a runtime React import is not.
      expect(code, `${file} must not import React at runtime`).not.toMatch(
        /^\s*import\s+(?!type\b)[^;]*from\s+["']react/m,
      );
      expect(code, `${file} must not emit SVG markup`).not.toMatch(/<svg/i);
    }
  });
});
