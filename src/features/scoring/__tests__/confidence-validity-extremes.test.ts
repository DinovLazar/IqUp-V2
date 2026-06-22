import { describe, expect, it } from "vitest";
import type { ScoredSignal } from "@/content/norms";
import { generateItem } from "@/features/tasks";
import {
  runSession,
  startSession,
  type ResponseScript,
} from "@/features/assessment";
import { finalize } from "..";
import {
  computeConfidence,
  evidenceFromCount,
  evidenceFromGlrRounds,
  type Evidence,
} from "../confidence";
import { gradeItem } from "../grade";
import { computeValidity } from "../validity";
import {
  PROFILES,
  ceilingProfile,
  correctResponse,
  flatTypical,
  scoreProfile,
  strongInvalid,
  wrongResponse,
  type Profile,
} from "@/features/assessment/fixtures";
import { gradedItem } from "./helpers";

const ALL_HIGH: Record<ScoredSignal, Evidence> = {
  gf: 2,
  gv: 2,
  gsm: 2,
  gs: 2,
  ef: 2,
  glr: 2,
  ct: 2,
  attention: 2,
};

describe("confidence by domain (Дел 6.5)", () => {
  it("full evidence + valid session ⇒ every index high", () => {
    const c = computeConfidence(ALL_HIGH, { session: "ok", flags: [] });
    for (const k of Object.keys(c) as (keyof typeof c)[])
      expect(c[k]).toBe("high");
  });

  it("few items in a contributing domain ⇒ that index is low", () => {
    const c = computeConfidence(
      { ...ALL_HIGH, gf: 0 },
      { session: "ok", flags: [] },
    );
    expect(c.logic).toBe("low"); // logic = Gf
    expect(c.spatial).toBe("high");
  });

  it("random-level accuracy in a domain ⇒ that index is low (even with items)", () => {
    const c = computeConfidence(ALL_HIGH, {
      session: "mild",
      flags: [{ code: "random_accuracy", signal: "gf", severity: "mild" }],
    });
    expect(c.logic).toBe("low");
    expect(c.spatial).toBe("high");
  });

  it("a strong session verdict forces every index to low", () => {
    const c = computeConfidence(ALL_HIGH, {
      session: "strong",
      flags: [{ code: "too_fast", severity: "strong" }],
    });
    for (const k of Object.keys(c) as (keyof typeof c)[])
      expect(c[k]).toBe("low");
  });

  it("evidence thresholds map item / round counts correctly", () => {
    expect(evidenceFromCount(4)).toBe(2);
    expect(evidenceFromCount(3)).toBe(1);
    expect(evidenceFromCount(2)).toBe(0);
    expect(evidenceFromGlrRounds(3)).toBe(2);
    expect(evidenceFromGlrRounds(2)).toBe(1);
    expect(evidenceFromGlrRounds(1)).toBe(0);
  });

  it("profiles: ceiling ⇒ all high; strong-invalid ⇒ all low", () => {
    const ceil = scoreProfile(ceilingProfile);
    for (const k of Object.keys(ceil.indices) as (keyof typeof ceil.indices)[])
      expect(ceil.indices[k].confidence).toBe("high");
    const bad = scoreProfile(strongInvalid);
    for (const k of Object.keys(bad.indices) as (keyof typeof bad.indices)[])
      expect(bad.indices[k].confidence).toBe("low");
  });
});

describe("validity flags + verdict (Дел 7.1)", () => {
  it("> 30% too-fast ⇒ strong verdict", () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      gradedItem({
        signal: "gf",
        correct: true,
        tooFast: i < 4,
        rawElapsedMs: i < 4 ? 200 : 4_000,
        optionIndex: i % 4,
      }),
    );
    const v = computeValidity(items);
    expect(v.session).toBe("strong");
    expect(
      v.flags.some((f) => f.code === "too_fast" && f.severity === "strong"),
    ).toBe(true);
  });

  it("> 60% same option position ⇒ a (mild) flag", () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      gradedItem({
        signal: "gv",
        correct: true,
        optionIndex: i < 7 ? 0 : i - 6,
      }),
    );
    const v = computeValidity(items);
    expect(v.flags.some((f) => f.code === "same_position")).toBe(true);
    expect(v.session).toBe("mild");
  });

  it("many excluded idle pauses ⇒ a flag", () => {
    const items = [
      gradedItem({
        signal: "gf",
        correct: true,
        excludedIdleGaps: 2,
        optionIndex: 0,
      }),
      gradedItem({
        signal: "gf",
        correct: true,
        excludedIdleGaps: 2,
        optionIndex: 1,
      }),
      gradedItem({
        signal: "gf",
        correct: true,
        excludedIdleGaps: 0,
        optionIndex: 2,
      }),
    ];
    expect(
      computeValidity(items).flags.some((f) => f.code === "idle_pauses"),
    ).toBe(true);
  });

  it("Gs mashing ⇒ a Gs flag", () => {
    const items = [
      gradedItem({
        signal: "gs",
        gs: {
          found: 5,
          falseTaps: 18,
          targetCount: 6,
          tappedCount: 23,
          cellCount: 24,
        },
      }),
    ];
    const v = computeValidity(items);
    expect(
      v.flags.some((f) => f.code === "gs_mashing" && f.signal === "gs"),
    ).toBe(true);
  });

  it("a whole domain at chance ⇒ random_accuracy flag for that signal", () => {
    const items = Array.from({ length: 4 }, (_, i) =>
      gradedItem({ signal: "gf", correct: i === 0, optionIndex: i }),
    );
    const v = computeValidity(items);
    expect(
      v.flags.some((f) => f.code === "random_accuracy" && f.signal === "gf"),
    ).toBe(true);
  });

  it("clean responses ⇒ ok, no flags", () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      gradedItem({ signal: "gf", correct: true, optionIndex: i % 4 }),
    );
    const v = computeValidity(items);
    expect(v.session).toBe("ok");
    expect(v.flags).toHaveLength(0);
  });

  it("a strong session is clearly marked for 1.06 to gate on", () => {
    expect(scoreProfile(strongInvalid).validity.session).toBe("strong");
  });

  it("idle gaps are excluded from a graded item's effective time", () => {
    const item = generateItem({ signal: "gf", level: 5, seed: "idle-grade" });
    const graded = gradeItem(item, {
      signal: "gf",
      optionIndex: 0,
      elapsedMs: 40_000,
      idleGaps: [35_000],
    });
    expect(graded.effectiveTimeMs).toBe(5_000);
    expect(graded.excludedIdleGaps).toBe(1);
  });
});

describe("extremes (Дел 7.3)", () => {
  it("a top-out profile sets ceiling on signals + indices", () => {
    const r = scoreProfile(ceilingProfile);
    expect(r.signals.gf.ceiling).toBe(true);
    expect(r.indices.logic.ceiling).toBe(true);
    expect(r.indices.spatial.ceiling).toBe(true);
    expect(r.signals.gf.floor).toBe(false);
  });

  it("a bottom-out profile sets floor on signals + indices", () => {
    const floorProfile: Profile = {
      ...flatTypical,
      label: "floor",
      age: 5,
      sessionSeed: "floor-fixture",
      ladder: { gf: 0, gv: 0, ef: 0, ct: 0 },
      gsmForward: 0,
      gsFoundFrac: 0,
      gsFalseTaps: 0,
      glrFinalFrac: 0,
    };
    const r = scoreProfile(floorProfile);
    expect(r.signals.gf.floor).toBe(true);
    expect(r.indices.logic.floor).toBe(true);
    expect(r.signals.gsm.floor).toBe(true);
    expect(r.indices.memory.floor).toBe(true);
    expect(r.signals.gf.ceiling).toBe(false);
  });

  it("ceiling and floor are mutually exclusive on every signal + index (D-066)", () => {
    for (const p of PROFILES) {
      const r = scoreProfile(p);
      for (const s of Object.values(r.signals))
        expect(s.ceiling && s.floor).toBe(false);
      for (const idx of Object.values(r.indices))
        expect(idx.ceiling && idx.floor).toBe(false);
    }
  });

  it("Gsm: failing forward but acing backward is a ceiling, never also a floor", () => {
    // The pathological case: forward all-wrong (span 0) yet backward climbs to the
    // max span. Floor must NOT fire alongside the resulting ceiling.
    const script: ResponseScript = (a) => {
      if (a.signal === "gsm") {
        return a.direction === "backward"
          ? correctResponse(a)
          : wrongResponse(a);
      }
      return correctResponse(a);
    };
    const r = finalize(
      runSession(startSession({ sessionSeed: "gsm-edge", age: 13 }), script),
    );
    expect(r.signals.gsm.span?.forward).toBe(0);
    expect(r.signals.gsm.ceiling).toBe(true);
    expect(r.signals.gsm.floor).toBe(false);
  });
});
