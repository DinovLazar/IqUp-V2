/**
 * Production render seam (Phase 1.09) — turns a `ReportModel` into a PDF `Buffer`.
 *
 * This is the IO boundary: it registers the bundled Montserrat fonts, resolves the
 * booking URL (env or placeholder) into the `?grad={city}` href, and renders the
 * pure document tree to a buffer via `@react-pdf`'s `renderToBuffer`.
 *
 * 2.02 contract — the future `/api/report` route imports `renderReportPdf`
 * UNCHANGED: it assembles the `ReportModel` (1.07), calls
 * `renderReportPdf(model, { city })` with the parent's submitted city, and emails
 * the returned buffer as the attachment. The PDF is NEVER stored (spec Дел 14 —
 * the report is generated on demand, not persisted), and the buffer carries no PII.
 * `@react-pdf/renderer` is declared in `serverExternalPackages` (`next.config.ts`)
 * so it runs as a Node external rather than being bundled; the deploy must also
 * keep `src/features/report/pdf/fonts/*.ttf` in the function bundle (see `fonts.ts`).
 */

import { renderToBuffer } from "@react-pdf/renderer";

import { buildBookingHref, resolveBookingUrl } from "@/features/lead/cta";

import type { ReportModel } from "../types";
import { buildReportDocument } from "./document";
import { registerPdfFonts } from "./fonts";

export interface RenderReportOptions {
  /** Parent's submitted city → booking CTA `?grad={city}`. Omitted = no city. */
  city?: string;
  /** Override the booking base URL; defaults to `resolveBookingUrl()` (env/placeholder). */
  bookingUrl?: string;
}

/** Render a report `ReportModel` to a PDF `Buffer` (server-side). */
export async function renderReportPdf(
  model: ReportModel,
  options: RenderReportOptions = {},
): Promise<Buffer> {
  registerPdfFonts();
  const bookingUrl = options.bookingUrl ?? resolveBookingUrl();
  const bookingHref = buildBookingHref(bookingUrl, options.city ?? "");
  return renderToBuffer(buildReportDocument(model, { bookingHref }));
}
