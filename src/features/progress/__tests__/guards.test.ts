/**
 * Phase 3.01 — structural guards for the on-device progress store (spec §14.1 /
 * Дел 14.2):
 *   • UNJOINABLE: the progress tree touches NEITHER Supabase (Store A) nor Brevo
 *     (Store B) — it is a third, purely on-device store that shares no key with
 *     either, so no subject can be correlated across stores.
 *   • ISOLATED IO: only `storage.ts` reads the browser (`window` / `localStorage`).
 *     The summary / compare / repeat / schema logic stays pure, so nothing leaks a
 *     side effect into the deterministic layers.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DIR = "src/features/progress";

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

const FILES = listTs(DIR);
const stripComments = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("progress store — unjoinable + isolated (§14.1 / Дел 14.2)", () => {
  it("scans a non-empty file set", () => {
    expect(FILES.length).toBeGreaterThan(4);
  });

  it("imports neither Supabase nor Brevo (no join to Store A / Store B)", () => {
    for (const file of FILES) {
      const code = stripComments(readFileSync(file, "utf8"));
      expect(code, `${file} must not import Supabase`).not.toMatch(/supabase/i);
      expect(code, `${file} must not import Brevo`).not.toMatch(/brevo/i);
      // no PostgREST / lead-store fetch either
      expect(code, `${file} must not read the lead store`).not.toMatch(
        /\/api\/(lead|score)\b/,
      );
    }
  });

  it("only storage.ts touches the browser (window / localStorage)", () => {
    for (const file of FILES) {
      const code = stripComments(readFileSync(file, "utf8"));
      const touchesBrowser =
        /\bwindow\b/.test(code) || /localStorage/.test(code);
      if (file.endsWith("storage.ts")) continue;
      expect(touchesBrowser, `${file} must not read window/localStorage`).toBe(
        false,
      );
    }
  });
});
