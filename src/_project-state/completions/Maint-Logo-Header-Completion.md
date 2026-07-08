# Maintenance · Real IQ UP! logo in headers · Completion Report

**Phase:** Maintenance (out-of-sequence) — real IQ UP! logo in the app headers
**Executing Claude:** Code
**Date completed:** 2026-07-08
**Branch:** `chore/real-iqup-logo` (cut from the current `main` tip — 3.02 already merged, PR #16)
**Commits:** one commit (see PR)
**PR:** _opened into `main` — awaiting Lazar's merge (link in PR)_

## What shipped

- The **real IQ UP! logo** now renders on the three in-app header surfaces — the landing (`/`), the static-page shell (`/za-testot`, `/politika-za-privatnost`, `/uslovi`), and the authenticated admin shell — replacing the code-drawn `PuzzleBrain`-chip + `IQ UP!` text stand-in that had stood in every header since the app began.
- The mark is served as a static file, `public/brand/iqup-logo.svg` (new `public/brand/` folder = the home for brand marks going forward), through one tiny shared component, `src/components/ui/logo.tsx` (`<Logo />`) — a plain isomorphic `<img>`, `alt="IQ UP!"`, intrinsic 192×54, `h-9 w-auto`, overridable `className`.
- The `PuzzleBrain` component and all its progress / completion / pentagon (motion-motif) usages are **untouched**; e-mail, PDF, favicon, and OG assets are **untouched** (each is a separate follow-up — see Blocked/carryover).

## Decisions made on the fly

*Logged in `Decisions.md` as D-156 / D-156a / D-156b.*

1. **Served as a static `<img>`, not inlined SVG (D-156)** — the Illustrator export carries a `<style>` block + generic gradient/clip-path ids (`linear-gradient`, `clip-path`, `cls-*`); inlining would leak those global ids into the page and collide (the classic "logo goes black/blank" failure). An external file scopes them to the image.
2. **Admin keeps a muted "Админ" role tag beside the logo (D-156a)** — the old admin wordmark was "IQ UP! · Админ"; a bare `<Logo />` would look identical to the public site and erase the "you're in the back-office" signal. Kept it via a new `admin.roleTag` mk.json key (no hardcoded string). `admin.appName` stays in mk.json (now unused) for future reuse.
3. **`h-9` (36px), documented `eslint-disable`, and moved the asset out of repo root (D-156b)** — picked `h-9` over `h-10` (reads correctly in all three headers); added a documented `eslint-disable-next-line @next/next/no-img-element` since a plain `<img>` is intentional (`next/image` won't optimize an SVG and needs `dangerouslyAllowSVG`); moved the provided `IQUP Main Logo.svg` from the repo root to `public/brand/iqup-logo.svg` and removed the root copy so `public/brand/` is the single home.

## Surprises / off-spec changes

- The provided asset arrived in the **repo root** as `IQUP Main Logo.svg` (untracked), not pre-placed. It passed every Step-1 validation check (viewBox `0 0 192 54`, one `<style>` block, `linearGradient` defs, **no** `<script>`, no external refs beyond the standard `www.w3.org` XML namespaces). One nuance vs. the brief's "begins with `<svg`" check: the file has a standard `<?xml version="1.0" encoding="UTF-8"?>` prolog before `<svg>` — valid and harmless when served as a static `<img>` — so it was used as-is (not redrawn/regenerated).
- The **admin shell is behind Supabase auth** (dummy local creds per D-149), so the authenticated chrome can't be reached by logging in locally. To still eyeball it, a **temporary** dev-only route rendering `<AdminShell>` was created, screenshotted, and then **deleted** (not part of the commit). `/admin` was also confirmed to still redirect cleanly to `/admin/login` after the import change.

## Files written / updated

**New:**
- `public/brand/iqup-logo.svg` — the real IQ UP! horizontal lockup (puzzle-brain + "EDUCATION THAT INSPIRES"), intrinsic 192×54.
- `src/components/ui/logo.tsx` — shared `<Logo />` (`<img>` of the brand mark).
- `src/_project-state/completions/Maint-Logo-Header-Completion.md` — this report.

**Modified:**
- `src/app/(site)/page.tsx` — header lockup → `<Logo />` (non-linked); removed the now-unused `PuzzleBrain` import.
- `src/app/(site)/page-shell.tsx` — header lockup → `<Logo />` inside the existing home `<Link>` (focus ring + back-to-home kept); removed the `PuzzleBrain` import.
- `src/app/admin/admin-shell.tsx` — header wordmark → `<Logo />` + a muted `admin.roleTag` ("Админ") tag; added the `Logo` import.
- `messages/mk.json` — new `admin.roleTag` = "Админ".
- `src/_project-state/file-map.md` — added the asset + `logo.tsx` lines; annotated the three header files.
- `src/_project-state/current-state.md` — refreshed "Last updated" + active branch + the landing description.
- `Decisions.md` — new entries D-156 / D-156a / D-156b.

## Tests run + results

- `npm run typecheck` — **green** (no errors).
- `npm run lint` — **green** (0 errors, 0 warnings; the `no-img-element` warning is silenced by the documented, intentional `eslint-disable`).
- `npm test` — **green**: 69 files, **502 tests** passed (unchanged from 3.02 — no test touched behavior this change covers).
- `npm run build` — **green** (with the local dummy Supabase env from D-149; the middleware→proxy deprecation notice is pre-existing and unrelated).
- **Visual (dev server):** the real logo renders crisply, correctly sized, and vertically centered — confirmed on `/` (landing, non-linked), `/za-testot` (static shell, linked home + "← Почетна"), and the admin shell (via the temporary preview route: logo + muted "Админ" tag + Статистика/Контакти nav + Одјава). No layout shift on load (intrinsic width/height reserve the box).
- **Review:** CodeRabbit / Codex are not connected to the repo yet (standing carryover), so no automated review ran. An internal adversarial self-review was done: confirmed no other header/consumer of the old stand-in was missed, `PuzzleBrain` is still imported/used by its motion-motif consumers, the two removed `PuzzleBrain` imports are the only ones dropped, and the asset has no `<script>` / external refs.

## Blocked / carryover

- [ ] **Favicon** (`src/app/favicon.ico`) — needs a square crop of just the brain mark. Deferred.
- [ ] **Open Graph / link-share image** — needs a PNG. Deferred.
- [ ] **PDF report header** (`src/features/report/pdf/document.tsx`) — `@react-pdf` can't render this gradient/`<style>` SVG; needs a raster PNG. Deferred.
- [ ] **Transactional e-mail wordmark** (`src/lib/brevo/email-template.ts` / `email.*` in mk.json) — needs a hosted absolute-URL PNG with a text fallback. Deferred.

## What's next

Back to the numbered plan — **2.05** (Vercel-preview real-network Lighthouse/LCP confirmation, the 3.02 carryover) and/or the Part 3 security pass. The four deferred logo surfaces above can be batched into a follow-up once the raster / square-crop / OG assets are supplied.

---
*IqUp-V2 | Maintenance · Real IQ UP! logo in headers | 2026-07-08*
