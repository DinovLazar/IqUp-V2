# IqUp-V2 — File Map

> A living map of every file in the repo with a one-line description. **Claude Code maintains this:** when you add, move, or delete a file, update this map in the same phase. Keep entries to one line each, grouped by folder, in path order.
>
> Lives at `src/_project-state/file-map.md`.

*Empty at kickoff — the repo hasn't been scaffolded yet. Phase 1.01 seeds this with the initial tree.*

## Format

```
path/to/file.ext — one-line description of what it does
```

## Map

**Project root docs (placed at kickoff):**
- `CLAUDE.md` — repo rules any Claude/agent reads first
- `AGENTS.md` — short cross-agent mirror of CLAUDE.md
- `project-instructions.md` — orchestrator rulebook (Claude Chat)
- `plan.md` — target master spec
- `phase-plan.md` — phase index
- `brand.md` — brand guide
- `Decisions.md` — append-only decision log
- `notion-checklist.md` — paste-into-Notion phase checklist

**Root config & housekeeping (Phase 1.01):**
- `README.md` — short project readme + how to run locally
- `.gitignore` — Next.js defaults + `.env*` (keeps `*.example`) + `.DS_Store`
- `.env.local.example` — env variable shapes only (no secrets); real keys live in Vercel
- `.coderabbit.yaml` — CodeRabbit auto-review config (live once the app is connected)
- `package.json` / `package-lock.json` — deps + scripts (dev/build/start/lint/typecheck/format)
- `tsconfig.json` — TypeScript config (strict)
- `next.config.ts` — Next config wrapped with the next-intl plugin
- `next-env.d.ts` — Next-generated types (gitignored content; file tracked)
- `postcss.config.mjs` — PostCSS → `@tailwindcss/postcss` (Tailwind v4)
- `eslint.config.mjs` — ESLint flat config (Next core-web-vitals + TS)
- `.prettierrc.json` — Prettier + `prettier-plugin-tailwindcss`
- `.prettierignore` — excludes deps/build/lockfile/PDF/Markdown
- `components.json` — shadcn/ui config (radix lib, Nova preset, neutral, Lucide)

**Docs:**
- `docs/design-handovers/.gitkeep` — reserved for Design handovers
- `docs/design-handovers/Part-1-Phase-02-Handover.md` — 1.02 design handover (visual source of truth for 1.03/1.06/1.07)
- `docs/ai-review-setup.md` — one-time CodeRabbit + Codex connect runbook (for Cowork)

**i18n:**
- `messages/mk.json` — Macedonian strings (starter set)
- `src/i18n/request.ts` — next-intl request config (locale `mk`, no routing yet)

**App (routes + backend):**
- `src/app/layout.tsx` — root layout; loads Montserrat via `next/font`, sets `<html lang>` + font var, wraps in `NextIntlClientProvider`
- `src/app/globals.css` — Tailwind v4 entry + **brand `@theme`** (all design tokens; shadcn semantic tokens mapped to brand; no dark mode)
- `src/app/favicon.ico` — placeholder favicon (rebranded later)
- `src/app/(site)/page.tsx` — placeholder landing; reads MK strings + renders Button
- `src/app/(site)/{procena,za-testot,politika-za-privatnost,uslovi}/.gitkeep` — reserved public pages
- `src/app/kit/page.tsx` — dev-only UI-kit gallery route (noindex; 404 on production); renders `KitGallery`
- `src/app/kit/kit-gallery.tsx` — client gallery: every component + state, pentagon samples, puzzle-brain across progress
- `src/app/admin/.gitkeep` — reserved admin panel (Part 2)
- `src/app/embed/.gitkeep` — reserved embeddable flow
- `src/app/api/.gitkeep` — reserved serverless backend (lead/report/score)

**Components (`src/components/ui/`) — brand kit on shadcn/Radix:**
- `button.tsx` — Button: primary / secondary / ghost, full state set
- `card.tsx` — Card (default + emphasis) + Header/Title/Description/Content/Footer
- `badge.tsx` — 30px explorer/reward pill (filled + soft)
- `progress.tsx` — word-labelled track with `--grad-brand` fill (Radix Progress)
- `input.tsx` — text input with focus + error states
- `label.tsx` — form label (Radix Label)
- `field.tsx` — Field wrapper + FieldHelpText + FieldError (no form logic)
- `checkbox.tsx` — consent checkbox (never pre-ticked; error-ready) (Radix Checkbox)
- `select.tsx` — Select trigger/content/item/etc. (Radix Select; popover uses `--shadow-pop`)
- `band-label.tsx` — index band-label: word + indicative range only (no number)
- `confidence-label.tsx` — висока/средна/ниска chip + signal glyph
- `index-band-bar.tsx` — per-index row: dot + name + word pill + colored track + range
- `pentagon.tsx` — web SVG pentagon over the geometry module
- `puzzle-brain.tsx` — Motion puzzle-brain assembly (+ chip variant; reduced-motion fallback)

**Lib (`src/lib/`):**
- `indices.ts` — single source of the 5 indices (order, MK labels, hex colors/tints/inks); PDF-safe
- `pentagon.ts` — pure framework-agnostic pentagon geometry (shared by web + future PDF)
- `utils.ts` — `cn()` className helper

**Reserved feature/content folders (empty until their phase):**
- `src/features/{assessment,tasks,scoring,report}/.gitkeep`
- `src/content/{tasks,modules,norms}/.gitkeep`

**Public assets:**
- `public/fonts/.gitkeep` — Montserrat added in 1.02/1.03
- `public/images/.gitkeep` — brand/photos added later

**Project state (`src/_project-state/`):**
- `current-state.md` — live "where are we" snapshot
- `file-map.md` — this file
- `00_stack-and-config.md` — append-only stack + config log
- `completions/_TEMPLATE.md` — completion-report template
- `completions/Part-1-Phase-01-Completion.md` — Phase 1.01 (scaffold) report
- `completions/Part-1-Phase-02-Completion.md` — Phase 1.02 (design system) report (relocated from repo root, D-042)
- `completions/Part-1-Phase-03-Completion.md` — Phase 1.03 (base UI kit) report
