/**
 * End-phase controller tests (Phase 1.08). The post-assessment sequence is a pure
 * controller so the screens stay a thin React layer (resolved-decision 1): the
 * flow must walk completion → form → confirmation and rest at confirmation.
 */

import { describe, expect, it } from "vitest";
import { advanceEndPhase, END_PHASE_ORDER } from "@/features/assessment";

describe("advanceEndPhase", () => {
  it("walks completion → form → confirmation", () => {
    expect(advanceEndPhase("completion")).toBe("form");
    expect(advanceEndPhase("form")).toBe("confirmation");
  });

  it("rests at confirmation (terminal)", () => {
    expect(advanceEndPhase("confirmation")).toBe("confirmation");
  });

  it("exposes the canonical order", () => {
    expect(END_PHASE_ORDER).toEqual(["completion", "form", "confirmation"]);
  });

  it("a full walk from completion reaches confirmation in two steps", () => {
    const a = advanceEndPhase("completion");
    const b = advanceEndPhase(a);
    expect([a, b]).toEqual(["form", "confirmation"]);
  });
});
