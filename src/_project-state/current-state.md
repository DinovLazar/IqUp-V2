# IqUp-V2 — Current State

> A live snapshot of the repo. **Claude Code updates this at the end of every phase.** It is the single source of truth for "where are we." If this and a planning doc disagree, this (the live state) wins.
>
> Lives at `src/_project-state/current-state.md`.

**Last updated:** 2026-06-21 — end of Phase 1.01 (Scaffold & foundations)
**Current part / phase:** Part 1 · Phase 1.01 complete → next is **1.02 (Design system & key screens)**
**Active branch:** `phase-1.01-scaffold` (PR into `main`)

## How to run it locally

```bash
npm install
npm run dev        # http://localhost:3000  → placeholder landing (MK)
```

Quality scripts: `npm run build` · `npm run lint` · `npm run typecheck` · `npm run format` / `format:check`. All pass as of this phase.

## Tech stack (current — installed & pinned)

Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict) · Tailwind CSS v4 (CSS-first, no `tailwind.config.ts`) · shadcn/ui on Radix (Nova preset, neutral) · Motion (`motion` v12) · Lucide · next-intl 4 (MK at root, no routing yet) · Prettier + ESLint. Exact versions and config notes: `00_stack-and-config.md`. **Deferred** (added in their phase): React Hook Form + Zod (1.08), @react-pdf/renderer (1.09), Supabase/Brevo/Meta/GA4 (Part 2).

## Pages built

- `/` — **placeholder landing** at `src/app/(site)/page.tsx`. Reads `meta.appName` + `common.start` from `messages/mk.json`; renders the shadcn Button. No branding yet (that's 1.03/1.06). Proves i18n + the component pipeline.
- Reserved (empty `.gitkeep` route folders): `(site)/procena`, `(site)/za-testot`, `(site)/politika-za-privatnost`, `(site)/uslovi`, `admin`, `embed`, `api`.

## Components built

- `src/components/ui/button.tsx` — shadcn Button (base only; restyled to the brand in 1.03).
- `src/lib/utils.ts` — `cn()` helper.

## Integrations wired

None yet (all stubbed until Part 2).

## Repo / infra

- GitHub: `DinovLazar/IqUp-V2` — **public**, single branch `main`, **branch protection on** (PR required, no direct pushes, force-push/deletion blocked).
- CodeRabbit config committed (`.coderabbit.yaml`). **One-time app-connect for CodeRabbit + Codex is still pending** — see `docs/ai-review-setup.md` (hand to Cowork).
- No Vercel connection / deploy yet (Part 2).

## Open carryover items

- [ ] **Connect the CodeRabbit + Codex GitHub Apps** to `DinovLazar` (browser step) → `docs/ai-review-setup.md`. Until done, PRs get no automated review.
- [ ] **Ratify D-027** — Code kept the existing on-disk `CLAUDE.md`/`AGENTS.md`/`Decisions.md` instead of overwriting them with the phase-prompt Appendix drafts (live-code-wins). Chat to confirm with Lazar.
- [ ] `notion-checklist.md` is referenced in the planning docs but is not present in the repo (owned by Chat; not created this phase).

## Known issues

- None. The shadcn `.dark` token block exists in `globals.css` but is inert (no dark mode is triggered); it's reconciled with the no-dark-mode rule during the 1.03 brand theme.

---
*Update procedure: at the end of each phase, refresh the "Last updated", "Current part / phase", and "Active branch" lines, then update each section to reflect what now exists. Keep it factual and current — this file mirrors reality, not the plan.*
