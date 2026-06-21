# IqUp-V2 — Claude Conventions

> First file any Claude (or agent) session reads inside this repo. Short and authoritative. The orchestration rulebook is `project-instructions.md`; the product source of truth is `IQ_UP_Specifikacija_v1_2_FINAL.pdf`. **Where this file and the live code disagree, the live code wins.**

## What this project is

A free, mobile-first web app (lead magnet) running an adaptive cognitive + STEM assessment for children 5–13, **deterministically (no AI at run-time)**. It captures a parent lead in Brevo, emails a branded PDF, and drives CTA clicks to an external booking page. This build ships the **Macedonian MVP**.

Tech stack: Next.js (App Router) + TypeScript, Tailwind, shadcn/ui (Radix), Motion, Lucide, custom SVG, React Hook Form + Zod, next-intl, @react-pdf/renderer, Supabase (Postgres EU) + Supabase Auth, Brevo, GA4 + Meta Pixel/CAPI, Vercel, Cloudflare.

## Who you are

If you're reading this inside the repo, you're **Claude Code** (or another execution agent) running a phase. Your job: read the phase prompt Lazar hands you (and any Design handover it references), do exactly that phase, then write a completion report and update the state files. You are **not** the orchestrator — phase planning happens in the project chat (Claude Chat). **One phase = one completion report = one git PR.**

## Repo layout

- `docs/design-handovers/` — Design handovers (`Part-X-Phase-YY-Handover.md`). Read the matching one before writing code for a phase that depends on it.
- `src/_project-state/` — live project state:
  - `current-state.md` — the single source of truth for "where are we." Update at the end of every phase.
  - `file-map.md` — every file with a one-line description. Keep it current.
  - `00_stack-and-config.md` — append-only stack + config log with pinned versions.
  - `completions/Part-X-Phase-YY-Completion.md` — one report per phase.
- `src/app/` — routes + `api/` serverless backend (`lead`, `report`, `score`).
- `src/features/` — assessment engine, tasks, scoring, report engine.
- `src/content/` — versioned task bank, report modules, seed norms.
- `src/components/`, `src/lib/`, `messages/`, `public/` — UI, integrations, i18n strings, assets.

Phase prompts come from the project chat (Lazar downloads and hands them over) — there is **no `briefs/` folder** in this repo.

## Branch & PR discipline

- **`main` = production** (`iq.iqup.mk`). Protected, PR-only. Vercel auto-creates a preview URL for every other branch/PR.
- Branch from `main`:
  - `phase-X.YY-<slug>` — a Code or Design phase (e.g. `phase-1.04-task-bank`).
  - `cowork/<slug>` — docs/planning/manual only, no code.
- Every PR: a descriptive title; a body with a Summary (2–4 bullets) + a Test Plan; the completion report committed in the **same PR**.
- **Nobody merges their own PR — Lazar (the human owner) merges.**

## AI review workflow

1. On PR open, wait ~2 min for **CodeRabbit**'s inline review.
2. For architectural PRs (migrations, cross-module flows, new integrations, the scoring/report engines), request a **Codex** review.
3. Address must-fix items with new commits on the same branch.
4. Lazar merges once must-fix items are resolved. Skip AI review only for `cowork/*` PRs with no code.

## End-of-phase ritual (every phase)

1. Write the completion report → `src/_project-state/completions/Part-X-Phase-YY-Completion.md` (template in that folder).
2. Update `current-state.md` and `file-map.md`.
3. Append to `00_stack-and-config.md` if stack/config changed.
4. Append to `Decisions.md` (repo root) any decision you made on your own — and call it out in the report so Chat can surface it to Lazar.

## Product & architecture rules (non-negotiable — from the spec)

**Determinism & no AI.** No AI at run-time. The report is a deterministic, **seedable** module-assembly engine: same answers → same path, same scores, same report. Task bank, scoring, and report templates are **versioned**, and the version is saved with each anonymous record.

**Never "clinical IQ."** No exact IQ number, no diagnosis, no ranking against other children. Use "cognitive profile / indicative range." Indices are shown **hybrid**: pentagon + per-index bar + word label (In development / Solid / Strong / Exceptional) + indicative range — never a hard number.

**Two language registers.** Code and internal docs use precise technical terms. **Everything a parent sees is plain Macedonian, no jargon** — never "neuroscience," "executive functions," or "cognitive domains" in parent-facing text. To the child: encouragement only. Growth areas are "areas to grow," never deficits / weakness / "falling behind."

**Privacy (GDPR).** No child name, ever. Parent **first name only** (no surname). Two separate stores that must **never be joinable**: anonymous scores (no PII, date only — not exact time) and leads (Brevo). **The PDF is never stored.** No PII in analytics or logs.

**Security.** Public repo → **no secrets in code**; keys live only in Vercel env, server-side (Brevo / Meta / Supabase service keys). HTTPS/HSTS; validate + sanitize all input; rate-limit + anti-bot on the form. Analytics + Meta are off outside production.

**Accessibility (WCAG 2.2 AA).** Keyboard + visible `focus-visible`; contrast ≥ 4.5:1; never color-only for meaning; tap targets ≥ 44px; respect `prefers-reduced-motion`; **no anxious timers except the speed game (Gs).**

**Performance.** Lighthouse 95+ (mobile + desktop); first load < 2.5s on 4G; lazy-load by section; procedural stimuli.

**Disclaimer.** "Informative, not diagnostic" must appear in all **7 placements** (landing footnote, pre-start screen, results screen, PDF top + bottom, email, About-the-test page, cookie banner).

## Useful commands

```bash
# New phase branch:
git checkout main && git pull origin main
git checkout -b phase-1.01-scaffold

# Docs/manual-only branch:
git checkout main && git pull origin main
git checkout -b cowork/<slug>

# Open a PR after pushing:
gh pr create --base main --title "<title>" --body "<summary + test plan>"
```

## Status & canonical docs

"Where are we" → `src/_project-state/current-state.md`. Rulebook → `project-instructions.md`. Target spec → `plan.md`. Phases → `phase-plan.md`. Brand → `brand.md`. Decisions → `Decisions.md`. Product truth → `IQ_UP_Specifikacija_v1_2_FINAL.pdf`.

---
*IqUp-V2 | CLAUDE.md | 2026-06-21*
