// @vitest-environment jsdom
/**
 * Lead-form integration tests (Phase 1.08). The React wiring the pure tests can't
 * reach: `form_view` fires on mount, an invalid submit (and a missing required
 * consent) surfaces inline errors WITHOUT calling the seams, and a valid submit
 * fires `lead_submit` with the city and advances the flow. Runs in jsdom; the
 * Select is left untouched (childGender is optional) to avoid portal machinery.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import messages from "../../../../../messages/mk.json";
import { scoreProfile, logicStrong } from "@/features/assessment/fixtures";
import type { LeadFormValues } from "@/features/lead";
import { trackEvent } from "@/lib/analytics";
import { LeadForm } from "../lead-form";

// Radix jsdom polyfills live in vitest.setup.ts (shared, env-guarded).

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

const RESULT = scoreProfile(logicStrong);

function renderForm(onSubmitted = vi.fn()) {
  render(
    <NextIntlClientProvider locale="mk" messages={messages}>
      <LeadForm result={RESULT} onSubmitted={onSubmitted} />
    </NextIntlClientProvider>,
  );
  return { onSubmitted };
}

function fillField(label: string | RegExp, value: string) {
  const el = screen.getByLabelText(label) as HTMLInputElement;
  fireEvent.change(el, { target: { value } });
  fireEvent.blur(el);
}

function tick(label: RegExp) {
  fireEvent.click(screen.getByLabelText(label));
}

beforeEach(() => vi.mocked(trackEvent).mockClear());
afterEach(() => cleanup());

describe("LeadForm — analytics on mount", () => {
  it("fires form_view exactly once on mount, with no other event", () => {
    renderForm();
    expect(trackEvent).toHaveBeenCalledWith("form_view");
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });
});

describe("LeadForm — invalid submit", () => {
  it("shows inline errors and does NOT call the seams", async () => {
    const { onSubmitted } = renderForm();
    fireEvent.click(
      screen.getByRole("button", { name: "Прикажи го резултатот" }),
    );

    // Required-field + required-consent errors all surface inline (role=alert).
    expect(await screen.findByText("Внесете име.")).toBeTruthy();
    expect(screen.getByText("Внесете е-пошта.")).toBeTruthy();
    expect(screen.getByText("Внесете телефон.")).toBeTruthy();
    expect(screen.getByText("Внесете град.")).toBeTruthy();
    expect(
      screen.getByText(
        "Потребна е согласност за да ви го испратиме извештајот.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Потврдете дека сте родител или старател."),
    ).toBeTruthy();

    expect(onSubmitted).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalledWith(
      "lead_submit",
      expect.anything(),
    );
  });

  it("with valid fields but unticked consents, only the consent errors block submit", async () => {
    const { onSubmitted } = renderForm();
    fillField("Име на родител", "Марија");
    fillField("Е-пошта", "marija@example.com");
    fillField("Телефон", "070 123 456");
    fillField("Град", "Скопје");
    fireEvent.click(
      screen.getByRole("button", { name: "Прикажи го резултатот" }),
    );

    expect(
      await screen.findByText(
        "Потребна е согласност за да ви го испратиме извештајот.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Внесете име.")).toBeNull();
    expect(onSubmitted).not.toHaveBeenCalled();
  });
});

describe("LeadForm — valid submit", () => {
  it("fires lead_submit with the city and advances with the validated values", async () => {
    const { onSubmitted } = renderForm();
    fillField("Име на родител", "  Марија  ");
    fillField("Е-пошта", "marija@example.com");
    fillField("Телефон", "+389 70 123 456");
    fillField("Град", "Скопје");
    tick(/да ги обработи внесените податоци/); // consentService
    tick(/Потврдувам дека сум родител/); // consentParent

    fireEvent.click(
      screen.getByRole("button", { name: "Прикажи го резултатот" }),
    );

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));

    const values = vi.mocked(onSubmitted).mock.calls[0][0] as LeadFormValues;
    expect(values.parentFirstName).toBe("Марија"); // trimmed by the schema
    expect(values.city).toBe("Скопје");
    expect(values.consentService).toBe(true);
    expect(values.consentParent).toBe(true);

    expect(trackEvent).toHaveBeenCalledWith("lead_submit", { city: "Скопје" });
  });
});
