# Part 1 · Phase 1.01 — Scaffold & Foundations · Completion Report

**Phase:** Part 1 · Phase 1.01 — Scaffold & foundations
**Executing Claude:** Code
**Date completed:** 2026-06-21
**Branch:** `phase-1.01-scaffold`
**Commits:** see PR
**PR:** _opened into `main` (see repo)_

## What shipped

- **Public GitHub repo `DinovLazar/IqUp-V2`** with a single `main` branch and **branch protection** (PR required before merge, no direct pushes, force-push + deletion blocked). The scaffold itself is delivered as one PR into the protected `main`.
- **Next.js 16 (App Router, TypeScript strict) + Tailwind CSS v4 + shadcn/ui (Radix)** app skeleton that builds, lints, type-checks, and runs locally. Foundation libs only: next-intl, Motion, Lucide (+ Prettier).
- **next-intl wired for Macedonian at the root** — a placeholder landing at `/` reads `meta.appName` + `common.start` from `messages/mk.json` and renders the shadcn Button; `<html lang="mk">`. Locale-ready for SR/HR/EN later (no routing yet, no RTL).
- **All reserved folders created** (`docs/design-handovers/`, the `(site)`/`admin`/`embed`/`api` routes, `features/*`, `content/*`, `public/{fonts,images}`) with `.gitkeep`s; **state files seeded/updated** and the completion-report template in place.
- **AI review prepared**: `.coderabbit.yaml` committed; a one-time connect runbook saved to `docs/ai-review-setup.md`.

## Decisions made on the fly

_All appended to `Decisions.md` (D-027…D-035). The first and last are the ones to surface to Lazar._

1. **D-027 — Kept the existing on-disk `CLAUDE.md` / `AGENTS.md` / `Decisions.md`; did NOT overwrite with the phase prompt's Appendix drafts.** Chat had already placed richer, more current versions (live `Decisions.md` = D-001…D-026; the Appendix draft stopped at D-010). Overwriting would have destroyed 16 logged decisions. The project's prime directive is "live code/docs win — surface the mismatch," so I preserved them. **Please ratify** — if the Appendix text was meant to supersede, I'll reconcile.
2. **D-035 — Branch protection uses `required_approving_review_count = 0`** (PR still required, no direct pushes, `enforce_admins` on). Requiring 1 approval would brick a solo operator (can't approve your own PR); the phase only requires "a PR before merging; no direct pushes." CodeRabbit is the review gate.
3. **D-028 — Package manager = npm** (pnpm/yarn absent). **D-029 — current stable majors (Next 16 / React 19 / Tailwind v4)**, which means **no `tailwind.config.ts`** (Tailwind v4 is CSS-first) and **`next.config.ts`** instead of `next.config.js`. **D-030 — next-intl "without routing"** pattern. **D-031 — `motion` package** (not legacy `framer-motion`). **D-032 — shadcn radix lib + Nova preset, neutral**, Button only. **D-033 — renamed the report template to `_TEMPLATE.md`**. **D-034 — `(site)` route group** holds the landing; Next.js boilerplate removed.

## Surprises / off-spec changes

- **Tailwind v4 ≠ the plan tree.** `plan.md` §7 listed `tailwind.config.ts` and `next.config.js`; the current stable stack (Tailwind v4 CSS-first + Next 16) produces neither — theme tokens live in `globals.css` `@theme`, config is `next.config.ts`. Documented in `00_stack-and-config.md`; the brand theme is implemented in `globals.css` at Phase 1.03.
- **shadcn CLI changed** — `init` now picks a *component library* (`radix` vs `base`) and a style *preset* (Nova, Vega, …) rather than just a base color. Used `radix` + `Nova` (neutral). `globals.css` imports `shadcn/tailwind.css`, so the `shadcn` package is a real runtime dependency (kept).
- **shadcn writes an inert `.dark` token block.** No dark mode is triggered (it only applies under a `.dark` ancestor we never add). Left as-is for the scaffold; reconciled with the no-dark-mode rule during the 1.03 theme.
- **create-next-app now generates `AGENTS.md`/`CLAUDE.md`/`README.md`.** Scaffolded in a temp dir and merged with those (and the project docs) excluded, so the project's authoritative rule files were preserved.
- **`notion-checklist.md`** is referenced by the planning docs but isn't in the repo (it's Chat-owned; not created here).

## Files written / updated

**New (app + config):** `package.json`/`package-lock.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `components.json`, `.gitignore` (env exception added), `.env.local.example`, `README.md`, `.coderabbit.yaml`.
**New (source):** `src/app/layout.tsx`, `src/app/globals.css`, `src/app/(site)/page.tsx`, `src/i18n/request.ts`, `messages/mk.json`, `src/components/ui/button.tsx`, `src/lib/utils.ts`, plus `.gitkeep`s across the reserved folders, `docs/ai-review-setup.md`.
**Updated (state):** `src/_project-state/current-state.md`, `file-map.md`, `00_stack-and-config.md`; `Decisions.md` (D-027…D-035); renamed `completions/Part-X-Phase-YY-Completion.md` → `_TEMPLATE.md`.
**Preserved (not overwritten):** `CLAUDE.md`, `AGENTS.md`, `Decisions.md` (existing), `plan.md`, `project-instructions.md`, `phase-plan.md`, `brand.md`, `IQ_UP_Specifikacija_v1_2_FINAL.pdf`.

## Tests run + results

- `npm run build` → ✓ compiled; `/` prerendered static.
- `npm run lint` → ✓ no problems.
- `npm run typecheck` (`tsc --noEmit`) → ✓ no errors (strict).
- `npm run format:check` → ✓ all files match Prettier style.
- Manual: dev server → `GET /` returns **200**, renders `IQ UP!` + `Започни проценка`, `<html lang="mk">`.

## Pre-flight check results

- `gh auth status` → ✓ logged in as `DinovLazar` (scopes incl. `repo`, `workflow`).
- Node `v26.3.0`, npm `11.16.0` → ✓ (pnpm/yarn absent → npm).
- Canonical docs present → ✓ all five (`project-instructions.md`, `plan.md`, `phase-plan.md`, `brand.md`, `IQ_UP_Specifikacija_v1_2_FINAL.pdf`).
- CodeRabbit/Codex apps → **not confirmed connected**; in-repo config added + runbook written (carryover).

## Blocked / carryover

- [ ] **Connect CodeRabbit + Codex GitHub Apps** to `DinovLazar` (browser-only) — `docs/ai-review-setup.md`. Hand to **Cowork**.
- [ ] **Ratify D-027** (kept on-disk rule files over the Appendix drafts) and **D-035** (0 required approvals on `main`).
- [ ] Decide whether Chat should add the missing `notion-checklist.md` to the repo.

## What's next

**Phase 1.02 — Design system & key screens (Design).** Per the workflow, Chat first agrees a visual direction with Lazar in chat, then writes the Design prompt; the handover lands in `docs/design-handovers/` and the brand tokens it defines get implemented as the Tailwind v4 `@theme` in Phase 1.03. Nothing blocks 1.02 except the visual-direction conversation.

---
*IqUp-V2 | Part 1 · Phase 1.01 Completion | 2026-06-21*
