# IqUp-V2 — Stack & Config Log

> Append-only log of stack and configuration decisions, with pinned versions. **Claude Code appends here** whenever a dependency is added/upgraded or a config decision is made. Newest entries at the bottom. Exact versions are pinned at Phase 1.01 when packages are first installed.
>
> Lives at `src/_project-state/00_stack-and-config.md`.

## Locked stack (seeded at kickoff — versions pinned at 1.01)

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router) | pin at 1.01 | React-based; serverless API routes are the backend. |
| Language | TypeScript | pin at 1.01 | Strict mode. |
| Styling | Tailwind CSS | pin at 1.01 | Brand tokens as theme config. |
| Components | shadcn/ui (Radix) | copy-in | Restyled to brand; components vendored into the repo. |
| Animation | Motion (Framer Motion) | pin at 1.01 | LazyMotion for a light bundle. |
| Icons | Lucide (lucide-react) | pin at 1.01 | UI icons only; science visuals are custom SVG. |
| Forms | React Hook Form + Zod | pin at 1.01 | Validation incl. consents; reused server-side. |
| i18n | next-intl | pin at 1.01 | MK at launch; no RTL. |
| PDF | @react-pdf/renderer | pin at 1.01 | Server-side report rendering. |
| Database | Supabase JS (Postgres, EU region) | pin at 1.01 | Anonymous scores only; project created in 2.01. |
| Admin auth | Supabase Auth | — | 2FA, roles, access logging. |
| Email / CRM | Brevo (API) | — | Server-side transactional send; account in 2.02. |
| Tracking | GA4 + Meta Pixel/CAPI | — | Server-side Lead, deduped via `event_id`; off outside production. |
| Hosting | Vercel | — | Hobby → Pro before launch (3.05). |
| DNS / CDN | Cloudflare | — | DNS-only record to Vercel (3.05). |
| Node | Node LTS | pin at 1.01 | Match Vercel's supported runtime. |
| Package manager | npm / pnpm | pin at 1.01 | Code picks at scaffold and records the choice here. |

## Config decisions

- **Environments:** dev / preview / production. Analytics + Meta are disabled outside production (spec §19.4).
- **Secrets:** never committed (public repo); only in Vercel env vars, server-side.
- **Branching:** single `main`, PR-only, branch protection, CodeRabbit + Codex (see `CLAUDE.md`).

## Append log

*(Code adds dated entries below as the stack/config changes — newest at the bottom.)*

- **2026-06-21** — Stack locked during planning (see `Decisions.md` D-011…D-018, D-024). Exact versions to be pinned at Phase 1.01.

- **2026-06-21 · Phase 1.01 — scaffold installed; versions pinned.**

  **Toolchain (developer machine):**
  - Node `v26.3.0`, npm `11.16.0`. **Package manager = npm** (pnpm/yarn not installed on the machine). Lockfile: `package-lock.json`. *(Vercel will pin its own Node runtime in Part 2; not constrained via `engines` yet.)*

  **Runtime dependencies (pinned in `package.json`):**
  | Package | Version | Role |
  |---|---|---|
  | next | 16.2.9 | Framework (App Router, Turbopack build) |
  | react / react-dom | 19.2.4 | UI runtime |
  | next-intl | ^4.13.0 | i18n (MK at root) |
  | motion | ^12.40.0 | Animation (successor to `framer-motion`; import from `motion/react`) |
  | lucide-react | ^1.21.0 | UI icons (added via shadcn) |
  | radix-ui | ^1.6.0 | shadcn primitives |
  | class-variance-authority | ^0.7.1 | shadcn variants |
  | clsx | ^2.1.1 | className helper |
  | tailwind-merge | ^3.6.0 | className merge |
  | tw-animate-css | ^1.4.0 | shadcn animations (Tailwind v4) |
  | shadcn | ^4.11.0 | **load-bearing**: `globals.css` imports `shadcn/tailwind.css` |

  **Dev dependencies:** typescript ^5, tailwindcss ^4 (+ @tailwindcss/postcss ^4), eslint ^9 (+ eslint-config-next 16.2.9), prettier ^3.8.4, prettier-plugin-tailwindcss ^0.8.0, @types/node ^20, @types/react ^19, @types/react-dom ^19.

  **Deferred dependencies (NOT installed in 1.01 — added in the phase that uses them, per D-010):** React Hook Form + Zod → Phase 1.08; @react-pdf/renderer → Phase 1.09; Supabase / Brevo / Meta / GA4 clients → Part 2.

  **Config decisions / deviations from `plan.md` §7:**
  - **Tailwind is v4 (CSS-first).** There is **no `tailwind.config.ts`** — theme tokens live in `src/app/globals.css` under `@theme`. The brand theme is implemented there in Phase 1.03. (Plan tree listed `tailwind.config.ts`; superseded.)
  - **`next.config.ts`** (TypeScript) instead of `next.config.js`; wrapped with `createNextIntlPlugin("./src/i18n/request.ts")`.
  - **next-intl approach = "without i18n routing"** (single MVP locale). `src/i18n/request.ts` returns `locale: "mk"` + the `messages/mk.json` bundle; the root layout reads it via `getLocale()`/`getMessages()` and sets `<html lang>`. Locale-ready: add a `[locale]` segment + middleware later for SR/HR/EN. No RTL.
  - **shadcn/ui** initialised with the **radix** component library + **Nova** preset, **neutral** base color, **Lucide** icons, CSS variables on. `Button` added to confirm the pipeline. Real brand restyle = Phase 1.03. The shadcn `.dark` token block is present but **inert** (only applies under a `.dark` ancestor we never add) — reconciled with the no-dark-mode rule in 1.03.
  - **ESLint** = Next flat config (`eslint.config.mjs`). **Prettier** added with `prettier-plugin-tailwindcss`; Markdown is excluded from Prettier (`.prettierignore`) so hand-authored docs aren't reformatted.
  - **Fonts:** placeholder uses a system sans stack (covers Macedonian Cyrillic); Montserrat (Cyrillic + Latin) lands in 1.02/1.03. Geist boilerplate fonts removed.

  **Verification:** `npm run build` ✓, `npm run lint` ✓, `npm run typecheck` ✓, `npm run format:check` ✓; dev server serves `/` (HTTP 200) with `<html lang="mk">` and the MK strings rendered.

- **2026-06-22 · Phase 1.03 — base UI kit; brand theme + fonts.**

  **No new dependencies.** The whole kit is built on the already-pinned stack (Tailwind v4, shadcn/Radix `radix-ui`, Motion, Lucide). Montserrat ships via Next's built-in `next/font/google` (part of `next` 16.2.9) — no package added.

  **Config decisions / deviations:**
  - **`src/app/globals.css` rewritten brand-first (D-043).** All design tokens (handover §1 / spec App. G) live in a single `@theme` block; the shadcn/Radix semantic tokens (`--color-primary`, `--color-background`, …) are mapped to brand values in the same block (so future `shadcn add` components are on-brand). Removed: the scaffold's `.dark` block, `@custom-variant dark`, the neutral oklch palette, and the unused `chart-*`/`sidebar-*` tokens. Kept `@import "shadcn/tailwind.css"` (it provides Radix-state custom variants `data-checked`/`data-disabled`/… used by the form components).
  - **Type roles** are exposed as Tailwind v4 paired-token utilities `text-display|subhead|label|body` (each carries size + line-height + letter-spacing + weight). Standalone `--font-weight-*` tokens kept per the handover.
  - **Fonts:** Montserrat via `next/font/google`, subsets `["latin","cyrillic"]`, weights `400/500/600/700/800`, `display:"swap"`, exposed as `--font-montserrat` → fed into `--font-sans`. Self-hosted at build time (no runtime Google call → privacy/self-host rule). `public/fonts/` left clean for a future `next/font/local` swap if Cowork ships brand woff2s.
  - **Gradients** (`--grad-brand`, `--grad-wash`) are `:root` custom props + `@utility bg-grad-brand|bg-grad-wash` (they're images, not colors). `--shadow-pop` is the only shadow token (→ `shadow-pop`), reserved for popover/modal.
  - **Kit gallery route = `src/app/kit/` (D-044)** — not `_kit` (underscore folders are private/non-routing in the App Router). Dev/preview only (404 on `VERCEL_ENV==="production"`), `noindex`.
  - **`.claude/` gitignored** — local agent/editor tooling (preview `launch.json`), not project source.

  **Verification:** `npm run build` ✓ (routes `/`, `/_not-found`, `/kit`), `npm run lint` ✓ (0 problems), `npm run typecheck` ✓; dev server serves `/` and `/kit` (HTTP 200); `/kit` visually verified — Montserrat Cyrillic, palette hex, pentagon geometry, and the puzzle-brain assembly (incl. 40px chip) all render correctly.
