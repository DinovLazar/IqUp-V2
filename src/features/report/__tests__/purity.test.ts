import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Purity scan for the report engine + module library — mirrors the 1.04 / 1.05
 * suites. The engine is pure: nothing in `src/features/report` or
 * `src/content/modules` may read a live clock, randomness, the environment or the
 * DOM (resolved-decision 4). Same input ⇒ deep-equal output depends on it.
 */

function listTs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTs(full));
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
      out.push(full);
  }
  return out;
}

const DIRS = ["src/features/report", "src/content/modules"];
const FILES = DIRS.flatMap(listTs);

/** Strip comments so we scan executable code + string literals only. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

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

describe("purity — report engine + module library", () => {
  it("scans a non-empty file set", () => {
    expect(FILES.length).toBeGreaterThan(10);
  });

  it("no live clock, randomness, env or DOM access anywhere", () => {
    for (const file of FILES) {
      const code = stripComments(readFileSync(file, "utf8"));
      for (const [re, label] of FORBIDDEN) {
        expect(code, `${file} must not use ${label}`).not.toMatch(re);
      }
    }
  });
});
