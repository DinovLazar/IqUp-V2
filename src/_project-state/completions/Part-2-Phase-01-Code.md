# Part 2 · Phase 01 (Code) — Anonymous-scores database (schema + write path) · Completion Report

**Phase:** Part 2 · Phase 01 (Code half) — the anonymous `scores` table + the server write path
**Executing Claude:** Code
**Date completed:** 2026-06-24
**Branch:** `phase-2.01-anonymous-scores-db` (cut from `main` — PR #9 / 1.10 is merged, D-115)
**Commits:** `36816c8` (+ a docs backfill for this PR ref)
**PR:** [#10](https://github.com/DinovLazar/IqUp-V2/pull/10) into `main`

> **Report naming:** this is `Part-2-Phase-01-Code.md`, parallel to the Cowork half's `Part-2-Phase-01-Cowork.md` (the prompt's "Outputs" section names it `Part-2-Phase-01-Code.md`). The `-Completion.md` suffix used by Part-1 phases is replaced by the `-Cowork` / `-Code` split because 2.01 ran as two halves.

## What shipped

- **The first real data store is live.** A SQL migration in the repo (`supabase/migrations/20260624021436_create_scores.sql`) creates `public.scores` — coarse demographics (age / gender / city / language) + the 8 fine signals + the 5 parent-facing indices + 5 per-index confidences + the validity verdict + version stamps + `environment`, with a **random `id`**, a **date-only `created_date`** (no timestamp), **RLS enabled and no policies**, and documenting table/column comments. It was **applied to the live EU project** (`rdhvpypbwefmafejclfy`, `eu-central-1`).
- **A pure `buildScoreRow`** (`src/features/scoring/persist/score-row.ts`) maps `AssessmentResult` + `{ city, childGender, language }` → the no-PII row. The `ScoreRow` type is `z.infer` of a **strict** `scoreRowSchema`, so name / e-mail / phone / lead-id / timestamp cannot be present (compile-time) and are rejected (runtime). The one `IndexKey`→column mapping is an isolated, tested constant.
- **A server-only service-role client** (`src/lib/supabase/server.ts`, guarded by `import "server-only"` + a non-`NEXT_PUBLIC_` key) and a real **`POST /api/score`** route that validates with the same strict schema (rejecting extras / PII / client-supplied dates), stamps `environment` server-side from `APP_ENV`, and inserts. No PII is logged.
- **The submit flow now fires the real score write** as a **separate, non-blocking** step inside `runLeadSubmit` (`writeScore` in `src/features/lead/score.ts`): decoupled from the (still-stubbed) lead, sharing no key, and guarded so a failure never blocks the parent's confirmation or PDF.
- **Tests + live verification.** New Vitest suites (key-set / no-PII / mapping / purity, schema↔migration parity, `/api/score` validation with the client mocked, the real client write path, non-blocking submit). A real end-to-end local write through the running route landed **one verified row**; the anon key was confirmed unable to read or insert.

## Definition of Done — evidence

- **Migration applied; table exists; RLS on, no policies.** `supabase db push` → `Applying migration 20260624021436_create_scores.sql... Finished` (exit 0). `scripts/verify-scores-db.ts`: `✓ service role can query public.scores (table exists)`.
- **No PII / lead-id / timestamp column; only `created_date` (date); table comment.** Live audit: `✓ latest row carries NO PII column — 30 columns`, `✓ created_date is DATE-ONLY (no time component) — 2026-06-24`. `migration.test.ts` asserts no `created_at`/`timestamp`/`now()`, no PII columns, and a `comment on table … never be joinable`.
- **`buildScoreRow` pure; type + test prove no PII / lead-id / timestamp; exact key set asserted.** `score-row.test.ts`: exact allowed key-set vs `SCORE_ROW_KEYS`; a forbidden-key guard over `email`/`phone`/`parentFirstName`/`lead_id`/`id`/`created_at`/`timestamp`/`environment`; purity source-scan (no clock/random/env/fetch) + the existing scoring `purity` scan recurses into `persist/`.
- **`/api/score` validates, rejects extra/PII/client-dates, stamps `environment`, inserts via service role; no PII logged.** `route.test.ts`: 201 happy path; rejects PII / client `created_date` / client `environment` / out-of-range / malformed JSON (400, no insert); 500 on DB error; asserts the email value is never logged.
- **Successful submit fires the real score write, separate + non-blocking; forced failure leaves confirmation + PDF unaffected.** `submit.test.ts`: score-write-first ordering, coarse-demographics-only payload (no PII), resolves even when `writeScore` throws, and still fires when the lead path rejects. `score.test.ts`: the real `writeScore` swallows a 500 and a network reject with no unhandled rejection.
- **All Supabase config from env; nothing secret in the repo; `.env.example` lists the new keys; `.env.local` gitignored.** `server.ts` + the route read only env; `.env.local.example` adds the Supabase + `APP_ENV` keys (names only); `git check-ignore .env.local` → `.env.local`.
- **A real local run writes one verified row; anon key cannot read.** `POST /api/score` (running dev server) → `{"ok":true}` HTTP 201; verify script: `✓ version stamps + norms_stage present — tb=1.0.0 sc=1.0.0 nv=1.0.0 stage=seed`, `✓ environment stamped — development`, `✓ anon key CANNOT read rows (RLS) — 0 rows`, `✓ anon key CANNOT insert (RLS) — denied: 42501`.
- **`build`, `lint`, `typecheck`, `test` all pass.** typecheck ✓, lint ✓ (0 problems), build ✓ (`ƒ /api/score` added; `server-only` guard holds), test ✓ (**44 files, 290 tests**), format ✓.
- **State files updated; Decisions appended; adversarial review done.** `current-state.md` / `file-map.md` / `00_stack-and-config.md` updated; `Decisions.md` D-106…D-115; review summary below.

## Decisions made on the fly

Logged as `Decisions.md` **D-106 … D-115**. In brief:

1. **D-106 anti-join by construction** — random `id` + date-only `created_date` (no `created_at`/timestamp).
2. **D-107 RLS on, no policies** — only the server-side service role writes; browser → `/api/score` only.
3. **D-108 descriptive index column names** (`memory_focus`/`planning_speed`/`learning_stem`) via one tested `INDEX_COLUMN` map.
4. **D-109 enums follow live code** — `validity_status` `ok/mild/strong` (not the brief's "none"); confidence `high/medium/low` (not "med"). Using the brief's literals would have failed every insert.
5. **D-110 server-stamped `environment`** from `APP_ENV` (data hygiene); client value rejected.
6. **D-111 score write is separate + non-blocking** (fire-and-forget, self-catching, decoupled from the lead).
7. **D-112 confidence columns stored** (the brief's "recommended" option).
8. **D-113 client builds the row, server re-validates with the same strict schema; `ScoreRow = z.infer`; `age` from `result.meta`** (not re-passed — removes a divergence footgun).
9. **D-114 applied via `db push --db-url <session-pooler>`** (no access token available; `link` needs API auth) + an ad-hoc CLI re-sign.
10. **D-115 branched from `main`** (PR #9 merged).

## Surprises / off-spec changes

- **The brief's enum literals didn't match the live code** — `validity` is `"ok"` (not "none") and confidence is `"medium"` (not "med"). The migration + schema follow the live types (D-109); a parity test guards it.
- **The Supabase CLI binary was SIGKILL'd on launch** — the npm-shipped arm64 binary arrived linker-signed and the kernel rejected it; `codesign --force --sign -` re-signed it ad-hoc (local-machine quirk, not committed; D-114).
- **No Supabase access token was provided** (only DB password + project ref), so `supabase link` was not usable headless; `db push --db-url` over the IPv4 **session pooler** (`aws-1-eu-central-1.pooler.supabase.com:5432`) applied the migration with just the password (the direct `db.<ref>.supabase.co` host is IPv6-only and unreachable here). The SQL is also runnable by hand (dashboard SQL editor) as the documented fallback.
- **The Cowork half's project defaults** ("Data API enabled, expose-new-tables on") mean RLS-with-no-policies is the load-bearing lock — confirmed live (anon SELECT 0 rows, anon INSERT `42501`).

## Adversarial review (internal — CodeRabbit/Codex still unconnected)

A 6-dimension multi-agent review (privacy/anti-join, security/RLS, correctness/mapping, route/Zod edge cases, test quality, repo-fit) with adversarial verification of every finding: **9 raised → 5 confirmed (0 must-fix, 3 should-fix, 2 nits), 0 uncertain.** All 5 fixed:

- **(should-fix) The real `writeScore`/`postScore` was untested** — only a synchronous-throw via a mocked dep was covered, not the production `.catch()` async-swallow. → Added `src/features/lead/__tests__/score.test.ts`: mocks `fetch` for a 500 and a network reject, asserts `writeScore` returns void synchronously, the write still fires, and **no unhandled rejection** leaks; asserts `postScore` POSTs the exact built row and throws on non-2xx.
- **(should-fix) `current-state.md` not yet updated.** → Updated (Part-2 / 2.01 snapshot, integrations, infra, run instructions).
- **(should-fix) `file-map.md` referenced a not-yet-existing Code report.** → Resolved by filing this report; the `-Code` name is intentional (parallels `-Cowork`).
- **(nit) The `conf_*` enum parity check was unanchored** (one correct column could mask a corrupted one). → `migration.test.ts` now anchors each of the five `conf_*` CHECKs to its own column.
- **(nit) `dump-score-row.ts` used the `@/` alias** while the other dump scripts use relative imports. → Switched to relative imports.

## Files written / updated

**New:**
- `supabase/config.toml`, `supabase/.gitignore` — `supabase init` scaffold (CLI config for `db push`).
- `supabase/migrations/20260624021436_create_scores.sql` — the `public.scores` migration (RLS-locked, date-only, no PII; documenting comments).
- `src/lib/supabase/server.ts` — server-only service-role client (`getServiceRoleClient`).
- `src/features/scoring/persist/score-row.ts` — pure `buildScoreRow` + strict `scoreRowSchema` + `ScoreRow`/`SCORE_ROW_KEYS`/`SIGNAL_KEYS`/`INDEX_COLUMN`/`ScoreDemographics`.
- `src/features/scoring/persist/index.ts` — barrel.
- `src/features/scoring/persist/__tests__/score-row.test.ts`, `…/migration.test.ts` — row contract + SQL↔code parity.
- `src/app/api/score/route.ts` — `POST /api/score`.
- `src/app/api/score/__tests__/route.test.ts` — route validation (client mocked).
- `src/features/lead/score.ts` — client `postScore` / fire-and-forget `writeScore`.
- `src/features/lead/__tests__/score.test.ts` — the real write path (fetch mocked).
- `scripts/dump-score-row.ts` — print a sample `/api/score` payload.
- `scripts/verify-scores-db.ts` — live RLS + row-shape verification.
- `src/_project-state/completions/Part-2-Phase-01-Code.md` — this report.

**Modified:**
- `src/features/lead/submit.ts` — `runLeadSubmit` fires the non-blocking `writeScore` (new `LeadSubmitDeps.writeScore`).
- `src/features/lead/index.ts` — export `writeScore` / `postScore`.
- `src/features/lead/__tests__/submit.test.ts` — score-write ordering / coarse-only payload / non-blocking.
- `src/app/(site)/procena/lead-form.tsx` — pass the real `writeScore` into `runLeadSubmit`.
- `.env.local.example` — Supabase runtime + CLI keys + `APP_ENV` (names only).
- `package.json` / `package-lock.json` — `@supabase/supabase-js` 2.108.2, `server-only` 0.0.1, `supabase` 2.107.0 (dev).
- `src/_project-state/{current-state,file-map,00_stack-and-config}.md`, `Decisions.md` — state + decisions.

## Tests run + results

- `npm run typecheck` ✓ · `npm run lint` ✓ (0 problems) · `npm run build` ✓ (route `ƒ /api/score`; `server-only` guard holds) · `npm test` ✓ (**44 files, 290 tests**; was 40/248) · `npm run format:check` ✓.
- **Live:** migration applied (`db push` → Finished); `POST /api/score` through the running dev server → 201 + 1 row inserted; `verify-scores-db.ts` → ALL CHECKS PASSED (date-only, versions, `environment=development`, no PII column; anon read 0 rows; anon insert `42501`).

## Blocked / carryover

- [ ] **Rate-limiting / anti-bot on `/api/score`** — not in scope this phase; revisit alongside the form's rate-limit when 2.02 wires Brevo (CLAUDE.md security rule). The route is anonymous-write-only and shape-validated, but a forged-but-valid payload could write noise (tagged `environment` so it's excludable).
- [ ] **A Supabase personal access token** would let future migrations use `supabase link` + `db push --linked` instead of the `--db-url` session-pooler form (D-114). Not blocking.
- [ ] **Centers-by-city `<select>` + the real booking URL** remain pending Cowork assets (unchanged from 1.08).
- [ ] **One dev-environment row** is left in `public.scores` as live-verification evidence (`environment='development'`, explicitly excludable from real norms).

## What's next

**Part 2 · Phase 2.02 — Brevo lead + transactional PDF email.** The `submitLead` seam becomes real (create/update the Brevo lead; e-mail the 1.09 PDF, never stored) and disclaimer placement #5 (the transactional e-mail) is wired from the existing `legal.*` copy. The score write built here stays decoupled — 2.02 must keep the two stores non-joinable (no shared key passed into `submitLead`).

---
*IqUp-V2 | Part 2 · Phase 01 (Code) Completion | 2026-06-24*
