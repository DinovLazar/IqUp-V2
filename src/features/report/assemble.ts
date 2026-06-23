/**
 * Layer 3 — assembly (spec Дел 9.3 / 9.4). `assembleReport` turns a scored
 * `AssessmentResult` into the deterministic `ReportModel` that BOTH the 1.08
 * summary and the 1.09 PDF render from.
 *
 * It selects the top-strength, growth, solving-style and STEM-bridge modules,
 * attaches per-index activities, the positioning text and the dynamic CTA, resolves
 * `{child}` tokens, and branches on validity (a strong flag yields the graceful
 * retry variant, not a confident profile — spec Дел 7.1).
 *
 * Determinism: same `AssessmentResult` in → deep-equal `ReportModel` out. Ties
 * break by (priority desc, lib/indices order, module id) — a total order, so the
 * result never depends on array or sort stability (resolved-decision 4).
 */

import { INDEX_BY_KEY, INDEX_ORDER, type IndexKey } from "@/lib/indices";
import type { AssessmentResult } from "@/features/scoring";
import {
  ACTIVITY_MODULES,
  CTA_MODULES,
  EXTREME_MODULES,
  GROWTH_MODULES,
  MODULE_LIBRARY_VERSION,
  POSITIONING_MODULES,
  RANGE_BY_BAND,
  STEM_BRIDGE_MODULES,
  STEM_READINESS_MODULES,
  STRENGTH_MODULES,
  STYLE_MODULES,
  VALIDITY_MODULES,
} from "@/content/modules";
import { BANDS } from "@/components/ui/band-label";

import { deriveFeatures } from "./features";
import { resolveText, resolveTexts } from "./text";
import { REPORT_ENGINE_VERSION } from "./types";
import type {
  ActivityBlock,
  DerivedFeatures,
  IndexPresentation,
  ReportModel,
  ReportModule,
} from "./types";

/** Tie-break key: lower is better. Higher priority first, then index order, then id. */
function rank(m: ReportModule): [number, number, string] {
  const priority = -(m.priority ?? 0);
  const order = m.index ? INDEX_ORDER.indexOf(m.index) : INDEX_ORDER.length;
  return [priority, order, m.id];
}

/** Pick the single best eligible module from a slot's candidates (never throws). */
function selectModule(
  modules: readonly ReportModule[],
  f: DerivedFeatures,
): ReportModule | null {
  let best: ReportModule | null = null;
  let bestKey: [number, number, string] | null = null;
  for (const m of modules) {
    if (!m.trigger(f)) continue;
    const key = rank(m);
    if (bestKey === null || compareKey(key, bestKey) < 0) {
      best = m;
      bestKey = key;
    }
  }
  return best;
}

function compareKey(
  a: [number, number, string],
  b: [number, number, string],
): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] - b[1];
  return a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0;
}

/** Resolve a narrative module's MK text (with `{child}` expanded). */
function moduleText(m: ReportModule): string {
  return resolveText(m.text ?? { mk: "" });
}

/** Build the five parent-facing index rows (Дел 10.2 — word + range, no number). */
function buildIndices(f: DerivedFeatures): IndexPresentation[] {
  return INDEX_ORDER.map((key: IndexKey) => {
    const band = f.indexBand[key];
    return {
      key,
      label: INDEX_BY_KEY[key].label,
      value: f.indexValue[key],
      band,
      wordLabel: BANDS[band].word,
      range: resolveText(RANGE_BY_BAND[band]),
      confidence: f.indexConfidence[key],
      ceiling: f.indexCeiling[key],
      floor: f.indexFloor[key],
      color: INDEX_BY_KEY[key].color,
    };
  });
}

/** One activity set per index, in lib/indices order — guarantees per-index coverage. */
function buildActivities(): ActivityBlock[] {
  return INDEX_ORDER.map((key) => {
    const m = ACTIVITY_MODULES.find((a) => a.index === key);
    if (!m || !m.activities) {
      // Authoring guarantees one activity module per index; this keeps the type total.
      return { index: key, moduleId: `activity_${key}`, items: [] };
    }
    return { index: key, moduleId: m.id, items: resolveTexts(m.activities) };
  });
}

export function assembleReport(result: AssessmentResult): ReportModel {
  const f = deriveFeatures(result);

  const meta: ReportModel["meta"] = {
    age: result.meta.age,
    reportEngineVersion: REPORT_ENGINE_VERSION,
    moduleLibraryVersion: MODULE_LIBRARY_VERSION,
    scoringVersion: result.meta.scoringVersion,
    normsVersion: result.meta.normsVersion,
    taskBankVersion: result.meta.taskBankVersion,
    normsStage: result.meta.normsStage,
  };

  // ── Strong validity flag → graceful retry, no confident profile (Дел 7.1) ────
  if (f.strongFlag) {
    const strong = selectModule(VALIDITY_MODULES, f);
    return {
      variant: "retry",
      meta,
      indices: null,
      partA: null,
      partB: null,
      positioning: null,
      cta: null,
      validity: {
        variant: "strong",
        note: strong ? moduleText(strong) : undefined,
        retry: true,
      },
    };
  }

  // ── Otherwise a full, confident profile ──────────────────────────────────────
  const strength = selectModule(STRENGTH_MODULES, f);
  const growth = selectModule(GROWTH_MODULES, f);
  const style = selectModule(STYLE_MODULES, f);
  const readiness = selectModule(STEM_READINESS_MODULES, f);
  const bridge = selectModule(STEM_BRIDGE_MODULES, f);
  const positioning = selectModule(POSITIONING_MODULES, f);
  const cta = selectModule(CTA_MODULES, f);

  // Extreme copy: ceiling is the headline positive; otherwise the gentle floor note.
  const ceiling = f.anyCeiling
    ? (EXTREME_MODULES.find((m) => m.extreme === "ceiling") ?? null)
    : null;
  const floor =
    !f.anyCeiling && f.anyFloor
      ? (EXTREME_MODULES.find((m) => m.extreme === "floor") ?? null)
      : null;
  const extreme = ceiling ?? floor;

  const mild = f.mildFlag ? selectModule(VALIDITY_MODULES, f) : null;

  return {
    variant: "profile",
    meta,
    indices: buildIndices(f),
    partA: {
      topStrength: {
        index: f.topStrengthIndex,
        moduleId: strength?.id ?? "strength_fallback",
        text: strength ? moduleText(strength) : "",
      },
      growthArea: {
        index: f.primaryGrowthIndex,
        moduleId: growth?.id ?? "growth_fallback",
        text: growth ? moduleText(growth) : "",
      },
      solvingStyle: {
        style: style?.style ?? f.solvingStyle,
        moduleId: style?.id ?? "style_balanced",
        text: style ? moduleText(style) : "",
      },
      activities: buildActivities(),
      extreme: extreme
        ? {
            kind: extreme.extreme as "ceiling" | "floor",
            moduleId: extreme.id,
            text: moduleText(extreme),
          }
        : undefined,
    },
    partB: {
      readiness: {
        moduleId: readiness?.id ?? "stem_readiness_fallback",
        text: readiness ? moduleText(readiness) : "",
      },
      stemBridge: {
        lead: bridge?.stemLead ?? f.stemLead,
        moduleId: bridge?.id ?? "stem_bridge_default",
        text: bridge ? moduleText(bridge) : "",
      },
    },
    positioning: positioning
      ? {
          moduleId: positioning.id,
          text: moduleText(positioning),
          program: {
            key: positioning.program ?? "bibi",
            name: positioning.programName
              ? resolveText(positioning.programName)
              : "",
            tier: positioning.programTier ?? "basic",
          },
          programHook: positioning.programHook ?? "",
        }
      : null,
    cta: {
      text: cta?.ctaText
        ? resolveText(cta.ctaText)
        : "Закажи бесплатен демо час",
    },
    validity: {
      variant: f.mildFlag ? "mild" : "ok",
      note: mild ? moduleText(mild) : undefined,
      retry: false,
    },
  };
}
