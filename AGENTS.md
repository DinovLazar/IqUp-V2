# IqUp-V2 — Agent Guide

> The single canonical guide for any AI agent working in this repo. Orchestration rulebook: `project-instructions.md`. Product source of truth: `IQ_UP_Specifikacija_v1_2_FINAL.pdf`. **Precedence: live code > `src/_project-state/current-state.md` > planning docs** (`plan.md`, `phase-plan.md`).

## What this is

A free, mobile-first web app (lead magnet): an adaptive cognitive + STEM assessment for children 5–13, **deterministic — no AI at run-time**. Macedonian MVP. It captures a parent lead in Brevo and e-mails a branded PDF report. Production domain will be **iq.iqup.mk** (D-003; Cloudflare DNS-only record to Vercel, D-005). **No Vercel connection or deploy exists yet — that is Phase 2.05**; everything runs locally today. Already live from local: Supabase (anonymous scores + admin auth) and Brevo (contact upsert + transactional e-mail). Stubbed: GA4/Meta (2.03, externally blocked).

## Who you are

You execute **exactly one phase per session**, from a phase prompt Lazar hands you (plus any Design handover in `docs/design-handovers/`). Phase planning happens elsewhere — see `project-instructions.md`. **One phase = one completion report = one PR.**

## Stack

- **Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict.** Alias `@/*` → `./src/*`.
- **Tailwind v4, CSS-first** — there is NO `tailwind.config`; all brand tokens live in `src/app/globals.css` `@theme`. shadcn/ui on the `radix-ui` package; the `shadcn` dep is load-bearing (`globals.css` imports `shadcn/tailwind.css`). No dark mode.
- **Motion** v12 (import from `motion/react`) · **next-intl 4** — single locale `mk` at root, no i18n routing; ALL parent/child-facing copy lives in `messages/mk.json`.
- React Hook Form + Zod 4 · **@react-pdf/renderer** (server-side PDF; in `serverExternalPackages`; bundled OFL Montserrat TTFs) · **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`, guarded with `server-only`; `supabase` CLI as devDep for migrations).
- **Vitest**: default env **node** (the pure cores); `.test.tsx` component tests opt into jsdom per-file via a `// @vitest-environment jsdom` docblock. Test files are inside tsconfig `include`, so `npm run typecheck` type-checks them.
- **npm** (`package-lock.json` is the only lockfile). **Log every dependency add/upgrade and stack/config change in `src/_project-state/00_stack-and-config.md` (append-only, with pinned versions).** No `engines` field; the dev machine runs Node 26 (Vercel will pin its own Node runtime when the deploy lands in Part 2).

## Commands

```bash
npm run dev            # localhost:3000 · /procena assessment · /admin panel · /kit dev-only UI gallery (404s in prod)
npm test               # vitest run  (npm run test:watch to watch)
npm run typecheck && npm run lint && npm run build && npm test && npm run format:check
                       # ^ the end-of-phase quality gate — ALL green before the PR
npx tsx scripts/dump-tasks.ts        # sample generated items as JSON
npx tsx scripts/dump-report-pdf.ts   # all 5 fixture PDFs → gitignored ./tmp/ (visual QA)
npx tsx scripts/dump-score-row.ts    # sample /api/score payload (the no-PII row)
set -a; . ./.env.local; set +a; npx tsx scripts/verify-scores-db.ts   # live DB check (also verify-admin-db.ts)
supabase db push --db-url "<session-pooler-url>"   # migrations — no access token, so no `supabase link` (D-114)
```

**`npm run build` FAILS without the Supabase env vars set** (the `/admin/login` prerender) — with `.env.local` present it is green.

## Repo layout

- Root docs — `project-instructions.md` (orchestrator rulebook), `plan.md` (target spec), `phase-plan.md` (phase index), `brand.md`, `Decisions.md` (append-only decision log), the spec PDF.
- `src/_project-state/` — **live state**: `current-state.md` (single source of "where are we"), `file-map.md` (every file, one line), `00_stack-and-config.md` (append-only stack log), `completions/` (one report per phase + `_TEMPLATE.md`).
- `src/app/` — `(site)` public routes (`/`, `/procena`, `/za-testot`, `/politika-za-privatnost`, `/uslovi`) · `admin` (login + TOTP 2FA, stats, contacts) · `api/` (`score`, `lead`, `admin/export`) · `kit` (dev gallery) · `embed` (reserved). **There is NO `/api/report` route** — the PDF renders in-process inside `/api/lead` (D-117).
- `src/features/` — assessment, tasks, scoring, report (incl. `pdf/`), lead, timing, progress (localStorage third store), admin. `src/content/` — versioned task bank, `norms/seed-norms.ts` (**the single tuning surface**), MK report modules. `src/lib/` — indices, pentagon, prng, env, analytics, `supabase/`, `brevo/`.
- `supabase/migrations/` — SQL migrations, applied live. `docs/ai-review-setup.md` — CodeRabbit/Codex connect runbook.

## Workflow

- Branch off `main`: `phase-X.YY-<slug>` (code/design) or `cowork/<slug>` (docs-only). **`main` = production, protected, PR-only.**
- PR: descriptive title + Summary (2–4 bullets) + Test Plan, via `gh pr create --base main --title "<title>" --body "<summary + test plan>"`. The completion report is committed in the **same PR**.
- **Nobody merges their own PR — Lazar (the human owner) merges.**
- **End-of-phase ritual:** (1) write `src/_project-state/completions/Part-X-Phase-YY-Completion.md` (template in that folder); (2) update `current-state.md` + `file-map.md`; (3) append to `00_stack-and-config.md` if stack/config changed; (4) append your own decisions to `Decisions.md` — sequential `D-NNN`, chronological across phases, **never edit old entries** (reversals get a new entry) — and call them out in the report.
- AI review: CodeRabbit on every PR, Codex on architectural ones (`.coderabbit.yaml` is committed). **The GitHub-app connect is still pending** (`docs/ai-review-setup.md`) — until it lands, substitute an internal adversarial review pass. Skip review only for no-code `cowork/*` PRs.

## Hard product rules (non-negotiable, test-enforced)

- **Determinism.** No AI at run-time; no `Math.random`/`Date`/env in the engine trees (static-scan tested). Everything seedable: same answers → same path, same scores, same report. Task bank / norms / scoring / report modules are **versioned**; versions are stamped per record.
- **Never "clinical IQ".** No exact IQ number, no diagnosis, no ranking against other children. Indices show hybrid: pentagon + per-index bar + word label (In development / Solid / Strong / Exceptional) + indicative range — **never a hard number** (PDF included).
- **Two language registers.** Internal = precise technical terms. **Parent-facing = plain Macedonian, zero jargon** (voice-lint tested) — never "neuroscience", "executive functions", "cognitive domains". Child-facing: encouragement only; "areas to grow", never deficits / weakness / "falling behind".
- **GDPR / three unjoinable stores.** No child name, ever; parent **first name only**. Store A = anonymous scores (`public.scores`, no PII, date-only) · Store B = Brevo leads · Store C = on-device localStorage progress. **They must never be joinable** (static-scan tested; no shared keys). **The PDF is never stored.** No PII in analytics or logs.
- **Disclaimer.** "Informative, not diagnostic" in all **7 placements**: landing footnote, pre-start screen, results screen, PDF top + bottom, e-mail, About-the-test page, cookie banner. One shared `Disclaimer` component / `legal.*` mk.json keys — **never hardcode the copy** (single-source guarded). 6 of 7 are live; the cookie banner lands in 3.03.
- **Accessibility WCAG 2.2 AA** — keyboard + visible `focus-visible`, contrast ≥ 4.5:1, never color-only meaning, tap targets ≥ 44px (≥ 72px at ages 5–6), respect `prefers-reduced-motion`; **no anxious timers except the speed game (Gs)**. **Performance:** Lighthouse 95+ (mobile + desktop), first load < 2.5s on 4G.

## Security

- **Public repo.** Secrets live ONLY in gitignored `.env.local` locally and in Vercel env settings once deployed — never in code or committed files. Var shapes: `.env.local.example`.
- `APP_ENV` stamps score rows AND routes Brevo leads: `production` → list 7, anything else → list 8. Analytics + Meta are OFF outside production.
- Validate + sanitize all input (shared Zod schemas). Rate-limit / anti-bot on the API routes is a deferred Part-3 item — flag it, don't improvise it.

## Gotchas

- `src/middleware.ts` prints a Next 16.2 middleware→proxy deprecation warning — **known and deliberate** (D-128); don't rename it casually.
- **No CI** (no `.github/`): the quality gate is the local script suite + PR review.
- Markdown is excluded from Prettier (`.prettierignore`) — hand-authored docs keep their formatting.
- Brevo rejects the production sender `noreply@iqup.mk` until `iqup.mk` is DNS-authenticated (Cowork carryover); e-mail sends are best-effort and never block the lead or confirmation.
- Admin login needs a one-time Supabase dashboard setup (enable email auth, disable sign-ups, enable TOTP MFA, create the admin, insert its `user_id` into `public.admin_users`) — steps in `current-state.md`.
- The npm-installed Supabase CLI binary once arrived broken-signed on this Mac and needed `codesign --force --sign -` (D-114).
- The local checkout is **macOS** (`/Users/lazar/Projects/IqUp-V2`, D-001). `tmp/` (PDF QA output) and `.claude/` (local launch config, dev server on port 3000) are gitignored.
- `notion-checklist.md` is referenced by planning docs but does NOT exist in the repo (owned by Chat).

---
*IqUp-V2 | AGENTS.md | 2026-07-06*
