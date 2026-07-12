// @vitest-environment jsdom

/**
 * Phase 3.03a — the cookie banner (spec §16.1 placement #7 / §16.3). The React
 * wiring the store tests can't reach: it shows only while undecided, renders the
 * single-source short disclaimer + a locale-aware Privacy link, offers exactly two
 * equal real buttons with no dismiss-X, and each choice writes the decision +
 * hides the banner ("Accept all" flips analytics consent on, "Essential only"
 * leaves it off). jsdom + Testing Library; `@/i18n/navigation` is aliased to the
 * repo's jsdom-safe Link stub (renders a plain `<a>`).
 */

import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import messages from "../../../../messages/mk.json";
import {
  getConsent,
  hasAnalyticsConsent,
  setConsent,
} from "@/features/consent";
import { CookieBanner } from "../cookie-banner";

const ARIA_LABEL = messages.cookie.ariaLabel;

function renderBanner() {
  render(
    <NextIntlClientProvider locale="mk" messages={messages}>
      <CookieBanner />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("CookieBanner — visibility", () => {
  it("shows on first visit (no stored decision)", async () => {
    renderBanner();
    expect(
      await screen.findByRole("region", { name: ARIA_LABEL }),
    ).toBeTruthy();
  });

  it("stays hidden when a decision is already stored", async () => {
    setConsent("accepted");
    renderBanner();
    // Let the mount effect run, then confirm the banner never appears.
    await waitFor(() => expect(screen.queryByRole("region")).toBeNull());
  });
});

describe("CookieBanner — content & accessibility", () => {
  it("renders the heading, the short disclaimer, and a locale-aware Privacy link", async () => {
    renderBanner();
    await screen.findByRole("region", { name: ARIA_LABEL });

    expect(
      screen.getByRole("heading", { name: messages.cookie.heading }),
    ).toBeTruthy();
    // The short disclaimer is single-sourced from `legal.disclaimerShort` (§16.1 #7).
    expect(screen.getByText(messages.legal.disclaimerShort)).toBeTruthy();

    const link = screen.getByRole("link", {
      name: messages.cookie.privacyLink,
    });
    expect(link.getAttribute("href")).toBe("/politika-za-privatnost");
  });

  it("offers exactly two equal real buttons and NO dismiss-X", async () => {
    renderBanner();
    await screen.findByRole("region", { name: ARIA_LABEL });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    for (const b of buttons) expect(b.tagName).toBe("BUTTON");

    expect(
      screen.getByRole("button", { name: messages.cookie.accept }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: messages.cookie.decline }),
    ).toBeTruthy();
    // No close / dismiss affordance — a choice must be explicit (D-168).
    expect(
      screen.queryByRole("button", { name: /затвори|close|dismiss|×|✕|x/i }),
    ).toBeNull();
  });
});

describe("CookieBanner — decisions", () => {
  it("Accept all → stores 'accepted', turns analytics consent ON, hides the banner", async () => {
    renderBanner();
    await screen.findByRole("region", { name: ARIA_LABEL });

    fireEvent.click(
      screen.getByRole("button", { name: messages.cookie.accept }),
    );

    expect(getConsent()).toBe("accepted");
    expect(hasAnalyticsConsent()).toBe(true);
    await waitFor(() => expect(screen.queryByRole("region")).toBeNull());
  });

  it("Essential only → stores 'declined', leaves analytics OFF, hides the banner", async () => {
    renderBanner();
    await screen.findByRole("region", { name: ARIA_LABEL });

    fireEvent.click(
      screen.getByRole("button", { name: messages.cookie.decline }),
    );

    expect(getConsent()).toBe("declined");
    expect(hasAnalyticsConsent()).toBe(false);
    await waitFor(() => expect(screen.queryByRole("region")).toBeNull());
  });
});
