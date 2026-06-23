/**
 * Montserrat registration for `@react-pdf/renderer` (Phase 1.09).
 *
 * This is an IO seam, not part of the pure document builder: it reads the bundled
 * TTF files from disk and registers them with `@react-pdf`. It is INDEPENDENT of
 * the web `next/font/google` pipeline — `@react-pdf` needs static TTFs (it cannot
 * use woff2), so we bundle OFL-licensed Montserrat TTFs in-repo (see `fonts/OFL.txt`).
 * If Cowork later ships a brand-tuned Montserrat, both pipelines swap then.
 *
 * Path resolution uses `process.cwd()` (the repo root under Vitest, the dump
 * script, and the Next server) — NOT `import.meta.url`, which would point at the
 * bundled location in a serverless build where the TTFs are not co-located. For
 * the 2.02 `/api/report` route, the deploy must also keep these files in the
 * function bundle (Next `outputFileTracingIncludes` for `src/features/report/pdf/
 * fonts/*.ttf`); `@react-pdf/renderer` is already declared in
 * `serverExternalPackages` (`next.config.ts`).
 */

import path from "node:path";
import { Font } from "@react-pdf/renderer";

import { PDF_FONT_FAMILY, PDF_FONT_WEIGHT } from "./theme";

const FONT_DIR = path.join(process.cwd(), "src/features/report/pdf/fonts");

/** Static Montserrat TTFs (Cyrillic + Latin) bundled in-repo, weight → file. */
const FONT_FILES: { file: string; weight: number }[] = [
  { file: "Montserrat-Regular.ttf", weight: PDF_FONT_WEIGHT.regular },
  { file: "Montserrat-Medium.ttf", weight: PDF_FONT_WEIGHT.medium },
  { file: "Montserrat-SemiBold.ttf", weight: PDF_FONT_WEIGHT.semibold },
  { file: "Montserrat-Bold.ttf", weight: PDF_FONT_WEIGHT.bold },
  { file: "Montserrat-ExtraBold.ttf", weight: PDF_FONT_WEIGHT.extrabold },
];

let registered = false;

/**
 * Register Montserrat with `@react-pdf` (idempotent — safe to call before every
 * render). Disables hyphenation so Macedonian words wrap whole, not mid-word.
 */
export function registerPdfFonts(): void {
  if (registered) return;
  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: FONT_FILES.map((f) => ({
      src: path.join(FONT_DIR, f.file),
      fontWeight: f.weight,
    })),
  });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
