# Part 3 · Phase 02 — Performance & Accessibility · Completion Report

**Phase:** Part 3 · Phase 02 — Performance & accessibility
**Executing Claude:** Code
**Date completed:** 2026-07-04
**Branch:** `phase-3.02-perf-a11y` (branched off `main` — PR #14/#15 had both already merged; see Decision 1)
**Commits:** (see PR)
**PR:** (opened alongside this report)

## What shipped

- **Code-splitting** — the 7 per-signal task renderers and the post-assessment `LeadForm`/`Confirmation` screens convert from static imports to `next/dynamic(..., { ssr: false })`, cutting `/procena`'s initial JS from **1318.6 KB → 1136.1 KB** (`/` and `/za-testot` stay flat at ~767 KB, confirming the reduction is real and scoped to the assessment flow).
- **Automated accessibility to zero violations** — axe-core scans of `/`, `/za-testot`, `/admin/login`, `/procena`, and `/kit` (every component/state/task-renderer/report-preview) all read **0 violations**, after fixing 4 real, distinct issues (contrast, a missing landmark, a missing progressbar name, a heading-order skip — see Decisions).
- **Contrast hardened + made reproducible** — a new `scripts/check-contrast.ts` computes WCAG ratios from `globals.css` directly; found and fixed 4 of 5 index `*-ink` colors failing 4.5:1 against their own soft-tint background (the band-label pill's actual background), with a new regression test pinning both the ratio and the `globals.css`↔`indices.ts` sync this phase discovered had no guard.
- **Reduced-motion + manual WCAG pass** — verified via code audit (every custom control is a real `<button>`, no `tabIndex`/custom-keydown traps, `focus-visible` present everywhere) cross-checked against the 0-violation axe results; documented in full below.
- **`docs/perf-a11y-audit.md`** — exact local reproduction steps (build, Lighthouse, axe, contrast script, bundle-size, server-only-leak check) for re-running at 2.05 against the real Vercel preview.
- **Lighthouse Best-Practices/Accessibility/SEO: a clean 100** on mobile and desktop across `/`, `/procena`, `/za-testot`. **Performance**: desktop is 100/100/100/100 on all three; mobile is close but not fully at target — flagged honestly below rather than claimed, with root cause.

## Decisions made on the fly

*(Full text in `Decisions.md` D-148–D-155; summarized here.)*

1. **Branched off `main`, not the 3.01 tip** — both PR #14 (3.01) and PR #15 (3.01R) had already merged by kickoff; the brief's own fallback rule applied.
2. **`.env.local` uses dummy Supabase/Brevo values**, never a real credential — a static local Lighthouse/axe pass makes no real network calls, so placeholders are enough to unblock `/admin/login`'s build-time prerender.
3. **`@axe-core/cli` chosen over Playwright** for automated a11y — smaller devDependency footprint given no existing e2e infra; hit a Chrome/chromedriver version mismatch (`browser-driver-manager` couldn't resolve it either) and fixed it by pinning `chromedriver@149.0.4` to match the local Chrome install (documented as a per-machine re-pin, not a product dependency).
4. **Four index `*-ink` colors re-darkened** (`blu`, `teal`, `org`, `yel`) after axe found them below 4.5:1 on their own soft tint — updated in both `globals.css` (the Tailwind/screen source) and `src/lib/indices.ts` (the duplicate `@react-pdf`-safe JS source), now kept in sync by a new test.
5. **Three more real axe fixes**: `Progress`'s visible `label` now wires as `aria-labelledby` (was never programmatically associated); `/admin/login` gained a `<main>` landmark (had none); `/kit`'s report-preview `Heading` moved `h4`→`h3` (was skipping a level under the Section's `h2`).
6. **Select placeholder opacity `/70`→`/90`** — the faded placeholder text measured 3.39:1 on white (below the 4.5:1 text floor); `/90` measures 5.36:1 while staying visually distinct from full-opacity selected text.
7. **Local mobile Lighthouse Performance/LCP is flagged, not force-fit** — see "Tests run" below for the full number + root-cause explanation; re-measurement is deferred to 2.05's real Vercel preview per the brief's own carve-out, rather than chasing framework-diet changes outside this phase's scope.

## Surprises / off-spec changes

- **`src/lib/indices.ts` duplicates `globals.css`'s ink/soft hex literals** (documented in the file's own header comment, for `@react-pdf`-safety) had **no sync guard** before this phase — the contrast bug was live in the actual rendered UI (band-label pills, index-band-bar labels) even though it wasn't yet caught by anything. Fixed both sources and added `src/lib/__tests__/indices-contrast.test.ts` to pin it going forward.
- **No local `.env.local`, no Lighthouse/axe tooling, and no Chrome/chromedriver version match** were all present before this phase started — none were spec surprises exactly, but each cost real setup time (see Decisions 2–3) worth flagging since the next phase to touch this tooling will hit the same chromedriver-version friction on a different machine.
- **`browser-driver-manager`** (tried first for axe's Chrome driver) silently failed to complete an install twice (no error, no env file written) — abandoned in favor of directly pinning a matching `chromedriver` npm package version instead.

## Files written / updated

**New:**
- `scripts/check-contrast.ts` — reproducible WCAG contrast calculator over `globals.css` tokens.
- `src/lib/__tests__/indices-contrast.test.ts` — pins ink-vs-soft-tint contrast ≥4.5:1 and `indices.ts`↔`globals.css` sync.
- `docs/perf-a11y-audit.md` — full local reproduction steps for Lighthouse + axe (for 2.05 re-verification).
- `.env.local` (gitignored, not committed) — local-only dummy values, see Decision 2.

**Modified:**
- `src/features/assessment/tasks/task-renderer.tsx` — 7 task renderers → `next/dynamic`, `TaskLoadingFallback`.
- `src/app/(site)/procena/end-phase-view.tsx` — `LeadForm`/`Confirmation` → `next/dynamic`.
- `src/app/(site)/procena/__tests__/end-phase-view.test.tsx` — 2 assertions `getByText`→`findByText` (dynamic import is async).
- `src/app/globals.css` — `blu-ink`/`teal-ink`/`org-ink`/`yel-ink` re-darkened.
- `src/lib/indices.ts` — same 4 ink hex values, kept in sync.
- `src/components/ui/progress.tsx` — `aria-labelledby` wired from the visible `label`.
- `src/components/ui/select.tsx` — placeholder opacity `/70`→`/90`.
- `src/app/admin/login/page.tsx` — root `<div>`→`<main>`.
- `src/app/kit/report-preview.tsx` — internal `Heading` `h4`→`h3`.
- `messages/mk.json` — new `common.loading` key (the dynamic-import loading fallback's `aria-label`).
- `package.json` — new pinned devDependencies (see `00_stack-and-config.md`).

## Tests run + results

- `npm run build`, `npm run typecheck`, `npm run lint`, `npm test` — **all green** throughout (final: 69 test files, 502 tests).
- **axe-core** (`@axe-core/cli` 4.12.1) against `/`, `/za-testot`, `/admin/login`, `/procena`, `/kit` — **0 violations on all 5**, after fixing 4 real issues found on the first pass (contrast ×2 kinds, missing landmark, missing progressbar name, heading-order skip).
- **Contrast** (`scripts/check-contrast.ts`) — 20 pairs checked (body ink/muted on bg+surface, all 5 index inks on their own soft tint + on bg + on surface, disabled-fg/bg): **19/20 pass** their WCAG floor; the 20th (disabled, 2.16:1) is WCAG-exempt (SC 1.4.3/1.4.11 excludes inactive controls) and documented as such, not silently ignored.

  | Pair | fg | bg | Ratio | Floor | Status |
  |---|---|---|---|---|---|
  | ink on bg | #231f26 | #faf8f4 | 15.28 | 4.5 | PASS |
  | ink on surface | #231f26 | #ffffff | 16.21 | 4.5 | PASS |
  | muted on bg | #5e5862 | #faf8f4 | 6.50 | 4.5 | PASS |
  | muted on surface | #5e5862 | #ffffff | 6.89 | 4.5 | PASS |
  | mag-ink on mag-soft | #b0067a | #fce0f1 | 5.41 | 4.5 | PASS |
  | mag-ink on bg / surface | #b0067a | — | 6.28 / 6.66 | 4.5 | PASS |
  | blu-ink on blu-soft | #00729c | #d6f2fd | 4.63 | 4.5 | PASS (was #0090c4, 3.10) |
  | blu-ink on bg / surface | #00729c | — | 5.09 / 5.40 | 4.5 | PASS |
  | teal-ink on teal-soft | #00776f | #d2f3f0 | 4.61 | 4.5 | PASS (was #007d75, 4.25) |
  | teal-ink on bg / surface | #00776f | — | 5.12 / 5.43 | 4.5 | PASS |
  | org-ink on org-soft | #955f00 | #fdebd3 | 4.60 | 4.5 | PASS (was #9a6200, 4.36) |
  | org-ink on bg / surface | #955f00 | — | 5.06 / 5.36 | 4.5 | PASS |
  | yel-ink on yel-soft | #8b6800 | #fff2cc | 4.62 | 4.5 | PASS (was #9a7400, 3.86) |
  | yel-ink on bg / surface | #8b6800 | — | 4.85 / 5.15 | 4.5 | PASS |
  | disabled-fg on disabled-bg | #a99cb3 | #ede9f0 | 2.16 | 3 | EXEMPT (1.4.3/1.4.11) |

- **Manual WCAG 2.2 AA pass** — done as a **code-level audit** (no local headless-browser tool could drive real Tab/Enter input against the stateful `/procena` SPA reliably; the connected Claude-in-Chrome browser instance was remote, not local, so it couldn't reach `localhost:3010`), cross-checked against the 0-violation axe results:
  - Every custom interactive control across all 7 task types (`gf/gv/gsm/gs/ef/glr/ct-task.tsx`) is a real `<button>` (native `Button`, `AnswerOption`, or a literal `<button type="button">`) — confirmed by grepping every `onClick` site and reading the surrounding markup. Native buttons get Enter/Space activation for free; none re-implement keyboard handling.
  - `ef-task.tsx`'s Tower-of-London peg is a dynamic `Tag = onClick ? "button" : "div"` — correctly only focusable/keyboard-operable when actually selectable.
  - No `tabIndex`, `autoFocus`, or custom `onKeyDown` exists anywhere in the task/component tree except `task-screen.tsx`'s `markActivity` (idle-timer bookkeeping only — never calls `preventDefault`/`stopPropagation`, so it cannot interfere with Tab/Enter/Space). **No keyboard traps found.**
  - `focus-visible:ring-[3px] focus-visible:ring-focus` present on every interactive primitive (`button.tsx`, `answer-option.tsx`, `input.tsx`, `checkbox.tsx`, `select.tsx`) — a visible, consistent focus ring across the whole flow.
  - `<html lang="mk">` confirmed (`src/app/layout.tsx`); heading order confirmed correct on all audited routes (the one violation found — `/kit`'s report-preview — is fixed).
  - The Gs speed-timer (`role="timer"`) remains the **only** timer in the app (confirmed by the pre-existing groundwork + no changes made to it this phase); reduced-motion doesn't remove its usability since it's a visual ring, not a Motion animation.
  - Tap-target minimums (≥44px base / ≥72px at ages 5–6) — unchanged from the existing `UX_BY_AGE` + `--size-tap-min` groundwork; not touched this phase since no violation was found tied to sizing.
  - `IdleNudge` observation (documented, not a violation): it's `role="status"` (non-modal by design — a dismissable reassurance overlay, not a blocking dialog) with no focus trap; a keyboard user tabbing while it's open could reach elements visually behind the semi-transparent overlay. Axe found no violation for this (0 on `/kit` and `/procena`, both of which render it open), but it's worth a look in a future a11y pass — not fixed here to avoid redesigning a working, deliberately non-modal pattern outside this phase's scope.
- **Reduced-motion** — confirmed via code: `puzzle-brain.tsx` is the **only** Motion (`motion/react`) consumer in the whole repo (grepped `from "motion"` across `src/`), already branches on `useReducedMotion()` to `{ duration: 0 }`; every other animated affordance (`answer-option.tsx` feedback, button hover/active, idle-nudge appearance) is a plain CSS `transition-*` class, all neutralized by the existing global `@media (prefers-reduced-motion: reduce)` block in `globals.css` (`transition-duration: 0.001ms !important` etc. on `*`). No new fallback was needed; nothing was found unhandled.
- **Server-only leak check** — grepped all `.next/static/chunks/*.js` for `react-pdf`, `supabase/server`, `brevo/server`, and the two secret env-var names: **zero matches**, confirming `serverExternalPackages` + the `server-only` imports keep those modules out of every client bundle.
- **Lighthouse** (median of 3 runs per route, mobile = default simulated Slow-4G + 4× CPU; desktop = `--preset=desktop`):

  | Route | Mobile Perf | Mobile A11y | Mobile BP | Mobile SEO | Mobile LCP | Desktop (all 4) |
  |---|---|---|---|---|---|---|
  | **Before code-split** | | | | | | |
  | `/` | 94 | 100 | 100 | 100 | 3.1s | 100/100/100/100 |
  | `/procena` | 91 | 100 | 100 | 100 | 3.4s | 100/100/100/100 |
  | `/za-testot` | 96 | 100 | 100 | 100 | 2.7s | 100/100/100/100 |
  | **After (this phase, final)** | | | | | | |
  | `/` | 95 | 100 | 100 | 100 | ~2.9s | 100/100/100/100 |
  | `/procena` | 92 | 100 | 100 | 100 | ~3.3s | 100/100/100/100 |
  | `/za-testot` | 94 | 100 | 100 | 100 | ~3.1s | 100/100/100/100 |

  **Honest read:** Accessibility/Best-Practices/SEO are a clean 100 everywhere (mobile + desktop), meeting the DoD outright. Desktop Performance is 100/100/100/100 across all three routes. **Mobile Performance/LCP did not clear the ≥95 / ≤2.5s targets** despite the real, measured bundle-size win (`/procena` −182 KB). Root cause (via Lighthouse's `lcp-breakdown-insight`): the *observed* page timing is tiny (single-digit-ms TTFB, ~100ms element render delay — the H1/setup-copy text paints almost immediately), but Lighthouse's **Lantern simulation** models a much higher LCP (~3s) by extrapolating network/CPU cost from the ~460–1100 KB of still-necessary shared framework JS (React 19, Next runtime, next-intl, Motion's `domAnimation` bundle, Radix UI, lucide icons) against `next start`'s plain **HTTP/1.1** localhost server — no HTTP/2 multiplexing, no CDN edge, exactly the gap the brief's own context section calls out ("real-network confirmation on the Vercel preview... is a 2.05 carryover"). Closing this further would mean framework-diet work (auditing Radix/lucide/next-intl runtime weight) beyond this phase's "lazy-load by section, no product logic changes" scope — flagged here rather than force-fit or silently claimed as met. **Recommend re-measuring at 2.05 against the real HTTP/2 Vercel preview before treating this as a blocking gap.**
- **Bundle size** (sum of every `<script src>` referenced in the initial HTML, uncompressed):

  | Route | Before | After | Δ |
  |---|---|---|---|
  | `/` | 767.0 KB (13 scripts) | 766.9 KB (13 scripts) | ~flat (expected — untouched code) |
  | `/procena` | 1318.6 KB (14 scripts) | 1136.1 KB (15 scripts) | **−182.5 KB (−13.8%)** |
  | `/za-testot` | 767.0 KB (13 scripts) | 766.9 KB (13 scripts) | ~flat (expected — untouched code) |

## Blocked / carryover

- [ ] **Mobile Lighthouse Performance/LCP on `/procena` (92 / ~3.3s) and `/` (95 / ~2.9s) should be re-measured against the real Vercel HTTP/2 preview at 2.05** — this phase's local HTTP/1.1 Lantern-simulated numbers likely understate real-world performance (see root-cause above); do not treat the local number as the final gate.
- [ ] **HTTPS/HSTS Best-Practices audits** — not applicable to a local `http://` server; confirmed at 2.05 per the brief.
- [ ] **Final real-hardware iOS Safari + Android Chrome pass** — remains Phase 3.05, per the brief; this phase's manual a11y pass was a code audit + axe, not a live device click-through (no local tool could drive the stateful flow — see "Tests run").
- [ ] **`IdleNudge`'s non-modal focus behavior** (documented above, not a violation) — worth a closer look in a future a11y pass, not fixed here.
- [ ] **`chromedriver` version pin (`149.0.4`) is machine-specific** — the next machine to run `@axe-core/cli` locally will likely need to re-pin to match its own Chrome install; documented in `docs/perf-a11y-audit.md`.

## What's next

Part 2's remainder (2.03 Meta/GA4 — externally blocked; 2.05 Vercel preview deploy) or the Part 3 security hardening (rate-limit/anti-bot on `/api/lead`, `/api/score`, `/api/admin/export`) are the logical next phases. **Chat should tell Lazar:** the mobile Lighthouse Performance/LCP numbers are close but not fully at the ≥95/≤2.5s targets locally, with a well-understood, disclosed root cause (local HTTP/1.1 Lantern simulation vs. the real HTTP/2 edge) — recommend re-measuring at 2.05 before deciding whether further optimization work is warranted.

---
*IqUp-V2 | Part 3 · Phase 02 Completion | 2026-07-04*
