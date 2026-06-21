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
- `docs/ai-review-setup.md` — one-time CodeRabbit + Codex connect runbook (for Cowork)

**i18n:**
- `messages/mk.json` — Macedonian strings (starter set)
- `src/i18n/request.ts` — next-intl request config (locale `mk`, no routing yet)

**App (routes + backend):**
- `src/app/layout.tsx` — root layout; sets `<html lang>`, wraps app in `NextIntlClientProvider`
- `src/app/globals.css` — Tailwind v4 entry + shadcn theme tokens (`@theme`)
- `src/app/favicon.ico` — placeholder favicon (rebranded later)
- `src/app/(site)/page.tsx` — placeholder landing; reads MK strings + renders Button
- `src/app/(site)/{procena,za-testot,politika-za-privatnost,uslovi}/.gitkeep` — reserved public pages
- `src/app/admin/.gitkeep` — reserved admin panel (Part 2)
- `src/app/embed/.gitkeep` — reserved embeddable flow
- `src/app/api/.gitkeep` — reserved serverless backend (lead/report/score)

**Components & lib:**
- `src/components/ui/button.tsx` — shadcn Button (base component)
- `src/lib/utils.ts` — `cn()` className helper

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
- `completions/Part-1-Phase-01-Completion.md` — this phase's report
