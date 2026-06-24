# Part 2 · Phase 01 — Create the Supabase project (anonymous scores DB) · Completion Report

**Phase:** Part 2 · Phase 01 — Cowork: create the Supabase project + place credentials
**Executing Claude:** Cowork
**Date completed:** 2026-06-24
**Branch:** `main` (no code branch — infra/credentials only; nothing committed by this phase)
**Commits:** none (the only file produced, `.env.local`, is gitignored and must never be committed)
**PR:** n/a

## What shipped

- A new Supabase project, **`iqup-v2`**, created under Lazar's personal account in org **"IqUp Iq"** (Free plan), in the **EU region Central EU (Frankfurt) — `eu-central-1`** (GDPR requirement met).
- All five credentials written into the repo's gitignored **`.env.local`** with the exact variable names required: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- The database was left **empty** — no tables, columns, or schema created. The `public` schema is untouched, ready for Code's repo migration (the dashboard shows "No migrations").
- Verified `.env.local` is gitignored and is neither staged nor committed.

## Project facts (non-secret)

- **Project name:** `iqup-v2`
- **Organization:** IqUp Iq (Free plan) — Lazar's personal account
- **Region:** Central EU (Frankfurt) — `eu-central-1`
- **Project ref:** `rdhvpypbwefmafejclfy`
- **Project / API URL:** `https://rdhvpypbwefmafejclfy.supabase.co`
- **Dashboard URL:** https://supabase.com/dashboard/project/rdhvpypbwefmafejclfy
- **service_role key & database password:** generated and placed in `.env.local` only — **deliberately not recorded here** (secrets).

## Decisions made on the fly

1. **Used the web dashboard (Chrome) rather than the Supabase MCP** — the connector is linked to the account but was not enabled for this chat, so its tools weren't callable; Goran chose the browser path.
2. **Generated a 28-char alphanumeric DB password** (no URL-significant symbols) — so it stays safe to embed in a Postgres connection string later without escaping issues. Stored only in `.env.local`.
3. **Captured the legacy `anon` / `service_role` keys** (not the new publishable/secret keys) — the repo's env shape and the brief both call for `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`, which are the legacy JWT keys.
4. **Left the default Security options** on project creation (Data API enabled, expose-new-tables on, automatic RLS off) — these create no tables, so the DB is still empty and Code's migration controls the actual schema and RLS.

## Surprises / off-spec changes

- The org already contains a separate active project named **`iqup-web`** (eu-central-1) plus two paused projects. `iqup-v2` is distinct and new; no existing project was touched. Two active free-tier projects (iqup-web + iqup-v2) is within the Free plan limit.
- A pre-existing `.git/index.lock` could not be unlinked from the sandbox mount during a read-only `git ls-files` check (harmless to this phase; `git status` is clean). Worth a glance if Lazar hits a "index.lock" message on his next commit.

## Files written / updated

**New:**
- `/.env.local` — the five Supabase variables (gitignored; real values; NOT committed).
- `src/_project-state/completions/Part-2-Phase-01-Cowork.md` — this report.

**Modified:**
- None.

## Tests run + results

- `git check-ignore .env.local` → prints `.env.local` ✓ (gitignored).
- `git status --porcelain` → empty ✓ (nothing staged/modified; `.env.local` does not appear).
- `git ls-files .env.local` → empty ✓ (not tracked); `git status --ignored` shows `!! .env.local` ✓.
- `.env.local` contains all five required variable names ✓.
- Dashboard confirms region = Central EU (Frankfurt), "No migrations", empty DB ✓.

## Blocked / carryover

- [ ] Project status briefly showed "Unhealthy" immediately after creation (normal during provisioning) — it should be healthy within a couple of minutes. No action needed.

## What's next

**Part 2 · Phase 01 (Code half):** write the table schema as a repo migration and build the write path for anonymous scores against this database, using the credentials now in `.env.local`. The DB is intentionally empty so the migration is the single source of truth.

---
*IqUp-V2 | Part 2 · Phase 01 Completion | 2026-06-24*
