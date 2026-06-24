/**
 * Unjoinable-stores guard (Phase 2.04, spec §14.1/§15). Static scan over the
 * admin pages + the admin API: NO single file may read BOTH a contact identity
 * (Brevo) AND a score (Store A) — that is the only way the two stores could be
 * correlated for one subject. The stats page reads ONLY scores; the contacts
 * page + export read ONLY contacts; nothing reads both.
 *
 * It also asserts both token groups actually appear SOMEWHERE (so a typo can't
 * make the cross-check pass vacuously).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOTS = [
  fileURLToPath(new URL("../../admin/", import.meta.url)),
  fileURLToPath(new URL("../../api/admin/", import.meta.url)),
  // The modules where the reads actually happen — guards a future cross-store
  // read added in the pure core or the server-only Brevo reader, matching the
  // docstring's "no single file reads both" claim.
  fileURLToPath(new URL("../../../features/admin/", import.meta.url)),
  fileURLToPath(new URL("../../../lib/brevo/", import.meta.url)),
];

/** Tokens that mean "this file reads parent CONTACT identities (Brevo)". */
const CONTACT_TOKENS = ["fetchAllContactsFromList", "listContactsFromList"];

/** Tokens that mean "this file reads anonymous SCORES (Store A)". */
const SCORE_TOKENS = [
  "admin_score_stats",
  'from("scores")',
  "from('scores')",
  "buildScoreRow",
  "scoreRowSchema",
  "public.scores",
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = `${dir}${entry}`;
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__") continue;
      out.push(...walk(`${full}/`));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const files = ROOTS.flatMap(walk);

function hasAny(text: string, tokens: string[]): boolean {
  return tokens.some((t) => text.includes(t));
}

describe("admin store separation", () => {
  it("found admin source files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("no admin file reads BOTH a contact identity and a score", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (hasAny(text, CONTACT_TOKENS) && hasAny(text, SCORE_TOKENS)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the contact + score reads each exist somewhere (tokens are real)", () => {
    const all = files.map((f) => readFileSync(f, "utf8")).join("\n");
    expect(hasAny(all, CONTACT_TOKENS)).toBe(true);
    expect(hasAny(all, SCORE_TOKENS)).toBe(true);
  });
});
