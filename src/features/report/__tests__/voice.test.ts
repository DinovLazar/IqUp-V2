import { describe, expect, it } from "vitest";

import {
  flatTypical,
  PROFILES,
  scoreProfile,
} from "@/features/assessment/fixtures";
import type { AssessmentResult } from "@/features/scoring";
import {
  ACTIVITY_MODULES,
  CTA_MODULES,
  MODULE_LIBRARY,
  RANGE_BY_BAND,
} from "@/content/modules";
import { assembleReport } from "@/features/report";
import type { ReportModel } from "@/features/report";

/**
 * Voice lint — mechanically enforces the brand §9 / spec Дел 12 voice and the legal
 * posture (Прилог D / H). No parent-facing text may contain an attack-frame or
 * jargon token: „слабост", „проблем", „заостанува", „невронаука", „извршни функции",
 * „когнитивни домени", „IQ", „дијагноза" (case-insensitive). The brand name
 * „IQ UP!" is allowed — it is stripped before the „IQ" check. The internal
 * `programHook` is NOT parent-facing and is excluded.
 */

const BANNED = [
  "слабост",
  "проблем",
  "заостанува",
  "невронаука",
  "извршни функции",
  "когнитивни домени",
  "iq",
  "дијагноза",
] as const;

/** Strip the „IQ UP!" brand name so the bare „IQ" check doesn't false-positive. */
function strip(text: string): string {
  return text.replace(/IQ UP!?/gi, "");
}

function offenders(text: string): string[] {
  const hay = strip(text).toLowerCase();
  return BANNED.filter((b) => hay.includes(b));
}

/** Every parent-facing string in an assembled report (NOT the internal programHook). */
function parentStrings(r: ReportModel): string[] {
  const out: string[] = [];
  for (const i of r.indices ?? []) out.push(i.label, i.wordLabel, i.range);
  if (r.partA) {
    out.push(
      r.partA.topStrength.text,
      r.partA.growthArea.text,
      r.partA.solvingStyle.text,
    );
    for (const a of r.partA.activities) out.push(...a.items);
    if (r.partA.extreme) out.push(r.partA.extreme.text);
  }
  if (r.partB) out.push(r.partB.readiness.text, r.partB.stemBridge.text);
  if (r.positioning) out.push(r.positioning.text, r.positioning.program.name);
  if (r.cta) out.push(r.cta.text);
  if (r.validity.note) out.push(r.validity.note);
  return out;
}

describe("report engine — voice lint", () => {
  it("no banned token in any authored module string", () => {
    const strings: string[] = [];
    for (const m of MODULE_LIBRARY) {
      if (m.text) strings.push(m.text.mk);
      if (m.activities) for (const a of m.activities) strings.push(a.mk);
      if (m.ctaText) strings.push(m.ctaText.mk);
      if (m.programName) strings.push(m.programName.mk);
    }
    for (const k of Object.keys(
      RANGE_BY_BAND,
    ) as (keyof typeof RANGE_BY_BAND)[]) {
      strings.push(RANGE_BY_BAND[k].mk);
    }
    expect(strings.length).toBeGreaterThan(50);
    for (const s of strings) {
      expect(offenders(s), `banned token in: ${s}`).toEqual([]);
    }
  });

  it("no banned token in any assembled, resolved report", () => {
    const base = scoreProfile(flatTypical);
    const mild: AssessmentResult = {
      ...base,
      validity: {
        session: "mild",
        flags: [{ code: "too_fast", severity: "mild" }],
      },
    };
    const reports = [
      ...PROFILES.map((p) => assembleReport(scoreProfile(p))),
      assembleReport(mild),
    ];
    for (const r of reports) {
      for (const s of parentStrings(r)) {
        expect(offenders(s), `banned token in: ${s}`).toEqual([]);
      }
    }
  });

  it("the CTA and activity copy stay in the no-attack voice", () => {
    for (const m of [...CTA_MODULES, ...ACTIVITY_MODULES]) {
      const strings = [
        m.ctaText?.mk,
        ...(m.activities ?? []).map((a) => a.mk),
      ].filter((s): s is string => Boolean(s));
      for (const s of strings) expect(offenders(s)).toEqual([]);
    }
  });
});
