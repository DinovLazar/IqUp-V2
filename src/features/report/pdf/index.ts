/**
 * Report PDF — public barrel (Phase 1.09).
 *
 * The branded, deterministic PDF rendering of a 1.07 `ReportModel`: a pure document
 * builder + the server-side render seam the future 2.02 `/api/report` route imports
 * unchanged. Sending/storing the PDF is out of scope — this only generates it.
 */

export {
  buildReportDocument,
  type BuildReportDocumentOptions,
} from "./document";
export { renderReportPdf, type RenderReportOptions } from "./render";
export { registerPdfFonts } from "./fonts";
export { PentagonPdf } from "./pentagon-pdf";
