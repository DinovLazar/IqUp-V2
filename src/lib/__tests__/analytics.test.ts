/**
 * Phase 3.03a — the analytics consent gate (spec §16.3, D-169). `trackEvent` must
 * consult `hasAnalyticsConsent()` FIRST and short-circuit before the forward body
 * whenever consent is not "accepted". The consent module is mocked so the gate is
 * exercised in isolation; `analyticsForwarder.forward` is the internal seam the
 * gate guards (and the single place Phase 2.03 fills with the GA4/Meta push).
 * Node environment — no DOM needed, consent is mocked.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { hasAnalyticsConsent } from "@/features/consent";
import { analyticsForwarder, trackEvent } from "@/lib/analytics";

vi.mock("@/features/consent", () => ({ hasAnalyticsConsent: vi.fn() }));

const consent = vi.mocked(hasAnalyticsConsent);

afterEach(() => {
  vi.restoreAllMocks();
  consent.mockReset();
});

describe("trackEvent consent gate (D-169)", () => {
  it("does NOT forward when consent is undecided / declined", () => {
    consent.mockReturnValue(false);
    const forward = vi.spyOn(analyticsForwarder, "forward");

    trackEvent("form_view");
    trackEvent("lead_submit", { city: "Скопје" });
    trackEvent("cta_booking_click", { city: "Скопје", source: "results" });

    expect(consent).toHaveBeenCalled();
    expect(forward).not.toHaveBeenCalled();
  });

  it("forwards the event once consent is 'accepted'", () => {
    consent.mockReturnValue(true);
    const forward = vi.spyOn(analyticsForwarder, "forward");

    trackEvent("lead_submit", { city: "Скопје" });

    expect(forward).toHaveBeenCalledTimes(1);
    expect(forward).toHaveBeenCalledWith("lead_submit", { city: "Скопје" });
  });

  it("checks consent BEFORE forwarding (the gate is the first thing)", () => {
    const order: string[] = [];
    consent.mockImplementation(() => {
      order.push("gate");
      return false;
    });
    vi.spyOn(analyticsForwarder, "forward").mockImplementation(() => {
      order.push("forward");
    });

    trackEvent("form_view");

    expect(order).toEqual(["gate"]); // never reached "forward"
  });
});
