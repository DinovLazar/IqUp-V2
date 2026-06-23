# IqUp-V2 — File Map

> A living map of every file in the repo with a one-line description. **Claude Code maintains this:** when you add, move, or delete a file, update this map in the same phase. Keep entries to one line each, grouped by folder, in path order.
>
> Lives at `src/_project-state/file-map.md`.

*Empty at kickoff — the repo hasn't been scaffolded yet. Phase 1.01 seeds this with the initial tree.*

## Format

```
path/to/file.ext — one-line description of what it does
```

## Map

**Project root docs (placed at kickoff):**
- `CLAUDE.md` — repo rules any Claude/agent reads first
- `AGENTS.md` — short cross-agent mirror of CLAUDE.md
- `project-instructions.md` — orchestrator rulebook (Claude Chat)
- `plan.md` — target master spec
- `phase-plan.md` — phase index
- `brand.md` — brand guide
- `Decisions.md` — append-only decision log
- `notion-checklist.md` — paste-into-Notion phase checklist

**Root config & housekeeping (Phase 1.01):**
- `README.md` — short project readme + how to run locally
- `.gitignore` — Next.js defaults + `.env*` (keeps `*.example`) + `.DS_Store` + `/tmp` (1.09 PDF QA output)
- `.env.local.example` — env variable shapes only (no secrets); real keys live in Vercel; `NEXT_PUBLIC_BOOKING_URL` documented (1.08, non-secret placeholder)
- `.coderabbit.yaml` — CodeRabbit auto-review config (live once the app is connected)
- `package.json` / `package-lock.json` — deps + scripts (dev/build/start/lint/typecheck/format)
- `tsconfig.json` — TypeScript config (strict)
- `next.config.ts` — Next config wrapped with the next-intl plugin; +1.09: `serverExternalPackages: ["@react-pdf/renderer"]` for the 2.02 `/api/report` route
- `next-env.d.ts` — Next-generated types (gitignored content; file tracked)
- `postcss.config.mjs` — PostCSS → `@tailwindcss/postcss` (Tailwind v4)
- `eslint.config.mjs` — ESLint flat config (Next core-web-vitals + TS)
- `.prettierrc.json` — Prettier + `prettier-plugin-tailwindcss`
- `.prettierignore` — excludes deps/build/lockfile/PDF/Markdown; +1.09: `*.ttf`, the fonts `OFL.txt`, `/tmp`
- `components.json` — shadcn/ui config (radix lib, Nova preset, neutral, Lucide)
- `vitest.config.ts` — Vitest config: node env (default) + `@/` alias; includes `src/**/*.test.ts` **and** `*.test.tsx` (1.08 jsdom tests opt in per-file via a `@vitest-environment jsdom` docblock); `setupFiles: vitest.setup.ts`
- `vitest.setup.ts` — env-guarded jsdom polyfills for Radix (ResizeObserver / pointer-capture / scrollIntoView); no-op under the Node suites (1.08)

**Docs:**
- `docs/design-handovers/.gitkeep` — reserved for Design handovers
- `docs/design-handovers/Part-1-Phase-02-Handover.md` — 1.02 design handover (visual source of truth for 1.03/1.06/1.07)
- `docs/ai-review-setup.md` — one-time CodeRabbit + Codex connect runbook (for Cowork)

**i18n:**
- `messages/mk.json` — Macedonian strings; +1.08: `leadForm` (labels + error tokens), `confirmation`, shared `legal` (verbatim Прилог D.2 data note + D.4 disclaimer), `complete.toForm`; +1.09: `reportPdf` (PDF chrome: wordmark/titles/part banners/section labels/confidence words; reuses `legal`); +1.10: `legal.disclaimerShort` (the §16.1 short line — single source), `pages` (about/privacy/terms copy), `common.home`; **removed** the duplicate `landing.disclaimer` + `prestart.disclaimer` short keys
- `src/i18n/request.ts` — next-intl request config (locale `mk`, no routing yet)

**App (routes + backend):**
- `src/app/layout.tsx` — root layout; loads Montserrat via `next/font`, sets `<html lang>` + font var, wraps in `NextIntlClientProvider`
- `src/app/globals.css` — Tailwind v4 entry + **brand `@theme`** (all design tokens; shadcn semantic tokens mapped to brand; no dark mode)
- `src/app/favicon.ico` — placeholder favicon (rebranded later)
- `src/app/(site)/page.tsx` — **real landing** (1.06): brand hero, value message, MK/EN switch (MK active), dashed photo placeholders, "Започни проценка" → `/procena`; +1.10: footnote = the shared `<Disclaimer variant="short">` (§16.1 placement #1)
- `src/app/(site)/procena/page.tsx` — assessment route (server); renders the client `Assessment` (1.06)
- `src/app/(site)/procena/assessment.tsx` — client flow state machine: setup → pre-start → practice/real (on the 1.05 engine) → completion → **form → confirmation** (1.08, `advanceEndPhase`); finalizes the result once + assembles the report once; session seed + `parentAssistMode` (inert); nothing persisted (1.06/1.08)
- `src/app/(site)/procena/setup-screen.tsx` — age gate 5–13 (<5/>13 blocked, MK message; `noValidate`); no child name (1.06)
- `src/app/(site)/procena/prestart-screen.tsx` — instructions + mandatory 5–7 parent screen + confirmation checkbox; +1.10: the shared `<Disclaimer variant="short">` (§16.1 placement #2)
- `src/app/(site)/procena/completion-screen.tsx` — "Тестот е завршен" + assembled puzzle-brain + reward badge; +1.08: optional `onProceed` primary button to the lead form
- `src/app/(site)/procena/lead-form.tsx` — **lead form (1.08)**: RHF + Zod resolver over the 1.03 primitives; 8 fields (first name only), 3 separate never-pre-ticked consents, inline errors, `form_view` on mount; `CityField` swap-seam; preview seams (`autoValidate`/`defaultValues`)
- `src/app/(site)/procena/confirmation.tsx` — **confirmation (1.08)**: renders `selectReportSummary` (pentagon + 5 bands + top strength, no number), email-sent line, §D.2 data note, booking CTA (`?grad={city}` + `cta_booking_click`); graceful-retry variant; +1.10: §D.4 = the shared `<Disclaimer variant="full">` (§16.1 placement #3, both branches)
- `src/app/(site)/procena/end-phase-view.tsx` — the completion → form → confirmation screen switch (1.08), split out of the flow machine so its guards are unit-testable
- `src/app/(site)/procena/__tests__/{lead-form,confirmation,end-phase-view}.test.tsx` — jsdom + Testing Library (1.08): `form_view` on mount, inline validation + missing-consent errors, valid-submit seam wiring; confirmation summary render (no number, both variants) + CTA href/`cta_booking_click`; end-phase screen-wiring guards
- `src/app/(site)/page-shell.tsx` — shared chrome for the static pages (1.10): wordmark + back-to-home header + centered content column (sync Server Component)
- `src/app/(site)/za-testot/page.tsx` — **About-the-test (1.10)**: §16.1 placement #6 — §1.1 "what it is / what it isn't" + the FULL shared `Disclaimer`; MK `metadata` + H1
- `src/app/(site)/politika-za-privatnost/page.tsx` — **Privacy (1.10)**: routable shell (resolves the consent link); H1 + "pending legal review" placeholder (final copy = Phase 3.03)
- `src/app/(site)/uslovi/page.tsx` — **Terms (1.10)**: routable shell; H1 + "pending legal review" placeholder (final copy = Phase 3.03)
- `src/app/(site)/__tests__/static-pages.test.tsx` — jsdom (1.10): each static page renders its H1 + content; About shows the full §D.4 disclaimer
- `src/app/(site)/__tests__/disclaimer-single-source.test.ts` — node (1.10): no production `.ts/.tsx` hardcodes the disclaimer copy; each canonical string appears once in `mk.json`
- `src/app/(site)/__tests__/disclaimer-placements.test.tsx` — jsdom (1.10): placement #2 (pre-start) render guard + placement #1 (async landing RSC) source-wiring guard
- `src/app/kit/page.tsx` — dev-only UI-kit gallery route (noindex; 404 on production); renders `KitGallery`
- `src/app/kit/kit-gallery.tsx` — client gallery: every component + state, pentagon samples, puzzle-brain across progress; +1.06: every task renderer (live), answer-option states, idle nudge, reward badge; +1.07: the report-engine preview section; **+1.08: the lead-form + confirmation preview section**
- `src/app/kit/report-preview.tsx` — dev-only report preview (1.07): all five `fixtures.ts` profiles assembled through `assembleReport` (pentagon + bands + Part А/Б + positioning + CTA; retry + ceiling variants; static Прилог D.4 disclaimer placeholder)
- `src/app/kit/lead-preview.tsx` — dev-only lead preview (1.08): the form in three states (empty / validation-error / missing-consent, via the `autoValidate`/`defaultValues` seams) + the confirmation from a `fixtures.ts` profile (+ graceful-retry)
- `src/app/admin/.gitkeep` — reserved admin panel (Part 2)
- `src/app/embed/.gitkeep` — reserved embeddable flow
- `src/app/api/.gitkeep` — reserved serverless backend (lead/report/score)

**Components (`src/components/ui/`) — brand kit on shadcn/Radix:**
- `button.tsx` — Button: primary / secondary / ghost, full state set
- `card.tsx` — Card (default + emphasis) + Header/Title/Description/Content/Footer
- `badge.tsx` — 30px explorer/reward pill (filled + soft)
- `progress.tsx` — word-labelled track with `--grad-brand` fill (Radix Progress)
- `input.tsx` — text input with focus + error states
- `label.tsx` — form label (Radix Label)
- `field.tsx` — Field wrapper + FieldHelpText + FieldError (no form logic)
- `checkbox.tsx` — consent checkbox (never pre-ticked; error-ready) (Radix Checkbox)
- `select.tsx` — Select trigger/content/item/etc. (Radix Select; popover uses `--shadow-pop`)
- `band-label.tsx` — index band-label: word + indicative range only (no number)
- `confidence-label.tsx` — висока/средна/ниска chip + signal glyph (+1.09: exports `CONFIDENCE` {bars,color} as the single source the PDF theme mirrors)
- `index-band-bar.tsx` — per-index row: dot + name + word pill + colored track + range (+1.09: exports `BAND_FILL` as the single source the PDF theme mirrors)
- `pentagon.tsx` — web SVG pentagon over the geometry module
- `puzzle-brain.tsx` — Motion puzzle-brain assembly (+ chip variant; reduced-motion fallback)
- `answer-option.tsx` — shared task-agnostic answer option (select + check disc + feedback states) (1.06, D-047)
- `idle-nudge.tsx` — gentle idle nudge ("Сè е во ред?" + Продолжи), overlay/inline, no timer/penalty (1.06, D-047)
- `reward-badge.tsx` — "IQ UP! Истражувач" celebratory tile + custom yellow star SVG (1.06, D-047)
- `disclaimer.tsx` — **shared §16.1 "informative, not diagnostic" component (1.10)**: full/short registers from `messages/mk.json` `legal`; isomorphic (no `"use client"`); exports `DISCLAIMER_KEYS` (the PDF copy-parity guard's key map)
- `__tests__/disclaimer.test.tsx` — jsdom (1.10): both registers render verbatim from mk.json; `DISCLAIMER_KEYS` resolve

**Lib (`src/lib/`):**
- `indices.ts` — single source of the 5 indices (order, MK labels, hex colors/tints/inks); PDF-safe
- `pentagon.ts` — pure framework-agnostic pentagon geometry (shared by web + future PDF)
- `prng.ts` — seeded PRNG (mulberry32 + FNV-1a) + helpers (`pick`/`shuffle`/`intInRange`/`deriveSeed`); the only randomness source for the task system
- `utils.ts` — `cn()` className helper
- `analytics.ts` — **analytics seam (1.08)**: typed `trackEvent` no-op (Прилог F: `form_view` / `lead_submit` / `cta_booking_click`); GA4 + Meta wired in 2.03; no PII in params

**Task bank — versioned config (`src/content/tasks/`) (Phase 1.04):**
- `version.ts` — `TASK_BANK_VERSION` ("1.0.0"); stored with every anonymous record
- `levels.ts` — per-domain level 1→10 difficulty tables + accessors (the single place difficulty is tuned)
- `index.ts` — barrel (version + level tables)

**Task bank — generators (`src/features/tasks/`) (Phase 1.04) — pure data/geometry, no React:**
- `types.ts` — the `Item` contract: `Signal`, per-family stimulus/answer types, `GenerateOpts`; documents Attention's intentional absence
- `shared.ts` — `makeBase` + coordinate geometry (rotate/reflect/recenter/`samePointSet`)
- `gf.ts` — Logic: matrix reasoning + numeric series (rules stored for re-derivation)
- `gv.ts` — Spatial: mental rotation + odd-one-out (chiral polygon geometry)
- `gsm.ts` — Memory: Corsi span over a fixed 6-tile board (caller passes length/direction)
- `gs.ts` — Processing speed: symbol-search grid + target-cell answer key
- `ef.ts` — Planning: Tower of London with BFS-verified `minMoves` + optimal path
- `glr.ts` — Learning: paired-associate study set + recall round
- `ct.ts` — STEM: sequence / debug / loop / condition / maze (all symbol-based, zero text)
- `guards.ts` — type guards (`isGfMatrix`, `isCt`, …) for narrowing `Item`
- `registry.ts` — signal→generator map, `generateItem(...)`, `generatePractice(...)`
- `index.ts` — public barrel (entry points + types + guards + version)
- `__tests__/{prng,determinism,coverage,answer-key,distractors,purity}.test.ts` — Vitest suite (41 tests)

**Seed norms — versioned config (`src/content/norms/`) (Phase 1.05) — pure data:**
- `seed-norms.ts` — the single 1.05 tuning surface: start levels, span expectations, item caps, idle/validity/confidence thresholds, composite weights, raw→index formula constants, `SCORING_VERSION`/`NORMS_VERSION`; every value labeled seed
- `index.ts` — barrel

**Adaptive engine (`src/features/assessment/`) (Phase 1.05) — pure, deterministic state machine:**
- `types.ts` — engine shapes: `RawResponse`, `GradedItem`, per-domain state (laddered/span/fixed), `SessionState`, `NextAction`
- `engine.ts` — `startSession`/`nextAction`/`applyResponse`/`advanceDomain`/`runSession`; start-by-age, basal/ceiling, span +1/−1 + backward-from-8, fixed age-sized domains, `deriveSeed` per item
- `fixtures.ts` — reusable scripted-session profiles (logic-strong / spatial-strong / flat / ceiling / strong-invalid) + `correctResponse`/`wrongResponse`/`scoreProfile` (also for 1.07)
- `index.ts` — public barrel
- `__tests__/{engine,determinism}.test.ts` — adaptive path, start levels, Gsm growth/ceiling/backward, determinism

**Scoring layer (`src/features/scoring/`) (Phase 1.05) — raw → indices → bands/confidence/validity:**
- `types.ts` — `AssessmentResult` + parts; `Band`/`Confidence` imported as TYPES from the 1.03 components so it feeds the UI kit with no adapter
- `grade.ts` — grade a response against the item's verified answer key (correctness derived, never time-fed)
- `time.ts` — time-rules math: `effectiveTime` (idle-gap exclusion), mean/stdDev/coefficient-of-variation
- `raw.ts` — raw scores per signal (Дел 6.1) + extremes (ceiling/floor) helpers
- `indices.ts` — raw→0–100 families (accuracy/span/speed), composites (Дел 6.3), bands (Дел 6.4)
- `attention.ts` — derived attention (time variability + impulsive errors; no administered items)
- `validity.ts` — validity flags + graduated verdict ok/mild/strong (Дел 7.1)
- `confidence.ts` — per-index confidence high/medium/low (Дел 6.5)
- `finalize.ts` — folds a completed session into the `AssessmentResult`
- `index.ts` — public barrel
- `__tests__/{scoring-formulas,confidence-validity-extremes,attention-time,profiles-ui,purity}.test.ts` + `helpers.ts` — Vitest suite

**Timing layer (`src/features/timing/`) (Phase 1.06) — pure stopwatch + one React hook:**
- `constants.ts` — UI idle/timing constants (`IDLE_NUDGE_MS`=22 s, `IDLE_POLL_MS`); re-exports `IDLE_GAP_EXCLUDE_MS`/`TOO_FAST_MS` from norms
- `types.ts` — `CapturedTiming` (= engine `ResponseTiming`), `ItemTimerState`, `DeviceCalibration`
- `stopwatch.ts` — pure silent stopwatch + idle/tab-blur gap recording over injected timestamps (node-tested)
- `calibration.ts` — pure device-baseline summary (median inter-tap, or first-tap latency)
- `use-item-timer.ts` — React hook: the app's only clock (`performance.now`); idle watcher + visibility listener; `finish()` → `{ timing, calibration }`
- `index.ts` — barrel
- `__tests__/timing.test.ts` — stopwatch idle/finish, calibration, captured-timing↔scoring contract

**Task renderers (`src/features/assessment/tasks/`) (Phase 1.06) — thin `.tsx` over a pure `.ts` core:**
- `view.ts` — pure presenters + response builders (`buildGvView`, `correctFields`/`wrongFields`, `withTiming`, `instructionKey`); node-tested
- `glyphs.tsx` — shared SVG glyphs: shapes (Gf), abstract symbols (Gs/Glr), move arrows + condition tokens (CT)
- `gf-task.tsx` · `gv-task.tsx` · `gsm-task.tsx` · `gs-task.tsx` · `ef-task.tsx` · `glr-task.tsx` · `ct-task.tsx` — one renderer per signal
- `task-renderer.tsx` — dispatch by signal (same guards as the scorer)
- `task-screen.tsx` — shared chrome (progress + section + dots), silent stopwatch wiring, idle nudge, practice/real routing
- `index.ts` — barrel
- `__tests__/responses.test.ts` — response→answer-key mapping per signal, slow≠wrong, Gv render determinism

**Flow controller (`src/features/assessment/`) (Phase 1.06 + 1.08):**
- `flow.ts` — pure running-phase logic on the 1.05 engine: `settle` past domainComplete, `nextStep` (practice/real), 5 index-group progress; +1.08: the `advanceEndPhase` end-phase controller (completion → form → confirmation)
- `__tests__/flow.test.ts` — flow over the 5 fixture profiles (reproduces the engine path), determinism, one practice per task type
- `__tests__/end-phase.test.ts` — `advanceEndPhase` walks completion → form → confirmation and rests at confirmation (1.08)

**Report engine (`src/features/report/`) (Phase 1.07) — pure, deterministic; reads 1.05 read-only:**
- `types.ts` — the engine contract: `DerivedFeatures`, the `ReportModule` schema (Дел 9.2), `ReportModel` (single render contract for 1.08 + 1.09), `ReportSummary`, `REPORT_ENGINE_VERSION`
- `features.ts` — layer 2 (Дел 9.1): `deriveFeatures` — profile shape, top-strength/growth, behaviour-only solving style, memory asymmetry, learning slope, extremes, STEM lead, positioning tier (report-local narrative seeds)
- `text.ts` — pure `{child}` → „вашето дете" resolver (+ sentence-initial „Вашето дете") and `resolveText`/`resolveTexts`
- `program.ts` — Дел 11 / Прилог E age + strength → IQ UP! program key (shared by positioning triggers + the assembler)
- `assemble.ts` — layer 3 (Дел 9.3): `assembleReport` — slot selection with total-order tie-break (priority → index order → id), validity branch (strong → retry variant)
- `select.ts` — `selectReportSummary` — the Дел 10.1 on-screen subset (pentagon + 5 bands + top strength + CTA)
- `index.ts` — public barrel
- `__tests__/{determinism,purity,profiles,validity-extremes,coverage,voice,text}.test.ts` — Vitest suite (36 tests)

**Lead feature (`src/features/lead/`) (Phase 1.08) — shared schema + stubbed seams (framework-free):**
- `schema.ts` — the shared Zod `leadSchema` (8 fields, first-name-only, permissive phone via `isPlausiblePhone`, two required consents enforced true, error TOKENS) + `LeadFormValues`; reused unchanged by the Part-2 API route
- `submit.ts` — `submitLead` (Part-1 inert stub + documented Part-2 contract incl. the separate non-joinable score write) + `runLeadSubmit` (pure DI pipeline: persist → `lead_submit` → advance)
- `cta.ts` — pure `buildBookingHref(url, city)` (`?grad=` URL-encoded) + `resolveBookingUrl` (`NEXT_PUBLIC_BOOKING_URL` or placeholder) + `BOOKING_URL_PLACEHOLDER`
- `index.ts` — public barrel
- `__tests__/{schema,cta,submit}.test.ts` — Vitest: field rules + consent-true enforcement, href encoding, pipeline ordering/args

**Report PDF (`src/features/report/pdf/`) (Phase 1.09) — pure builder + IO seam; renders the 1.07 `ReportModel`:**
- `theme.ts` — pure PDF tokens (literal-hex palette/surfaces mirroring `globals.css`, Montserrat family + weights, band fill/level + confidence bar maps)
- `fonts.ts` — IO seam: `registerPdfFonts()` registers the bundled Montserrat TTFs with `@react-pdf` (idempotent; path via `process.cwd()`)
- `pentagon-pdf.tsx` — pure `@react-pdf` SVG pentagon over the shared `@/lib/pentagon` geometry (identical shape to the web component; `SvgText` cast works around `@react-pdf`'s incomplete SVG `Text` types)
- `document.tsx` — the pure `buildReportDocument(model, { bookingHref })`: branded puzzle-brain header, Part А (pentagon + 5 word/range bands + confidence + strength/growth/style + per-index activities), Part Б (readiness + STEM bridge), positioning + program name, clickable CTA, §D.4 disclaimer top + fixed footer; retry variant (dim brain, no pentagon)
- `render.ts` — IO seam: `renderReportPdf(model, { city })` → `Promise<Buffer>` via `renderToBuffer` (the 2.02 `/api/report` contract; PDF never stored)
- `index.ts` — public barrel (`buildReportDocument`, `renderReportPdf`, `registerPdfFonts`, `PentagonPdf`)
- `fonts/Montserrat-{Regular,Medium,SemiBold,Bold,ExtraBold}.ttf` + `fonts/OFL.txt` — bundled OFL static TTFs (Cyrillic + Latin), independent of the web `next/font` pipeline
- `__tests__/{document,render,fonts,theme,purity}.test.ts` — Vitest: element-tree no-number + determinism + section-presence + retry (renders the pure component tree, not bytes); non-empty Buffer for all 5 fixtures + `?grad=` link; Macedonian glyph coverage via `fontkit`; theme sync-guard (PDF maps == components' exported `BAND_FILL`/`BANDS`/`CONFIDENCE`); purity scan; +1.10: `document.test.ts` asserts top=full/footer=short
- `__tests__/disclaimer-parity.test.ts` — Vitest (1.10): the PDF top (full) + footer (short) === `mk.legal[DISCLAIMER_KEYS.*]` for every fixture (PDF ↔ shared-component keys ↔ mk.json)

**Report module library — versioned MK content (`src/content/modules/`) (Phase 1.07) — pure data:**
- `version.ts` — `MODULE_LIBRARY_VERSION` ("1.0.0"); stored in `ReportModel.meta`
- `ranges.ts` — indicative range caption per band (Дел 10.2 — never a number)
- `strengths.ts` — strength modules (per index × band) + fallback
- `growth.ts` — growth modules (no-attack frame) + „all strong" variant + fallback
- `styles.ts` — solving-style modules (slow+accurate / fast+accurate / fast+errors / balanced)
- `stem.ts` — STEM readiness (by band) + STEM bridge (spatial/logic/CT-led, broader than coding)
- `activities.ts` — per-index home activities (every index, not just the growth zone)
- `positioning.ts` — IQ UP! positioning (5 programs + fallback; program name shown, age→program logic internal as `programHook`)
- `cta.ts` — dynamic demo-class CTA copy (by growth zone) + fallback
- `extremes.ts` — ceiling (positive) + floor (gentle) copy
- `validity.ts` — mild soft-note + strong graceful-retry copy
- `index.ts` — barrel: `MODULE_LIBRARY` (flat) + per-category arrays + `modulesOf(category)`

**Lib types (`src/types/`):**
- `fontkit.d.ts` — minimal ambient types for `fontkit` (transitive, untyped); used only by the 1.09 font-coverage test

**Scripts:**
- `scripts/dump-tasks.ts` — dev-only: print sample items per signal/level as JSON (`npx tsx scripts/dump-tasks.ts`)
- `scripts/dump-report-pdf.ts` — dev-only: render all 5 `fixtures.ts` profiles → PDF into gitignored `./tmp/` (`npx tsx scripts/dump-report-pdf.ts [city]`)

**Public assets:**
- `public/fonts/.gitkeep` — Montserrat added in 1.02/1.03
- `public/images/.gitkeep` — brand/photos added later

**Project state (`src/_project-state/`):**
- `current-state.md` — live "where are we" snapshot
- `file-map.md` — this file
- `00_stack-and-config.md` — append-only stack + config log
- `completions/_TEMPLATE.md` — completion-report template
- `completions/Part-1-Phase-01-Completion.md` — Phase 1.01 (scaffold) report
- `completions/Part-1-Phase-02-Completion.md` — Phase 1.02 (design system) report (relocated from repo root, D-042)
- `completions/Part-1-Phase-03-Completion.md` — Phase 1.03 (base UI kit) report
- `completions/Part-1-Phase-04-Completion.md` — Phase 1.04 (task bank + generators) report
- `completions/Part-1-Phase-05-Completion.md` — Phase 1.05 (adaptive engine + scoring + norms) report
- `completions/Part-1-Phase-06-Completion.md` — Phase 1.06 (assessment flow UI) report
- `completions/Part-1-Phase-07-Completion.md` — Phase 1.07 (report engine) report
- `completions/Part-1-Phase-08-Completion.md` — Phase 1.08 (lead form + confirmation) report
- `completions/Part-1-Phase-09-Completion.md` — Phase 1.09 (branded PDF report) report
- `completions/Part-1-Phase-10-Completion.md` — Phase 1.10 (shared disclaimer + static page shells + 7-placement audit) report
