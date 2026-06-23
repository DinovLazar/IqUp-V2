import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Purity scan for the PDF module (Phase 1.09) — mirrors the report-engine scan
 * (`src/features/report/__tests__/purity.test.ts`). The document builder is a pure
 * function of `ReportModel`: nothing in `src/features/report/pdf` may read a live
 * clock, randomness, the environment or the DOM. The two IO seams (`fonts.ts`
 * registers TTFs from disk, `render.ts` renders to a buffer) resolve paths via
 * `process.cwd()` ONLY — never `process.env` — so they pass the same scan.
 */

const DIR = "src/features/report/pdf";

function listTs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__" || entry.name === "fonts") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTs(full));
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
      out.push(full);
  }
  return out;
}

const FILES = listTs(DIR);

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

describe("purity — PDF module", () => {
  it("scans a non-empty file set", () => {
    expect(FILES.length).toBeGreaterThan(3);
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
