# Feat · Code — Full Serbian (Latin) localization · Completion Report

**Phase:** Feat — Full Serbian (Latin) localization (add SR alongside MK)
**Executing Claude:** Code
**Date completed:** 2026-07-10
**Branch:** `chore/remove-language-switcher` (PR #21, **reused**; SR work developed on `feat/locale-sr` off the `main` tip `ded42cc` — real logo + favicon + hero class-photo)
**Commits:** one squashed commit; the branch was repointed from the D-158 removal to this SR work (the removal is superseded)
**PR:** [#21](https://github.com/DinovLazar/IqUp-V2/pull/21) — reused (was "chore: remove the inert MK/EN language switcher"); do **not** self-merge (Lazar merges after CodeRabbit)

## What shipped

- **SR is a fully wired second locale.** next-intl 4 i18n routing is enabled — **MK at the root (byte-for-byte unchanged), SR under `/sr`** (`localePrefix: "as-needed"`, `localeDetection: false`), from a single canonical locale list (`src/i18n/routing.ts`). `<html lang>` reflects the active locale; the locale persists via the URL prefix + `NEXT_LOCALE` cookie.
- **A functional MK/SR header switcher** (`src/components/ui/locale-switcher.tsx`) replaces the old inert MK/EN JSX — driven off the enabled-locale list, active state marked by a check glyph + `aria-current` (not colour-only), ≥44px keyboard-accessible targets, on the landing header + static-page shell, **not** inside `/procena`. Approved pill look preserved.
- **`messages/sr.json`** — a complete Serbian (Latin) translation with exact key + array-shape parity to `mk.json` (parity-tested). Switcher keys: dropped `langEn`/`langDisabledNote`, added `langSr` + `langSwitcherLabel`.
- **A fully Serbian report on screen, in the PDF, and in the e-mail** — the module library gained an `sr` register per slot (`assembleReport(result, lang)`), the index labels / pentagon vertices / band words / confidence words / `{child}` resolver are locale-aware, and the PDF + transactional e-mail pick the message bundle by locale. A test proves no reachable report slot falls back to Macedonian or blank.
- **Serbian metadata + SEO** — locale-aware `generateMetadata`, `hreflang` MK↔SR alternates, `og:locale` per locale. Montserrat renders č ć š ž đ dž lj nj with no tofu in both the web app (`latin-ext` subset) and the PDF (bundled TTFs, glyph-coverage tested).

## Decisions made on the fly

Logged as **D-159 … D-167** in `Decisions.md`. Summary:

1. **D-159** — SR pulled forward; the switcher is rebuilt as MK/SR, **superseding D-158** (the switcher removal).
2. **D-160** — Serbian script = Latin (latinica); `latin-ext` added to the web Montserrat subset.
3. **D-161** — MK at root / SR under `/sr` (`as-needed`), `localeDetection` off (deterministic MK root); one canonical locale source.
4. **D-162** — SR legal/consent/disclaimer copy translated for function (needs its own SR/EU lawyer review, non-blocking); program names are **transliterations** (swap-only if the client supplies official Serbian names).
5. **D-163** — App restructure: `[locale]` segment for `(site)` under a pass-through root layout; `/admin` + `/kit` render their own `<html>` (Macedonian-only); middleware composes next-intl + the admin session refresh.
6. **D-164** — module library carries the locale via the existing `LocalizedText.sr` (no parallel files); `MODULE_LIBRARY_VERSION` 1.0.0 → **1.1.0** (minor — MK unchanged, not in the score row).
7. **D-165** — locale-aware non-JSON surfaces (indices/band/confidence via `useLocale`; `{child}` → „vaše dete“; PDF/email/score/Brevo by `lang`).
8. **D-166** — SR voice-lint scoped to the module library (legal/about negations out of scope, like MK).
9. **D-167** — Vitest aliases `@/i18n/navigation` to a jsdom-safe stub; static pages became async Server Components for SSG.

## Surprises / off-spec changes

- **Serbian case agreement + the `{child}` token.** The neuter „dete“ has nominative = accusative but differs in the genitive/dative/locative. Every Serbian module sentence is authored so `{child}` sits in a **subject or direct-object** slot (Macedonian constructions like „кај {child}“ / „на {child}“ / „профилот на {child}“ were rephrased) so „vaše dete“ agrees. Gender-unknown child-facing copy uses gender-neutral phrasings (present tense / impersonal) since Serbian past tenses + adjectives are gendered.
- **Static content pages → async.** Adding `[locale]` made `/za-testot`, `/politika-za-privatnost`, `/uslovi` render **dynamically** (they used sync `useTranslations` with no `setRequestLocale`). Converting them to async Server Components with `setRequestLocale` restored **SSG** for both locales; their test now await-calls them with `getTranslations`/`setRequestLocale` stubbed.
- **`no-html-link-for-pages` re-triggered on `admin/contacts`.** The `[locale]` root segment changed the ESLint rule's page detection, flagging a pre-existing `<a href="/admin/contacts">` (the "clear filters" link, unchanged by me). Fixed minimally by switching it to `next/link` `Link` (admin is MK-only, outside `[locale]`) — behaviour-identical.
- **next-intl client navigation under jsdom.** `createNavigation` needs `next/navigation` + an App Router context jsdom lacks; the component tests are aliased to a stub (D-167). Live routing + the switcher are verified by the build + an in-browser check.

## Files written / updated

**New (i18n + locale infra):**
- `src/i18n/routing.ts`, `src/i18n/navigation.ts`, `src/i18n/metadata.ts` — routing config (single canonical locale source), navigation wrappers, hreflang/og helpers
- `src/app/fonts.ts` — shared Montserrat (`latin` + `latin-ext` + `cyrillic`)
- `src/app/root-document.tsx` — shared `<html>` shell (lang + font + provider)
- `src/app/[locale]/layout.tsx`, `src/app/kit/layout.tsx` — new `<html>` roots; `src/app/admin/layout.tsx` now renders its own `<html>`
- `src/components/ui/locale-switcher.tsx` — the shared MK/SR switcher
- `messages/sr.json` — full Serbian (Latin) bundle
- `test/mocks/i18n-navigation.tsx` — jsdom navigation stub
- Tests: `src/i18n/__tests__/{routing,messages-parity}.test.ts`, `src/features/report/__tests__/sr-localization.test.ts`, `src/components/ui/__tests__/locale-switcher.test.tsx`

**Moved:** `src/app/(site)/**` → `src/app/[locale]/(site)/**` (whole tree, incl. tests).

**Modified:**
- `src/app/layout.tsx` → pass-through root; `src/middleware.ts` → composed next-intl + admin session
- `src/i18n/request.ts` → `requestLocale` + `hasLocale`; `next.config.ts` unchanged
- `src/lib/indices.ts` (SR label overlay + `indexLabel`), `src/components/ui/{band-label,confidence-label,index-band-bar,pentagon}.tsx` (locale-aware via `useLocale`)
- `src/features/report/{text.ts,assemble.ts}` (SR `{child}` + `lang` threading), all 11 `src/content/modules/*.ts` (SR content) + `version.ts` (1.1.0)
- `src/features/report/pdf/{document.tsx,render.ts}` + `src/lib/brevo/email-template.ts` (locale bundle by `lang`)
- `src/app/api/lead/route.ts` + `src/features/lead/{submit.ts,index.ts}` (locale in body / score demographics / Brevo `LANGUAGE`)
- The three localized page files (`page.tsx` landing + `procena/page.tsx` + the 3 static pages) — `params`/`setRequestLocale`/`Link`/switcher/metadata
- `messages/mk.json` — switcher keys renamed; `vitest.config.ts` — navigation alias
- State docs: `Decisions.md`, `00_stack-and-config.md`, `current-state.md`, `file-map.md`

## Tests run + results

- `npm run typecheck` ✓ · `npm run lint` ✓ (0 problems) · `npm run format:check` ✓
- `npm run build` ✓ — 16 pages; `/`, `/procena`, and the 3 static pages are **SSG for both `/mk*` and `/sr*`**; `/admin`/`/api`/`/kit` unchanged. (The pre-existing D-128 `middleware`→`proxy` warning remains.)
- `npm test` ✓ — **73 files, 529 tests** (was 69 files / 502). New: message parity, routing config, SR report completeness + no-MK-leak + voice-lint + `{child}`, PDF latinica glyph coverage, switcher/routing. Every pre-existing engine/task/scoring test stays green — **no score/norm value changed**.
- **In-browser (dev):** `/` = MK (`<html lang="mk">`) → switcher → `/sr` = Serbian (`<html lang="sr">`, "Otkrijte kako razmišlja vaše dete"), locale-aware links keep `/sr` (`/sr/procena`), the switcher is absent inside `/procena`, hreflang MK↔SR + `og:locale sr_RS` present, **zero console errors**.
- **SR PDF + e-mail generation:** `renderReportPdf(model, { city, lang: "sr" })` → 42 KB PDF with real latinica; `buildReportEmail({ …, lang: "sr" })` → Serbian subject + `<html lang="sr">` + "Zakaži besplatan demo čas". The Brevo send path is unchanged (best-effort).

## Blocked / carryover

- [ ] **Serbian legal / consent / disclaimer copy needs its own SR/EU lawyer review** before a Serbian public launch (D-162; parallel-track, non-blocking — mirrors MK 3.03).
- [ ] **Serbian program names are transliterations, not official** (D-162) — if IQ UP! provides official Serbian program names, swap them in `src/content/modules/positioning.ts` (copy-only).
- [ ] **Re-measure SR routes at 2.05** on the real Vercel HTTP/2 preview (the 3.02 mobile-Lighthouse carryover now covers `/mk*` + `/sr*`).
- [ ] **HR/EN remain out of scope** — adding them later is a `routing.ts` locale + a message file + module `sr`-style registers, with no switcher change.
- [ ] Standard carryovers unchanged: booking URL, `middleware`→`proxy` rename (D-128), CodeRabbit/Codex app-connect, Brevo `noreply@iqup.mk` DNS.

## What's next

Open the PR (`feat/locale-sr` → `main`, CodeRabbit review, **Lazar merges**). After that, the remaining Part-2 work (2.03 analytics, 2.05 Vercel preview) and the Part-3 security pass are unaffected by this presentation/content layer. If a Serbian launch is imminent, route the SR legal/consent copy + official program names through review first.

---
*IqUp-V2 | Feat · Serbian (Latin) Localization Completion | 2026-07-10*
