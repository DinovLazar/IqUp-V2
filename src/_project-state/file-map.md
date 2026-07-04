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
- `.env.local.example` — env variable shapes only (no secrets); real keys live in Vercel; `NEXT_PUBLIC_BOOKING_URL` documented (1.08); +2.01: Supabase runtime keys (`NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), CLI keys (`SUPABASE_PROJECT_REF`/`_DB_PASSWORD`), and `APP_ENV`; +2.02: the 5 `BREVO_*` vars (`BREVO_API_KEY` secret + `BREVO_SENDER_EMAIL`/`_NAME` + `BREVO_LIST_ID_PRODUCTION`/`_TEST`)
- `.coderabbit.yaml` — CodeRabbit auto-review config (live once the app is connected)
- `package.json` / `package-lock.json` — deps + scripts (dev/build/start/lint/typecheck/format); +2.04: `@supabase/ssr` 0.12.0 (cookie-based admin auth)
- `tsconfig.json` — TypeScript config (strict)
- `next.config.ts` — Next config wrapped with the next-intl plugin; +1.09: `serverExternalPackages: ["@react-pdf/renderer"]` for the 2.02 `/api/report` route
- `next-env.d.ts` — Next-generated types (gitignored content; file tracked)
- `src/middleware.ts` — **admin session middleware (2.04)**: matches `/admin/:path*`; refreshes the Supabase session cookie (`@supabase/ssr`, anon key, edge-safe) and redirects unauthenticated requests → `/admin/login` (login excluded); NOT the security boundary (that is `requireAdmin()`). Next 16.2 prints a `middleware`→`proxy` deprecation warning (D-128)
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
- `messages/mk.json` — Macedonian strings; +1.08: `leadForm` (labels + error tokens), `confirmation`, shared `legal` (verbatim Прилог D.2 data note + D.4 disclaimer), `complete.toForm`; +1.09: `reportPdf` (PDF chrome: wordmark/titles/part banners/section labels/confidence words; reuses `legal`); +1.10: `legal.disclaimerShort` (the §16.1 short line — single source), `pages` (about/privacy/terms copy), `common.home`; **removed** the duplicate `landing.disclaimer` + `prestart.disclaimer` short keys; +2.02: `email` (verbatim Прилог D.3 transactional copy — subject / greeting `{name}` / body / softCta / button / signOff; reuses `legal.disclaimer` = §16.1 placement #5); +2.04: `admin` namespace (internal staff tool, plain MK — login + 2FA, stats labels + gender map, contacts columns + filters + pagination + export)
- `src/i18n/request.ts` — next-intl request config (locale `mk`, no routing yet)

**App (routes + backend):**
- `src/app/layout.tsx` — root layout; loads Montserrat via `next/font`, sets `<html lang>` + font var, wraps in `NextIntlClientProvider`
- `src/app/globals.css` — Tailwind v4 entry + **brand `@theme`** (all design tokens; shadcn semantic tokens mapped to brand; no dark mode)
- `src/app/favicon.ico` — placeholder favicon (rebranded later)
- `src/app/(site)/page.tsx` — **real landing** (1.06): brand hero, value message, MK/EN switch (MK active), dashed photo placeholders, "Започни проценка" → `/procena`; +1.10: footnote = the shared `<Disclaimer variant="short">` (§16.1 placement #1)
- `src/app/(site)/procena/page.tsx` — assessment route (server); renders the client `Assessment` (1.06)
- `src/app/(site)/procena/assessment.tsx` — client flow state machine: setup → pre-start → practice/real (on the 1.05 engine) → completion → **form → confirmation** (1.08, `advanceEndPhase`); finalizes the result once + assembles the report once. **+3.01:** `parentAssistMode` + the device calibration baseline now feed `finalize(state, ctx)`; each finished run's anonymous summary is persisted on-device via `@/features/progress` (repeat ⇒ fresh seed); still no server/PII (1.06/1.08/3.01)
- `src/app/(site)/procena/setup-screen.tsx` — age gate 5–13 (<5/>13 blocked, MK message; `noValidate`); no child name (1.06)
- `src/app/(site)/procena/prestart-screen.tsx` — instructions + mandatory 5–7 parent screen + confirmation checkbox; +1.10: the shared `<Disclaimer variant="short">` (§16.1 placement #2)
- `src/app/(site)/procena/completion-screen.tsx` — "Тестот е завршен" + assembled puzzle-brain + reward badge; +1.08: optional `onProceed` primary button to the lead form
- `src/app/(site)/procena/lead-form.tsx` — **lead form (1.08)**: RHF + Zod resolver over the 1.03 primitives; 8 fields (first name only), 3 separate never-pre-ticked consents, inline errors, `form_view` on mount; `CityField` swap-seam; preview seams (`autoValidate`/`defaultValues`); +2.01: passes the real `writeScore` into `runLeadSubmit`
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
- `src/app/admin/layout.tsx` — **admin panel layout (2.04)**: marks all `/admin/**` `noindex,nofollow` + neutral bg; renders NO authenticated chrome (login lives under it too)
- `src/app/admin/admin-shell.tsx` — **authenticated admin chrome (2.04)**: header wordmark + nav (Статистика/Контакти) + `SignOutButton`, centered content column; sync Server Component (next-intl); used by the stats + contacts pages only
- `src/app/admin/sign-out-button.tsx` — **(2.04)** client sign-out: clears the Supabase session via the browser client, routes to `/admin/login`
- `src/app/admin/login/page.tsx` — **`/admin/login` (2.04)**: the one admin route reachable without a session; renders the client `LoginForm`
- `src/app/admin/login/login-form.tsx` — **(2.04)** client login state machine: email+password → TOTP enrol (QR/secret) or challenge → aal2 → `/admin`; friendly MK errors; NOT the security boundary
- `src/app/admin/page.tsx` — **`/admin` stats (2.04)**: server, `requireAdminPage()`-gated; reads AGGREGATES only from `public.scores` via the `admin_score_stats` RPC (env-filtered); total + by age/gender/city/language + per-index band distribution; reads NO contacts
- `src/app/admin/contacts/page.tsx` — **`/admin/contacts` (2.04)**: server, `requireAdminPage()`-gated; lists contacts LIVE from the env-resolved Brevo list (cols: first name/email/phone/city/gender/3 consents/signup — NO age, NO results); server-side filter (city/gender/marketing) + pagination + CSV export links; reads NO scores
- `src/app/admin/__tests__/unjoinable-stores.test.ts` — node (2.04): static scan — no `src/app/admin/**` or `src/app/api/admin/**` file reads BOTH a contact identity and a score (the §14.1 unjoinable guard)
- `src/app/embed/.gitkeep` — reserved embeddable flow
- `src/app/api/score/route.ts` — **`POST /api/score` (2.01)**: validates the body with the strict `scoreRowSchema` (rejects PII/extras/client dates), stamps `environment` via the shared `resolveEnvironment()` (`@/lib/env`, 2.02) server-side, inserts via the service-role client; minimal `{ok}` JSON; no PII logged (`runtime=nodejs`, `dynamic=force-dynamic`)
- `src/app/api/score/__tests__/route.test.ts` — Vitest (2.01, supabase client mocked): 201 happy path + server env stamping; rejects PII/extra/client-date/out-of-range/malformed-JSON (400, no insert); 500 on DB error; no PII in logs
- `src/app/api/lead/route.ts` — **`POST /api/lead` (2.02)**: validates the lead fields with the shared `leadSchema` (rejects invalid/missing-consent → 400), upserts the parent Brevo contact (built-ins + 8 attrs, list 7/8) as the SUCCESS GATE (failure → 502), then BEST-EFFORT re-assembles the report (`assembleReport`) → renders the PDF (`renderReportPdf`) → e-mails it with the PDF attached; logs PII-free + still returns `{ok}` if the e-mail fails. Persists nothing beyond the contact; no score write (`runtime=nodejs`, `dynamic=force-dynamic`)
- `src/app/api/lead/__tests__/route.test.ts` — Vitest (2.02, Brevo client + PDF render mocked): validation rejections (no upsert); contact attrs (server-set LANGUAGE/CONSENT_DATE, stable gender code, no score/result keys = unjoinable); upsert-failure → 502 + no e-mail; e-mail/PDF-failure → still 200 + logs; server re-assembly === client model for all 5 fixtures
- `src/app/api/admin/export/route.ts` — **`GET /api/admin/export` (2.04)**: `requireAdmin()`-gated (401 if not admin); reads the env-resolved Brevo list, applies `?city=&gender=&marketing=` filters, streams a CSV of the displayed fields (BOM + CRLF); `marketing=yes|only` → marketing-consent-only variant; writes ONE PII-free `admin_export_log` row BEFORE streaming (FAIL-CLOSED → 500 if the audit insert fails); reads NO scores (`runtime=nodejs`, `dynamic=force-dynamic`)
- `src/app/api/admin/export/__tests__/route.test.ts` — Vitest (2.04, guard + service-role + Brevo mocked): 401 unauthenticated (no data, no audit); marketing-only returns only `consentMarketing=true`; audit row written PII-free with the right type/count; fail-closed 500 on audit error

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
- `env.ts` — **shared server-side environment resolver (2.02, extracted from 2.01)**: `resolveEnvironment()` (`APP_ENV` → `development|preview|production`, default development) + `ALLOWED_ENVIRONMENTS`; used by BOTH the score `environment` stamp and the Brevo list selection so they always agree (D-120)
- `supabase/server.ts` — **server-only service-role Supabase client (2.01)**: `getServiceRoleClient()`; guarded by `import "server-only"` + a non-`NEXT_PUBLIC_` key; the only writer to `public.scores`; +2.04 also reads the `admin_users` allowlist, the `admin_score_stats` RPC, and writes `admin_export_log`; never imported client-side
- `supabase/admin-browser.ts` — **(2.04)** browser Supabase Auth client (`@supabase/ssr` `createBrowserClient`, public keys only); used by `/admin/login` + sign-out
- `supabase/admin-server.ts` — **(2.04)** server-only cookie-based Supabase Auth client (`createServerClient` over `next/headers` cookies); the session/identity client for `requireAdmin()`; separate from the service-role client
- `supabase/admin-guard.ts` — **`requireAdmin()` — the admin security boundary (2.04)**: pure `evaluateAdmin()` (session + aal2 + `admin_users` allowlist, fail-closed) + the wired `requireAdmin()` + `requireAdminPage()` (redirect on failure); called by every admin page + the export route
- `supabase/__tests__/admin-guard.test.ts` — Vitest (2.04, SSR/service/next-navigation mocked): the deny/allow matrix (no session / aal1 / not-allowlisted / ok) + fail-closed allowlist read + `requireAdminPage` redirect
- `brevo/server.ts` — **server-only Brevo client (2.02)**: `upsertLeadContact` (`POST /v3/contacts`, `updateEnabled:true`, 8 custom attrs) + `sendReportEmail` (`POST /v3/smtp/email`, sender from env, PDF base64 attachment) + `resolveBrevoListId` (prod→7 / else→8 via `@/lib/env`) + a PII-free `BrevoError`; +2.04: `BREVO_CONTACT_ATTRIBUTES` (locked attr names, tied to the upsert contract) + `listContactsFromList`/`fetchAllContactsFromList` (READ a list → displayed-fields-only `AdminContact[]`, for the admin contacts view + export); guarded by `import "server-only"` + a non-`NEXT_PUBLIC_` `BREVO_API_KEY`
- `brevo/__tests__/list-contacts.test.ts` — Vitest (2.04, `server-only` + `fetch` mocked): GET endpoint + paging params, map → ONLY displayed `AdminContact` fields (no LANGUAGE/CONSENT_DATE leak), boolean consent coercion, multi-page fetch to the list total
- `brevo/email-template.ts` — **pure transactional e-mail builder (2.02)**: `buildReportEmail({ parentFirstName, bookingHref })` → `{ subject, html, text }`; table-based inline-styled HTML + plain-text; all copy from `messages/mk.json` (`email.*` + `legal.disclaimer` = §16.1 placement #5); HTML-escapes the interpolated name; no `server-only`, no env
- `brevo/__tests__/server.test.ts` — Vitest (2.02, `server-only` + `fetch` mocked): endpoints/headers/payloads, `updateEnabled:true`, full attr key-set + types, list 7/8 by env, sender from env, html+text+attachment, PII-free `BrevoError`, missing-key config error
- `brevo/__tests__/email-template.test.ts` — Vitest (2.02): subject/body/CTA/sign-off/wordmark from mk.json, footer disclaimer === `legal.disclaimer`, CTA href === `buildBookingHref(city)`, `{name}` interpolation + HTML-escape, determinism

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
- `seed-norms.ts` — the single 1.05 tuning surface: start levels, span expectations, item caps, idle/validity/confidence thresholds, composite weights, raw→index formula constants, `SCORING_VERSION`/`NORMS_VERSION`; every value labeled seed. **+3.01:** validity-threshold MODULATION — `resolveValidityThresholds(ctx)` + new seeds for the young-5–7 band, parent-assist relaxation, and the device-relative too-fast ms (`baseline·mult`, clamped); `{}` ⇒ the exact 1.05 base values (D-131)
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
- `validity.ts` — validity flags + graduated verdict ok/mild/strong (Дел 7.1); **+3.01:** `computeValidity(items, ctx?)` — too-fast counted device-relatively (`rawElapsedMs < resolved threshold`), fraction + idle count age/assist-modulated via the resolver; `ctx` absent ⇒ 1.05 behaviour
- `confidence.ts` — per-index confidence high/medium/low (Дел 6.5)
- `finalize.ts` — folds a completed session into the `AssessmentResult`; **+3.01:** `finalize(state, context?)` threads a session-level `ScoringContext` (`parentAssistMode`, `deviceBaselineMs`) into validity without widening the per-item contract (D-130)
- `index.ts` — public barrel (+3.01 `ScoringContext`)
- `__tests__/{scoring-formulas,confidence-validity-extremes,attention-time,profiles-ui,purity}.test.ts` + `helpers.ts` — Vitest suite (the `purity` scan also covers `persist/`)
- `__tests__/validity-context.test.ts` — **(3.01)** the resolver + wired verdict: base-case = 1.05, young/assist relaxation (age-held-fixed flip), device-relative comparable-across-devices verdicts + the absolute-ms regression guard
- `__tests__/finalize-context.test.ts` — **(3.01)** `ScoringContext` threads end-to-end (device baseline flips ok→strong; changes ONLY validity + its confidence, never a score); determinism with context
- `__tests__/extremes-floor-vs-invalid.test.ts` — **(3.01)** an engaged floor session (not strong, keeps floor + gentle profile) reads differently from a masher (strong → retry), separated by the verdict (Дел 7.3 vs 7.1)
- `persist/score-row.ts` — **pure `buildScoreRow` + strict `scoreRowSchema` (2.01)**: `AssessmentResult` + `{city,childGender,language}` → the no-PII "Store A" row; `ScoreRow = z.infer<schema>` (exactly the allowed keys — no PII/lead-id/timestamp compiles); the one tested `INDEX_COLUMN` map + `SIGNAL_KEYS`; enums tied to live `Confidence`/`SessionValidity`
- `persist/index.ts` — barrel (`buildScoreRow`, `scoreRowSchema`, `SCORE_ROW_KEYS`, `SIGNAL_KEYS`, `INDEX_COLUMN`, types); separate from the scoring barrel so it's client/route/test-importable
- `persist/__tests__/score-row.test.ts` — Vitest (2.01): exact allowed key-set, no-PII/lead-id/timestamp, strict-schema rejections, age/version/validity/confidence mapping, index→column correctness, ranges, purity + determinism
- `persist/__tests__/migration.test.ts` — Vitest (2.01): SQL↔code parity — every row key is a column, RLS-on/no-policies, date-only (no created_at/timestamp/now()), no PII column, CHECK enums match the live types (ok/mild/strong; high/medium/low)

**Timing layer (`src/features/timing/`) (Phase 1.06) — pure stopwatch + one React hook:**
- `constants.ts` — UI idle/timing constants (`IDLE_NUDGE_MS`=22 s, `IDLE_POLL_MS`); re-exports `IDLE_GAP_EXCLUDE_MS`/`TOO_FAST_MS` from norms
- `types.ts` — `CapturedTiming` (= engine `ResponseTiming`), `ItemTimerState`, `DeviceCalibration`
- `stopwatch.ts` — pure silent stopwatch + idle/tab-blur gap recording over injected timestamps (node-tested)
- `calibration.ts` — pure device-baseline summary (median inter-tap, or first-tap latency)
- `use-item-timer.ts` — React hook: the app's only clock (`performance.now`); idle watcher + visibility listener; `finish()` → `{ timing, calibration }`
- `index.ts` — barrel
- `__tests__/timing.test.ts` — stopwatch idle/finish, calibration, captured-timing↔scoring contract
- `__tests__/idle-blur.test.ts` — **(3.01)** idle AND `visibilitychange` record the same gap → `effectiveTime` excludes >30 s → the idle-count validity flag; end-to-end blur path through `gradeItem`; the nudge is timer-free + penalty-free (Дел 8)

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

**Local progress store (`src/features/progress/`) (Phase 3.01) — anonymous, on-device, unjoinable (spec Дел 14.2 / §14.1):** pure-core / thin-IO split (like the timing layer); a THIRD store that shares no key with Store A (scores) or Store B (Brevo), holds NO PII.
- `schema.ts` — the strict Zod `storedProfileSchema` + `StoredProfile = z.infer<…>` (exactly: `schema`/`setSeed`/`attempt`/`age`/`indices`/`validity`/`stamps` — a name/email/phone/city cannot compile or validate); `isStoredProfile` guard; `STORED_PROFILE_KEYS`; enums tied to live `Band`/`Confidence`/`SessionValidity` (D-132)
- `summary.ts` — pure `buildStoredProfile(result, {setSeed, attempt})` → the no-PII on-device summary
- `repeat.ts` — pure `nextRepeatSeed(prior)` (a fresh derived session seed ⇒ a NEW item set, deterministic + provably ≠ prior) + `sessionSeedFor(prior, freshSeed)`
- `compare.ts` — pure `compareToPrior(prior, current)` → per-index growth deltas + band movement, OR the cross-major fallback (`majorVersion`/`isCrossMajor`; different `taskBankVersion` major ⇒ no numeric comparison, D-133)
- `storage.ts` — the ONLY browser touchpoint: a defensive `localStorage` adapter (`load`/`save`/`clear`), fails SOFT on SSR / disabled / quota / corrupt / tampered blob (versioned key `iqup:progress:v1`)
- `index.ts` — barrel + the composed read API: `loadPriorProfile`, `resolveSessionSeed`, `saveSessionProfile`, `readGrowth`
- `__tests__/{summary,repeat,compare}.test.ts` — pure Node: PII-free + no-join shape; repeat determinism + freshness (disjoint item set + different first-item content at the engine level); growth deltas + the cross-major guard (stored v1 vs injected v2)
- `__tests__/storage.test.tsx` — **jsdom:** save↔load round-trip; empty/corrupt/wrong-shape → null (fails soft); versioned key
- `__tests__/guards.test.ts` — static scan: imports neither Supabase nor Brevo (unjoinable), and only `storage.ts` reads `window`/`localStorage`
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
- `submit.ts` — `submitLead` + `runLeadSubmit` (pure DI pipeline); +2.01: the pipeline fires `writeScore` first as a separate, non-blocking (try/catch-guarded) step decoupled from the lead (coarse demographics only; no shared key); +2.02: `submitLead` is now REAL — POSTs `{ ...values, result }` to `/api/lead`, rejects on a non-2xx (the form surfaces an error, no confirmation); `runLeadSubmit` + the score-write step unchanged
- `score.ts` — **client score-write path (2.01)**: `postScore` (builds the row via `buildScoreRow`, POSTs to `/api/score`) + `writeScore` (fire-and-forget, self-catching wrapper used by `runLeadSubmit`); never touches Supabase directly
- `cta.ts` — pure `buildBookingHref(url, city)` (`?grad=` URL-encoded) + `resolveBookingUrl` (`NEXT_PUBLIC_BOOKING_URL` or placeholder) + `BOOKING_URL_PLACEHOLDER`
- `index.ts` — public barrel; +2.01 exports `writeScore`/`postScore`
- `__tests__/{schema,cta,submit}.test.ts` — Vitest: field rules + consent-true enforcement, href encoding; +2.01 `submit`: score-write-first ordering, coarse-demographics-only payload (no PII), non-blocking on score-write throw, score still fires when the lead path rejects

**Admin feature (`src/features/admin/`) (Phase 2.04) — pure core (no network, no React), shared by the pages + export route + tests:**
- `contacts.ts` — `AdminContact` (the displayed-fields-only shape) + `ADMIN_CONTACT_KEYS` (the no-age/no-score guard target) + `parseContactFilters`/`filterContacts`/`paginate`/`exportTypeFor` (`?city=&gender=&marketing=`, marketing `yes|no|only`)
- `csv.ts` — pure `toContactsCsv` (RFC-4180 escaping, CRLF, booleans as true/false) + `CSV_HEADERS` (MK) + `CSV_BOM` (prepended by the route)
- `stats.ts` — `AdminStats` type + `normalizeStats` (coerces the RPC jsonb; fills every index with all four bands) + `sortedEntries`/`sortedNumericEntries`; bands/index order from the live `band-label`/`indices` sources
- `audit.ts` — pure `buildExportAuditRow` (actor + export type + filter summary + count) + `EXPORT_AUDIT_KEYS`; PII-free by construction
- `index.ts` — barrel
- `__tests__/{contacts,csv,stats,audit,migration-parity}.test.ts` — Vitest (2.04): contact shape (no age/score) + filters (incl. marketing-only) + parse/paginate; CSV escaping/columns/booleans; stats normalize/fill/sort; audit PII-free shape; **SQL↔code parity** (`score_band` cut-offs === `BAND_THRESHOLDS`; admin tables RLS-locked, no policies; export-log holds no PII column; RPC execute service-role-only)

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
- `scripts/dump-score-row.ts` — dev-only (2.01): print a sample `buildScoreRow` payload as JSON (the exact `/api/score` body; usable for a local e2e write)
- `scripts/verify-scores-db.ts` — dev-only (2.01): live check that the service role can query `public.scores`, the anon key CANNOT read/write (RLS), and the latest row is date-only + version-stamped + PII-free (env from `.env.local`; prints nothing secret)
- `scripts/verify-admin-db.ts` — dev-only (2.04): live check that the service role can query `admin_users`/`admin_export_log` + call the `admin_score_stats` RPC (aggregates only), and the anon key CANNOT read the allowlist or call the RPC (RLS + revoked execute); prints nothing secret

**Supabase (anonymous scores DB) (Phase 2.01):**
- `supabase/config.toml` — `supabase init` scaffold (local-dev defaults); used by the CLI for `db push`
- `supabase/.gitignore` — ignores `.branches` / `.temp` / supabase env files
- `supabase/migrations/20260624021436_create_scores.sql` — **the `public.scores` migration**: id (random uuid) + date-only `created_date` + coarse demographics + 8 signals + 5 indices + 5 confidences + validity + version stamps + `environment`; RLS enabled, NO policies; documenting table/column comments (no-PII / no-join). Applied live to the EU project
- `supabase/migrations/20260624120000_create_admin_users.sql` — **(2.04)** `public.admin_users` allowlist (`user_id` PK → `auth.users` ON DELETE CASCADE, optional `label`, `created_at`); RLS enabled, NO policies. Applied live
- `supabase/migrations/20260624120100_create_admin_export_log.sql` — **(2.04)** `public.admin_export_log` PII-free export audit (random `id`, `actor_user_id`, `export_type`, `filters jsonb`, `row_count`, `created_at`); RLS enabled, NO policies; no parent PII column. Applied live
- `supabase/migrations/20260624120200_create_admin_score_stats.sql` — **(2.04)** `public.score_band(integer)` (§6.4 cut-offs) + `public.admin_score_stats(text)` (aggregates-only stats over `public.scores`, `security invoker`); execute revoked from public, granted to `service_role`. Applied live
- `supabase/migrations/20260624120300_lock_admin_score_stats_execute.sql` — **(2.04)** revokes the default `anon`/`authenticated` execute grant on the stats functions (defence-in-depth; not a leak — RLS already blocks anon's underlying rows). Applied live

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
- `completions/Part-2-Phase-01-Cowork.md` — Phase 2.01 Cowork half (created the Supabase EU project + placed credentials in `.env.local`)
- `completions/Part-2-Phase-01-Code.md` — Phase 2.01 Code half (anonymous-scores schema + write path) report
- `completions/Part-2-Phase-02-Cowork-Completion.md` — Phase 2.02 Cowork half (stood up Brevo: lists 7/8, 8 custom attributes, API key in `.env.local`; sender pending DNS)
- `completions/Part-2-Phase-02-Code-Completion.md` — Phase 2.02 Code half (Brevo lead capture + transactional PDF e-mail) report
- `completions/Part-2-Phase-04-Completion.md` — Phase 2.04 (admin panel: Supabase Auth + 2FA, stats, contacts, CSV export) report
