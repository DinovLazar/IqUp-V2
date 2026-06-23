/**
 * Submit-seam tests (Phase 1.08). The Part-1 stub does no network and resolves a
 * typed success; `runLeadSubmit` is the pure pipeline the form delegates to — it
 * must persist (submitLead) THEN fire `lead_submit` (city only) THEN advance,
 * with the validated values passed through unchanged.
 */

import { describe, expect, it, vi } from "vitest";
import {
  runLeadSubmit,
  submitLead,
  type LeadFormValues,
} from "@/features/lead";
import { scoreProfile, logicStrong } from "@/features/assessment/fixtures";

const RESULT = scoreProfile(logicStrong);

const VALUES: LeadFormValues = {
  parentFirstName: "Марија",
  email: "marija@example.com",
  phone: "070123456",
  city: "Скопје",
  childGender: undefined,
  consentService: true,
  consentParent: true,
  consentMarketing: false,
};

describe("submitLead (Part-1 stub)", () => {
  it("resolves a typed success without touching the network", async () => {
    await expect(submitLead(VALUES, RESULT)).resolves.toEqual({ ok: true });
  });
});

describe("runLeadSubmit pipeline", () => {
  it("calls submit with the validated values + result, then tracks, then advances", async () => {
    const order: string[] = [];
    const submit = vi.fn(async () => {
      order.push("submit");
      return { ok: true as const };
    });
    const track = vi.fn(() => {
      order.push("track");
    });
    const onSubmitted = vi.fn(() => {
      order.push("done");
    });

    await runLeadSubmit(VALUES, RESULT, { submit, track, onSubmitted });

    expect(submit).toHaveBeenCalledWith(VALUES, RESULT);
    expect(track).toHaveBeenCalledWith("lead_submit", { city: "Скопје" });
    expect(onSubmitted).toHaveBeenCalledWith(VALUES);
    // Persist before track before advance.
    expect(order).toEqual(["submit", "track", "done"]);
  });

  it("does not track or advance if the submit rejects", async () => {
    const submit = vi.fn(async () => {
      throw new Error("network down");
    });
    const track = vi.fn();
    const onSubmitted = vi.fn();

    await expect(
      runLeadSubmit(VALUES, RESULT, { submit, track, onSubmitted }),
    ).rejects.toThrow("network down");
    expect(track).not.toHaveBeenCalled();
    expect(onSubmitted).not.toHaveBeenCalled();
  });
});
