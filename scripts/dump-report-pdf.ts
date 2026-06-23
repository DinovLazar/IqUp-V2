/**
 * Render every `fixtures.ts` profile through the report engine → the PDF, and write
 * the results to a gitignored local folder (`./tmp/`) for visual QA. Mirrors
 * `scripts/dump-tasks.ts`. The Vitest suite, not this script, is the real gate.
 *
 * Run:  npx tsx scripts/dump-report-pdf.ts
 *       npx tsx scripts/dump-report-pdf.ts Скопје   # CTA city for the ?grad= link
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { PROFILES, scoreProfile } from "../src/features/assessment/fixtures";
import { assembleReport } from "../src/features/report";
import { renderReportPdf } from "../src/features/report/pdf";

const OUT_DIR = join(process.cwd(), "tmp");

async function main() {
  const city = process.argv[2] ?? "Скопје";
  mkdirSync(OUT_DIR, { recursive: true });
  for (const profile of PROFILES) {
    const model = assembleReport(scoreProfile(profile));
    const buffer = await renderReportPdf(model, { city });
    const file = join(OUT_DIR, `report-${profile.label}.pdf`);
    writeFileSync(file, buffer);
    console.log(
      `${profile.label.padEnd(16)} ${model.variant.padEnd(8)} ${String(
        buffer.length,
      ).padStart(7)} bytes → ${file}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
