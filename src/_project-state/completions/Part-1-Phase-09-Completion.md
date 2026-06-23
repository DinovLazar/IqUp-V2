# Part 1 · Phase 09 — Branded PDF report · Completion Report

**Phase:** Part 1 · Phase 09 — Branded PDF report
**Executing Claude:** Code
**Date completed:** 2026-06-23
**Branch:** `phase-1.09-pdf-report` (from `main`, PR #7 already merged — D-101)
**Commits:** _(filled at PR open)_
**PR:** _(filled at PR open)_

## What shipped

- **A pure, deterministic PDF document builder** (`src/features/report/pdf/`) that renders the full 1.07 `ReportModel` (spec Дел 10.3) — a branded puzzle-brain header, Part А (color-coded pentagon + five word/range bands + per-index confidence + top strength + growth area + solving style + per-index home activities), Part Б (STEM readiness + bridge), the IQ UP! positioning + program name, the clickable booking CTA, and the §D.4 disclaimer at the top + a fixed footer on every page. Handles both `ReportModel` variants: the normal profile and the strong-validity graceful-retry (no pentagon / no confident profile).
- **`renderReportPdf(model, { city }): Promise<Buffer>`** — the server-side render seam (via `@react-pdf`'s `renderToBuffer`) that the future 2.02 `/api/report` route imports unchanged (contract documented in `render.ts`). Sending/storing is fully out of scope — this only generates.
- **Bundled OFL Montserrat static TTFs** (weights 400/500/600/700/800, Cyrillic + Latin) registered with `@react-pdf` via a font seam — Macedonian Cyrillic (incl. Ѓѓ/Ќќ/Љљ/Њњ/Џџ/Ѕѕ/Јј) renders with no tofu.
- **A dev dump script** (`scripts/dump-report-pdf.ts`) that renders all five `fixtures.ts` profiles to a gitignored `./tmp/`, plus a Vitest suite (4 files): element-tree no-number + section-presence + retry assertions, non-empty buffers for all five fixtures, font glyph-coverage, and a purity scan.

## Decisions made on the fly

*Logged in `Decisions.md` (D-097…D-101); surfaced here for Chat → Lazar.*

1. **D-097 — Bundle OFL Montserrat static TTFs in-repo** and register with `@react-pdf`, independent of the web `next/font` pipeline. `@react-pdf` can't read woff2 and doesn't support the variable font; static TTFs are the only reliable Cyrillic path. Downside: ~2.2 MB of binary in a public repo.
2. **D-098 — `renderToBuffer` + dev dump script for QA**, not an in-browser `PDFViewer` (which can't exercise the server seam and bloats the app bundle).
3. **D-099 — PDF chrome strings in a new `reportPdf` namespace in `messages/mk.json`, imported statically** into the pure builder (reusing `legal.*`); keeps the builder pure/synchronous while all parent copy stays in the single i18n source.
4. **D-100 — §D.4 disclaimer at top + a fixed footer on every page; full report content** (incl. all-five per-index activities + the §D.2 data note) rendered from the model. The on-screen confirmation shows only the summary; the PDF is the full report.
5. **D-101 — Branched from `main`** (PR #7 merged), per the brief's own fallback (mirrors D-092).
6. *(Config)* **`next.config.ts` → `serverExternalPackages: ["@react-pdf/renderer"]`** added proactively so the 2.02 route works unchanged; harmless until then.

## Surprises / off-spec changes

- **`@react-pdf` SVG `<Text>` typings are incomplete** — they omit `fontSize`/`fontFamily`/`fontWeight` (the runtime supports them). Worked around with a single localized `SvgText` cast in `pentagon-pdf.tsx` (verified at runtime: Cyrillic vertex labels render). `fontkit` (transitive, untyped) needed a 1-line ambient `src/types/fontkit.d.ts` for the test only.
- **No app-route change.** Nothing imports the PDF module into the Next app in Part 1, so `next build` routes are unchanged (`/`, `/procena`, `/kit`, `/_not-found`). The module is exercised only by the dump script + tests (outside Next's bundler).
- **`npm audit`** reports 2 moderate advisories in `@react-pdf`'s transitive deps (server-side only; no route imports it in Part 1) — note for the 2.02 wiring phase.
- The document tree test **renders the pure, hook-free function components** (`type(props)`) to assert on the element tree (per the DoD: "assert on the element tree, not byte output"); a separate render test proves the real `renderToBuffer` path for all five fixtures.

## Files written / updated

**New:**
- `src/features/report/pdf/theme.ts` — pure PDF tokens (palette/surfaces, Montserrat family+weights, band/confidence maps)
- `src/features/report/pdf/fonts.ts` — `registerPdfFonts()` IO seam (idempotent)
- `src/features/report/pdf/pentagon-pdf.tsx` — pure `@react-pdf` SVG pentagon over `@/lib/pentagon`
- `src/features/report/pdf/document.tsx` — the pure `buildReportDocument(model, { bookingHref })`
- `src/features/report/pdf/render.ts` — `renderReportPdf(model, { city })` (the 2.02 seam)
- `src/features/report/pdf/index.ts` — barrel
- `src/features/report/pdf/fonts/Montserrat-*.ttf` (×5) + `fonts/OFL.txt` — bundled OFL fonts
- `src/features/report/pdf/__tests__/{document,render,fonts,purity}.test.ts` — Vitest suite
- `src/types/fontkit.d.ts` — ambient types for the font test
- `scripts/dump-report-pdf.ts` — dev dump of all five fixtures → `./tmp/`

**Modified:**
- `messages/mk.json` — new `reportPdf` namespace (PDF chrome)
- `next.config.ts` — `serverExternalPackages: ["@react-pdf/renderer"]`
- `package.json` / `package-lock.json` — `@react-pdf/renderer` 4.5.1 (exact)
- `.gitignore` — `/tmp`; `.prettierignore` — `*.ttf`, fonts `OFL.txt`, `/tmp`
- `src/_project-state/{current-state,file-map,00_stack-and-config}.md` — synced
- `Decisions.md` — D-097…D-101

## Tests run + results

- `npm run typecheck` ✓ · `npm run lint` ✓ (0 problems) · `npm run build` ✓ (routes unchanged) · `npm test` ✓ (**35 files, 232 tests** — +23 over 1.08's 209) · `npm run format:check` ✓.
- **Visual QA** via `npx tsx scripts/dump-report-pdf.ts` + `pymupdf` rasterization: all five fixtures render — four 2-page profiles + the 1-page strong-invalid retry; Macedonian Cyrillic (incl. MK-specific letters) renders with no tofu; pentagon + brain motif color-coded; CTA link carries `?grad={city}`; §D.4 at top + footer. A header title/subtitle overlap caught in this pass was fixed (explicit line-heights), and a near-empty 3rd page was eliminated (tightened spacing → 2 pages).
- **Internal adversarial review pass** (CodeRabbit/Codex still unconnected): a 5-dimension multi-agent review (purity/determinism, no-number/two-register, content-completeness, edge-cases/correctness, test-quality/reuse) with adversarial verification of each finding — 8 raw findings, 6 confirmed, **0 must-fix, 3 should-fix, 3 nits**. The three should-fix items were fixed + regression-tested:
  1. **Fixed-footer clearance** — `page.paddingBottom` bumped 56 → 72 so a future disclaimer line-wrap can't draw over trailing content (still 2 pages).
  2. **Font-coverage test under-asserted Latin** — added the STEM capitals (S/T/E/M) + `!`/`?` to the `fonts.test.ts` glyph set.
  3. **Duplicated band/confidence maps had no sync guard** — exported `BAND_FILL` (index-band-bar) + `CONFIDENCE` (confidence-label) as the single source and added `theme.test.ts` asserting the PDF maps equal them (drift now breaks the build).
  Nits: added a builder **determinism** test (same model → identical tree); de-overclaimed a render-test comment; left the i18n `ctaFallback` ("Закажи бесплатен демо час") as-is — it matches the report engine's own fallback module and the app's voice (the engine always supplies `model.cta.text` anyway).

## Blocked / carryover

- [ ] **Sending the PDF (email/Brevo) is Phase 2.02** — `renderReportPdf` is ready to import unchanged; the deploy must also keep `src/features/report/pdf/fonts/*.ttf` in the function bundle (Next `outputFileTracingIncludes`).
- [ ] **Real booking URL** still a pending Cowork asset — the CTA uses `NEXT_PUBLIC_BOOKING_URL` (placeholder) via `buildBookingHref`.
- [ ] **Class-photo slot** intentionally omitted (asset pending Cowork) — can be added without API change when it lands.
- [ ] **Shared "informative, not diagnostic" component + 7-placement audit is Phase 1.10** — the PDF uses the static canonical §D.4 text (consistent with 1.08/landing).
- [ ] `npm audit` — 2 moderate advisories in `@react-pdf` transitive deps; revisit at 2.02.

## What's next

**Phase 1.10** — the shared "informative, not diagnostic" disclaimer component + the 7-placement audit (landing footnote, pre-start, results, PDF top + bottom, email, About-the-test, cookie banner). The PDF already places the §D.4 text top + bottom, ready to adopt the shared component when it lands.

---
*IqUp-V2 | Part 1 · Phase 09 Completion | 2026-06-23*
