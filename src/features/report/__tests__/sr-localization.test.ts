import { describe, expect, it } from "vitest";

import { MODULE_LIBRARY, RANGE_BY_BAND } from "@/content/modules";
import { PROFILES, scoreProfile } from "@/features/assessment/fixtures";
import { assembleReport } from "@/features/report";
import { resolveChild } from "@/features/report/text";
import type { LocalizedText, ReportModel } from "@/features/report/types";

/**
 * Serbian report localization (Feat-Serbian-Localization). Three guarantees:
 *
 *  1. COMPLETENESS — every authored module slot (narrative text, activities, CTA,
 *     program name) and every indicative range carries a non-empty `sr` register.
 *  2. NO LEAK — assembling any of the five fixture profiles in Serbian yields a
 *     report with NO Macedonian (Cyrillic) text and no blank narrative slot.
 *  3. VOICE — the Serbian module copy honours the two-register brand voice: no
 *     jargon, no „klinički IQ“, no „slabost / problem / zaostaje / dijagnoza“,
 *     growth-not-deficit (mirrors the Macedonian voice lint, D-082). Scoped to the
 *     module library, like MK — the legal/about copy legitimately NEGATES some of
 *     these ("nije klinički test", "ne daje dijagnozu") and is not in scope.
 */

const CYRILLIC = /[Ѐ-ӿ]/;

function hasSr(t: LocalizedText | undefined): boolean {
  return !!t && typeof t.sr === "string" && t.sr.trim().length > 0;
}

/** Every reachable localized field of the module library. */
describe("SR module-library completeness", () => {
  it("every module's narrative text has a non-empty sr", () => {
    const offenders = MODULE_LIBRARY.filter(
      (m) => m.text !== undefined && !hasSr(m.text),
    ).map((m) => m.id);
    expect(offenders, `missing text.sr: ${offenders.join(", ")}`).toEqual([]);
  });

  it("every activity item has a non-empty sr", () => {
    const offenders: string[] = [];
    for (const m of MODULE_LIBRARY) {
      if (!m.activities) continue;
      m.activities.forEach((a, i) => {
        if (!hasSr(a)) offenders.push(`${m.id}[${i}]`);
      });
    }
    expect(offenders, `missing activity sr: ${offenders.join(", ")}`).toEqual(
      [],
    );
  });

  it("every CTA + program-name has a non-empty sr", () => {
    const cta = MODULE_LIBRARY.filter(
      (m) => m.ctaText !== undefined && !hasSr(m.ctaText),
    ).map((m) => m.id);
    const prog = MODULE_LIBRARY.filter(
      (m) => m.programName !== undefined && !hasSr(m.programName),
    ).map((m) => m.id);
    expect(cta, `missing ctaText.sr: ${cta.join(", ")}`).toEqual([]);
    expect(prog, `missing programName.sr: ${prog.join(", ")}`).toEqual([]);
  });

  it("every indicative range has a non-empty sr", () => {
    const offenders = Object.entries(RANGE_BY_BAND)
      .filter(([, v]) => !hasSr(v))
      .map(([band]) => band);
    expect(offenders, `missing range.sr: ${offenders.join(", ")}`).toEqual([]);
  });
});

/** Collect every parent-facing string that reaches the page/PDF from a model. */
function reportStrings(model: ReportModel): string[] {
  const out: string[] = [];
  for (const idx of model.indices ?? []) {
    out.push(idx.label, idx.wordLabel, idx.range);
  }
  const a = model.partA;
  if (a) {
    out.push(a.topStrength.text, a.growthArea.text, a.solvingStyle.text);
    if (a.extreme) out.push(a.extreme.text);
    for (const g of a.activities) out.push(...g.items);
  }
  if (model.partB) {
    out.push(model.partB.readiness.text, model.partB.stemBridge.text);
  }
  if (model.positioning) {
    out.push(model.positioning.text, model.positioning.program.name);
  }
  if (model.cta) out.push(model.cta.text);
  if (model.validity.note) out.push(model.validity.note);
  return out.filter((s) => s !== undefined);
}

describe("SR report — no Macedonian leak, no blank slot", () => {
  for (const profile of PROFILES) {
    it(`fixture "${profile.label}" assembles a fully Serbian report`, () => {
      const model = assembleReport(scoreProfile(profile), "sr");
      const strings = reportStrings(model);

      // No Macedonian (Cyrillic) survived into any Serbian slot.
      const leaked = strings.filter((s) => CYRILLIC.test(s));
      expect(leaked, `Macedonian leaked: ${leaked.join(" | ")}`).toEqual([]);

      // The narrative slots are never blank in a confident profile.
      if (model.variant === "profile") {
        expect(model.partA?.topStrength.text.length).toBeGreaterThan(0);
        expect(model.partA?.growthArea.text.length).toBeGreaterThan(0);
        expect(model.partA?.solvingStyle.text.length).toBeGreaterThan(0);
        expect(model.partB?.readiness.text.length).toBeGreaterThan(0);
        expect(model.partB?.stemBridge.text.length).toBeGreaterThan(0);
        expect(model.positioning?.text.length).toBeGreaterThan(0);
        expect(model.cta?.text.length).toBeGreaterThan(0);
        // Every index carries three home activities.
        for (const g of model.partA?.activities ?? []) {
          expect(g.items.length).toBeGreaterThan(0);
        }
      } else {
        // The retry variant still shows a Serbian graceful-retry note.
        expect((model.validity.note ?? "").length).toBeGreaterThan(0);
      }
    });
  }
});

describe("SR voice lint (module library)", () => {
  const BANNED = [
    "klinički iq",
    "slabost",
    "problem",
    "zaostaje",
    "zaostajanje",
    "dijagnoz",
    "neuronauk",
    "egzekutivn",
    "kognitivn domen",
  ];

  const srStrings: string[] = [];
  for (const m of MODULE_LIBRARY) {
    if (m.text?.sr) srStrings.push(m.text.sr);
    if (m.ctaText?.sr) srStrings.push(m.ctaText.sr);
    if (m.programName?.sr) srStrings.push(m.programName.sr);
    for (const a of m.activities ?? []) if (a.sr) srStrings.push(a.sr);
  }
  for (const v of Object.values(RANGE_BY_BAND)) if (v.sr) srStrings.push(v.sr);

  it("scans a non-trivial amount of Serbian copy", () => {
    expect(srStrings.length).toBeGreaterThan(30);
  });

  it("contains no banned token", () => {
    const offenders: string[] = [];
    for (const s of srStrings) {
      const lower = s.toLowerCase();
      for (const bad of BANNED) {
        if (lower.includes(bad)) offenders.push(`"${bad}" in: ${s}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("SR {child} resolver", () => {
  it("expands {child} to the neuter „vaše dete“ / „Vaše dete“ by position", () => {
    expect(resolveChild("{child} rešava zadatke.", "sr")).toBe(
      "Vaše dete rešava zadatke.",
    );
    expect(resolveChild("Zadatak koji {child} voli.", "sr")).toBe(
      "Zadatak koji vaše dete voli.",
    );
  });

  it("still resolves Macedonian by default (no regression)", () => {
    expect(resolveChild("{child} решава задачи.")).toBe(
      "Вашето дете решава задачи.",
    );
  });
});
