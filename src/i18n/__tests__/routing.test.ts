import { describe, expect, it } from "vitest";
import { hasLocale } from "next-intl";

import { routing, locales, defaultLocale } from "@/i18n/routing";

/**
 * Routing config (Feat-Serbian-Localization) — the single canonical source of the
 * enabled locales + URL policy. Asserts the owner decisions: exactly MK + SR, MK
 * the default served at the ROOT (as-needed prefix → SR under /sr), and locale
 * auto-detection OFF so `/` is deterministically Macedonian.
 */
describe("routing config", () => {
  it("enables exactly MK + SR (MK first), with MK the default", () => {
    expect([...locales]).toEqual(["mk", "sr"]);
    expect(defaultLocale).toBe("mk");
    expect([...routing.locales]).toEqual(["mk", "sr"]);
    expect(routing.defaultLocale).toBe("mk");
  });

  it("serves the default locale at the root (as-needed → MK at /, SR at /sr)", () => {
    expect(routing.localePrefix).toBe("as-needed");
  });

  it("disables locale auto-detection (/ stays deterministically MK)", () => {
    expect(routing.localeDetection).toBe(false);
  });

  it("validates locales with hasLocale", () => {
    expect(hasLocale(routing.locales, "mk")).toBe(true);
    expect(hasLocale(routing.locales, "sr")).toBe(true);
    expect(hasLocale(routing.locales, "de")).toBe(false);
    expect(hasLocale(routing.locales, undefined)).toBe(false);
  });
});
