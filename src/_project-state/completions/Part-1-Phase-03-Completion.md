# Part 1 · Phase 1.03 — Base UI kit · Completion Report

> Filled from `_TEMPLATE.md`. Committed in the same PR as the phase work.

**Phase:** Part 1 · Phase 1.03 — Base UI kit
**Executing Claude:** Code
**Date completed:** 2026-06-22
**Branch:** `phase-1.03-ui-kit` (off `phase-1.01-scaffold` — see D-041)
**Commits:** _(filled at PR time)_
**PR:** _(filled at PR time)_

## What shipped

- **Full brand token layer** — `src/app/globals.css` rewritten brand-first: every handover §1 / spec App. G token in one Tailwind v4 `@theme` (8 palette colors + per-index soft tints + accessible `*-ink` text variants, `--grad-brand`/`--grad-wash`, surface/border/focus/state tokens, the four Montserrat type roles, 4/8/12/16/24/32 spacing, 12–18/30/11px radii, ≥44px tap min, the single `--shadow-pop`). shadcn/Radix semantic tokens are mapped to brand values in the same block; dark mode removed.
- **Montserrat (latin + cyrillic)** wired via `next/font/google` (self-hosted at build, weights 400/500/600/700/800) → `--font-montserrat` → `--font-sans`; the four type roles render correctly in Macedonian Cyrillic.
- **Core component kit** on shadcn/Radix, fully restyled, each with its complete state set: Button (primary/secondary/ghost), Card (+ emphasis), Badge (30px pill), Progress (word-labelled), Input/Label/Field, Checkbox (consent — never pre-ticked, error-ready), Select, plus the **index band-label** (word + indicative range, no number), **confidence label**, and the composed **index band bar**.
- **Pentagon** — a pure, framework-agnostic geometry module (`src/lib/pentagon.ts`, PDF-safe) + the web SVG component on top, with color dots + Macedonian vertex labels in §10.2 order. **Puzzle-brain** — a Motion (LazyMotion) clipped-silhouette + 5-region assembly driven by a `completed` (0–5) prop, with the `prefers-reduced-motion` snap fallback and a legible ~40px chip variant. Both share `src/lib/indices.ts` (the single source of index order/labels/colors).
- **Dev-only kit gallery** at `/kit` (`src/app/kit/`) rendering every component + state, pentagon samples, and the brain across progress values — `noindex`, 404 on production, not linked from nav. Plus: relocated the 1.02 handover + completion into the repo, logged the 1.02 + 1.03 decisions, and updated all state files.

## Decisions made on the fly

Logged in `Decisions.md` — the five accepted **1.02 design decisions** D-036–D-040 (now that Code can commit), and Code's **1.03 decisions**:

1. **D-041** — branched off `phase-1.01-scaffold`, not `main` (the 1.01 PR is unmerged; `main` lacks the scaffold). **Surfaced.**
2. **D-042** — relocated the 1.02 handover + completion from the repo root into their proper folders.
3. **D-043** — `globals.css` rewritten brand-first; removed dark mode + the unused neutral oklch / chart / sidebar tokens.
4. **D-044** — kit gallery at `src/app/kit/`, not `_kit/` (underscore folders are private/non-routing in the App Router); dev/preview-only + noindex.
5. **D-045** — the puzzle-brain SVG is an original interpretation of §2 (mockup not in repo); paths swappable for the mockup's exact geometry later.
6. **D-046** — confidence "висока" uses brand teal-ink (palette has no separate green); meaning also carried by bar count + word.
7. **D-047** — built `IndexBandBar` now; deferred the other §4.2 extras (reward badge, answer option, idle nudge) to their screen phases.

## Surprises / off-spec changes

- **The 1.02 mockup HTML (`IQ UP Phase 1-02 Design System.dc.html`) is not in the repo** — Design delivered it as a streaming component. The handover §1–§4 (concrete values) + `brand.md` were the working sources; the brain's exact path data was unavailable, hence D-045.
- **The 1.02 handover/completion were at the repo root** (untracked), not at the `docs/`/`completions/` paths the brief's read-order and the 1.02 report claim. Moved them (D-042).
- **`main` is still at the kickoff baseline** — the 1.01 PR hasn't merged (D-041).
- **`shadcn/tailwind.css` resolves to `node_modules/shadcn/dist/tailwind.css`** and provides Radix-state custom variants (`data-checked`/`data-disabled`/…) + `no-scrollbar` — not colors or the radius scale. Kept the import (the form components use those variants).
- **The scaffold's `.dark` block (flagged inert after 1.01) is now removed** (D-043) — reconciles the no-dark-mode rule (D-023).

## Files written / updated

**New — components (`src/components/ui/`):** `card.tsx`, `badge.tsx`, `progress.tsx`, `input.tsx`, `label.tsx`, `field.tsx`, `checkbox.tsx`, `select.tsx`, `band-label.tsx`, `confidence-label.tsx`, `index-band-bar.tsx`, `pentagon.tsx`, `puzzle-brain.tsx`.
**New — lib (`src/lib/`):** `indices.ts`, `pentagon.ts`.
**New — route:** `src/app/kit/page.tsx`, `src/app/kit/kit-gallery.tsx`.
**New — docs:** `src/_project-state/completions/Part-1-Phase-03-Completion.md` (this report).
**Relocated (D-042):** `docs/design-handovers/Part-1-Phase-02-Handover.md`, `src/_project-state/completions/Part-1-Phase-02-Completion.md` (from repo root).
**Modified:** `src/app/globals.css` (brand theme), `src/app/layout.tsx` (Montserrat), `src/components/ui/button.tsx` (brand restyle), `.gitignore` (`.claude/`), `Decisions.md`, `src/_project-state/current-state.md`, `src/_project-state/file-map.md`, `src/_project-state/00_stack-and-config.md`.

## Tests run + results

```
$ npm run typecheck   → tsc --noEmit : clean (no output)
$ npm run lint        → eslint        : 0 problems
$ npm run build       → next build    : ✓ Compiled successfully; TS ✓
                        Routes: ○ /   ○ /_not-found   ○ /kit   (all static)
```

- **Format:** `npm run format:check` ✓ (Prettier + tailwindcss plugin).
- **Runtime smoke:** dev server — `/` → 200, `/kit` → 200, no console errors; Macedonian Cyrillic renders.
- **Visual verification (`/kit`):** Montserrat Cyrillic + the four type roles; palette/tint/ink swatches at the exact hex; pentagon (grid + violet 10% profile + colored vertex dots + MK labels in order); the puzzle-brain assembly (lobes complete → core filling → dim, white seams), including the 40px chip — all render correctly.
- **A11y self-check:** visible 3px `focus-visible` ring on every interactive component; colored text uses `*-ink`/teal-ink/org-ink/muted at ≥4.5:1; tap targets ≥44px (buttons 48px); band meaning is word + glyph + color (never color-only); no numeric score in any component; `prefers-reduced-motion` honored (global CSS net + brain JS branch); no shadow except `--shadow-pop` on the Select popover.

## Blocked / carryover

- [ ] **Merge the 1.01 PR first**, then merge/rebase this 1.03 PR after it (D-041).
- [ ] **Connect CodeRabbit + Codex GitHub Apps** (`docs/ai-review-setup.md`) — until then PRs get no automated review.
- [ ] **Cowork assets:** real IQ UP! class photo(s) (dashed placeholders in place); optional self-hosted Montserrat woff2 (clean `next/font/local` swap path left).
- [ ] **§4.2 extras** (reward badge, answer option, idle nudge) deferred to 1.06/1.07 (D-047).
- [ ] **Ratify D-027** (carried from 1.01).

## What's next

**Phase 1.04 — Task bank.** The versioned content/task-bank work. The kit, the pentagon geometry module, and `indices.ts` are ready for 1.06 (assessment flow), 1.07 (report), and 1.09 (PDF) to consume. Chat should flag D-041 (branch order) and confirm the photo asset / Montserrat woff2 situation before later screen phases.

---
*IqUp-V2 | Part 1 · Phase 1.03 Completion | 2026-06-22*
