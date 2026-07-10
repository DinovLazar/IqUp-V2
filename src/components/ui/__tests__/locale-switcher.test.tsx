// @vitest-environment jsdom
/**
 * Locale switcher (Feat-Serbian-Localization). The shared, functional replacement
 * for the old inert MK/EN JSX: one control per enabled locale, the active one
 * marked NOT by colour alone (an `aria-current` + a check glyph), and a tap that
 * navigates to the equivalent route in the other locale.
 *
 * `@/i18n/navigation` is aliased to a jsdom-safe stub (vitest.config); its
 * `router.replace` is a shared spy this test inspects.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import mkMessages from "../../../../messages/mk.json";
import srMessages from "../../../../messages/sr.json";
// Import the spy from the stub's real path (not the `@/i18n/navigation` alias) so
// `tsc` resolves the `routerReplace` export; at runtime Vitest dedupes this to the
// same module the aliased switcher uses, so the spy captures its calls.
import { routerReplace } from "../../../../test/mocks/i18n-navigation";
import { LocaleSwitcher } from "../locale-switcher";

function renderSwitcher(locale: "mk" | "sr") {
  const messages = locale === "sr" ? srMessages : mkMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleSwitcher />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  routerReplace.mockClear();
});

describe("LocaleSwitcher", () => {
  it("renders one control per enabled locale, active marked (not colour-only)", () => {
    renderSwitcher("mk");
    const mk = screen.getByRole("button", { name: mkMessages.landing.langMk });
    const sr = screen.getByRole("button", { name: mkMessages.landing.langSr });
    expect(mk).toBeTruthy();
    expect(sr).toBeTruthy();
    // Active state carries a non-colour signal (aria-current); inactive does not.
    expect(mk.getAttribute("aria-current")).toBe("true");
    expect(sr.getAttribute("aria-current")).toBeNull();
  });

  it("switching to SR navigates to the equivalent route (keeps the current path)", () => {
    renderSwitcher("mk");
    fireEvent.click(
      screen.getByRole("button", { name: mkMessages.landing.langSr }),
    );
    expect(routerReplace).toHaveBeenCalledWith("/", { locale: "sr" });
  });

  it("clicking the already-active locale does not navigate", () => {
    renderSwitcher("mk");
    fireEvent.click(
      screen.getByRole("button", { name: mkMessages.landing.langMk }),
    );
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("under Serbian, SR is the active control (and MK switches back)", () => {
    renderSwitcher("sr");
    const sr = screen.getByRole("button", { name: srMessages.landing.langSr });
    expect(sr.getAttribute("aria-current")).toBe("true");
    fireEvent.click(
      screen.getByRole("button", { name: srMessages.landing.langMk }),
    );
    expect(routerReplace).toHaveBeenCalledWith("/", { locale: "mk" });
  });
});
