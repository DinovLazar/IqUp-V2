# Part 1 · Phase 08 — Lead form + confirmation screen · Completion Report

**Phase:** Part 1 · Phase 08 — Lead form + confirmation screen
**Executing Claude:** Code
**Date completed:** 2026-06-23
**Branch:** `phase-1.08-lead-form` (cut from `main`; PR #6 / 1.07 already merged — D-092)
**Commits:** `c1a4685` (+ this docs backfill)
**PR:** [#7](https://github.com/DinovLazar/IqUp-V2/pull/7) into `main` (awaiting Lazar's merge — nobody merges their own PR)

## What shipped

- **The visible end of the flow.** `/procena` now runs setup → … → completion + reward → **lead form → confirmation**, appended as phases inside the existing flow machine (the pure `advanceEndPhase` controller + a testable `EndPhaseView` switch). The result is finalized once on leaving completion and the `ReportModel` assembled once on the confirmation. Nothing is persisted — browser memory only.
- **A shared, framework-free Zod schema** (`src/features/lead/schema.ts`) — the single validation source for the 8 fields, reusable verbatim by the Part-2 API route: parent **first name only** (no surname, no child-name field anywhere), email, permissive phone, required free-text city, optional child gender, and **three separate, never-pre-ticked consents** with the two required ones enforced **`true` in the schema itself**.
- **The lead form** composed entirely from the existing 1.03 primitives (`Field`/`Input`/`Label`/`Select`/`Checkbox` — no new field primitive), with MK labels + the **verbatim Прилог D** consent / data-note copy, accessible inline validation, the privacy-policy link → `/politika-za-privatnost`, and `form_view` fired on mount.
- **The confirmation** rendering `selectReportSummary(...)` — pentagon + 5 word/range bands + top strength, **no hard number** — plus the „report sent to email" line, the §D.2 data note, the §D.4 disclaimer placeholder, and the booking CTA (`?grad={city}`, URL-encoded), with the graceful-retry variant for a strong-invalid session.
- **Inert seams, no real network:** `submitLead` (success stub + the full Part-2 contract incl. the **separate, non-joinable** anonymous-score write), `trackEvent` (the three Прилог F events at the right call sites), and the pure `buildBookingHref`. React Hook Form + Zod (+ the resolver) installed and pinned.

## Decisions made on the fly

*The 8 bake-ins are logged as D-084…D-091. The independent gap-fills below are D-092…D-096.*

1. **Branched from `main`, not `phase-1.07-report-engine`** (D-092) — PR #6 is already merged (commit `00beacf`), so the brief's own fallback applied. Mirrors D-069.
2. **Required consents via `z.boolean().refine(v => v === true)`, not `z.literal(true)`** (D-093) — both reject `false`/absent in the schema, but `refine` keeps the input type `boolean` so an un-ticked checkbox is a valid RHF default (a `z.literal(true)` input type makes a `false` default a type error).
3. **Schema emits stable error TOKENS, mapped to MK in the form** (D-094) — keeps the schema framework-free / server-reusable and all parent copy in `messages/mk.json`.
4. **`runLeadSubmit` extracted as a pure DI pipeline** (D-096) — the form is a thin caller; the persist → `lead_submit` → advance ordering is unit-tested in Node.
5. **First DOM tests in the repo** (D-095) — `vitest.config` includes `*.test.tsx`; the global env stays `node` and the React tests opt into `jsdom` per-file via a docblock; Radix polyfills live in a shared, env-guarded `vitest.setup.ts`.
6. **Minor seams (no separate D-number):** a `CityField` swap-seam (one component to change for the Part-2 centers `<select>`); a shared `legal` i18n namespace for the verbatim §D.2/§D.4 copy used by both screens; the confirmation handles the retry variant with a restart affordance; dev-only `autoValidate`/`defaultValues` props on `LeadForm` to surface the `/kit` error states.

## Surprises / off-spec changes

- **No `AssessmentResult` was being finalized.** The 1.06 flow stopped at the reward badge and never called `finalize`. 1.08 now calls `finalize(state)` once when the parent proceeds from completion, then `assembleReport` once on the confirmation. The engine/scoring/report modules are untouched (consumed read-only).
- **Adversarial review pass (automated review still unconnected).** A multi-agent review of the diff surfaced **7 confirmed should-fix** items (no must-fix / no hard-requirement violations). Fixed + regression-tested:
  1. The submit handler never reset `submitting` and had no `catch` → a future Part-2 network rejection would lock the button. Now bound to RHF `isSubmitting` + a `try/catch` that shows an inline MK `submitFailed` line (recoverable; a no-op guard in Part 1 since the stub always resolves).
  2. Hardcoded field ids collided across the three `LeadForm` instances on `/kit`. Now namespaced with `useId()` — **verified 0 duplicate ids** across the page.
  3. The consent privacy-link sat inside the `<label>`; it now `stopPropagation`s so following it never toggles the consent.
  4. The completion→form→confirmation wiring wasn't tested at the screen level — extracted to `EndPhaseView` and pinned with a guards test.
  5. The confirmation no-hard-number guard ran only on the profile variant — now also asserted on the retry variant.
- **`/politika-za-privatnost` 404s** (review-flagged, by phase design): the consent link is real + verbatim per the phase prompt, but the route is a `.gitkeep` shell until 3.03. Left as carryover, href unchanged (correct).

## Files written / updated

**New:**
- `src/features/lead/schema.ts` — shared Zod `leadSchema` + `LeadFormValues` + `isPlausiblePhone`
- `src/features/lead/submit.ts` — `submitLead` stub (+ Part-2 contract) + pure `runLeadSubmit` pipeline
- `src/features/lead/cta.ts` — pure `buildBookingHref` + `resolveBookingUrl` + `BOOKING_URL_PLACEHOLDER`
- `src/features/lead/index.ts` — barrel
- `src/lib/analytics.ts` — typed `trackEvent` no-op seam
- `src/app/(site)/procena/lead-form.tsx` — the lead form
- `src/app/(site)/procena/confirmation.tsx` — the confirmation
- `src/app/(site)/procena/end-phase-view.tsx` — the testable completion→form→confirmation switch
- `src/app/kit/lead-preview.tsx` — `/kit` form (3 states) + confirmation preview
- `src/features/lead/__tests__/{schema,cta,submit}.test.ts` — pure Node tests
- `src/features/assessment/__tests__/end-phase.test.ts` — `advanceEndPhase`
- `src/app/(site)/procena/__tests__/{lead-form,confirmation,end-phase-view}.test.tsx` — jsdom tests
- `vitest.setup.ts` — env-guarded jsdom polyfills (Radix)

**Modified:**
- `src/features/assessment/flow.ts` + `index.ts` — `EndPhase` / `advanceEndPhase` / `END_PHASE_ORDER`
- `src/app/(site)/procena/assessment.tsx` — finalize once + sequence the end phases via `EndPhaseView`
- `src/app/(site)/procena/completion-screen.tsx` — optional `onProceed` primary button
- `messages/mk.json` — `leadForm` (labels + error tokens), `confirmation`, shared `legal` (verbatim D.2/D.4), `complete.toForm`
- `src/app/kit/kit-gallery.tsx` — the lead-form/confirmation preview section
- `vitest.config.ts` — include `*.test.tsx` + `setupFiles`
- `.env.local.example` — `NEXT_PUBLIC_BOOKING_URL` documented
- `package.json` / `package-lock.json` — new deps (pinned exact)
- `Decisions.md` (D-084…D-096), `src/_project-state/{current-state,file-map,00_stack-and-config}.md`

## Tests run + results

All quality gates pass (full output pasted into the PR description):

- `npm run typecheck` ✓
- `npm run lint` ✓ (0 problems)
- `npm run build` ✓ (routes `/`, `/procena`, `/kit`, `/_not-found`)
- `npm test` ✓ — **30 files, 209 tests** (was 23 / 169 after 1.07: +7 files, +40 tests)
- `npm run format:check` ✓

Coverage meets the DoD: schema per-field rules + both consents must be `true` + optional fields accepted; `buildBookingHref` encoding (space + Cyrillic); the `completion → form → confirmation` transition (`advanceEndPhase` + the `EndPhaseView` guards); the seams called with the right args at the right times (`form_view` on mount, `lead_submit` on success with `{ city }`, `submitLead`/`runLeadSubmit` with the validated values); no hard number on both confirmation variants.

**Browser-verified at `/kit`** (dev server): the form in all three states (required-consent failures show inline; **0 duplicate ids** across the 3 instances), and the confirmation (pentagon + word/range bands, **no number**; booking href `…?grad=%D0%A1%D0%BA%D0%BE%D0%BF%D1%98%D0%B5`); graceful-retry variant renders; no console errors.

## Blocked / carryover

- [ ] **Real `NEXT_PUBLIC_BOOKING_URL`** — pending Cowork asset; swap the placeholder (env only) before launch.
- [ ] **Centers-by-city `<select>`** — Part-2 Cowork deliverable; city is free-text now (the `CityField` seam localizes the swap).
- [ ] **`/politika-za-privatnost` (+ `/uslovi`, `/za-testot`) pages** land in 3.03 — the consent link is real but 404s until then.
- [ ] **Shared „informative, not diagnostic" component + 7-placement audit** — Phase 1.10 (the confirmation uses the static §D.4 placeholder).
- [ ] **Real Brevo / Meta / GA4 / Supabase wiring** — Part 2 (the seams are inert + typed; `submitLead` documents the contract incl. the non-joinable score write).
- [ ] **Connect CodeRabbit + Codex** — still pending; this PR was self-reviewed + one adversarial review pass instead.

## What's next

**Phase 1.09 — the PDF report** (`@react-pdf/renderer`): render the full `ReportModel` (Part А/Б, activities, positioning, CTA) to a branded PDF reusing the PDF-safe `pentagon.ts` geometry + `lib/indices` hex. The confirmation already promises „report sent to email" (production copy); 1.09 builds the PDF and 2.02 sends it via Brevo. Chat should note to Lazar that the booking URL + the privacy-policy page remain pending assets.

---
*IqUp-V2 | Part 1 · Phase 08 Completion | 2026-06-23*
