// @vitest-environment jsdom
/**
 * Placement wiring coverage (Phase 1.10) for the two §16.1 hosts the other suites
 * don't reach: #2 pre-start (a render assertion) and #1 the landing footnote.
 *
 * The other wired placements are already render-guarded — #3 confirmation
 * (confirmation.test.tsx, both branches), #4 PDF (document.test.ts +
 * disclaimer-parity.test.ts), #6 About (static-pages.test.tsx). The single-source
 * guard only proves NO hardcoded copy survives; it cannot catch a host that
 * deleted `<Disclaimer/>` or swapped its register — that's what this file pins.
 *
 * The landing page is an async Server Component using `getTranslations`, which has
 * no request scope under Vitest, so it can't be unit-rendered; its wiring is held
 * by a source assertion (the rendered output is verified in the browser + by the
 * component test). The pre-start screen is a client component, so it renders here.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import messages from "../../../../../messages/mk.json";
import { PrestartScreen } from "../procena/prestart-screen";

afterEach(() => cleanup());

describe("§16.1 placement #2 — pre-start screen renders the shared short Disclaimer", () => {
  it('renders <Disclaimer variant="short"> verbatim from mk.json', () => {
    const { container } = render(
      <NextIntlClientProvider locale="mk" messages={messages}>
        <PrestartScreen age={8} onStart={vi.fn()} />
      </NextIntlClientProvider>,
    );
    const el = container.querySelector("[data-disclaimer='short']");
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe(messages.legal.disclaimerShort);
  });
});

describe("§16.1 placement #1 — landing footnote wires the shared short Disclaimer", () => {
  it('the landing page source renders <Disclaimer variant="short"> (async RSC, source-guarded)', () => {
    const src = readFileSync(
      join(process.cwd(), "src/app/[locale]/(site)/page.tsx"),
      "utf8",
    );
    expect(src).toContain("import { Disclaimer }");
    expect(src).toMatch(/<Disclaimer\s+variant="short"/);
    // And it does NOT fall back to a removed namespaced key.
    expect(src).not.toContain('t("disclaimer")');
  });
});
