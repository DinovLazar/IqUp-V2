# Part 1 · Phase 10 — Shared "informative, not diagnostic" disclaimer, static page shells & 7-placement audit · Completion Report

**Phase:** Part 1 · Phase 1.10 — Shared disclaimer component, static page shells & 7-placement audit
**Executing Claude:** Code
**Date completed:** 2026-06-23
**Branch:** `phase-1.10-disclaimer-static-pages` (cut from `main` — D-103)
**Commits:** _this PR_
**PR:** _to be backfilled_

## What shipped

- **One shared `Disclaimer` component** (`src/components/ui/disclaimer.tsx`) with two registers — `full` (the §D.4 paragraph) and `short` (the condensed footnote line) — sourcing **all** copy from `messages/mk.json` (`legal.disclaimer` / the new `legal.disclaimerShort`). It is isomorphic (no `"use client"`, next-intl `useTranslations`), so the same module renders in both Server and client components, and it exports `DISCLAIMER_KEYS` for the parity guard.
- **Every ad-hoc inline disclaimer replaced** by the shared component: the landing footnote (short), pre-start (short), and confirmation — both the main and the graceful-retry branch — (full). The duplicate `landing.disclaimer` + `prestart.disclaimer` mk.json keys and the `/kit` hardcoded `DISCLAIMER` const are deleted. The §D.2 **data note** stays a separate string (not folded in).
- **PDF copy parity**: `report/pdf/document.tsx` now renders **top = full** + **footer = short**, reading the same `legal` keys; a `disclaimer-parity` test ties the PDF tree to `DISCLAIMER_KEYS` ↔ mk.json (mirrors the `pentagon.ts`/`pentagon.tsx` one-source/two-renderer split + the 1.09 theme sync-guard).
- **Three static page shells**, now routable (prerendered, no longer 404): `/za-testot` (About — placement #6: §1.1 what-is/what-isn't + the full disclaimer), `/politika-za-privatnost` + `/uslovi` (pending-legal placeholders), over a shared `(site)/page-shell.tsx`; each with MK `metadata` + a semantic H1. The confirmation/lead-form consent link → `/politika-za-privatnost` now resolves.
- **A `/kit` entry** for the Disclaimer (both registers), **the 7-placement audit** (below), new **Vitest** coverage, and **Decisions.md** + the three live state files updated.

## 7-placement audit (spec §16.1)

| # | Placement | Status | Where / evidence |
|---|---|---|---|
| 1 | Landing footnote | **Wired now** (short) | `src/app/(site)/page.tsx` footer → `<Disclaimer variant="short" />`. Browser-verified (`<p data-disclaimer="short">`, `text-muted`); `disclaimer-placements.test.tsx` (source guard for the async RSC). |
| 2 | Pre-start screen | **Wired now** (short) | `src/app/(site)/procena/prestart-screen.tsx` → `<Disclaimer variant="short" />`. Render-guarded in `disclaimer-placements.test.tsx`. |
| 3 | Results / confirmation | **Wired now** (full, both branches) | `src/app/(site)/procena/confirmation.tsx` (main + `RetryView`). Render-guarded in `confirmation.test.tsx` (both branches assert `data-disclaimer='full'`). |
| 4 | PDF — top + bottom | **Wired now** (top = full / footer = short) | `src/features/report/pdf/document.tsx`. Guarded by `document.test.ts` (full=1 top / short=1 footer) + `disclaimer-parity.test.ts`. |
| 5 | Transactional e-mail | **Copy-ready, wired at host (Phase 2.02)** | Hosted by the Brevo e-mail template (not built in Part 1). Copy already in `legal.disclaimer` / `legal.disclaimerShort` — one-line drop-in. (D-102) |
| 6 | About-the-test page | **Wired now** (full) | `src/app/(site)/za-testot/page.tsx`. Render-guarded in `static-pages.test.tsx` (asserts `data-disclaimer='full'` === `legal.disclaimer`). |
| 7 | Cookie banner | **Copy-ready, wired at host (Phase 3.03)** | Hosted by the cookie banner (built at 3.03 legal finalization). Copy already in `legal.*` — one-line drop-in. (D-102) |

**5 of 7 wired now (1,2,3,4,6); 2 of 7 copy-ready and dropped in at their host phase (5 → 2.02, 7 → 3.03).** The plan §14 "all 7 placements" criterion is fully LIVE only at 3.03.

## Decisions made on the fly

*Logged in `Decisions.md` as D-102 … D-105.*

1. **D-102 — 5-wired / 2-deferred placement split.** Wired #1/#2/#3/#4/#6 now; #5 (e-mail) + #7 (cookie banner) copy-ready in mk.json for a one-line drop-in. *Alternative considered:* stub fake e-mail + cookie-banner hosts now. *Honest downside:* "all 7 placements" is only fully LIVE at 3.03; this audit marks 2 of 7 as "copy ready, wired at host." *Why: stubbing non-existent hosts is dead scaffolding that misrepresents what ships.*
2. **D-103 — Branched from `main`.** PR #8 (1.09) is already merged (`ad51f18`), so `main` is the chain tip; the brief's "branch from the tip because #8 isn't merged" premise was stale (mirrors D-101/D-092).
3. **D-104 — `Disclaimer` is isomorphic (no `"use client"`); the static pages are sync Server Components** (`useTranslations` body + async `generateMetadata`), over a shared `page-shell.tsx`. *Why: one component serves both registers in both runtimes; sync Server Components stay unit-testable under the provider.*
4. **D-105 — PDF footer = short line, top = full (refines D-100); duplicate short keys consolidated into one `legal.disclaimerShort`, guarded against drift** by the single-source + parity tests.

## Surprises / off-spec changes

- **next-intl serializes the whole message bundle into every page's HTML** (the `NextIntlClientProvider` in the root layout), so a raw-HTML `includes()` check matches any string on any page. Visible-DOM checks (live `document.querySelector`) and the H1/status checks are the reliable signals — used for browser verification.
- **The async landing page (`page.tsx`) can't be unit-rendered** (its `getTranslations` needs request scope absent in Vitest), so placement #1 is held by a **source-wiring guard** + browser verification + the component-level render test, while placement #2 (the client pre-start screen) gets a real render test. Honest, and consistent with the repo never unit-testing the async landing/procena pages.
- The jsdom env's `import.meta.url` is not a `file://` URL — the placements test reads source via `process.cwd()` (the single-source test, in the Node env, uses `import.meta.url` fine).

## Files written / updated

**New:**
- `src/components/ui/disclaimer.tsx` — the shared `Disclaimer` (full/short) + `DISCLAIMER_KEYS`.
- `src/app/(site)/page-shell.tsx` — shared chrome for the static pages (wordmark + back-to-home header + content column).
- `src/app/(site)/za-testot/page.tsx` — About (placement #6): §1.1 what-is/what-isn't + the full disclaimer; MK `metadata` + H1.
- `src/app/(site)/politika-za-privatnost/page.tsx` — Privacy shell (pending-legal placeholder).
- `src/app/(site)/uslovi/page.tsx` — Terms shell (pending-legal placeholder).
- `src/components/ui/__tests__/disclaimer.test.tsx` — both registers render verbatim from mk.json; `DISCLAIMER_KEYS` resolve.
- `src/features/report/pdf/__tests__/disclaimer-parity.test.ts` — PDF top=full / footer=short tied to `DISCLAIMER_KEYS` + mk.json.
- `src/app/(site)/__tests__/static-pages.test.tsx` — each page's H1 + content; About shows the full disclaimer.
- `src/app/(site)/__tests__/disclaimer-single-source.test.ts` — no hardcoded disclaimer copy in production source; one mk.json occurrence each.
- `src/app/(site)/__tests__/disclaimer-placements.test.tsx` — placement #2 render guard + placement #1 (async RSC) source guard.

**Modified:**
- `messages/mk.json` — added `legal.disclaimerShort`, the `pages` namespace (about/privacy/terms), `common.home`; **removed** `landing.disclaimer` + `prestart.disclaimer`.
- `src/app/(site)/page.tsx` · `procena/prestart-screen.tsx` · `procena/confirmation.tsx` — swapped to `<Disclaimer/>`; removed dead inline copy.
- `src/app/kit/report-preview.tsx` — removed the hardcoded `DISCLAIMER` const → shared component.
- `src/app/kit/kit-gallery.tsx` — added the Disclaimer gallery section (both registers).
- `src/features/report/pdf/document.tsx` — footer → `legal.disclaimerShort`; refreshed comments.
- `src/features/report/pdf/__tests__/document.test.ts` — top=full (1) / footer=short (1) assertions.
- `src/app/(site)/procena/__tests__/confirmation.test.tsx` — pinned the §D.4 disclaimer to `data-disclaimer='full'` on both branches.
- `Decisions.md`, `src/_project-state/{current-state,file-map,00_stack-and-config}.md` — D-102…D-105 + live state.
- Removed the 3 reserved `(site)/{za-testot,politika-za-privatnost,uslovi}/.gitkeep` files.

## Tests run + results

- `npm run build` ✓ — 7 routes; `/za-testot`, `/politika-za-privatnost`, `/uslovi` prerender as static (○) — they no longer 404.
- `npm run lint` ✓ (0 problems) · `npm run typecheck` ✓ · `npm run format:check` ✓.
- `npm test` ✓ — **40 files, 248 tests** (was 35 / 232; +5 files, +16 tests). New: component variants, PDF copy-parity, static-page H1s, single-source + placement-wiring guards.
- **Browser QA** (preview server): `/za-testot` renders H1 + is/isn't + the full §D.4 disclaimer (`<p data-disclaimer="full">`) and stacks single-column on mobile; the landing footnote renders the short `<p data-disclaimer="short">` (`text-muted`); `/politika-za-privatnost` + `/uslovi` 200 with correct H1 + MK `<title>`; `/kit` shows both registers; **zero console + server errors**.
- **Adversarial review** (internal 5-dimension multi-agent pass, CodeRabbit/Codex still unconnected): 9 findings raised → 7 confirmed (**0 must-fix**, 2 should-fix, 5 nits), 2 refuted. Both should-fix items (render coverage for placements #1/#2; the retry-branch disclaimer assertion) were fixed + regression-tested; cheap nits also handled (stale PDF padding comment; strengthened About-page + confirmation assertions). The §D.2-vs-§D.4 separation concern was refuted (the verbatim `.toBe` component test already catches a fold-in).

## Blocked / carryover

- [ ] **2 of 7 placements wired at their host phase (D-102):** #5 e-mail → **2.02** (Brevo), #7 cookie banner → **3.03**. Copy is in `legal.*`; each is a one-line drop-in.
- [ ] **Final lawyer-approved Privacy/Terms BODY copy = Phase 3.03.** The shells show a "pending legal review" placeholder; the swap is copy-only (in `pages.privacy` / `pages.terms`). The §D.4 disclaimer copy is likewise the spec's verbatim placeholder, swapped to lawyer copy at 3.03 (copy-only, in `legal.*`).
- [ ] **No in-app nav to `/za-testot` + `/uslovi` yet** (only the consent link reaches `/politika-za-privatnost`). Placement #6 is satisfied (the About page hosts the disclaimer); a site-wide footer nav linking About/Privacy/Terms arrives with later chrome (cookie banner 3.03 / footer). Review nit, by design.
- [ ] **CodeRabbit + Codex apps still unconnected** — this PR (architectural: cross-screen swap + new routes + a copy-parity guard) used the internal adversarial review pass instead. Consider a Codex review once connected.

## What's next

**Part 1 is complete (1.01 → 1.10).** Next is **Part 2 · 2.01 — anonymous-scores database** (Cowork creates the EU Supabase project; Code builds the no-PII scores schema + the write path + the per-record version field). Chat should note for Lazar: this PR is stacked on the merged 1.09 and is ready for his merge (nobody merges their own PR); and that 2 of the 7 disclaimer placements (e-mail, cookie banner) are intentionally deferred to 2.02 / 3.03 with copy already in place.

---
*IqUp-V2 | Part 1 · Phase 10 Completion | 2026-06-23*
