// @vitest-environment jsdom
/**
 * Disclaimer component tests (Phase 1.10). The single §16.1 source must render
 * BOTH registers from `messages/mk.json` verbatim — `short` → `legal.disclaimerShort`,
 * `full` → `legal.disclaimer` — and must forward className/props so each placement
 * can theme it. `DISCLAIMER_KEYS` (consumed by the PDF copy-parity guard) must
 * point at real keys. This is the component ↔ mk.json half of the parity story;
 * the PDF ↔ mk.json half lives in `report/pdf/__tests__/disclaimer-parity`.
 */

import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import messages from "../../../../messages/mk.json";
import { Disclaimer, DISCLAIMER_KEYS } from "../disclaimer";

function renderDisclaimer(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="mk" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

afterEach(() => cleanup());

describe("Disclaimer — renders both registers from mk.json", () => {
  it("short renders legal.disclaimerShort verbatim", () => {
    const { container } = renderDisclaimer(<Disclaimer variant="short" />);
    expect(
      container.querySelector("[data-disclaimer='short']")?.textContent,
    ).toBe(messages.legal.disclaimerShort);
  });

  it("full renders legal.disclaimer verbatim", () => {
    const { container } = renderDisclaimer(<Disclaimer variant="full" />);
    expect(
      container.querySelector("[data-disclaimer='full']")?.textContent,
    ).toBe(messages.legal.disclaimer);
  });

  it("defaults to the short register", () => {
    const { container } = renderDisclaimer(<Disclaimer />);
    expect(
      container.querySelector("[data-disclaimer='short']")?.textContent,
    ).toBe(messages.legal.disclaimerShort);
  });

  it("the two registers carry different copy (no accidental aliasing)", () => {
    expect(messages.legal.disclaimer).not.toBe(messages.legal.disclaimerShort);
  });

  it("forwards className + arbitrary props onto the rendered <p>", () => {
    const { container } = renderDisclaimer(
      <Disclaimer variant="full" className="kit-cls" id="x" />,
    );
    const el = container.querySelector("p#x");
    expect(el).not.toBeNull();
    expect(el?.classList.contains("kit-cls")).toBe(true);
  });

  it("DISCLAIMER_KEYS resolve to the canonical legal-namespace strings", () => {
    expect(messages.legal[DISCLAIMER_KEYS.full]).toBe(
      messages.legal.disclaimer,
    );
    expect(messages.legal[DISCLAIMER_KEYS.short]).toBe(
      messages.legal.disclaimerShort,
    );
  });
});
