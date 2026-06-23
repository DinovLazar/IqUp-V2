# IqUp-V2 — Current State

> A live snapshot of the repo. **Claude Code updates this at the end of every phase.** It is the single source of truth for "where are we." If this and a planning doc disagree, this (the live state) wins.
>
> Lives at `src/_project-state/current-state.md`.

**Last updated:** 2026-06-23 — end of Phase 1.09 (Branded PDF report)
**Current part / phase:** Part 1 · Phase 1.09 complete → next is **1.10 (shared disclaimer component + 7-placement audit)**
**Active branch:** `phase-1.09-pdf-report` → PR into `main` (awaiting Lazar's merge)

> The assessment runs **end-to-end locally**: `/` → setup → pre-start → practice (with calibration) → all 7 task types adaptively (on the 1.05 engine) → completion + reward badge → **lead form → confirmation**. **1.08 closes the visible flow:** the parent fills one short form (first name only, email, phone, city, optional child gender, three separate never-pre-ticked consents) validated by a shared, server-reusable Zod schema; a successful submit fires the stubbed `submitLead` + `lead_submit`, then the confirmation renders `selectReportSummary` (pentagon + 5 word/range bands + top strength — **no number**), the „report sent to email" line, the §D.2 data note, the §D.4 disclaimer placeholder, and the booking CTA (`?grad={city}`). All integrations are inert seams; **nothing is persisted** (browser-memory only). 1.07's report engine still feeds the screen read-only. **1.09 builds the emailed payoff:** a pure, deterministic `@react-pdf` document builder renders the FULL `ReportModel` (Дел 10.3) into a branded A4 PDF — puzzle-brain header, color-coded pentagon, five word/range bands + confidence, strength/growth/style, per-index home activities, Part Б, positioning, clickable CTA, §D.4 top + footer, and the graceful-retry variant — via `renderReportPdf(model, { city }): Promise<Buffer>` (the 2.02 `/api/report` seam). **Sending is still stubbed** (Brevo = 2.02); this phase only generates the document.

## How to run it locally

```bash
npm install
npm run dev        # http://localhost:3000  → real landing (MK) → /procena runs the assessment → form → confirmation
                   # http://localhost:3000/kit → dev-only UI-kit gallery (every component + every task renderer + report + lead-form/confirmation preview)
npm test           # Vitest: + report/pdf (document tree / render buffers / font coverage / theme sync / purity) — 35 files, 232 tests
npx tsx scripts/dump-tasks.ts        # print sample generated items as JSON (eyeballing)
npx tsx scripts/dump-report-pdf.ts   # render all 5 fixtures → PDF into gitignored ./tmp/ (visual QA)
```

Quality scripts: `npm run build` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run format` / `format:check`. All pass as of this phase.

## Tech stack (current — installed & pinned)

Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict) · Tailwind CSS v4 (CSS-first; brand `@theme` in `globals.css`) · shadcn/ui on Radix (`radix-ui`), fully **restyled to brand** · Motion (`motion` v12, LazyMotion) · Lucide · next-intl 4 (MK at root) · **Montserrat via `next/font/google`** (latin + cyrillic) · **React Hook Form 7.80.0 + Zod 4.4.3 + @hookform/resolvers 5.4.0** (forms, added 1.08) · **Vitest 4.1.9** (+ jsdom 29 / @testing-library/react 16 for the 1.08 DOM tests). Prettier + ESLint. Exact versions and config notes: `00_stack-and-config.md`. **PDF** (added 1.09): **@react-pdf/renderer 4.5.1** (server-side report PDF) + bundled OFL Montserrat static TTFs. **Deferred**: Supabase/Brevo/Meta/GA4 (Part 2).

## Pages built

- `/` — **real landing** at `src/app/(site)/page.tsx` (1.06): brand hero, value message, MK/EN switch (MK active, EN inert), dashed class-photo placeholders (Cowork swaps in later), "Започни проценка" → `/procena`, inline "informative, not diagnostic" footnote, puzzle-brain accent.
- `/procena` — **the assessment flow** (1.06 + 1.08): setup (age 5–13; <5/>13 blocked; no child name) → pre-start (instructions + mandatory 5–7 parent confirm + inline disclaimer) → practice/real on the 1.05 engine → completion + reward badge → **lead form → confirmation**. The end-phase switch (`EndPhaseView`) renders each screen; the result is finalized once + the report assembled once. Browser-memory only; nothing persisted.
- `/kit` — **dev-only UI-kit gallery** at `src/app/kit/`. Every component + state, pentagon, puzzle-brain, every 1.06 task renderer (live), answer-option states, idle nudge, reward badge, the 1.07 report preview (all five `fixtures.ts` profiles through `assembleReport`), **+ the 1.08 lead-form preview (empty / validation-error / missing-consent) + confirmation from a profile (+ graceful-retry).** `noindex`; 404s on real production; not linked from nav.
- Reserved (empty `.gitkeep` route folders): `(site)/za-testot`, `(site)/politika-za-privatnost`, `(site)/uslovi`, `admin`, `embed`, `api`.

## Components built (`src/components/ui/`)

Full brand kit on shadcn/Radix + Tailwind v4, each with its complete state set:

- `button.tsx` — primary / secondary / ghost; sizes default(48px)/lg/icon; hover/active/focus-visible/disabled.
- `card.tsx` — Card (default + emphasis surfaces) + Header/Title/Description/Content/Footer. No shadow.
- `badge.tsx` — 30px explorer/reward pill (filled + soft), icon-friendly.
- `progress.tsx` — word-labelled track, `--grad-brand` fill (Radix Progress).
- `input.tsx`, `label.tsx`, `field.tsx` (Field/FieldHelpText/FieldError), `checkbox.tsx` (consent style — never pre-ticked, error-ready), `select.tsx` (Radix Select; popover uses `--shadow-pop`).
- `band-label.tsx` — index band-label: **word + indicative range only, no number** (`*-ink` colored, 4-step glyph).
- `confidence-label.tsx` — висока/средна/ниска + 3-bar signal glyph.
- `index-band-bar.tsx` — per-index row: dot + name + word pill + colored track + indicative range (+ optional confidence).
- `pentagon.tsx` — web SVG over the pure geometry module; color dots + MK vertex labels; PDF-safe primitives.
- `puzzle-brain.tsx` — Motion (LazyMotion) clipped-silhouette + 5 region assembly from a `completed` (0–5) prop; reduced-motion snap fallback; ~40px chip variant; optional word-labelled track.
- **`answer-option.tsx`** (1.06, D-047) — shared task-agnostic option control: select + violet check disc + correct/incorrect feedback; ≥64px square.
- **`idle-nudge.tsx`** (1.06, D-047) — gentle "Сè е во ред?" prompt + Продолжи; overlay or inline; light-blue, no timer/penalty.
- **`reward-badge.tsx`** (1.06, D-047) — "IQ UP! Истражувач" violet tile + custom yellow-star SVG + child-facing line.

**Shared lib (`src/lib/`):**
- `indices.ts` — single source of the 5 indices (order, MK labels, hex colors/tints/inks). Imported by pentagon, band bars, confidence, brain — and PDF-safe for 1.09.
- `pentagon.ts` — **pure, framework-agnostic** pentagon geometry (vertices/profile/rings/spokes/labels). One module feeds both the web component and the future `@react-pdf` report (1.09).
- `utils.ts` — `cn()` helper (unchanged).
- `analytics.ts` — **1.08** typed `trackEvent` no-op seam (Прилог F events; GA4 + Meta in 2.03; no PII).

## Task bank (`src/features/tasks/`, `src/content/tasks/`, `src/lib/prng.ts`) — Phase 1.04

Deterministic, seedable procedural generators for the **7 testable signals**, emitting **pure data / coordinate geometry** (no React, no SVG, no CSS — mirrors `pentagon.ts`). One entry point, `generateItem({ signal, level, seed, practice?, ...opts })`, plus `generatePractice(signal, seed)`; a signal→generator `REGISTRY`; type guards in `guards.ts`. Same inputs → deep-equal item, always.

- **`prng.ts`** — the one randomness source: `makeRng` (mulberry32 + FNV-1a), `pick`/`shuffle`/`pickN`/`intInRange`/`chance`, and `deriveSeed` (so 1.06 derives per-item seeds from one session master seed). No `Math.random`/`Date`/env anywhere downstream (purity-tested).
- **`content/tasks/`** — `TASK_BANK_VERSION = "1.0.0"` (stored per record, spec Дел 19.4) + per-domain level 1→10 difficulty tables (the single place difficulty is tuned).
- **Generators** — `gf` (matrix + numeric series), `gv` (mental rotation + odd-one-out, chiral polygons), `gsm` (Corsi span, fixed 6-tile board, caller passes length/direction), `gs` (symbol-search grid + target-cell key), `ef` (Tower of London, BFS-verified `minMoves` + optimal path), `glr` (paired-associate study + recall), `ct` (5 sub-types: sequence/debug/loop/condition/maze, all symbol-based, zero text).
- **Attention has NO generator** — it is a derived signal (timing variability + misses + impulsive errors) computed in 1.05 (spec Дел 3.1 #5 / Дел 4). Documented in `types.ts`.
- **Tests** — Vitest suite under `__tests__/` (6 files, 41 tests): determinism, full level/subtype coverage, answer-key correctness (independent BFS for EF, rule re-derivation for Gf, congruence for Gv, maze-is-a-tree, etc.), distractor validity (unique key, matrix distractors differ by exactly one attribute), and a purity/language-neutrality scan.
- **Out of scope (1.06):** all timers/timing *behaviour* (stopwatch, idle/tab-blur detection, the gentle nudge), practice-item administration, device calibration, and rendering — 1.05 consumes timing as passed-in data only.

## Adaptive engine + scoring + seed norms (`src/features/assessment/`, `src/features/scoring/`, `src/content/norms/`) — Phase 1.05

The **brain** of the assessment: a pure, deterministic, UI-free state machine + scoring layer that turns a child's responses into the five parent-facing indices with bands, confidence, validity, and extremes. No clock, no randomness beyond the seeded PRNG, no React — same `sessionSeed` + age + response/timing script → **deep-equal `AssessmentResult`**, always (purity- and determinism-tested, mirroring 1.04).

- **`content/norms/seed-norms.ts`** — the **single tuning surface**: start-level-by-age, expected spans, item caps, the idle/validity/confidence thresholds, composite weights, and the raw→index formula constants. **Every value is a labeled seed** to recalibrate from pilot + anonymous data (Дел 6.6). `SCORING_VERSION` + `NORMS_VERSION` = `1.0.0`, carried in `result.meta` with `normsStage: "seed"`.
- **`features/assessment/`** — `startSession` → `nextAction` (selector) → `applyResponse` (reducer) → `advanceDomain`, plus a `runSession` driver. Three control flows behind one interface: laddered basal/ceiling (Gf, Gv, EF, CT), span-adaptive Corsi (Gsm; +1/−1, backward only from age 8), and fixed age-sized (Gs, Glr). Per-item seeds via `deriveSeed`; each administered item comes from `generateItem`. Plus **`fixtures.ts`** — five reusable scripted profiles (logic-strong / spatial-strong / flat / ceiling / strong-invalid), reused by 1.07.
- **`features/scoring/`** — grade (correctness derived from the item's own key, never from time) → raw scores (Дел 6.1) → derived **attention** (variability + impulsive errors; no task) → raw→0–100 (3 families) → composites (Дел 6.3) → bands (Дел 6.4) → confidence (Дел 6.5) → validity flags + verdict (Дел 7.1) → extremes (Дел 7.3), assembled by `finalize`. **Slow ≠ wrong** is structural: only Gs scoring sees time.
- **Output feeds the UI kit with no adapter** — `AssessmentResult.indices` is keyed by the `lib/indices` `IndexKey` and the band/confidence enums are imported *as types* straight from the 1.03 components (so any drift breaks the build).
- **Tests** — 7 new Vitest files (engine path, determinism, formulas, confidence/validity/extremes, attention + slow≠wrong, five-profiles/UI-shape, purity). One bug caught by an adversarial review pass (Gsm floor/ceiling mutual-exclusivity) was fixed + regression-tested.

## Assessment flow UI (`src/features/timing/`, `src/features/assessment/tasks/` + `flow.ts`, `src/app/(site)/procena/`) — Phase 1.06

The test becomes something a child can take. Built on the same pure-core / thin-React split as `pentagon.ts` vs `pentagon.tsx`:

- **Timing layer (`src/features/timing/`)** — a pure silent stopwatch + idle/tab-blur gap recorder over injected timestamps (`stopwatch.ts`, node-tested), pure device calibration (`calibration.ts`), and ONE React hook `use-item-timer.ts` that owns the app's only clock (`performance.now`). Output is the engine-shaped `{ elapsedMs, idleGaps? }` fed straight into `applyResponse`. Lives outside `src/features/assessment` so the hook's clock never trips the 1.05 purity scan (D-070). Nudge at 22 s, suppressed during Gs (D-072).
- **Task renderers (`src/features/assessment/tasks/`)** — one per signal (Gf, Gv, Gsm/Corsi, Gs/speed-grid, EF/Tower-of-London, Glr/paired-associate, CT/5 sub-types), each a thin render of `generateItem` output over a pure `view.ts` (presenters + response builders + `instructionKey`). Shared SVG `glyphs.tsx`. `TaskRenderer` dispatches by signal; `TaskScreen` wraps any renderer with progress chrome + the silent stopwatch + the idle nudge. **Correctness derives from the answer key, never time** — only the Gs timer is visible (calm orange ring); no countdown anywhere else.
- **Flow (`flow.ts` + `procena/`)** — a pure running-phase controller (`settle` past domainComplete, `nextStep` = practice/real, 5 index-group progress, D-073) and the React state machine (`assessment.tsx`): setup → pre-start → practice (one per task type, skippable; first calibrates) → adaptive sections → completion + reward. `parentAssistMode` plumbed but inert (3.01); device calibration captured but inert (no field in the 1.05 `ResponseTiming` — D-071, flagged not silently added).
- **Tests** — 3 new Vitest files (32 tests): timing (idle/finish/calibration + scoring contract), response→answer-key per signal (slow≠wrong), and the flow over the 5 `fixtures.ts` profiles (reproduces the engine path, deterministic, one practice per task type).

## Report engine (`src/features/report/`, `src/content/modules/`) — Phase 1.07

The piece that turns the five computed indices into a **personalized, deterministic report** — top strength, main growth area, observed solving style, the STEM bridge, expert IQ UP! positioning and a dynamic demo-class CTA — assembled with **no AI** from a versioned MK module library. Same `AssessmentResult` in → **deep-equal `ReportModel`** out; five fixtures → five visibly different reports (purity- + determinism-tested, mirroring 1.04/1.05). The engine **consumes 1.05's indices / bands / confidence / validity READ-ONLY** — it never recomputes a score, only narrates one (Дел 9).

- **`features/report/`** — three pure layers + the contract: `features.ts` (Дел 9.1 derived features: profile shape, top-strength + primary-growth index, the **behaviour-only** speed-accuracy style, memory forward/backward asymmetry, learning slope, extremes, STEM-bridge lead, positioning tier — narrative thresholds are report-local seeds, never scoring norms, D-081); `assemble.ts` (`assembleReport` — slot selection with a **total-order** tie-break of priority → lib/indices order → id, so output never depends on sort stability); `text.ts` (the pure `{child}` → „вашето дете" resolver, D-078); `select.ts` (`selectReportSummary` — the 10.1 on-screen subset: pentagon + 5 bands + top strength + CTA); `program.ts` (Дел 11 / Прилог E age→program mapping); `types.ts` (`ReportModel` — the single render contract for 1.08 + 1.09: `meta` with report-engine + module-library + scoring + norms versions, the parent-facing per-index presentation, Part А, Part Б, positioning, CTA **text** only). The input contract needed **no widening of 1.05** — `SignalResult.perItem` + aggregates already exposed everything (D-080).
- **`content/modules/`** — the **versioned MK module library** (`MODULE_LIBRARY_VERSION = "1.0.0"`): strengths (per index × band), growth (no-attack frame + an „all strong" variant), solving styles (4), STEM readiness (by band) + STEM bridge (spatial/logic/CT-led, broader than coding), per-index home activities (every index, not just the growth zone), positioning (5 programs + fallback, Прилог E voice; the program name shows, the age→program logic stays internal as `programHook`), dynamic CTAs (by growth zone), extremes (ceiling/floor), validity (mild soft-note + strong graceful-retry). **A fallback per category** so no reachable profile yields a blank section. Authored to the brand §9 voice; **never a number**, never „слабост/проблем/заостанува", never „клинички IQ".
- **Validity branch** — a **strong** flag yields `variant: "retry"` (the graceful retry message + a „Повтори" affordance, **no confident profile**, Дел 7.1); **mild** keeps the full profile and appends the soft note; **ceiling** shows the positive „го достигна врвот…" copy.
- **Tests** — 7 new Vitest files (36 tests): determinism (deep-equal), purity scan (no clock/random/env in `report/` + `modules/`), **five profiles → five distinct reports**, validity + extremes (strong→retry, mild note, ceiling copy), per-index activity coverage + non-empty Part А/Б/positioning/CTA, the **voice lint** (banned-token substring check, „IQ UP!" allow-listed, D-082), and the `{child}` resolver. Repo total: **23 files, 169 tests.**

## Lead form + confirmation (`src/features/lead/`, `src/app/(site)/procena/`, `src/lib/analytics.ts`) — Phase 1.08

The visible end of the flow: the assessment turns into a lead. Built on the same pure-core / thin-React split.

- **`features/lead/`** — the shared, **framework-free** Zod `leadSchema` (the single validation source, reused verbatim by the Part-2 API route): 8 fields — `parentFirstName` (first name only, no surname/child name), `email` (Zod email), `phone` (permissive: allowed glyphs + 6–15 digits, no MK normalization), `city` (required free-text), optional `childGender` enum, two required consents (`consentService`/`consentParent`, enforced **true in the schema** via `refine`, D-093) + optional `consentMarketing`; errors are stable TOKENS mapped to MK in the form (D-094). Plus the stubbed seams: `submitLead` (Part-1 inert + documented Part-2 contract incl. the separate non-joinable score write) + the pure DI `runLeadSubmit` pipeline (D-096), and the pure `buildBookingHref(url, city)` → `?grad=` URL-encoded (+ `resolveBookingUrl`/`NEXT_PUBLIC_BOOKING_URL` placeholder).
- **`lib/analytics.ts`** — the typed no-op `trackEvent` seam (Прилог F): `form_view` (mount), `lead_submit` (`{ city }`, on success), `cta_booking_click` (`{ city, source }`, on CTA click). City only — no PII. GA4 + Meta land in 2.03.
- **Screens (`procena/`)** — `lead-form.tsx` (RHF + Zod resolver over the existing 1.03 `Field`/`Input`/`Label`/`Select`/`Checkbox` — no new primitive; `useId`-namespaced ids; inline `FieldError`s; consents never pre-ticked; the privacy link → `/politika-za-privatnost`; a `CityField` swap-seam for the Part-2 centers `<select>`), `confirmation.tsx` (renders `selectReportSummary` — pentagon + 5 word/range bands + top strength, **no number** — + the email-sent line, §D.2 data note, §D.4 disclaimer placeholder, booking CTA; graceful-retry variant), and `end-phase-view.tsx` (the testable completion → form → confirmation switch). The verbatim Прилог D copy lives in `messages/mk.json` (`leadForm` + shared `legal`).
- **Tests** — 6 new Vitest files (30 files / **209 tests** total): pure Node — schema (each field rule + both consents-must-be-true + optional fields), `buildBookingHref` (space + Cyrillic encoding), `runLeadSubmit`/`submitLead` (ordering + args), `advanceEndPhase`; jsdom + Testing Library — the form (`form_view` on mount, inline + missing-consent errors, valid-submit seam wiring), the confirmation (summary render + no-number on both variants + CTA href/`cta_booking_click`), and the `EndPhaseView` screen-wiring guards. One adversarial review pass (7 confirmed should-fix items) fixed + regression-tested.

## Report PDF (`src/features/report/pdf/`, `scripts/dump-report-pdf.ts`) — Phase 1.09

The emailed payoff: the on-screen profile rendered as a branded, shareable A4 PDF. Built on the same pure-core / thin-IO split as the rest of the repo, and on `@react-pdf/renderer` 4.5.1.

- **Pure builder** — `buildReportDocument(model, { bookingHref })` is a pure function of the 1.07 `ReportModel` (purity-scanned: no clock/random/env/IO). It renders the **full** report (spec Дел 10.3): a branded **puzzle-brain** header (the same §2 silhouette/regions as the web motif) + IQ UP! wordmark + a 5-index color rule; **Part А** — the **pentagon** (`@react-pdf` SVG over the shared `@/lib/pentagon` geometry, color-coded per `@/lib/indices`) + the five per-index bands (**word label + indicative range, never a number**) + per-index **confidence** (висока/средна/ниска) + top strength + growth area + solving style + per-index **home activities**; **Part Б** — STEM readiness + the STEM bridge; the IQ UP! **positioning** + program name (the internal `programHook` is never printed); the **CTA** „Закажи демо час" as a clickable link to `buildBookingHref(resolveBookingUrl(), city)` (`?grad={city}`); the **§D.4 disclaimer** at the **top** + a `fixed` footer on every page **bottom**, plus the §D.2 data note. The **retry variant** (strong validity flag) renders the graceful-retry message with **no pentagon / no confident profile** (dim brain).
- **IO seams** — `fonts.ts` registers the bundled OFL **Montserrat** static TTFs (400/500/600/700/800, Cyrillic + Latin) with `@react-pdf` (idempotent; path via `process.cwd()`). `render.ts` exposes **`renderReportPdf(model, { city }): Promise<Buffer>`** (via `renderToBuffer`) — the documented 2.02 `/api/report` contract; the PDF is **never stored**. `messages/mk.json` gains a `reportPdf` namespace (chrome strings), imported statically into the pure builder, reusing the shared `legal` copy.
- **Two-register + no-number** preserved: the parent sees words + indicative ranges; the numeric index value reaches the page only as pentagon geometry; internal version metadata + `programHook` are never printed.
- **Dev tooling** — `scripts/dump-report-pdf.ts` renders all five `fixtures.ts` profiles → gitignored `./tmp/` (mirrors `dump-tasks.ts`). **Not wired into any route or `/kit`** — generation only (sending/Brevo is 2.02). `next.config.ts` declares `@react-pdf/renderer` in `serverExternalPackages` for the 2.02 route.
- **Tests** — 5 new Vitest files (35 files / **232 tests** total): the document **element-tree** assertions (no-number invariant + determinism + every required section present + retry has no pentagon — asserts on the pure tree, not bytes), non-empty PDF buffers + the `?grad=` link for all five fixtures, Macedonian glyph coverage via `fontkit`, a **theme sync-guard** (PDF band/confidence maps must equal the on-screen components' exported values), and a purity scan over the PDF module. An internal multi-agent adversarial review pass (5 dimensions, adversarially verified) found **no must-fix items**; the confirmed should-fix items (footer clearance, font glyph coverage, the map sync-guard) were fixed + regression-tested.

## Design tokens

All handover §1 / spec App. G tokens are in the Tailwind v4 `@theme` (`src/app/globals.css`): 8 palette colors + per-index soft tints + `*-ink` text variants, gradients, surface/border/focus/state tokens, the four Montserrat type roles, the 4/8/12/16/24/32 spacing scale, 12–18/30/11px radii, ≥44px tap minimum, and the single `--shadow-pop`. No dark mode.

## Integrations wired

None live yet. **1.08 adds the inert seams** (no network, no keys): `submitLead` (Brevo/Meta/GA4/score-write — Part 2), `trackEvent` (GA4 + Meta — 2.03), and the booking CTA via `NEXT_PUBLIC_BOOKING_URL` (placeholder until the real URL lands). **1.09 adds `renderReportPdf(model, { city })`** — the PDF is generated on demand and returned as a `Buffer`; the 2.02 `/api/report` route will import it unchanged to email the attachment (never stored).

## Repo / infra

- GitHub: `DinovLazar/IqUp-V2` — **public**, branch protection on `main`.
- CodeRabbit config committed (`.coderabbit.yaml`). **One-time app-connect for CodeRabbit + Codex still pending** — `docs/ai-review-setup.md`.
- No Vercel connection / deploy yet (Part 2).

## Open carryover items

- [x] ~~Merge the 1.01 PR first (D-041)~~ — **resolved:** PRs #1–#3 are merged into `main`; the chain is collapsed (see D-069).
- [ ] **Connect the CodeRabbit + Codex GitHub Apps** to `DinovLazar` → `docs/ai-review-setup.md`. Until done, PRs get no automated review (this 1.05 PR included — self-reviewed + an internal adversarial review pass instead).
- [ ] **Ratify D-027** (Code kept on-disk `CLAUDE.md`/`AGENTS.md`/`Decisions.md` over the Appendix drafts).
- [ ] **Brand assets pending (Cowork):** real IQ UP! class photo(s) (dashed placeholders in place); optional self-hosted Montserrat woff2 (currently `next/font/google` — clean swap path to `next/font/local`).
- [x] ~~**§4.2 extras deferred (D-047):** reward badge, answer option, idle nudge~~ — **built in 1.06** (`reward-badge.tsx`, `answer-option.tsx`, `idle-nudge.tsx`).
- [ ] **Timing-shape mismatch flagged (D-071):** the 1.05 `ResponseTiming` has no calibration field; the device baseline is captured at session level (inert) for 3.01 to consume. Decide in 3.01 whether to extend the contract.
- [ ] **Real booking URL still a pending Cowork asset.** 1.08 wired the CTA via `NEXT_PUBLIC_BOOKING_URL` with a non-secret placeholder (`https://booking.example.invalid`) + the pure `buildBookingHref` (`?grad={city}`); swap in the real URL (env only) before launch.
- [ ] **Centers-by-city `<select>` is a Part-2 Cowork deliverable.** City is free-text for now; the `CityField` swap-seam localizes the change to one component.
- [ ] **`/politika-za-privatnost` page lands in 3.03.** The consent link is real + verbatim (spec Прилог D) but the route is still a `.gitkeep` shell, so it 404s until 3.03 (same for `/uslovi`, `/za-testot`). Flagged by the 1.08 review; by phase design.
- [ ] **Disclaimer left to 1.10.** No shared „informative, not diagnostic" component yet; the confirmation (and `/kit`) show the canonical Прилог D.4 text as a static placeholder. 1.10 builds the shared component + audits all 7 placements.
- [x] ~~**PDF report is Phase 1.09.**~~ — **done in 1.09:** `renderReportPdf(model, { city })` generates the branded PDF from the `ReportModel`. **Sending the PDF/email (Brevo) is still Part 2.02** — the confirmation's „report sent to email" copy is production, but no email is sent in Part 1.
- [ ] `notion-checklist.md` referenced in planning docs but not in the repo (owned by Chat).

## Known issues

- None. The inert shadcn `.dark` block flagged after 1.01 is **removed** (D-043). The puzzle-brain silhouette/region paths are an original interpretation of §2 (mockup not in repo, D-045) — swappable for the mockup's exact geometry later without API changes.

---
*Update procedure: at the end of each phase, refresh the "Last updated", "Current part / phase", and "Active branch" lines, then update each section to reflect what now exists. Keep it factual and current — this file mirrors reality, not the plan.*
