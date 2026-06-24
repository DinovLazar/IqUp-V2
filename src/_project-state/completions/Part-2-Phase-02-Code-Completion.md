# Part 2 · Phase 02 — Brevo lead capture + transactional PDF e-mail · Completion Report

**Phase:** Part 2 · Phase 02 (Code half) — Brevo lead capture + transactional PDF e-mail
**Executing Claude:** Code
**Date completed:** 2026-06-24
**Branch:** `phase-2.02-brevo-lead-email` (cut from the merged 2.01 tip `c60f2aa`)
**Commits:** `48d27a1` (+ a docs backfill commit for this PR ref)
**PR:** [#11](https://github.com/DinovLazar/IqUp-V2/pull/11)

## What shipped

- **A server-only Brevo client** (`src/lib/brevo/server.ts`, `import "server-only"` + a non-`NEXT_PUBLIC_` `BREVO_API_KEY`, mirroring the 2.01 Supabase client): `upsertLeadContact` (`POST /v3/contacts`, `updateEnabled:true`, `listIds:[7|8]`, built-in `email`/`FIRSTNAME` + the 8 custom attributes), `sendReportEmail` (`POST /v3/smtp/email`, sender from `BREVO_SENDER_EMAIL`/`_NAME`, html+text, PDF base64 attachment), and `resolveBrevoListId`. Failures surface as a **PII-free `BrevoError`** (endpoint + status + Brevo `code` only).
- **`POST /api/lead`** (`src/app/api/lead/route.ts`), modelled on `/api/score`: validate with the shared 1.08 `leadSchema` → **upsert the contact (success gate)** → **best-effort** re-assemble the report server-side (`assembleReport`) → render the PDF (`renderReportPdf`) → e-mail it with the PDF attached. A send/render failure is logged PII-free and the route **still returns success** — the lead is captured.
- **The in-repo branded transactional e-mail** (`src/lib/brevo/email-template.ts`): a pure `buildReportEmail({ parentFirstName, bookingHref }) → { subject, html, text }` — table-based, inline-styled HTML (CTA button in brand violet `--pur`) + a plain-text alternative, **all copy from `messages/mk.json`** (`email.*` = verbatim Прилог D.3 + `legal.disclaimer` = **§16.1 placement #5**); the `{name}` greeting is HTML-escaped.
- **`submitLead` made real**: POSTs `{ ...values, result }` to `/api/lead`; rejects on a non-2xx so the form surfaces an error and the confirmation does not render. The separate, non-blocking `writeScore` → `/api/score` call (2.01) is **unchanged**.
- **Live-verified**: a real submit created a contact on **list 8 (Test)** with the correct attributes (and no score/result fields); the PDF rendered + attached + delivered end-to-end (proven via the verified sender). 32 new tests; full quality gate green.

## Decisions made on the fly

*(Logged in `Decisions.md` as D-116…D-120. The three brief-mandated ones are D-117/118/119.)*

1. **D-116** — branched from `main` (it is the merged 2.01 tip `c60f2aa`). Mirrors the prior branch decisions.
2. **D-117** (brief-mandated a) — `/api/lead` does upsert + report-e-mail in **one route / one client round-trip**, with the report-e-mail kept as a discrete pure lib module; **no `/api/report` HTTP route** (`api/report/` stays reserved), `renderReportPdf` called in-process.
3. **D-118** (brief-mandated b) — the **server re-assembles the report** from the client-sent `AssessmentResult` (not a trusted client model); deterministic, so the PDF provably matches the screen.
4. **D-119** (brief-mandated c) — the **e-mail is best-effort**; the **contact upsert is the success gate** (its failure → 502; an e-mail failure → still 200 + log).
5. **D-120** — extracted the 2.01 `resolveEnvironment()` into a shared `src/lib/env.ts` so the Brevo **list selection and the `scores.environment` stamp always agree** (production → list 7, else → list 8). Behavior-preserving refactor of the score route.

*Minor, self-evident choices (not separately logged): upsert-failure returns **HTTP 502** (`lead_failed`, an upstream Brevo failure) vs. **400** for validation and **200** for success; the PDF attachment filename is the language-neutral `IQ-UP-Izvestaj.pdf`; `BrevoError` never echoes the Brevo message (it can carry an e-mail).*

## Surprises / off-spec changes

- **Brevo accepts the `noreply@iqup.mk` send at the API (HTTP 201) but rejects delivery asynchronously** (pre-DNS), exactly as the Cowork report found — the rejection shows only in Brevo → Transactional → Logs, not in the API response. So the route's synchronous handler sees success; the best-effort guard still covers the case where Brevo returns a synchronous non-2xx. Real inbox delivery was therefore proven via the **verified gmail sender** (sanctioned optional step); the shipped sender stays `noreply@iqup.mk`.
- **`leadSchema` is non-strict**, so it cleanly strips the carried `result` key on `safeParse` — the lead fields validate and `result` is read separately. No schema change needed.
- **Two existing tests needed updating** because `submitLead` is no longer inert: the 1.08 lead-form DOM test now stubs `fetch` (so the valid-submit path resolves), and the 1.08 submit unit test now asserts the real `/api/lead` POST shape (normalized through JSON, since `undefined` optionals drop on serialize). No behavior regressions.
- **3 lint warnings** from a `const { x: _omit, ...rest }` destructure in the new route test were replaced with an `omit()` helper to keep `lint` at **0 problems** (the repo convention).

## Files written / updated

**New:**
- `src/lib/env.ts` — shared `resolveEnvironment()` (extracted from `/api/score`, D-120).
- `src/lib/brevo/server.ts` — server-only Brevo client (`upsertLeadContact`, `sendReportEmail`, `resolveBrevoListId`, `BrevoError`).
- `src/lib/brevo/email-template.ts` — pure `buildReportEmail` → `{ subject, html, text }`.
- `src/lib/brevo/__tests__/server.test.ts` — Brevo client tests (`server-only` + `fetch` mocked).
- `src/lib/brevo/__tests__/email-template.test.ts` — e-mail builder copy/href/escape tests.
- `src/app/api/lead/route.ts` — `POST /api/lead`.
- `src/app/api/lead/__tests__/route.test.ts` — route tests (Brevo + PDF render mocked) + 5-fixture re-assembly equality.

**Modified:**
- `src/features/lead/submit.ts` — `submitLead` now POSTs to `/api/lead` (was inert); `runLeadSubmit` + the score-write step unchanged.
- `src/app/api/score/route.ts` — imports the shared `resolveEnvironment` from `@/lib/env` (behavior-preserving).
- `messages/mk.json` — new `email` namespace (verbatim Прилог D.3 copy).
- `.env.local.example` — documents the 5 `BREVO_*` vars (names + non-secret values).
- `src/features/lead/__tests__/submit.test.ts` — `submitLead` now tested as a real POST.
- `src/app/(site)/procena/__tests__/lead-form.test.tsx` — stubs `fetch` for the valid-submit path.
- `src/_project-state/{current-state,file-map,00_stack-and-config}.md`, `Decisions.md` — state + decisions.

## Tests run + results

- **`npm test`** → **47 files, 323 tests, all passing** (was 44/290). New: 32 tests across the Brevo client, e-mail builder, and `/api/lead` route (incl. validation rejections, upsert-as-gate, best-effort e-mail/PDF failure, the **unjoinable invariant** — the contact carries no score/result keys — and **server re-assembly === client model** for all 5 fixtures).
- **`npm run typecheck`** ✓ · **`npm run lint`** ✓ (0 problems) · **`npm run build`** ✓ (route `ƒ /api/lead` added; `server-only` guards hold) · **`npm run format:check`** ✓.
- **Live verification (real Brevo account, EU):**
  - **Contact upsert:** `POST /api/lead` via the running dev server → **200 `{ok:true}`**; Brevo → Contacts shows `iqup-2-02-verify@example.com` on **list 8 (Test)** with `FIRSTNAME=Тест-Родител`, `PHONE=+389 70 000 222`, `CITY=Скопје`, `CHILD_GENDER=female`, `LANGUAGE=mk`, `CONSENT_SERVICE/PARENT/MARKETING=true`, `CONSENT_DATE=2026-06-24`, and **no score/result attribute**.
  - **E-mail:** the route's `/v3/smtp/email` request is well-formed and **accepted (HTTP 201)**; from `noreply@iqup.mk` delivery is blocked pre-DNS (Cowork carryover). Real inbox delivery proven via the **verified gmail sender** (HTTP 201 + messageId `<202606240518.14102210030@smtp-relay.mailin.fr>`; PDF rendered = **42 KB**, attached). The handler logs + continues on a synchronous failure (best-effort).
  - **No secrets committed:** `.env.local` stays gitignored; no key in code or in this report.

## Blocked / carryover

- [ ] **`iqup.mk` domain authentication (client DNS).** Real outbound mail from `noreply@iqup.mk` is blocked until the 4 DNS records (in the 2.02 Cowork report) are added and Brevo shows the domain Authenticated. The contact upsert works live today; the send is best-effort.
- [ ] **Add the 5 `BREVO_*` vars to Vercel's environment at Phase 2.05.** `APP_ENV=production` on prod routes leads to **list 7**; preview/dev → **list 8**.
- [ ] **Rate-limit / anti-bot on the lead form** (spec §19.3) → Part 3 hardening. Flagged, not built here.
- [ ] **Centers-by-city `<select>`** (Part-2 Cowork deliverable) + **real booking URL** (`NEXT_PUBLIC_BOOKING_URL`) — both pre-existing carryovers; the e-mail CTA uses the booking placeholder until the real URL lands.
- [ ] **One test contact left on Brevo list 8** (`iqup-2-02-verify@example.com`) as live evidence — safe to delete.

## What's next

**Part 2 · Phase 2.03 — Meta Pixel/CAPI + GA4.** `/api/lead` is structured so 2.03 can add the server-side Meta `Lead` (CAPI, `event_id` dedup) after the upsert without re-plumbing, and wire `trackEvent` (GA4 + Meta, client) — both off outside production. The score write (2.01) and the lead/e-mail path (2.02) are untouched by that work.

---
*IqUp-V2 | Part 2 · Phase 02 (Code) Completion | 2026-06-24*
