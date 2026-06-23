/**
 * Booking-href tests (Phase 1.08). `buildBookingHref` is pure and must attach the
 * city as a URL-encoded `?grad=` param — covering spaces and Cyrillic.
 */

import { describe, expect, it } from "vitest";
import { BOOKING_URL_PLACEHOLDER, buildBookingHref } from "@/features/lead";

describe("buildBookingHref", () => {
  it("appends ?grad= with the city", () => {
    expect(buildBookingHref("https://book.test", "Bitola")).toBe(
      "https://book.test?grad=Bitola",
    );
  });

  it("URL-encodes a city with a space", () => {
    expect(buildBookingHref("https://book.test", "Sveti Nikole")).toBe(
      "https://book.test?grad=Sveti%20Nikole",
    );
  });

  it("URL-encodes a Cyrillic city", () => {
    const href = buildBookingHref(BOOKING_URL_PLACEHOLDER, "Скопје");
    expect(href).toBe(
      "https://booking.example.invalid?grad=%D0%A1%D0%BA%D0%BE%D0%BF%D1%98%D0%B5",
    );
    // Round-trips back to the original city.
    expect(decodeURIComponent(href.split("grad=")[1])).toBe("Скопје");
  });

  it("is pure — same inputs, same output, no env read", () => {
    const a = buildBookingHref("https://x.test", "Охрид");
    const b = buildBookingHref("https://x.test", "Охрид");
    expect(a).toBe(b);
  });

  it("exposes a clearly non-real placeholder default", () => {
    expect(BOOKING_URL_PLACEHOLDER).toContain("example.invalid");
  });
});
