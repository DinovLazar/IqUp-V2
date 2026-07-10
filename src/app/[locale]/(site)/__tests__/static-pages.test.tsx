// @vitest-environment jsdom
/**
 * Static (site) page tests (Phase 1.10). The three shells must be routable React
 * trees with a semantic H1 + their content: /za-testot shows the §1.1 what-is /
 * what-isn't sections AND the FULL §D.4 disclaimer (§16.1 placement #6);
 * /politika-za-privatnost and /uslovi show their H1 + the visible "pending legal
 * review" placeholder (final copy lands in Phase 3.03). The default exports are
 * async Server Components (Feat-Serbian-Localization: they take the `[locale]`
 * param + `setRequestLocale` for static rendering) — so they are await-called to
 * their element tree, then rendered under the next-intl provider.
 */

import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

// The async page components are Server Components: `setRequestLocale` writes to a
// per-request store the test renderer lacks, and `getTranslations` refuses to run
// outside an RSC. Stub both against the Macedonian bundle so the components resolve
// to their element tree (which is then rendered under the client provider below).
vi.mock("next-intl/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl/server")>();
  const { createTranslator } = await import("next-intl");
  const mk = (await import("../../../../../messages/mk.json")).default;
  return {
    ...actual,
    setRequestLocale: vi.fn(),
    getTranslations: async (arg?: string | { namespace?: string }) => {
      const namespace = typeof arg === "string" ? arg : arg?.namespace;
      return createTranslator({
        locale: "mk",
        messages: mk,
        namespace: namespace as never,
      });
    },
  };
});

import messages from "../../../../../messages/mk.json";
import ZaTestotPage from "../za-testot/page";
import PrivacyPolicyPage from "../politika-za-privatnost/page";
import TermsPage from "../uslovi/page";

type LocalePage = (props: {
  params: Promise<{ locale: string }>;
}) => Promise<ReactNode>;

async function renderPage(Page: LocalePage) {
  const ui = await Page({ params: Promise.resolve({ locale: "mk" }) });
  return render(
    <NextIntlClientProvider locale="mk" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

afterEach(() => cleanup());

describe("/za-testot (About the test) — placement #6", () => {
  it("renders its H1, intro, the full is/isn't lists, the note heading, and the FULL §D.4 disclaimer", async () => {
    await renderPage(ZaTestotPage);
    const about = messages.pages.about;
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      about.title,
    );
    expect(screen.getByText(about.intro)).toBeTruthy();
    expect(screen.getByText(about.isTitle)).toBeTruthy();
    expect(screen.getByText(about.isntTitle)).toBeTruthy();
    expect(screen.getByText(about.noteTitle)).toBeTruthy();
    // Every §1.1 list item renders (a regression that truncates a list is caught).
    for (const item of about.isItems)
      expect(screen.getByText(item)).toBeTruthy();
    for (const item of about.isntItems)
      expect(screen.getByText(item)).toBeTruthy();
    // The full §D.4 disclaimer (the shared component, full register) is present.
    expect(
      document.querySelector("[data-disclaimer='full']")?.textContent,
    ).toBe(messages.legal.disclaimer);
  });
});

describe("/politika-za-privatnost (Privacy) — pending shell", () => {
  it("renders its H1 + the pending-legal placeholder", async () => {
    await renderPage(PrivacyPolicyPage);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      messages.pages.privacy.title,
    );
    expect(screen.getByText(messages.pages.privacy.pending)).toBeTruthy();
  });
});

describe("/uslovi (Terms) — pending shell", () => {
  it("renders its H1 + the pending-legal placeholder", async () => {
    await renderPage(TermsPage);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      messages.pages.terms.title,
    );
    expect(screen.getByText(messages.pages.terms.pending)).toBeTruthy();
  });
});
