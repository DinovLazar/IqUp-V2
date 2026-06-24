/**
 * Email builder (Phase 2.02) — pure, no network, no `server-only`.
 *
 * Asserts every parent-facing string comes from `messages/mk.json` (`email.*`),
 * the footer disclaimer is the single-sourced `legal.disclaimer` (placement #5),
 * the CTA href === `buildBookingHref(city)`, the `{name}` greeting is interpolated
 * (and HTML-escaped), and the build is deterministic.
 */

import { describe, expect, it } from "vitest";

import { buildReportEmail } from "@/lib/brevo/email-template";
import { buildBookingHref } from "@/features/lead/cta";
import mk from "../../../../messages/mk.json";

const BOOKING_BASE = "https://booking.example.test";
const CITY = "Скопје";
const HREF = buildBookingHref(BOOKING_BASE, CITY);

function build(name = "Марија") {
  return buildReportEmail({ parentFirstName: name, bookingHref: HREF });
}

describe("buildReportEmail — copy comes from mk.json (Appendix D.3)", () => {
  it("uses the D.3 subject verbatim", () => {
    expect(build().subject).toBe(mk.email.subject);
  });

  it("puts the body, soft-CTA, button and sign-off in both html + text", () => {
    const { html, text } = build();
    for (const copy of [
      mk.email.body,
      mk.email.softCta,
      mk.email.button,
      mk.email.signOff,
    ]) {
      expect(html).toContain(copy);
      expect(text).toContain(copy);
    }
  });

  it("renders the IQ UP! wordmark from mk.json", () => {
    const { html, text } = build();
    expect(html).toContain(mk.email.wordmark);
    expect(text).toContain(mk.email.wordmark);
  });
});

describe("buildReportEmail — disclaimer placement #5 (single source)", () => {
  it("footer disclaimer === mk.legal.disclaimer, in html + text", () => {
    const { html, text } = build();
    expect(html).toContain(mk.legal.disclaimer);
    expect(text).toContain(mk.legal.disclaimer);
  });
});

describe("buildReportEmail — CTA href", () => {
  it("the button links to buildBookingHref(city)", () => {
    const { html, text } = build();
    expect(html).toContain(`href="${HREF}"`);
    expect(text).toContain(HREF);
  });
});

describe("buildReportEmail — greeting {name}", () => {
  it("interpolates the parent first name into the greeting", () => {
    const greeting = mk.email.greeting.replace("{name}", "Марија");
    expect(build("Марија").html).toContain(greeting);
    expect(build("Марија").text).toContain(greeting);
  });

  it("HTML-escapes the interpolated name (no injection)", () => {
    const { html } = build("A<b&c>");
    expect(html).toContain("A&lt;b&amp;c&gt;");
    expect(html).not.toContain("A<b&c>");
  });

  it("leaves no unresolved {name} placeholder", () => {
    const { html, text } = build();
    expect(html).not.toContain("{name}");
    expect(text).not.toContain("{name}");
  });
});

describe("buildReportEmail — determinism", () => {
  it("same inputs → deep-equal output", () => {
    expect(build("Ана")).toEqual(build("Ана"));
  });
});
