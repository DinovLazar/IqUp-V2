/**
 * Report-engine types — the derived-features contract, the module schema, and the
 * `ReportModel` that BOTH the on-screen summary (1.08) and the PDF (1.09) render
 * from.
 *
 * The engine is pure and deterministic (same `AssessmentResult` in → deep-equal
 * `ReportModel` out) and **never recomputes** indices, bands, confidence or
 * validity — those are 1.05's output, consumed read-only. Everything here is
 * narrative personalisation layered on top (spec Дел 9).
 *
 * Multilingual-ready by schema, MK-only authored this phase: `LocalizedText`
 * keeps `sr`/`hr`/`en` slots but only `mk` is filled (D-079).
 */

import type { Band } from "@/components/ui/band-label";
import type { Confidence } from "@/components/ui/confidence-label";
import type { IndexKey } from "@/lib/indices";
import type { SessionValidity, ValidityFlag } from "@/features/scoring";

export type { Band, Confidence, IndexKey };

/** Bumped when the derived-features or assembly logic changes (carried in meta). */
export const REPORT_ENGINE_VERSION = "1.0.0";

/** Supported registers; only `mk` is authored this phase (resolved-decision 3). */
export type Lang = "mk" | "sr" | "hr" | "en";

/** A localized string; `mk` is always present, the rest are later phases. */
export interface LocalizedText {
  mk: string;
  sr?: string;
  hr?: string;
  en?: string;
}

// ── Derived features (spec Дел 9.1 layer 2) ──────────────────────────────────

/** The observed speed-accuracy style — read straight from behaviour (Дел 8 / 9.5). */
export type SolvingStyle =
  | "fast-accurate"
  | "slow-accurate"
  | "fast-errors"
  | "balanced";

/** Which thinking the STEM bridge leads with (Дел 9.3 — broader than coding). */
export type StemLead = "spatial" | "logic" | "ct" | "default";

/** Age cluster for positioning (Дел 11 / Прилог E). */
export type ProgramKey =
  | "mali"
  | "bibi"
  | "bibi-plus"
  | "oliver"
  | "oliver-plus";

/** Whether the recommended program tier is the base or the PLUS variant. */
export type ProfileStrength = "basic" | "plus";

/**
 * The pure layer-2 features the assembly layer reads. Index-keyed maps mirror the
 * 1.05 output verbatim (no recomputation); the rest are narrative derivations.
 */
export interface DerivedFeatures {
  age: number;

  // Profile shape (spec Дел 9.1) — peaked vs flat.
  profileShape: "flat" | "peaked";
  /** Spread (max − min) of the 5 index values; drives `profileShape`. */
  indexSpread: number;

  // Read-only mirrors of the 1.05 composite output.
  indexValue: Record<IndexKey, number>;
  indexBand: Record<IndexKey, Band>;
  indexConfidence: Record<IndexKey, Confidence>;
  indexCeiling: Record<IndexKey, boolean>;
  indexFloor: Record<IndexKey, boolean>;

  // Peak / growth (tie-broken by lib/indices order, then nothing else needed).
  topStrengthIndex: IndexKey;
  primaryGrowthIndex: IndexKey;
  /** True when the lowest index is itself strong/exceptional (a strong-all profile). */
  growthIsStrong: boolean;

  // Observed solving style (Дел 9.5) — every input is behavioural, never speculative.
  solvingStyle: SolvingStyle;
  /** Correct fraction across the clean reasoning items (gf, gv, ef, ct). */
  accuracy: number;
  /** Too-fast-and-wrong rate (spec impulsive term). */
  impulsiveRate: number;
  /** Fast-but-correct rate (answered under the too-fast floor yet right). */
  fastCorrectRate: number;

  // Memory forward-vs-backward asymmetry (Дел 9.1), when Corsi backward ran.
  memoryForwardSpan: number | null;
  memoryBackwardSpan: number | null;
  memoryForwardStronger: boolean;

  // Learning slope (Glr) and session variability (attention).
  learningSlope: number | null;
  positiveLearningSlope: boolean;
  sessionVariability: number | null;

  // Extremes (spec Дел 7.3).
  anyCeiling: boolean;
  anyFloor: boolean;
  ceilingCount: number;

  // STEM bridge lead + positioning tier.
  stemLead: StemLead;
  profileStrength: ProfileStrength;

  // Validity carried through read-only (spec Дел 7.1).
  validity: SessionValidity;
  validityFlags: readonly ValidityFlag[];
  mildFlag: boolean;
  strongFlag: boolean;
}

// ── Module schema (spec Дел 9.2) ─────────────────────────────────────────────

export type ModuleCategory =
  | "strength"
  | "growth"
  | "style"
  | "stem-bridge"
  | "stem-readiness"
  | "activity"
  | "positioning"
  | "cta"
  | "extreme"
  | "validity"
  | "range";

/**
 * One report module. `trigger` is the authoritative eligibility predicate over the
 * derived features (Дел 9.2); the metadata fields below carry slot identity and
 * the deterministic tie-break key. `programHook` is an internal note for the team
 * (Дел 11) — never printed to the parent verbatim.
 */
export interface ReportModule {
  id: string;
  category: ModuleCategory;
  trigger: (f: DerivedFeatures) => boolean;

  /** Narrative copy (strength / growth / style / stem / extreme / validity / readiness). */
  text?: LocalizedText;
  /** 2–3 concrete home activities (activity modules). */
  activities?: LocalizedText[];
  /** Dynamic demo-class CTA copy, tied to the growth zone (Дел 9.2). */
  ctaText?: LocalizedText;
  /** Internal program-mapping note (Дел 11) — NOT shown to the parent verbatim. */
  programHook?: string;

  // Slot identity / tie-break metadata.
  index?: IndexKey;
  band?: Band;
  style?: SolvingStyle;
  stemLead?: StemLead;
  program?: ProgramKey;
  /** Parent-facing program display name (positioning modules). */
  programName?: LocalizedText;
  programTier?: ProfileStrength;
  extreme?: "ceiling" | "floor";
  validityVariant?: "mild" | "strong";
  /** Higher wins ties; defaults to 0 (the fallback level). */
  priority?: number;
}

// ── ReportModel — the single render contract for 1.08 + 1.09 ──────────────────

export interface ReportMeta {
  age: number;
  reportEngineVersion: string;
  moduleLibraryVersion: string;
  scoringVersion: string;
  normsVersion: string;
  taskBankVersion: string;
  normsStage: "seed";
}

/** Parent-facing per-index presentation (Дел 10.2) — word + range, NEVER a number. */
export interface IndexPresentation {
  key: IndexKey;
  /** Full Macedonian index name (from lib/indices). */
  label: string;
  /**
   * The 8–99 composite, carried for PENTAGON GEOMETRY ONLY (the shape — Дел 10.2).
   * It is never rendered as text; the parent sees the band word + range, not this.
   */
  value: number;
  band: Band;
  /** Band word („Во развој" · „Солидно" · „Силно" · „Исклучително"). */
  wordLabel: string;
  /** Indicative range caption — derived from the band, never a number. */
  range: string;
  confidence: Confidence;
  ceiling: boolean;
  floor: boolean;
  /** Index hex (from lib/indices) — color key for pentagon/bars/PDF. */
  color: string;
}

export interface StrengthBlock {
  index: IndexKey;
  moduleId: string;
  text: string;
}
export interface GrowthBlock {
  index: IndexKey;
  moduleId: string;
  text: string;
}
export interface StyleBlock {
  style: SolvingStyle;
  moduleId: string;
  text: string;
}
export interface ActivityBlock {
  index: IndexKey;
  moduleId: string;
  items: string[];
}
export interface ExtremeBlock {
  kind: "ceiling" | "floor";
  moduleId: string;
  text: string;
}

/** Part А · Когнитивен профил (spec Дел 9.4). */
export interface PartA {
  topStrength: StrengthBlock;
  growthArea: GrowthBlock;
  solvingStyle: StyleBlock;
  /** Exactly one per index (all five) — guaranteed non-empty per index. */
  activities: ActivityBlock[];
  extreme?: ExtremeBlock;
}

/** Part Б · STEM подготвеност (spec Дел 9.4). */
export interface PartB {
  readiness: { moduleId: string; text: string };
  stemBridge: { lead: StemLead; moduleId: string; text: string };
}

export interface PositioningBlock {
  moduleId: string;
  text: string;
  program: { key: ProgramKey; name: string; tier: ProfileStrength };
  /** Internal team note (Дел 11) — never displayed to the parent verbatim. */
  programHook: string;
}

/** CTA carries TEXT only — the booking URL + `?grad=` are assembled in 1.08/1.09. */
export interface CtaBlock {
  text: string;
}

export interface ValidityPresentation {
  variant: SessionValidity;
  /** Soft note (mild) or graceful-retry message (strong); absent when ok. */
  note?: string;
  /** True only for the strong-flag retry variant — show a „Повтори" affordance. */
  retry: boolean;
}

/**
 * The deterministic report. `variant: "retry"` is the strong-flag graceful retry
 * (no confident profile, spec Дел 7.1): `indices`/`partA`/`partB`/`positioning`/
 * `cta` are all null and only `validity` carries the retry message.
 */
export interface ReportModel {
  variant: "profile" | "retry";
  meta: ReportMeta;
  indices: IndexPresentation[] | null;
  partA: PartA | null;
  partB: PartB | null;
  positioning: PositioningBlock | null;
  cta: CtaBlock | null;
  validity: ValidityPresentation;
}

/** The subset the 1.08 confirmation screen renders (spec Дел 10.1). */
export interface ReportSummary {
  variant: "profile" | "retry";
  indices: IndexPresentation[] | null;
  topStrength: StrengthBlock | null;
  cta: CtaBlock | null;
  validity: ValidityPresentation;
}
