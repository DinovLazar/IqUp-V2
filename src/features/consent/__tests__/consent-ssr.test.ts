/**
 * Phase 3.03a — SSR safety (no `window`). On the server the consent API must read
 * "no decision" with analytics OFF, and its writers + subscription must be harmless
 * no-ops that never throw. Runs in the DEFAULT Node environment (no jsdom docblock),
 * where `window` is undefined — the exact condition during server rendering.
 */

import { describe, expect, it } from "vitest";

import {
  clearConsent,
  getConsent,
  hasAnalyticsConsent,
  setConsent,
  subscribeConsent,
} from "../consent";

describe("consent API — SSR-safe (no window)", () => {
  it("runs without a window (the SSR condition)", () => {
    expect(typeof window).toBe("undefined");
  });

  it("reads undecided with analytics OFF", () => {
    expect(getConsent()).toBeUndefined();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("writers + subscribe are harmless no-ops that never throw", () => {
    expect(() => setConsent("accepted")).not.toThrow();
    expect(() => clearConsent()).not.toThrow();
    const unsub = subscribeConsent(() => {});
    expect(typeof unsub).toBe("function");
    expect(() => unsub()).not.toThrow();
    // Nothing was persisted server-side — still off.
    expect(hasAnalyticsConsent()).toBe(false);
  });
});
