/**
 * Scoring output types — the `AssessmentResult` and its parts.
 *
 * Field names + enum values line up with the 1.03 UI kit and `lib/indices.ts` so
 * the result feeds `pentagon.tsx`, `index-band-bar.tsx`, `band-label.tsx` and
 * `confidence-label.tsx` with NO adapter layer. `Band` and `Confidence` are
 * imported as TYPES straight from the components (erased at build), so any drift
 * in those enums breaks this compile — the strongest possible coupling.
 */

import type { Band } from "@/components/ui/band-label";
import type { Confidence } from "@/components/ui/confidence-label";
import type { IndexKey } from "@/lib/indices";
import type { CorsiDirection } from "@/features/tasks";
import type { ScoredSignal } from "@/content/norms";
import type { ErrorType } from "@/features/assessment/types";

export type { Band, Confidence };

/** Graduated session verdict (spec Дел 7.1). `strong` ⇒ no confident profile. */
export type SessionValidity = "ok" | "mild" | "strong";

export type ValidityCode =
  | "too_fast"
  | "same_position"
  | "idle_pauses"
  | "gs_mashing"
  | "gs_omission"
  | "random_accuracy";

export interface ValidityFlag {
  code: ValidityCode;
  /** The affected signal, when the flag is domain-specific. */
  signal?: ScoredSignal;
  severity: "mild" | "strong";
}

/** One administered item, surfaced for transparency + 1.07 features. */
export interface PerItemResult {
  level?: number;
  spanLength?: number;
  direction?: CorsiDirection;
  correct: boolean;
  effectiveTimeMs: number;
  errorType?: ErrorType;
  tooFast: boolean;
}

/** Per-signal result: raw score, the 0–100 index, and observables for 1.07. */
export interface SignalResult {
  /** Raw score (units vary by signal — see spec Дел 6.1). */
  rawScore: number;
  /** Normed index 8–99 (the number is never shown to a parent). */
  index: number;
  itemsAdministered: number;
  perItem: PerItemResult[];
  /** Corsi only: max correct span per direction. */
  span?: { forward: number; backward: number };
  meanEffectiveTimeMs?: number;
  /** Coefficient of variation of effective times (between-task variability). */
  timeVariability?: number;
  impulsiveErrorRate?: number;
  /** Glr only: recall-accuracy slope across rounds. */
  learningSlope?: number;
  ceiling: boolean;
  floor: boolean;
}

/** One parent-facing composite index — drops straight into the UI kit. */
export interface IndexResult {
  /** 8–99; drives pentagon geometry + band assignment. Never rendered raw. */
  value: number;
  band: Band;
  confidence: Confidence;
  ceiling: boolean;
  floor: boolean;
}

export interface AssessmentMeta {
  age: number;
  sessionSeed: string;
  scoringVersion: string;
  normsVersion: string;
  taskBankVersion: string;
  /** Honest label: results are seed-norm reference values, not measured norms (Дел 6.6). */
  normsStage: "seed";
}

/** The full deterministic output of a scored session. */
export interface AssessmentResult {
  meta: AssessmentMeta;
  /** Per fine signal (7 testable + derived attention). */
  signals: Record<ScoredSignal, SignalResult>;
  /** The 5 parent-facing composites, keyed by lib/indices IndexKey. */
  indices: Record<IndexKey, IndexResult>;
  validity: { session: SessionValidity; flags: ValidityFlag[] };
}
