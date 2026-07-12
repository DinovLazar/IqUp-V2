/**
 * Phase 3.03a — structural guards for the on-device consent store (spec §14.1 /
 * §16.3), mirroring the progress-store guard:
 *   • UNJOINABLE: the consent tree touches NEITHER Supabase (Store A) nor Brevo
 *     (Store B) — it is a third, purely on-device store (D-170) sharing no key with
 *     either, so no subject can be correlated across stores.
 *   • ISOLATED IO: only `storage.ts` reads the browser (`window` / `localStorage`).
 *     The schema, the `consent` API, and BOTH UI components stay window-free — they
 *     reach the browser only through the storage adapter.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DIR = "src/features/consent";

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

describe("consent store — unjoinable + isolated (§14.1 / §16.3)", () => {
  it("scans a non-empty file set", () => {
    expect(FILES.length).toBeGreaterThan(4);
  });

  it("imports neither Supabase nor Brevo (no join to Store A / Store B)", () => {
    for (const file of FILES) {
      const code = stripComments(readFileSync(file, "utf8"));
      expect(code, `${file} must not import Supabase`).not.toMatch(/supabase/i);
      expect(code, `${file} must not import Brevo`).not.toMatch(/brevo/i);
      expect(code, `${file} must not read the lead/score store`).not.toMatch(
        /\/api\/(lead|score)\b/,
      );
    }
  });

  it("only storage.ts touches the browser (window / localStorage)", () => {
    for (const file of FILES) {
      if (file.endsWith("storage.ts")) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      const touchesBrowser =
        /\bwindow\b/.test(code) || /localStorage/.test(code);
      expect(touchesBrowser, `${file} must not read window/localStorage`).toBe(
        false,
      );
    }
  });
});
