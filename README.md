# IQ UP! — IqUp-V2

A free, mobile-first web app (lead magnet): an adaptive cognitive + STEM
assessment for children aged 5–13, run **deterministically (no AI at run-time)**.
It captures a parent lead, emails a branded PDF report, and drives CTA clicks to
an external booking page. This build ships the **Macedonian MVP** at `iq.iqup.mk`.

> **Read `CLAUDE.md` first** — it is the authoritative repo rulebook. The full
> build docs are `project-instructions.md`, `plan.md`, `phase-plan.md`,
> `brand.md`, and `Decisions.md`. The product source of truth is
> `IQ_UP_Specifikacija_v1_2_FINAL.pdf`. **Where a doc and the live code disagree,
> the live code wins — surface the mismatch.**

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) ·
Motion · Lucide · next-intl · custom SVG. Pinned versions and config decisions
live in [`src/_project-state/00_stack-and-config.md`](src/_project-state/00_stack-and-config.md).

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build         # production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format        # Prettier (write)
npm run format:check  # Prettier (check)
```

Copy `.env.local.example` → `.env.local` for local secrets. **This repo is
public — never commit real keys.** Real values live only in Vercel's
environment settings, server-side.

## Where things live

- `src/app/` — routes (`(site)` public pages, `admin`, `embed`) + `api/` backend.
- `src/features/` — assessment engine, tasks, scoring, report (built in later phases).
- `src/content/` — versioned task bank, report modules, seed norms.
- `src/components/ui/` — shadcn-based components (restyled to the brand in 1.03).
- `messages/` — next-intl strings (`mk.json` now; SR/HR/EN later).
- `src/_project-state/` — live project state: where we are, the file map, the
  stack log, and per-phase completion reports.

## Status

See [`src/_project-state/current-state.md`](src/_project-state/current-state.md)
for "where are we." Work goes through pull requests only — never push directly
to `main`.
