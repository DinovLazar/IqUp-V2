# Part 3 · Phase 03a — Cookie consent banner + analytics consent gate · Completion Report

**Phase:** Part 3 · Phase 3.03a — Cookie consent banner + analytics consent gate
**Executing Claude:** Code
**Date completed:** 2026-07-12
**Branch:** `feat/cookie-consent-banner` (cut from `main` tip `e4a0d1e`)
**Commits:** `557a87f` (code + tests + docs) + this report-fields update
**PR:** [#23](https://github.com/DinovLazar/IqUp-V2/pull/23) into `main` (Lazar merges)

## What shipped

- **A consent feature module** `src/features/consent/` (pure-core / thin-IO, mirroring `features/progress/`): `schema.ts` (strict Zod blob, no PII), `storage.ts` (the only browser touchpoint — versioned key `iqup:cookie-consent:v1`, fail-soft, date-only stamp, change signal), `consent.ts` (browser-free API: `getConsent`/`setConsent`/`clearConsent`/`hasAnalyticsConsent`/`subscribeConsent`), and an `index.ts` barrel. A **third on-device store**, no PII, unjoinable with Store A/B (D-170).
- **The analytics consent gate**: `trackEvent` (in `src/lib/analytics.ts`) now returns on its first line unless `hasAnalyticsConsent()` is exactly `"accepted"`, so **GA4/Meta (2.03) can never fire without an explicit "Accept all"** (D-169). Public signature + all call sites unchanged; the forward body is the split-out, unit-spyable `analyticsForwarder.forward`.
- **A non-blocking cookie banner** (`cookie-banner.tsx`) mounted on the `[locale]` public tree only (D-171): two explicit, equal-weight buttons ("Accept all" / "Essential only"), **no dismiss-X** (D-168), the short `<Disclaimer/>` (**§16.1 placement #7 — now 7 of 7 live**), a locale-aware Privacy link, `role="region"` + `aria-label`. Hydration-safe via `useSyncExternalStore` (D-173).
- **A "manage cookies" withdrawal control** (`cookie-settings.tsx`) on `/politika-za-privatnost` → `clearConsent()` reopens the banner (GDPR "withdraw as easily as give").
- **Copy**: a new `cookie` namespace added verbatim to **both** `messages/mk.json` and `messages/sr.json` (exact key parity), spec-voice placeholder pending lawyer + SR review (D-172).
- **9 tests** across store / API / SSR / guards / analytics gate / banner; state files + decision log updated.

## Decisions made on the fly

*(Logged in `Decisions.md` as D-173…D-175.)*

1. **`useSyncExternalStore` for the banner, not a `useState`+`useEffect` mounted-guard (D-173)** — hydration-safe (server sentinel → renders `null` on server + during hydration) AND reactive to the store (a choice here or a withdrawal on the Privacy page shows/hides it with no manual state or reload). It also cleanly satisfies the `react-hooks/set-state-in-effect` lint rule, which (correctly) forbids the synchronous `setMounted(true)` an effect-based mounted-guard would use.
2. **The `trackEvent` forward body is split onto an exported `analyticsForwarder.forward` object-method, bridged by an `AnalyticsTrackArgs` tuple-union (D-174)** — so a unit test can spy on `.forward` to prove the gate guards it now (while the body is inert), and 2.03 has one gated place to add the real push, with the public `trackEvent` signature unchanged.
3. **The date stamp + the cross-component change signal both live in `storage.ts` (D-175)** — a date-only `decidedAt` (never finer, so it can't correlate) and the `iqup:consent-changed` custom event + cross-tab `storage` event, so `consent.ts` and the UI stay `window`-free and the "only `storage.ts` touches the browser" guard holds identically to the progress store.

## Surprises / off-spec changes

- **The local checkout was 4 commits stale.** The phase prompt's Context assumes Serbian is merged (`[locale]` tree, `sr.json`, `src/i18n/{routing,navigation}.ts`, `root-document.tsx`). My initial `git status` snapshot showed `main` at `ded42cc` (PR #20) with none of those files present, which looked like a hard contradiction. Per AGENTS.md precedence (**live code > docs**) I investigated before building: `git fetch` revealed local `main` was 4 commits behind `origin/main`, which had **PR #21 (Serbian, `9f387a0`)** and **PR #22 (Vercel Web Analytics)** merged. I fast-forwarded `main`, cut the branch from the true tip, and everything in the prompt's Context was then present and accurate. **No code impact** — just required syncing before starting.
- **`npm install` was required and touched two files.** The stale `node_modules` predated PR #22, so typecheck failed on the missing `@vercel/analytics/next` and stale `.next/types` pointing at the old `(site)` tree. `npm install` (no new dependency — only syncing existing deps) + `rm -rf .next` fixed both. `npm install` also pruned one extraneous nested `@swc/helpers` entry from `package-lock.json`; I **reverted `package-lock.json`** to keep the PR focused on the feature.
- **axe/Chrome version skew, but the scan still ran.** The machine has Chrome 150 vs. the pinned `chromedriver` 149; the DoD anticipated this needing a code-level fallback, but the real `npx axe` scan tolerated the skew and ran — **0 violations** on `/`, `/politika-za-privatnost`, and `/sr` with the banner visible.

## Files written / updated

**New:**
- `src/features/consent/schema.ts` — strict Zod `storedConsentSchema` + `isStoredConsent` + `ConsentDecision` / `CONSENT_VERSION`
- `src/features/consent/storage.ts` — the only browser touchpoint: `localStorage` adapter (versioned key, date stamp, fail-soft) + change signal
- `src/features/consent/consent.ts` — browser-free API: `getConsent`/`setConsent`/`clearConsent`/`hasAnalyticsConsent`/`subscribeConsent`
- `src/features/consent/index.ts` — barrel (store API only; no `.tsx`)
- `src/features/consent/cookie-banner.tsx` — the non-blocking banner (`"use client"`, `useSyncExternalStore`)
- `src/features/consent/cookie-settings.tsx` — the "manage cookies" withdrawal control (`"use client"`)
- `src/features/consent/__tests__/{storage,consent,consent-ssr,guards}.test.ts` + `cookie-banner.test.tsx` — the 5 test files
- `src/lib/__tests__/analytics.test.ts` — the consent-gate test
- `src/_project-state/completions/Part-3-Phase-03a-Cookie-Banner-Completion.md` — this report

**Modified:**
- `src/lib/analytics.ts` — consent gate at the top of `trackEvent`; forward body split to `analyticsForwarder.forward`; `AnalyticsTrackArgs`; essential-cookies note
- `src/app/[locale]/layout.tsx` — mounts `<CookieBanner/>` alongside `{children}`
- `src/app/[locale]/(site)/politika-za-privatnost/page.tsx` — mounts `<CookieSettings/>`
- `messages/mk.json`, `messages/sr.json` — new `cookie` namespace (verbatim, key parity)
- `src/_project-state/current-state.md` — new "Last updated" + a consent-feature section + 7/7 placement audit + `trackEvent` gated + corrected the stale PR #21 / switcher-removal active-branch lines (SR is merged; new branch active)
- `src/_project-state/file-map.md` — consent feature block + updated analytics/layout/privacy entries
- `Decisions.md` — D-168…D-175

## Tests run + results

- `npm test` — **79 files / 561 tests, all passing** (was 73/529 before; +6 files / +32 tests). Includes the mk↔sr parity test (auto-covers the new `cookie` namespace) and the untouched 1.08 lead-form/confirmation tests (they mock `@/lib/analytics`, so the gate is transparent to them).
- `npm run typecheck` — **clean** (after the `npm install` + `.next` clear).
- `npm run lint` — **clean** (0 errors; the banner uses `useSyncExternalStore`, so no `set-state-in-effect` violation).
- `npm run format:check` — **clean**.
- `npm run build` — **green**: `✓ Compiled successfully`, 16 pages incl. MK + SR SSG static pages; the client banner in the layout does not break static generation.
- **axe-core** — `0 violations found!` on `/`, `/politika-za-privatnost`, and `/sr`, each with the banner visible (real Chrome scan; Chrome 150 / chromedriver 149 skew tolerated).
- **In-browser verification** (dev server): banner shows on `/` when undecided; **Accept all** → stored `{"decision":"accepted","version":1,"decidedAt":"2026-07-12"}` + banner hidden + `hasAnalyticsConsent()===true`; **Essential only** → `declined` + off; **manage cookies** on Privacy → consent cleared + banner reappears with no reload; **SR** banner renders in Serbian with the Privacy link correctly `/sr`-prefixed; banner absent on `/kit` and `/admin/login` (undecided).

## Blocked / carryover

- [ ] **Lawyer-reviewed Privacy/Terms body + final consent wording (3.03b).** The `cookie.*` copy is spec-voice placeholder (D-172); swapping it (and the `pages.privacy`/`pages.terms` bodies) is copy-only — the mechanism is shipped.
- [ ] **SR native review of the `cookie` copy** (parallel to the D-162 SR legal posture).
- [ ] **GA4/Meta wiring (2.03, externally blocked)** now has its gate: 2.03 fills `analyticsForwarder.forward`, entirely behind the consent check.
- [ ] **A site-wide footer** (About/Privacy/Terms nav) is still pending later chrome — out of scope here.

## What's next

Likely **2.05** (Vercel preview / deploy — the first real-network confirmation, incl. re-running Lighthouse/axe on the edge) and/or the Part 3 security pass (rate-limit / anti-bot on the API routes). Chat should note to Lazar that Serbian + Vercel Analytics were already merged (PR #21/#22) and that the "all 7 disclaimer placements" launch criterion is now **fully satisfied (7 of 7)**.

---
*IqUp-V2 | Part 3 · Phase 03a Completion | 2026-07-12*
