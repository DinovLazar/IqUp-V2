// @vitest-environment jsdom
/**
 * End-phase screen-wiring tests (Phase 1.08). The flow machine delegates the
 * completion → form → confirmation switch to `EndPhaseView`; this pins the guards
 * directly: completion renders the proceed affordance, the form needs the scored
 * result, the confirmation needs result + submitted leadValues (and the city
 * reaches the booking CTA), and a missing prerequisite falls back to completion.
 */

import type * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import messages from "../../../../../messages/mk.json";
import { scoreProfile, logicStrong } from "@/features/assessment/fixtures";
import type { LeadFormValues } from "@/features/lead";
import { EndPhaseView } from "../end-phase-view";

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

const RESULT = scoreProfile(logicStrong);
const LEAD: LeadFormValues = {
  parentFirstName: "Марија",
  email: "marija@example.com",
  phone: "070123456",
  city: "Битола",
  childGender: undefined,
  consentService: true,
  consentParent: true,
  consentMarketing: false,
};

function renderView(props: Partial<React.ComponentProps<typeof EndPhaseView>>) {
  const onProceed = props.onProceed ?? vi.fn();
  render(
    <NextIntlClientProvider locale="mk" messages={messages}>
      <EndPhaseView
        endPhase="completion"
        result={null}
        leadValues={null}
        onProceed={onProceed}
        onSubmitted={vi.fn()}
        onRestart={vi.fn()}
        {...props}
      />
    </NextIntlClientProvider>,
  );
  return { onProceed };
}

afterEach(() => cleanup());

describe("EndPhaseView", () => {
  it("completion: renders the reward + a proceed button that fires onProceed", () => {
    const { onProceed } = renderView({ endPhase: "completion" });
    const proceed = screen.getByRole("button", { name: "Земи го извештајот" });
    fireEvent.click(proceed);
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it("form (with result): renders the lead form", () => {
    renderView({ endPhase: "form", result: RESULT });
    expect(screen.getByText("Земете го бесплатниот извештај")).toBeTruthy();
  });

  it("form WITHOUT result: falls back to completion (guard)", () => {
    renderView({ endPhase: "form", result: null });
    expect(
      screen.getByRole("button", { name: "Земи го извештајот" }),
    ).toBeTruthy();
    expect(screen.queryByText("Земете го бесплатниот извештај")).toBeNull();
  });

  it("confirmation (result + leadValues): renders it and the city reaches the CTA href", () => {
    renderView({ endPhase: "confirmation", result: RESULT, leadValues: LEAD });
    expect(
      screen.getByText("Извештајот е пратен на вашата e-mail адреса."),
    ).toBeTruthy();
    const href = screen.getByRole("link").getAttribute("href") ?? "";
    expect(decodeURIComponent(href.split("grad=")[1])).toBe("Битола");
  });

  it("confirmation WITHOUT leadValues: falls back to completion (guard)", () => {
    renderView({ endPhase: "confirmation", result: RESULT, leadValues: null });
    expect(
      screen.getByRole("button", { name: "Земи го извештајот" }),
    ).toBeTruthy();
  });
});
