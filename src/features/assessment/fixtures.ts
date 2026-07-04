/**
 * Scripted-session fixtures — deterministic response + timing scripts that drive
 * the engine end-to-end. Used by the test suites and reusable by the report
 * engine (1.07) as canonical "five profiles → five reports" inputs.
 *
 * The model is an **ability threshold** per signal: a child reliably passes items
 * at or below their ability and fails above it. Under the v2 ladders that means
 * a per-signal LEVEL cap for the laddered domains (Gf, Gv, EF, CT, Glr) and a
 * SPAN cap for Corsi (backward ≈ forward — Kessels 2008). That yields realistic
 * adaptive paths that climb, floor, or stabilise — exactly what the report
 * engine needs to exercise. All timings are constants, so the whole thing stays
 * pure and reproducible.
 */

import {
  EXPECTED_FORWARD_SPAN_BY_AGE,
  byAge,
  startLevel,
} from "@/content/norms";
import { gsForAge } from "@/content/tasks";
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
  // Wrong picks rotate off the (uniformly-shuffled) key so scripted mistakes
  // spread across option positions — a fixture that always tapped slot 0 would
  // trip the same-position validity flag.
  optionIndex: correct ? item.answer : (item.answer + 1) % item.options.length,
  ...timing,
});

function ctResponse(
  item: CtItem,
  correct: boolean,
  timing: ResponseTiming,
): RawResponse {
  const { answer } = item;
  if (answer.kind === "optionIndex") {
    const optionCount =
      "options" in item.stimulus ? item.stimulus.options.length : 4;
    const chosen = correct ? answer.value : (answer.value + 1) % optionCount;
    return { signal: "ct", optionIndex: chosen, ...timing };
  }
  const chosen = correct ? answer.value : answer.value === 0 ? 1 : 0;
  return { signal: "ct", stepIndex: chosen, ...timing };
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
      return glrResponse(item, action.rounds ?? item.meta.trials, 1, timing);
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
      return glrResponse(item, action.rounds ?? item.meta.trials, 0, timing);
  }
}

// ── Profile spec → response script ────────────────────────────────────────────

export interface Profile {
  label: string;
  age: number;
  sessionSeed: string;
  /** Pass-up-to level per laddered domain (correct iff administered level ≤ this). */
  ladder: Record<"gf" | "gv" | "ef" | "ct" | "glr", number>;
  /** Pass-up-to span, both directions (Corsi backward ≈ forward). */
  gsmForward: number;
  gsFoundFrac: number;
  gsFalseTaps: number;
  gsMash: boolean;
  gsElapsedMs: number;
  /** Final-round recall accuracy for Glr items ABOVE the ability level. */
  glrFinalFrac: number;
  /** Base elapsed time (ms) for non-Gs items. */
  baseTimeMs: number;
  /** Force every answer under the too-fast threshold (invalid-session simulation). */
  forceFast?: boolean;
}

/** A typical-for-age ability: passes each signal's start level, misses above. */
function typicalLadder(age: number): Profile["ladder"] {
  return {
    gf: startLevel("gf", age),
    gv: startLevel("gv", age),
    ef: startLevel("ef", age),
    ct: startLevel("ct", age),
    glr: startLevel("glr", age),
  };
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
      case "gsm":
        return gsmResponse(
          item,
          (action.spanLength ?? 0) <= profile.gsmForward,
          timing(profile.baseTimeMs),
        );
      case "gs":
        return gsResponse(
          item,
          profile.gsFoundFrac,
          profile.gsFalseTaps,
          profile.gsMash,
          timing(profile.gsElapsedMs),
        );
      case "glr": {
        const rounds = action.rounds ?? item.meta.trials;
        const pass = (action.level ?? 0) <= profile.ladder.glr;
        return glrResponse(
          item,
          rounds,
          pass ? 1 : profile.glrFinalFrac,
          timing(profile.baseTimeMs),
        );
      }
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
  // A typical child uses the whole per-age window (throughput anchors assume it).
  gsElapsedMs: gsForAge(age).windowSec * 1000,
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
  ladder: { gf: 10, gv: 10, ef: 10, ct: 10, glr: 10 },
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
