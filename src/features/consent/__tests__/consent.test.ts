// @vitest-environment jsdom

/**
 * Phase 3.03a — the consent API over the storage adapter (spec §16.3, D-169/D-170).
 * `hasAnalyticsConsent()` is true ONLY for an explicit "accepted"; set/clear notify
 * subscribers so the banner + "manage cookies" control stay in sync. jsdom backs
 * the real localStorage. (The no-window / SSR path is covered in `consent-ssr.test.ts`.)
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearConsent,
  getConsent,
  hasAnalyticsConsent,
  setConsent,
  subscribeConsent,
} from "../consent";

afterEach(() => window.localStorage.clear());

describe("consent API (D-169 / D-170)", () => {
  it("is undecided with analytics OFF by default", () => {
    expect(getConsent()).toBeUndefined();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("'accepted' is the only decision that enables analytics consent", () => {
    setConsent("accepted");
    expect(getConsent()).toBe("accepted");
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("'declined' records the choice but leaves analytics OFF", () => {
    setConsent("declined");
    expect(getConsent()).toBe("declined");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("clearConsent withdraws the decision (→ undecided, analytics OFF)", () => {
    setConsent("accepted");
    expect(hasAnalyticsConsent()).toBe(true);
    clearConsent();
    expect(getConsent()).toBeUndefined();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("notifies subscribers on both set and clear", () => {
    const listener = vi.fn();
    const unsub = subscribeConsent(listener);
    setConsent("declined");
    clearConsent();
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    setConsent("accepted");
    expect(listener).toHaveBeenCalledTimes(2); // silent after unsubscribe
  });
});
