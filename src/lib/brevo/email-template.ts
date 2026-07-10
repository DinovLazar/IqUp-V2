/**
 * The branded transactional e-mail (Phase 2.02) — in-repo HTML + plain-text.
 *
 * `buildReportEmail({ parentFirstName, bookingHref })` is a PURE function: same
 * inputs → same `{ subject, html, text }`. It hosts §16.1 disclaimer placement #5
 * (the e-mail) from the single-sourced `legal.disclaimer`, and EVERY parent-facing
 * string comes from `messages/mk.json` (the Appendix D.3 copy under `email.*` +
 * the shared `legal.disclaimer`) — nothing user-facing is hardcoded here, so the
 * 1.10 single-source guard stays green.
 *
 * Brand-but-robust for e-mail clients: a table-based layout with INLINE styles
 * only (no external CSS, no `<style>` block, no web fonts), the palette expressed
 * as literal hex mirroring `globals.css` (the CTA button in brand violet `--pur`).
 * The PDF report rides along as an attachment (added by the route); this template
 * carries the copy + the booking CTA, not the report body.
 *
 * Why HTML in-repo (not a Brevo-hosted template): keeps all copy + markup in
 * version control and under the same i18n single-source rule as the rest of the app.
 */

import mk from "../../../messages/mk.json";
import sr from "../../../messages/sr.json";

/** Supported e-mail locales (Feat-Serbian-Localization). */
export type EmailLang = "mk" | "sr";
const MESSAGES = { mk, sr } as const;

/** Brand palette (literal hex; mirrors the `@theme` tokens in `globals.css`). */
const COLOR = {
  ink: "#231F26",
  muted: "#5E5862",
  bg: "#FAF8F4",
  surface: "#FFFFFF",
  pur: "#762D90",
  purInk: "#651E80",
  border: "#EAE6E0",
  borderPur: "#E4D7EC",
  tintPur: "#F4EFF7",
} as const;

const FONT_STACK =
  "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";

export interface ReportEmailInput {
  /** Parent's first name (no child name anywhere) — interpolated into the greeting. */
  parentFirstName: string;
  /** Booking CTA target — `buildBookingHref(resolveBookingUrl(), city)` (`?grad={city}`). */
  bookingHref: string;
  /** E-mail locale (Feat-Serbian-Localization) — matches the report locale; default `mk`. */
  lang?: EmailLang;
}

export interface ReportEmail {
  subject: string;
  html: string;
  text: string;
}

/** Minimal HTML-attribute/text escaper for the few interpolated values. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Resolve the `{name}` placeholder in the greeting with the (escaped) parent name. */
function greetingHtml(template: string, parentFirstName: string): string {
  return template.replace("{name}", escapeHtml(parentFirstName));
}

function greetingText(template: string, parentFirstName: string): string {
  return template.replace("{name}", parentFirstName);
}

/**
 * Build the transactional report e-mail in `lang` (Macedonian by default). Copy =
 * Appendix D.3 (`email.*`) + the single-sourced `legal.disclaimer` (placement #5),
 * from the locale's message bundle. The CTA links to `bookingHref`.
 */
export function buildReportEmail({
  parentFirstName,
  bookingHref,
  lang = "mk",
}: ReportEmailInput): ReportEmail {
  const m = MESSAGES[lang] ?? mk;
  const e = m.email;
  const disclaimer = m.legal.disclaimer;
  const hrefAttr = escapeHtml(bookingHref);

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(e.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLOR.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.bg};">
<tr>
<td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${COLOR.surface};border:1px solid ${COLOR.border};border-radius:16px;overflow:hidden;">
<tr>
<td style="padding:28px 32px 8px 32px;font-family:${FONT_STACK};">
<div style="font-size:24px;font-weight:800;letter-spacing:-0.01em;color:${COLOR.pur};">${escapeHtml(e.wordmark)}</div>
</td>
</tr>
<tr>
<td style="padding:8px 32px 0 32px;font-family:${FONT_STACK};">
<p style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:${COLOR.ink};">${greetingHtml(e.greeting, parentFirstName)}</p>
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${COLOR.ink};">${escapeHtml(e.body)}</p>
<p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${COLOR.muted};">${escapeHtml(e.softCta)}</p>
</td>
</tr>
<tr>
<td style="padding:0 32px 28px 32px;font-family:${FONT_STACK};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" bgcolor="${COLOR.pur}" style="border-radius:12px;">
<a href="${hrefAttr}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};font-size:16px;font-weight:700;color:${COLOR.surface};text-decoration:none;border-radius:12px;background-color:${COLOR.pur};">${escapeHtml(e.button)}</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:0 32px 28px 32px;font-family:${FONT_STACK};">
<p style="margin:0;font-size:15px;color:${COLOR.ink};">${escapeHtml(e.signOff)}</p>
</td>
</tr>
<tr>
<td style="padding:20px 32px 28px 32px;background-color:${COLOR.tintPur};border-top:1px solid ${COLOR.borderPur};font-family:${FONT_STACK};">
<p style="margin:0;font-size:12px;line-height:1.55;color:${COLOR.muted};">${escapeHtml(disclaimer)}</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const text = [
    e.wordmark,
    "",
    greetingText(e.greeting, parentFirstName),
    "",
    e.body,
    "",
    e.softCta,
    "",
    `${e.button}: ${bookingHref}`,
    "",
    e.signOff,
    "",
    "—",
    disclaimer,
  ].join("\n");

  return { subject: e.subject, html, text };
}
