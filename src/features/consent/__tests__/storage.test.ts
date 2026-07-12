// @vitest-environment jsdom

/**
 * Phase 3.03a — the cookie-consent localStorage adapter (spec §16.3 / Дел 14). It
 * round-trips a decision (date-only stamp, no PII), fails SOFT (⇒ null) for an
 * empty / corrupt / tampered / wrong-version blob, uses the versioned key, and owns
 * the same-tab + cross-tab change signal the banner subscribes to. jsdom supplies
 * `window.localStorage` and the DOM event bus.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CONSENT_STORAGE_KEY,
  clearStoredConsent,
  loadStoredConsent,
  notifyConsentChange,
  saveStoredConsent,
  subscribeConsentChange,
} from "../storage";

afterEach(() => window.localStorage.clear());

describe("consent storage adapter (§16.3 / Дел 14)", () => {
  it("uses the versioned key so a future schema bump ignores old blobs", () => {
    expect(CONSENT_STORAGE_KEY).toBe("iqup:cookie-consent:v1");
  });

  it("round-trips a decision with a date-only stamp and no extra keys", () => {
    saveStoredConsent("accepted");
    const stored = loadStoredConsent();
    expect(stored?.decision).toBe("accepted");
    expect(stored?.version).toBe(1);
    expect(stored?.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/); // never finer than a date
    expect(Object.keys(stored ?? {}).sort()).toEqual([
      "decidedAt",
      "decision",
      "version",
    ]);
  });

  it("returns null when nothing is stored", () => {
    expect(loadStoredConsent()).toBeNull();
  });

  it("returns null for corrupt JSON (fails soft)", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "{not json");
    expect(loadStoredConsent()).toBeNull();
  });

  it.each([
    ["unknown decision", { decision: "maybe", version: 1 }],
    ["wrong version", { decision: "accepted", version: 2 }],
    ["extra key (tampered)", { decision: "accepted", version: 1, evil: true }],
    [
      "fine-grained timestamp",
      { decision: "accepted", version: 1, decidedAt: "2026-07-12T10:00:00Z" },
    ],
  ])("returns null for an invalid blob: %s", (_label, blob) => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(blob));
    expect(loadStoredConsent()).toBeNull();
  });

  it("clear removes the decision", () => {
    saveStoredConsent("declined");
    clearStoredConsent();
    expect(loadStoredConsent()).toBeNull();
  });

  it("save fails soft when setItem throws (quota / disabled storage)", () => {
    const spy = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(() => saveStoredConsent("accepted")).not.toThrow();
    spy.mockRestore();
  });

  it("notifyConsentChange calls subscribers; unsubscribe stops them", () => {
    const listener = vi.fn();
    const unsub = subscribeConsentChange(listener);
    notifyConsentChange();
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
    notifyConsentChange();
    expect(listener).toHaveBeenCalledTimes(1); // no further calls after unsubscribe
  });

  it("reacts to a cross-tab storage event on the consent key only", () => {
    const listener = vi.fn();
    const unsub = subscribeConsentChange(listener);
    window.dispatchEvent(
      new StorageEvent("storage", { key: CONSENT_STORAGE_KEY }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: null })); // clear() in another tab
    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
  });
});
