# Part 2 · Phase 04 — Admin panel (Supabase Auth + 2FA, stats, contacts, CSV export) · Completion Report

**Phase:** Part 2 · Phase 04 (Code) — the login-protected admin panel
**Executing Claude:** Code
**Date completed:** 2026-06-24
**Branch:** `phase-2.04-admin-panel` (cut from `main` — PR #11 / 2.02 is merged, D-125)
**Commits:** `14b8ffd` (phase work + report) + this `docs:` backfill
**PR:** [#12](https://github.com/DinovLazar/IqUp-V2/pull/12) into `main` (Lazar merges)

## What shipped

- **A login-protected admin panel at `/admin`**, `noindex` and unlinked from any public nav. Supabase Auth with **email+password + TOTP 2FA** at `/admin/login`; admin access requires assurance level **aal2**.
- **`requireAdmin()` is the real security boundary** (`src/lib/supabase/admin-guard.ts`): valid session (`auth.getUser()`) + **aal2** (MFA satisfied) + `user_id` present in the new `public.admin_users` allowlist (read via the service-role client, fail-closed). **Every** admin page and the export route calls it; `src/middleware.ts` refreshes the session and redirects unauthenticated `/admin/**` → `/admin/login` (login excluded). Verified live: unauthenticated `/admin` + `/admin/contacts` redirect to login, and `/api/admin/export` returns 401 with no data.
- **`/admin` stats** — aggregates from `public.scores` (env-filtered) via a `security invoker` RPC `public.admin_score_stats` (execute granted **only** to `service_role`), so **only aggregates** cross the boundary: total + by age/gender/city/language + the per-index four-band distribution. Band cut-offs live in a SQL `score_band()` helper guarded by a code↔SQL parity test.
- **`/admin/contacts`** — contacts read **live** from the env-resolved Brevo list (prod→7 / else→8): first name, email, phone, city, gender, the three consents, and **date-only** signup — with **NO age and NO results** (decision 1). Server-side filter (city/gender/marketing) + pagination; the Brevo key never reaches the client.
- **CSV export** (`GET /api/admin/export`, `requireAdmin()`-gated) — streams the filtered contacts (UTF-8 BOM + CRLF, RFC-4180-escaped, spreadsheet-formula-neutralized), with a **marketing-consent-only** variant. **Every export writes one PII-free `public.admin_export_log` row, fail-closed** (an audit-write failure returns 500 and no CSV).
- **Two stores stay unjoinable** (§14.1): contacts read only Brevo, stats read only `public.scores` aggregates, the contact shape carries no age/score key, and a static-scan test forbids any admin file from reading both stores. Four RLS-locked migrations applied live; one new pinned dependency (`@supabase/ssr` 0.12.0); admin UI built from the existing kit + a new `admin` mk.json namespace.

## Decisions made on the fly

Logged as `Decisions.md` **D-121 … D-128** (the brief's resolved decisions 1–4 + four on-the-fly). In brief:

1. **D-121** — contacts view **omits child age** (age lives only in Store A; showing it per-contact would require a forbidden join). *Resolved decision 1.*
2. **D-122** — every CSV export writes a **PII-free** `admin_export_log` row (actor + type + filter summary + count + timestamp; no parent data). *Resolved decision 2.*
3. **D-123** — "sync to Brevo" = **live read + CSV export, no push**; read+export only (no edit/delete). *Resolved decision 3.*
4. **D-124** — **single implicit admin role via a positive allowlist**; `requireAdmin()` is the one extension point; allowlist read is fail-closed. *Resolved decision 4.*
5. **D-125** — branched from `main` (PR #11 merged; mirrors D-116…).
6. **D-126** — stats via a `security invoker` **RPC** + a SQL `score_band()` guarded by a parity test, execute locked to `service_role`; **four** migrations (the two named tables + the stats functions + an execute-lockdown migration, because Supabase's default `anon`/`authenticated` execute grant survived `revoke … from public`). Task 5 explicitly sanctioned "a view/RPC".
7. **D-127** — the CSV-export audit is **fail-closed** (untraceable PII egress is worse than a temporarily blocked export).
8. **D-128** — **kept `src/middleware.ts`** despite the Next 16.2 `middleware`→`proxy` deprecation warning (the brief mandates `middleware.ts` in Scope + DoD; it works; the rename is flagged as carryover).

## Surprises / off-spec changes

- **The RPC execute grant needed a second migration.** `revoke all … from public` on the new functions did **not** remove Supabase's DEFAULT execute grant to `anon`/`authenticated`, so a fourth migration revokes those explicitly. Verified live: it was never a data leak — `admin_score_stats` is `security invoker`, so an anon caller runs as `anon`, hits RLS on `public.scores` (enabled, no policies), reads 0 rows, and gets `total:0` empty aggregates; execute is now revoked anyway (anon denied `42501`).
- **`listFactors().totp` is verified-only in the SDK types.** The login flow's stale-unverified-factor cleanup had to look in `factors.all` (filtering `factor_type === "totp" && status === "unverified"`), not `factors.totp`.
- **Next 16.2 deprecates the `middleware` file convention** in favour of `proxy`. The build emits a warning and shipping both files is a hard error; `src/middleware.ts` still works (registered as "Proxy (Middleware)"). Kept per the brief (D-128); rename flagged as carryover.
- **The authenticated flow can't be fully exercised this phase** — it needs the one-time Supabase dashboard setup (below), which requires dashboard access not available to Code. The unauthenticated boundary (redirect + 401) is verified live; everything else is covered by unit tests.

## Adversarial review (internal — CodeRabbit/Codex still unconnected)

A 5-dimension multi-agent review (security/auth, privacy/unjoinable, correctness, spec/i18n, test-quality/repo-fit) with adversarial verification of every finding: **15 raised → 10 confirmed (0 must-fix, 3 should-fix, 7 nits).** Fixes applied:

- **(should-fix) CSV spreadsheet formula injection** — parent-controlled fields (first name, city, `+`-prefixed phone) starting with `=/+/-/@` were emitted unquoted into an Excel-targeted CSV. Added `neutralizeFormula` (leading-`'` prefix) applied to string cells before RFC-4180 escaping; covered by tests.
- **(should-fix) `fetchAllContactsFromList` cap/truncation path untested** — added a `max`-clamp + `truncated===true` test and a bogus-`count` paging test.
- **(should-fix) `middleware`→`proxy` deprecation** — **not applied as a rename**; kept `src/middleware.ts` per the brief and logged D-128 + a carryover (the only declined should-fix, by deliberate decision).
- **(nits, applied)** allowlist read error now logged PII-free (diagnosability); login clears a stale unverified TOTP factor before enrolling (prevents factor-cap brick); `fetchAllContactsFromList` count-guard `total > 0` (a bogus full-page+`count:0` no longer short-circuits); **signup normalized to date-only** at the mapping boundary (CSV + table now consistent, matches the date-only ethos); broadened the unjoinable static scan to cover `src/features/admin/**` + `src/lib/brevo/**`; added a stats-page test pinning the env-scoped RPC wiring; added CSV CR-escaping + CRLF-separator assertions.

## Files written / updated

**New — migrations (applied live, tracked in `supabase_migrations`):**
- `supabase/migrations/20260624120000_create_admin_users.sql` — allowlist (RLS on, no policies).
- `supabase/migrations/20260624120100_create_admin_export_log.sql` — PII-free export audit (RLS on, no policies).
- `supabase/migrations/20260624120200_create_admin_score_stats.sql` — `score_band(int)` + `admin_score_stats(text)` (security invoker; execute → service_role).
- `supabase/migrations/20260624120300_lock_admin_score_stats_execute.sql` — revoke default anon/authenticated execute.

**New — auth + app:**
- `src/lib/supabase/admin-browser.ts`, `admin-server.ts`, `admin-guard.ts` — SSR auth clients + `requireAdmin()`/`requireAdminPage()`.
- `src/middleware.ts` — `/admin/:path*` session refresh + unauthenticated redirect.
- `src/features/admin/{contacts,csv,stats,audit,index}.ts` — pure core (shape/filter/paginate, CSV, stats normalize, audit row).
- `src/app/admin/{layout,admin-shell,sign-out-button,page}.tsx`, `login/{page,login-form}.tsx`, `contacts/page.tsx` — pages + chrome.
- `src/app/api/admin/export/route.ts` — CSV export route.
- `scripts/verify-admin-db.ts` — live DB verification.
- Tests: `src/lib/supabase/__tests__/admin-guard.test.ts`, `src/features/admin/__tests__/{contacts,csv,stats,audit,migration-parity}.test.ts`, `src/app/api/admin/export/__tests__/route.test.ts`, `src/app/admin/__tests__/{unjoinable-stores,stats-page}.test.ts`, `src/lib/brevo/__tests__/list-contacts.test.ts`.

**Modified:**
- `src/lib/brevo/server.ts` — `BREVO_CONTACT_ATTRIBUTES` (locked names, tied to the upsert contract) + `listContactsFromList`/`fetchAllContactsFromList` (read → displayed-fields-only `AdminContact[]`, date-only signup).
- `messages/mk.json` — new `admin` namespace.
- `package.json` / `package-lock.json` — `@supabase/ssr` 0.12.0 (pinned exact).
- `.env.local.example` — already documented "Supabase (anonymous scores + admin auth) — Phase 2.01 / 2.04" + the anon key; no new var added.
- `src/_project-state/{current-state,file-map,00_stack-and-config}.md`, `Decisions.md` — state + decisions.

## Tests run + results

- `npm run typecheck` ✓ · `npm run lint` ✓ (0 problems) · `npm run build` ✓ (routes `ƒ /admin`, `ƒ /admin/contacts`, `○ /admin/login`, `ƒ /api/admin/export`; middleware registered as "Proxy (Middleware)" — one non-fatal deprecation warning, D-128) · `npm test` ✓ (**57 files, 392 tests**; was 47/323) · `npm run format:check` ✓.
- **Live (real EU project `rdhvpypbwefmafejclfy`):** four migrations applied (`supabase db push` → "Finished"); `scripts/verify-admin-db.ts` → ALL CHECKS PASSED — service role queries `admin_users` + `admin_export_log` (tables exist, RLS-locked) and calls `admin_score_stats('development')` (aggregates: total=1, all five index bands present); **anon CANNOT read `admin_users`** (0 rows) **or call the RPC** (`42501`).
- **Live boundary (dev server):** unauthenticated `/admin` + `/admin/contacts` → redirect to `/admin/login`; `/api/admin/export` → `401 {"ok":false,"error":"unauthorized"}` (no data, no audit row); `/admin/login` renders the form; no server/console errors.

## Definition of Done — evidence

- **`@supabase/ssr` installed, pinned, recorded** — `0.12.0` exact in `package.json`; logged in `00_stack-and-config.md`.
- **`/admin/login` email+password + TOTP 2FA; pages require aal2** — login state machine (sign-in → enrol/challenge → aal2); `requireAdmin()` requires `currentLevel === "aal2"`.
- **`requireAdmin()` enforces session + aal2 + allowlist; called by every page + export; middleware refreshes + redirects (login excluded)** — `admin-guard.ts` + each page + the route; `middleware.ts` matcher `/admin/:path*`. Live-verified.
- **`/admin` aggregate stats from `public.scores` (env-filtered); only aggregates leave Postgres** — `admin_score_stats` RPC; page reads only the RPC.
- **`/admin/contacts` from the env-resolved Brevo list; columns = decision 1 (no age, no results); paginated + filterable** — implemented; `ADMIN_CONTACT_KEYS` guarded by a test.
- **CSV export downloadable; marketing-only returns only `consentMarketing=true`; auth-gated** — `export/route.ts`; tested.
- **Every export writes a PII-free `admin_export_log` row** — `buildExportAuditRow` + fail-closed insert; tested PII-free.
- **Two migrations applied live, RLS enabled, no anon access** — all four applied (the two tables + the stats RPC + lockdown); verified.
- **Secrets server-side only** — service-role key + Brevo key never client-exposed (`server-only` guards); admin contact reads go through the server-only Brevo client; only the public anon key is used in the browser/middleware.
- **Stores never joined (test-guarded)** — `unjoinable-stores.test.ts` static scan.
- **`/admin/**` noindex, not in public nav; existing kit; `admin` namespace** — layout metadata `robots: { index:false, follow:false }`.
- **`build` · `lint` · `typecheck` · `test` · `format:check` pass; Task-9 tests exist + pass** — yes (392 tests).
- **Decisions 1–4 logged; state files updated; report filed with dashboard prerequisites** — D-121…D-128; this report.

## One-time Supabase dashboard prerequisites (dashboard actions, NOT code)

Before the login flow works end-to-end (these could not be done by Code — no dashboard access):
1. **Authentication → enable the Email (email/password) provider.**
2. **Disable public sign-ups** (the allowlist backstops this — D-124).
3. **Enable TOTP MFA.**
4. **Create the first admin user** (email + password).
5. **Insert that user's `user_id` (UUID) into `public.admin_users`** — SQL editor: `insert into public.admin_users (user_id, label) values ('<uuid>', 'Owner');`.

On first login the user sets up TOTP (QR/secret shown), reaches aal2, and lands on `/admin`. Subsequent logins challenge the TOTP code.

## Blocked / carryover

- [ ] **The one-time Supabase dashboard setup above** must be done before the panel is usable past login.
- [ ] **Rename `src/middleware.ts` → `src/proxy.ts`** (Next 16.2 deprecation, D-128) — trivial follow-up (also rename the exported `middleware` → `proxy`).
- [ ] **Rate-limit / anti-bot on `/api/admin/export`** — Part 3 hardening (route is aal2+allowlist-gated, so low risk).
- [ ] **Vercel env at 2.05** — no new env var, but ensure the existing Supabase + Brevo vars are present on every deploy environment.
- [ ] **No real admin user / allowlist row yet** — the authenticated screens (stats/contacts/export) are unit-tested but not live-walked this phase.

## What's next

**Part 2 · Phase 2.03 — Meta Pixel/CAPI + GA4** (the analytics phase the panel deliberately fired no events into). The admin panel stays analytics-free; 2.03 wires the public-flow tracking. Chat should flag to Lazar: (1) do the one-time Supabase dashboard setup so the panel is usable; (2) the `middleware.ts`→`proxy.ts` rename decision (D-128) is open for ratification.

---
*IqUp-V2 | Part 2 · Phase 04 Completion | 2026-06-24*
