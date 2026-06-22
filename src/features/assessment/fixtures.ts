/**
 * Scripted-session fixtures — deterministic response + timing scripts that drive
 * the engine end-to-end. Used by the 1.05 test suite and reusable by the report
 * engine (1.07) as canonical "five profiles → five reports" inputs.
 *
 * The model is an **ability threshold** per signal: a child reliably passes items
 * at or below their ability and fails above it (backward Corsi is two steps
 * harder). That yields realistic adaptive paths that climb, floor, or stabilise —
 * exactly what the report engine needs to exercise. All timings are constants, so
 * the whole thing stays pure and reproducible.
 */

import {
  EXPECTED_FORWARD_SPAN_BY_AGE,
  START_LEVEL_BY_AGE,
  byAge,
} from "@/content/norms";
import { finalize, type AssessmentResult } from "@/features/scoring";
import type {
  CtItem,
  EfItem,
  GlrItem,
  GsItem,
  GsmItem,
  GvItem,
  GfItem,
} from "@/features/tasks";
import {
  runSession,
  startSession,
  type AdministerAction,
  type RawResponse,
  type ResponseScript,
  type ResponseTiming,
} from ".";

// ── Per-signal response builders ──────────────────────────────────────────────

const mcCorrect = (
  item: GfItem | GvItem,
  correct: boolean,
  timing: ResponseTiming,
): RawResponse => ({
  signal: item.signal,
  optionIndex: correct ? item.answer : item.answer === 0 ? 1 : 0,
  ...timing,
});

function ctResponse(
  item: CtItem,
  correct: boolean,
  timing: ResponseTiming,
): RawResponse {
  const { answer } = item;
  if (answer.kind === "optionIndex" || answer.kind === "stepIndex") {
    const wrong = answer.value === 0 ? 1 : 0;
    const chosen = correct ? answer.value : wrong;
    return answer.kind === "optionIndex"
      ? { signal: "ct", optionIndex: chosen, ...timing }
      : { signal: "ct", stepIndex: chosen, ...timing };
  }
  // maze path
  return {
    signal: "ct",
    path: correct ? answer.moves : [],
    ...timing,
  };
}

const gsmResponse = (
  item: GsmItem,
  correct: boolean,
  timing: ResponseTiming,
): RawResponse => ({
  signal: "gsm",
  tapOrder: correct ? item.answer : [],
  ...timing,
});

function gsResponse(
  item: GsItem,
  foundFrac: number,
  falseTaps: number,
  mash: boolean,
  timing: ResponseTiming,
): RawResponse {
  if (mash) {
    return {
      signal: "gs",
      selectedCells: Array.from(
        { length: item.stimulus.cellCount },
        (_, i) => i,
      ),
      ...timing,
    };
  }
  const targets = item.answer;
  const nFound = Math.min(
    targets.length,
    Math.round(foundFrac * targets.length),
  );
  const found = targets.slice(0, nFound);
  const targetSet = new Set(targets);
  const nonTargets: number[] = [];
  for (
    let i = 0;
    i < item.stimulus.cellCount && nonTargets.length < falseTaps;
    i++
  ) {
    if (!targetSet.has(i)) nonTargets.push(i);
  }
  return { signal: "gs", selectedCells: [...found, ...nonTargets], ...timing };
}

const efResponse = (
  item: EfItem,
  solved: boolean,
  timing: ResponseTiming,
): RawResponse => ({
  signal: "ef",
  moves: solved ? item.answer.optimalPath : [],
  ...timing,
});

function glrResponse(
  item: GlrItem,
  rounds: number,
  finalFrac: number,
  timing: ResponseTiming,
): RawResponse {
  const k = item.answer.length;
  const out: number[][] = [];
  for (let r = 0; r < rounds; r++) {
    const acc = (finalFrac * (r + 1)) / rounds;
    const nCorrect = Math.round(acc * k);
    out.push(
      item.answer.map((correctIdx, i) => {
        if (i < nCorrect) return correctIdx;
        const optionCount = item.stimulus.trials[i].options.length;
        return (correctIdx + 1) % optionCount;
      }),
    );
  }
  return { signal: "glr", rounds: out, ...timing };
}

const DEFAULT_TIMING: ResponseTiming = { elapsedMs: 4_000 };

/** A fully-correct response to any administered item (test/engine helper). */
export function correctResponse(
  action: AdministerAction,
  timing: ResponseTiming = DEFAULT_TIMING,
): RawResponse {
  const item = action.item;
  switch (item.signal) {
    case "gf":
    case "gv":
      return mcCorrect(item, true, timing);
    case "ct":
      return ctResponse(item, true, timing);
    case "ef":
      return efResponse(item, true, timing);
    case "gsm":
      return gsmResponse(item, true, timing);
    case "gs":
      return gsResponse(item, 1, 0, false, timing);
    case "glr":
      return glrResponse(item, action.rounds ?? 2, 1, timing);
  }
}

/** A fully-wrong response to any administered item (test/engine helper). */
export function wrongResponse(
  action: AdministerAction,
  timing: ResponseTiming = DEFAULT_TIMING,
): RawResponse {
  const item = action.item;
  switch (item.signal) {
    case "gf":
    case "gv":
      return mcCorrect(item, false, timing);
    case "ct":
      return ctResponse(item, false, timing);
    case "ef":
      return efResponse(item, false, timing);
    case "gsm":
      return gsmResponse(item, false, timing);
    case "gs":
      return gsResponse(item, 0, 0, false, timing);
    case "glr":
      return glrResponse(item, action.rounds ?? 2, 0, timing);
  }
}

// ── Profile spec → response script ────────────────────────────────────────────

export interface Profile {
  label: string;
  age: number;
  sessionSeed: string;
  /** Pass-up-to level per laddered domain (correct iff administered level ≤ this). */
  ladder: Record<"gf" | "gv" | "ef" | "ct", number>;
  /** Pass-up-to forward span (backward is two steps harder). */
  gsmForward: number;
  gsFoundFrac: number;
  gsFalseTaps: number;
  gsMash: boolean;
  gsElapsedMs: number;
  glrFinalFrac: number;
  /** Base elapsed time (ms) for non-Gs items. */
  baseTimeMs: number;
  /** Force every answer under the too-fast threshold (invalid-session simulation). */
  forceFast?: boolean;
}

/** A typical-for-age laddered ability (passes its start level, misses above). */
function typicalLadder(age: number): Profile["ladder"] {
  const s = byAge(START_LEVEL_BY_AGE, age);
  return { gf: s, gv: s, ef: s, ct: s };
}

/** Build the deterministic response script for a profile. */
export function makeScript(profile: Profile): ResponseScript {
  return (action: AdministerAction): RawResponse => {
    const item = action.item;
    // Deterministic per-item jitter ⇒ realistic between-task time variability
    // (so attention reflects pacing, not a constant). Forced-fast overrides it.
    const timing = (ms: number): ResponseTiming => ({
      elapsedMs: profile.forceFast ? 200 : ms + (action.itemIndex % 3) * 700,
    });
    switch (item.signal) {
      case "gf":
      case "gv":
        return mcCorrect(
          item,
          (action.level ?? 0) <= profile.ladder[item.signal],
          timing(profile.baseTimeMs),
        );
      case "ct":
        return ctResponse(
          item,
          (action.level ?? 0) <= profile.ladder.ct,
          timing(profile.baseTimeMs),
        );
      case "ef":
        return efResponse(
          item,
          (action.level ?? 0) <= profile.ladder.ef,
          timing(profile.baseTimeMs),
        );
      case "gsm": {
        const cap =
          action.direction === "backward"
            ? profile.gsmForward - 2
            : profile.gsmForward;
        return gsmResponse(
          item,
          (action.spanLength ?? 0) <= cap,
          timing(profile.baseTimeMs),
        );
      }
      case "gs":
        return gsResponse(
          item,
          profile.gsFoundFrac,
          profile.gsFalseTaps,
          profile.gsMash,
          timing(profile.gsElapsedMs),
        );
      case "glr":
        return glrResponse(
          item,
          action.rounds ?? 2,
          profile.glrFinalFrac,
          timing(profile.baseTimeMs),
        );
    }
  };
}

/** Run + score a profile end-to-end. */
export function scoreProfile(profile: Profile): AssessmentResult {
  const state = startSession({
    sessionSeed: profile.sessionSeed,
    age: profile.age,
  });
  return finalize(runSession(state, makeScript(profile)));
}

// ── The five canonical profiles ───────────────────────────────────────────────

const base = (age: number, label: string, seed: string): Profile => ({
  label,
  age,
  sessionSeed: seed,
  ladder: typicalLadder(age),
  gsmForward: byAge(EXPECTED_FORWARD_SPAN_BY_AGE, age),
  gsFoundFrac: 0.65,
  gsFalseTaps: 1,
  gsMash: false,
  gsElapsedMs: 16_000,
  glrFinalFrac: 0.55,
  baseTimeMs: 4_000,
});

/** Logic-strong: aces Gf, typical elsewhere. */
export const logicStrong: Profile = {
  ...base(10, "logic-strong", "fixture-logic"),
  ladder: { ...typicalLadder(10), gf: 10 },
};

/** Spatial-strong: aces Gv, typical elsewhere. */
export const spatialStrong: Profile = {
  ...base(10, "spatial-strong", "fixture-spatial"),
  ladder: { ...typicalLadder(10), gv: 10 },
};

/** Flat/typical: solid-for-age across the board. */
export const flatTypical: Profile = base(9, "flat-typical", "fixture-flat");

/** Ceiling: aces everything at the top — sets ceiling markers. */
export const ceilingProfile: Profile = {
  ...base(13, "ceiling", "fixture-ceiling"),
  ladder: { gf: 10, gv: 10, ef: 10, ct: 10 },
  gsmForward: 99,
  gsFoundFrac: 1,
  gsFalseTaps: 0,
  gsElapsedMs: 8_000,
  glrFinalFrac: 1,
  baseTimeMs: 3_000,
};

/** Strong-invalid: every answer under the too-fast floor → strong verdict (+ Gs mashing). */
export const strongInvalid: Profile = {
  ...base(8, "strong-invalid", "fixture-invalid"),
  forceFast: true,
  gsMash: true,
};

/** The five canonical fixtures, in display order. */
export const PROFILES: readonly Profile[] = [
  logicStrong,
  spatialStrong,
  flatTypical,
  ceilingProfile,
  strongInvalid,
];
