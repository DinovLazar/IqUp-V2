// @vitest-environment jsdom
/**
 * Confirmation integration tests (Phase 1.08). The final flow phase must render
 * the on-screen SUMMARY (pentagon + band rows + top strength), the "report sent
 * to email" line, the §D.2 data note + §D.4 disclaimer, and a booking CTA whose
 * href carries `?grad={city}` and whose click fires `cta_booking_click`. NO hard
 * number may appear. The strong-invalid fixture renders the graceful-retry view.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import messages from "../../../../../messages/mk.json";
import {
  scoreProfile,
  logicStrong,
  strongInvalid,
} from "@/features/assessment/fixtures";
import { trackEvent } from "@/lib/analytics";
import { Confirmation } from "../confirmation";

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

const PROFILE_RESULT = scoreProfile(logicStrong);
const RETRY_RESULT = scoreProfile(strongInvalid);

function renderConfirmation(result = PROFILE_RESULT, onRestart = vi.fn()) {
  const { container } = render(
    <NextIntlClientProvider locale="mk" messages={messages}>
      <Confirmation result={result} city="Скопје" onRestart={onRestart} />
    </NextIntlClientProvider>,
  );
  return { container, onRestart };
}

beforeEach(() => vi.mocked(trackEvent).mockClear());
afterEach(() => cleanup());

describe("Confirmation — profile variant", () => {
  it("renders the email line, the pentagon, all five band rows and the top strength", () => {
    renderConfirmation();
    expect(
      screen.getByText("Извештајот е пратен на вашата e-mail адреса."),
    ).toBeTruthy();
    // Pentagon (geometry only) is exposed as an image with the MK title.
    expect(screen.getByRole("img", { name: "Когнитивен профил" })).toBeTruthy();
    // All five index names appear (band rows).
    for (const label of [
      "Логичко мислење",
      "Просторно мислење",
      "Меморија и фокус",
      "Планирање и брзина",
      "Учење и STEM",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText("Најсилна страна")).toBeTruthy();
  });

  it("shows the §D.2 data note and the §D.4 disclaimer (shared full component, 1.10)", () => {
    const { container } = renderConfirmation();
    expect(screen.getByText(/Не ги чуваме резултатите од тестот/)).toBeTruthy();
    // The §D.4 disclaimer is the shared <Disclaimer variant="full"/> (placement #3).
    expect(
      container.querySelector("[data-disclaimer='full']")?.textContent,
    ).toBe(messages.legal.disclaimer);
  });

  it("shows NO hard number anywhere (word bands + ranges only, Дел 10.2)", () => {
    const { container } = renderConfirmation();
    expect(/\d/.test(container.textContent ?? "")).toBe(false);
  });

  it("builds the booking CTA with ?grad={city} and fires cta_booking_click on click", () => {
    renderConfirmation();
    const link = screen.getByRole("link");
    const href = link.getAttribute("href") ?? "";
    expect(href).toContain("?grad=");
    expect(decodeURIComponent(href.split("grad=")[1])).toBe("Скопје");

    // Don't let jsdom attempt real navigation.
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith("cta_booking_click", {
      city: "Скопје",
      source: "confirmation",
    });
  });
});

describe("Confirmation — graceful-retry variant", () => {
  it("renders the retry message + a Повтори affordance and no pentagon", () => {
    const { container, onRestart } = renderConfirmation(RETRY_RESULT);
    expect(screen.getByText("Ајде уште еднаш")).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Когнитивен профил" })).toBeNull();
    // The retry branch must also stay free of any hard number (Дел 10.2).
    expect(/\d/.test(container.textContent ?? "")).toBe(false);
    // Placement #3 also covers the retry branch — the full §D.4 disclaimer renders.
    expect(
      container.querySelector("[data-disclaimer='full']")?.textContent,
    ).toBe(messages.legal.disclaimer);

    const retry = screen.getByRole("button", { name: /Повтори/ });
    fireEvent.click(retry);
    expect(onRestart).toHaveBeenCalledTimes(1);
    // No booking CTA fires from the retry view.
    expect(trackEvent).not.toHaveBeenCalledWith(
      "cta_booking_click",
      expect.anything(),
    );
  });
});
