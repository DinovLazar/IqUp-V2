# IqUp-V2 — Current State

> A live snapshot of the repo. **Claude Code updates this at the end of every phase.** It is the single source of truth for "where are we." If this and a planning doc disagree, this (the live state) wins.
>
> Lives at `src/_project-state/current-state.md`.

**Last updated:** 2026-06-22 — end of Phase 1.04 (Task bank + procedural generators)
**Current part / phase:** Part 1 · Phase 1.04 complete → next is **1.05 (Scoring & norms)**
**Active branch:** `phase-1.04-task-bank` (PR into `main`)

> ⚠️ **Branch note (D-041):** the 1.01 PR is **not yet merged** — `main` is still at the kickoff baseline and has none of the scaffold. The phase branches form a chain off `main`: `phase-1.01-scaffold` → `phase-1.03-ui-kit` → `phase-1.04-task-bank` (this branch is cut from 1.03, not bare `main`). Merge/rebase them onto `main` in order, oldest first.

## How to run it locally

```bash
npm install
npm run dev        # http://localhost:3000  → placeholder landing (MK)
                   # http://localhost:3000/kit → dev-only UI-kit gallery (every component + state)
npm test           # Vitest: task-bank determinism + answer-key + distractor + purity suite
npx tsx scripts/dump-tasks.ts   # print sample generated items as JSON (eyeballing)
```

Quality scripts: `npm run build` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run format` / `format:check`. All pass as of this phase.

## Tech stack (current — installed & pinned)

Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict) · Tailwind CSS v4 (CSS-first; brand `@theme` in `globals.css`) · shadcn/ui on Radix (`radix-ui`), fully **restyled to brand** · Motion (`motion` v12, LazyMotion) · Lucide · next-intl 4 (MK at root) · **Montserrat via `next/font/google`** (latin + cyrillic) · **Vitest 4.1.9** (test runner, added 1.04) · Prettier + ESLint. Exact versions and config notes: `00_stack-and-config.md`. **Deferred** (added in their phase): React Hook Form + Zod (1.08), @react-pdf/renderer (1.09), Supabase/Brevo/Meta/GA4 (Part 2).

## Pages built

- `/` — **placeholder landing** at `src/app/(site)/page.tsx`. Reads MK strings; renders the (now brand) Button. Real landing is 1.06.
- `/kit` — **dev-only UI-kit gallery** at `src/app/kit/`. Renders every component + every state, the pentagon at sample profiles, and the puzzle-brain across progress values. `noindex`; 404s on real production (`VERCEL_ENV==="production"`); not linked from any nav. Verification surface for the kit.
- Reserved (empty `.gitkeep` route folders): `(site)/procena`, `(site)/za-testot`, `(site)/politika-za-privatnost`, `(site)/uslovi`, `admin`, `embed`, `api`.

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

**Shared lib (`src/lib/`):**
- `indices.ts` — single source of the 5 indices (order, MK labels, hex colors/tints/inks). Imported by pentagon, band bars, confidence, brain — and PDF-safe for 1.09.
- `pentagon.ts` — **pure, framework-agnostic** pentagon geometry (vertices/profile/rings/spokes/labels). One module feeds both the web component and the future `@react-pdf` report (1.09).
- `utils.ts` — `cn()` helper (unchanged).

## Task bank (`src/features/tasks/`, `src/content/tasks/`, `src/lib/prng.ts`) — Phase 1.04

Deterministic, seedable procedural generators for the **7 testable signals**, emitting **pure data / coordinate geometry** (no React, no SVG, no CSS — mirrors `pentagon.ts`). One entry point, `generateItem({ signal, level, seed, practice?, ...opts })`, plus `generatePractice(signal, seed)`; a signal→generator `REGISTRY`; type guards in `guards.ts`. Same inputs → deep-equal item, always.

- **`prng.ts`** — the one randomness source: `makeRng` (mulberry32 + FNV-1a), `pick`/`shuffle`/`pickN`/`intInRange`/`chance`, and `deriveSeed` (so 1.06 derives per-item seeds from one session master seed). No `Math.random`/`Date`/env anywhere downstream (purity-tested).
- **`content/tasks/`** — `TASK_BANK_VERSION = "1.0.0"` (stored per record, spec Дел 19.4) + per-domain level 1→10 difficulty tables (the single place difficulty is tuned).
- **Generators** — `gf` (matrix + numeric series), `gv` (mental rotation + odd-one-out, chiral polygons), `gsm` (Corsi span, fixed 6-tile board, caller passes length/direction), `gs` (symbol-search grid + target-cell key), `ef` (Tower of London, BFS-verified `minMoves` + optimal path), `glr` (paired-associate study + recall), `ct` (5 sub-types: sequence/debug/loop/condition/maze, all symbol-based, zero text).
- **Attention has NO generator** — it is a derived signal (timing variability + misses + impulsive errors) computed in 1.05 (spec Дел 3.1 #5 / Дел 4). Documented in `types.ts`.
- **Tests** — Vitest suite under `__tests__/` (6 files, 41 tests): determinism, full level/subtype coverage, answer-key correctness (independent BFS for EF, rule re-derivation for Gf, congruence for Gv, maze-is-a-tree, etc.), distractor validity (unique key, matrix distractors differ by exactly one attribute), and a purity/language-neutrality scan.
- **Out of scope (1.05/1.06):** scoring, norms, raw→0–100, basal/ceiling, confidence, validity flags, adaptive level selection, +1/−1 span growth, the age-8 backward rule, all timers/timing behaviour, and rendering.

## Design tokens

All handover §1 / spec App. G tokens are in the Tailwind v4 `@theme` (`src/app/globals.css`): 8 palette colors + per-index soft tints + `*-ink` text variants, gradients, surface/border/focus/state tokens, the four Montserrat type roles, the 4/8/12/16/24/32 spacing scale, 12–18/30/11px radii, ≥44px tap minimum, and the single `--shadow-pop`. No dark mode.

## Integrations wired

None yet (all stubbed until Part 2).

## Repo / infra

- GitHub: `DinovLazar/IqUp-V2` — **public**, branch protection on `main`.
- CodeRabbit config committed (`.coderabbit.yaml`). **One-time app-connect for CodeRabbit + Codex still pending** — `docs/ai-review-setup.md`.
- No Vercel connection / deploy yet (Part 2).

## Open carryover items

- [ ] **Merge the 1.01 PR first**, then merge/rebase this 1.03 PR after it (D-041).
- [ ] **Connect the CodeRabbit + Codex GitHub Apps** to `DinovLazar` → `docs/ai-review-setup.md`. Until done, PRs get no automated review.
- [ ] **Ratify D-027** (Code kept on-disk `CLAUDE.md`/`AGENTS.md`/`Decisions.md` over the Appendix drafts).
- [ ] **Brand assets pending (Cowork):** real IQ UP! class photo(s) (dashed placeholders in place); optional self-hosted Montserrat woff2 (currently `next/font/google` — clean swap path to `next/font/local`).
- [ ] **§4.2 extras deferred (D-047):** reward badge, answer option, idle nudge → built with their screens (1.06/1.07).
- [ ] `notion-checklist.md` referenced in planning docs but not in the repo (owned by Chat).

## Known issues

- None. The inert shadcn `.dark` block flagged after 1.01 is **removed** (D-043). The puzzle-brain silhouette/region paths are an original interpretation of §2 (mockup not in repo, D-045) — swappable for the mockup's exact geometry later without API changes.

---
*Update procedure: at the end of each phase, refresh the "Last updated", "Current part / phase", and "Active branch" lines, then update each section to reflect what now exists. Keep it factual and current — this file mirrors reality, not the plan.*
