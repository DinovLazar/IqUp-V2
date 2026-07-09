# Maintenance · Brand favicon + assessment-header logo · Completion Report

**Phase:** Maintenance (out-of-sequence) — follow-up to Maint-Logo (D-156)
**Executing Claude:** Code
**Date completed:** 2026-07-09
**Branch:** `fix/brand-logo` (cut from the `main` tip after D-156's PR #18 merged)
**Commits:** one commit (see PR)
**PR:** #19 — _into `main`, awaiting Lazar's merge_

## What shipped

Closes two of the gaps D-156 left open — the owner's original two asks:

1. **Browser favicon** — the default `create-next-app` icon (25931-byte `favicon.ico`, the "Vercel logo" the owner flagged) is replaced by the IQ UP! mark:
   - `src/app/icon.svg` — the App-Router SVG favicon: a **viewBox crop** (`-2 0 54 54`, square) of the existing `public/brand/iqup-logo.svg` — the puzzle-brain + "IQ UP!" cluster centered, the "EDUCATION THAT INSPIRES" tagline windowed out (illegible at tab size).
   - `src/app/favicon.ico` — regenerated as a 16/32/48 PNG-embedded ICO from that same SVG, using the already-present `sharp` dep.
   - Next's App Router auto-emits both `<link rel="icon">` tags; verified both serve 200 and resolve to the brand icon.
2. **Assessment task-screen header** — `src/features/assessment/tasks/task-screen.tsx` was **not** in D-156's scope and still rendered the live-progress `PuzzleBrain` **chip** (`completed={brainCompleted}`) that recolored as the child advanced — the "changing mind" the owner asked to replace. It now shows the static shared `<Logo />`. **Progress is not lost:** the five index-colored **section dots** directly below already carry it (`brainCompleted` still drives them).

## Decisions made on the fly

*Logged in `Decisions.md` as D-157.*

1. **Favicon is a viewBox crop of the D-156 SVG, not a new asset (D-157)** — reuses `public/brand/iqup-logo.svg` (the single brand-mark home). The D-156 id-collision reasoning (why the header logo is an `<img>`, not inlined) does **not** apply to a file/`<img>`-served favicon — it never inlines into the document — so the SVG tab icon needs no raster round-trip; only `favicon.ico` is rasterized (via `sharp`) for legacy browsers.
2. **Assessment header uses the same shared `<Logo />` at its default `h-9`** — matches the three page headers D-156 already converted, for one consistent mark app-wide. Verified at the mobile viewport (375px) that the full lockup + "Секција X од 5" + compass fit with no overflow.

## Surprises / off-spec changes

- D-156's PR #18 had **already merged** the real logo into the three *page* headers by the time this ran, using a different approach than a first (now-discarded) local attempt. This branch was **re-cut from the post-#18 `main`** and reduced to only the delta `main` still lacked — the favicon and the assessment header — reusing D-156's `<Logo>` + `public/brand/` conventions verbatim (no duplicate component, no `public/images/` asset, no `next/image`).
- `PuzzleBrain` remains imported/used by its motif consumers (completion screen, PDF `BrainMark`, pentagon, `/kit`); the one import dropped here is the assessment header's only remaining logo-slot use.

## Files written / updated

**New:**
- `src/app/icon.svg` — square brand tab icon (crop of `public/brand/iqup-logo.svg`).
- `src/_project-state/completions/Maint-Favicon-Assessment-Logo-Completion.md` — this report.

**Modified:**
- `src/app/favicon.ico` — regenerated as the 16/32/48 brand ICO (was the default `create-next-app` icon).
- `src/features/assessment/tasks/task-screen.tsx` — header `PuzzleBrain` chip → `<Logo />`; dropped the `PuzzleBrain` import, added `Logo`; refreshed the chrome comment + the `brainCompleted` doc (now "drives the section dots").
- `Decisions.md` — new entry D-157.
- `src/_project-state/file-map.md` — `favicon.ico` re-annotated + new `icon.svg` line; `logo.tsx` + `task-screen.tsx` + `public/brand/iqup-logo.svg` lines updated.
- `src/_project-state/current-state.md` — refreshed "Last updated" + active branch.

## Tests run + results

- `npm run typecheck` — **green**.
- `npm run lint` — **green** (0 errors, 0 warnings).
- `npm run format:check` — **green**.
- `npm test` — **green**: 69 files, **502 tests** (unchanged; no behavior this change covers is tested).
- `npm run build` — **green** (with the local dummy Supabase env); `/icon.svg` registers as a static route.
- **Visual (dev server):** the assessment task screen shows the static `<Logo />` next to "Секција 1 од 5" (mobile 375px, no overflow); `/` and `/za-testot` render the logo (D-156, unchanged); favicon `<link>` tags resolve to `icon.svg` + `favicon.ico`; no console errors.
- **Review:** CodeRabbit / Codex still not connected (standing carryover) — internal adversarial self-review done: confirmed no other logo-slot use of `PuzzleBrain` was missed, the favicon crop reuses the brand SVG (no id leak, no new asset), and no norm/product logic was touched.

## Blocked / carryover

Unchanged from D-156, minus the favicon:

- [ ] **Open Graph / link-share image** — needs a PNG. Deferred.
- [ ] **PDF report header** (`src/features/report/pdf/document.tsx`) — `@react-pdf` can't render this gradient/`<style>` SVG; needs a raster PNG. Deferred.
- [ ] **Transactional e-mail wordmark** (`src/lib/brevo/email-template.ts` / `email.*` in mk.json) — needs a hosted absolute-URL PNG + text fallback. Deferred.

## What's next

Back to the numbered plan — **2.05** (Vercel-preview real-network Lighthouse/LCP) and/or the Part 3 security pass. The three deferred logo surfaces above can be batched once the raster / OG assets are supplied.

---
*IqUp-V2 | Maintenance · Brand favicon + assessment-header logo | 2026-07-09*
