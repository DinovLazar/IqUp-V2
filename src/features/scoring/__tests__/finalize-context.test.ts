/**
 * Phase 3.01 — `finalize(state, context)` threads the session context (parent
 * assist + device baseline) end-to-end into the §7.1 validity verdict, WITHOUT
 * touching the pure engine state and WITHOUT changing any index/score (the context
 * only modulates validity thresholds). Same state + no context ⇒ the 1.05 result.
 */

import { describe, expect, it } from "vitest";
import {
  runSession,
  startSession,
  type AdministerAction,
  type RawResponse,
  type ResponseScript,
} from "@/features/assessment";
import { correctResponse } from "@/features/assessment/fixtures";
import { finalize } from "..";

/** A script that answers every item correctly at a fixed raw elapsed time. */
const atElapsed =
  (elapsedMs: number): ResponseScript =>
  (action: AdministerAction): RawResponse =>
    correctResponse(action, { elapsedMs });

describe("finalize threads the device baseline (Дел 7.2, D-071)", () => {
  it("a slow-device session flips ok → strong once the baseline is supplied", () => {
    const seed = "ctx-device";
    const age = 10; // mid band — isolate the device effect from age modulation
    const state = runSession(
      startSession({ sessionSeed: seed, age }),
      atElapsed(900),
    );

    // No context: 900 ms > the absolute 500 ms floor ⇒ never too-fast.
    expect(finalize(state).validity.session).toBe("ok");

    // Slow device (baseline 500 ms ⇒ threshold 1250 ms): 900 ms is implausibly
    // fast RELATIVE to this device ⇒ every answer too-fast ⇒ strong.
    expect(finalize(state, { deviceBaselineMs: 500 }).validity.session).toBe(
      "strong",
    );
  });

  it("the device context changes ONLY validity (+ its downstream confidence) — never a score", () => {
    const state = runSession(
      startSession({ sessionSeed: "ctx-noperturb", age: 10 }),
      atElapsed(900),
    );
    const base = finalize(state);
    const withDevice = finalize(state, { deviceBaselineMs: 500 });

    // Raw scores + 0–100 indices are a function of answers alone — untouched.
    expect(withDevice.signals).toEqual(base.signals);
    for (const key of Object.keys(
      base.indices,
    ) as (keyof typeof base.indices)[]) {
      expect(withDevice.indices[key].value).toBe(base.indices[key].value);
      expect(withDevice.indices[key].band).toBe(base.indices[key].band);
    }

    // What DOES change is exactly the validity verdict and the confidence it
    // forces (a strong session ⇒ every index low) — the intended coupling.
    expect(base.validity.session).toBe("ok");
    expect(withDevice.validity.session).toBe("strong");
    for (const key of Object.keys(
      withDevice.indices,
    ) as (keyof typeof withDevice.indices)[]) {
      expect(withDevice.indices[key].confidence).toBe("low");
    }
  });
});

describe("finalize threads parent-assist (Дел 7.4)", () => {
  it("parentAssistMode threads through finalize into the verdict path", () => {
    // A 6-year-old answering every item at 300 ms is 100% too-fast — above BOTH
    // the young (0.45) and assisted (0.5) fractions — so it stays strong either
    // way. This proves finalize passes parentAssistMode into computeValidity; the
    // fraction FLIP at the young↔assisted boundary is proven at the computeValidity
    // level in validity-context.test.ts (a 50%-fast session held at age 6).
    const state = runSession(
      startSession({ sessionSeed: "ctx-assist", age: 6 }),
      atElapsed(300),
    );
    expect(finalize(state, { parentAssistMode: false }).validity.session).toBe(
      "strong",
    );
    expect(finalize(state, { parentAssistMode: true }).validity.session).toBe(
      "strong",
    );
  });

  it("determinism: same state + same context ⇒ deep-equal result", () => {
    const mk = () =>
      finalize(
        runSession(
          startSession({ sessionSeed: "ctx-determinism", age: 7 }),
          atElapsed(4_000),
        ),
        { parentAssistMode: true, deviceBaselineMs: 320 },
      );
    expect(mk()).toEqual(mk());
  });
});
