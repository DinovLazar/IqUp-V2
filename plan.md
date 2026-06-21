# IqUp-V2 — Plan

> The master spec for the finished site. This is **aspirational** — it describes the target, not the current status. The live snapshot is `src/_project-state/current-state.md`. **If this plan and the live code ever disagree, the live code wins.**
>
> Product source of truth: `IQ_UP_Specifikacija_v1_2_FINAL.pdf` (v1.2). This plan is the build layer on top of it.
>
> **Version:** 1.0 · **Created:** 2026-06-21 · **Scope:** Macedonian MVP (three-part build)

---

## 1. Goals and success criteria

Ship a free, mobile-first web app at `iq.iqup.mk` that runs an adaptive cognitive + STEM assessment for children aged 5–13, deterministically (no AI at run-time), captures a parent lead in Brevo, emails a branded PDF report, and drives CTA clicks to the external booking page — while building the perception of IQ UP! as serious education for developing the intellect.

**Success metrics (the spec's KPIs):**
- **Completion rate** — % of started tests that are finished.
- **Form conversion** — % of finished tests that leave a contact (PDF sent).
- **CTA → demo** — % of reports that click "Book a demo" through to the booking page.
- **Drop-off by step** — where users fall out of the funnel.

## 2. About the business / project

IQ UP! is a North Macedonian children's STEM and education brand, with programs organized by age (Mali istražuvači, Bibi & Bobi, the science adventures of Oliver, plus "PLUS" tiers). This app is a **lead magnet**: a free, genuinely useful assessment that earns a parent's contact details, positions IQ UP! as a serious, credible educator, and funnels parents toward a demo class. Lazar builds it as a contractor; IQ UP! is the client and provides accounts, brand assets, the booking page, contact details, and the legal review.

## 3. Information architecture (sitemap)

The app lives on the subdomain `iq.iqup.mk`. The assessment itself is one **stateful flow** (nothing personal is stored until the form), so it sits under a single route with internal steps; the rest are real pages.

| Route | Page | Notes |
|---|---|---|
| `/` | Landing | Brand hero, value message, language switch, "Start assessment". |
| `/procena` | Assessment flow | Internal steps: setup (age) → test (adaptive sections) → completion (child badge) → form → confirmation. Held in browser memory. |
| `/za-testot` | About the test | Credibility + a disclaimer placement. |
| `/politika-za-privatnost` | Privacy policy | Lawyer-approved. |
| `/uslovi` | Terms | Lawyer-approved. |
| `/admin` | Admin panel | Login-gated dashboard. `noindex`. |
| `/embed` | Embeddable flow | The `/procena` flow packaged for embedding in the landing page and Meta ads. `noindex`. |

**URL / locale structure:** built locale-ready via next-intl. Macedonian is served at the root for the MVP; Serbian/Croatian/English add later under language routing. No RTL.

## 4. Pages at launch

1. **Landing** (`/`) — hero, value proposition, language switch, start button, "informative not diagnostic" footnote.
2. **Assessment flow** (`/procena`) — setup, practice items, adaptive test sections, completion + reward badge, lead form, on-screen confirmation.
3. **About the test** (`/za-testot`) — what the assessment is and isn't; a disclaimer placement.
4. **Privacy policy** (`/politika-za-privatnost`).
5. **Terms** (`/uslovi`).
6. **Admin panel** (`/admin`) — login + dashboard.
7. **Embeddable variant** (`/embed`) of the flow.

## 5. Design system (locked)

Full detail lives in `brand.md`; the locked essentials:

**Palette (from the logo)** — each index owns one hue; violet is the primary action color.

| Color | Hex | Token | Role |
|---|---|---|---|
| Magenta | `#EC008C` | `--mag` | Logic |
| Violet | `#762D90` | `--pur` | Primary action |
| Blue | `#00B6F1` | `--blu` | Spatial |
| Light blue | `#6FD0F6` | `--blu2` | Blue support |
| Teal | `#00B9AD` | `--teal` | Memory & focus |
| Orange | `#F7941D` | `--org` | Planning & speed |
| Yellow | `#FFC20E` | `--yel` | Learning & STEM |
| Grey | `#999999` | `--grey` | Neutral |

**Typography** — Montserrat (Cyrillic + Latin): Display ExtraBold 800 / 28–34px; Subhead Bold 700 / 18–22px; Label SemiBold 600 / 14–16px; Body Regular-Medium 400/500 / 15–16px.

**Component principles** — light backgrounds + gradient accents; the puzzle-brain motif (progress fills the brain; the pentagon is the assembled colored brain); spacing 4/8/12/16/24/32; radius 12–18px cards / 30px badges; tap targets ≥44px; custom SVG for the pentagon and all test stimuli; real IQ UP! photos. Expert, not templated. **Off the table:** generic cards, shadow-on-everything, emoji décor, dark mode (MVP), anxious timers (except the speed game).

## 6. Tech stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Client-side test engine; serverless API routes for the backend. |
| Styling | Tailwind CSS | Brand tokens as theme config. |
| Components | shadcn/ui (on Radix) | Restyled to the brand. |
| Animation | Motion (Framer Motion) | Reduced-motion aware; light bundle (LazyMotion). |
| Icons | Lucide | UI icons; science illustrations are custom SVG. |
| Visuals | Custom SVG | Pentagon + all test stimuli; identical in app and PDF. |
| Lead form | React Hook Form + Zod | Validation incl. consents; reused server-side. |
| i18n | next-intl | MK at launch; no RTL. |
| PDF | @react-pdf/renderer | Server-side; branded report as components. |
| Database | Supabase (Postgres, EU region) | Anonymous scores only (no PII). |
| Admin auth | Supabase Auth | 2FA, roles, access logging. |
| Email + CRM | Brevo (EU) | Leads, transactional PDF email, campaigns. |
| Tracking | GA4 + Meta Pixel + CAPI (server-side) | Funnel events; deduped via `event_id`. |
| AI | None | Deterministic module-assembly report engine. |
| Hosting | Vercel (Hobby → Pro before launch) | Native Next.js + serverless + preview URLs. |
| DNS / CDN | Cloudflare | DNS-only record to Vercel. |
| Legal | Hand-built + lawyer-reviewed | Spec provides consent copy; lawyer sign-off required. |

## 7. File and folder structure

Planned target tree. Code may refine it during scaffolding; the live `src/_project-state/file-map.md` is authoritative once built. **Reserved folders `docs/design-handovers/` and `src/_project-state/` must exist** (created in Phase 1.01).

```
IqUp-V2/
├─ docs/
│  └─ design-handovers/              # reserved — Part-X-Phase-YY-Handover.md
├─ public/
│  ├─ fonts/                         # Montserrat (Cyrillic + Latin)
│  └─ images/                        # IQ UP! class photos, brand assets, OG images
├─ messages/
│  └─ mk.json                        # Macedonian strings (sr/hr/en added later)
├─ src/
│  ├─ app/
│  │  ├─ (site)/
│  │  │  ├─ page.tsx                 # / — Landing
│  │  │  ├─ procena/                 # /procena — stateful assessment flow
│  │  │  ├─ za-testot/               # /za-testot — About the test
│  │  │  ├─ politika-za-privatnost/  # privacy policy
│  │  │  └─ uslovi/                  # terms
│  │  ├─ admin/                      # /admin — login + dashboard (auth-gated)
│  │  ├─ embed/                      # embeddable flow variant
│  │  ├─ api/                        # the backend (serverless routes)
│  │  │  ├─ lead/                    #   create lead in Brevo + fire Meta/GA4
│  │  │  ├─ report/                  #   generate + email the PDF
│  │  │  └─ score/                   #   write the anonymous score row
│  │  ├─ layout.tsx
│  │  └─ globals.css
│  ├─ components/
│  │  └─ ui/                         # shadcn-based, restyled (+ pentagon, badges, progress)
│  ├─ features/
│  │  ├─ assessment/                 # adaptive engine, flow state, silent timing
│  │  ├─ tasks/                      # procedural generators for the 8 signals
│  │  ├─ scoring/                    # raw → indices, norms, confidence, validity flags
│  │  └─ report/                     # 3-layer engine + module assembly
│  ├─ content/
│  │  ├─ tasks/                      # task-bank config (versioned)
│  │  ├─ modules/                    # report module library (versioned)
│  │  └─ norms/                      # seed norms (versioned)
│  ├─ lib/                           # brevo, meta, analytics, supabase clients + utils
│  └─ _project-state/                # reserved — live project docs
│     ├─ current-state.md
│     ├─ file-map.md
│     ├─ 00_stack-and-config.md
│     └─ completions/                # Part-X-Phase-YY-Completion.md
├─ CLAUDE.md
├─ AGENTS.md
├─ .env.local                        # local secrets (gitignored — never committed)
├─ .gitignore
├─ next.config.js
├─ tailwind.config.ts
├─ tsconfig.json
└─ package.json
```

## 8. Integrations and what each does

| Integration | What it does | Wired in |
|---|---|---|
| **Brevo** | Stores the parent lead; sends the transactional email with the PDF; runs email/SMS-by-city campaigns (campaigns are a later product phase). Doubles as the CRM. | Phase 2.02 |
| **Meta Pixel + Conversions API** | Fires a server-side `Lead` event on form submit, deduplicated with the browser Pixel via `event_id`. Server-side is reliable and ad-blocker-resistant. | Phase 2.03 |
| **GA4** | Funnel events (`test_start`, `age_set`, `section_complete`, `test_complete`, `form_view`, `lead_submit`, `cta_booking_click`, `retest_start`) per the spec's Appendix F. | Phase 2.03 |
| **Supabase (EU)** | Holds the anonymous-scores table (age, gender, city, language, 8 signals + 5 indices, date only — no PII) and powers the admin login. | Phases 2.01 / 2.04 |
| **Cloudflare DNS** | Points `iq.iqup.mk` at Vercel (DNS-only record). | Phase 3.05 |
| **Vercel** | Hosting; preview URLs in Part 2, Pro + production in Part 3. | Phases 2.05 / 3.05 |
| **Booking page** | External, out of scope. The CTA links out with `?grad={city}`. | URL only |

## 9. SEO and schema strategy

This is an app driven largely by Meta ads and embeds, so SEO is secondary — but the public pages stay clean.

- **Landing + About the test:** hand-written titles/descriptions, Open Graph tags, and `hreflang` (ready for the later languages). Schema: `Organization` (IQ UP!) and `WebApplication` (the tool); a `FAQPage` on About the test if it has Q&A.
- **`/procena`, `/admin`, `/embed`:** `noindex` (no SEO value; admin is private).
- Branded OG image so shared links look like an "IQ UP! cognitive profile."

## 10. Multi-language approach

- **MVP:** Macedonian only, at the root.
- All strings externalized via next-intl. Visual tasks (matrices, rotation, Corsi, speed grid, Tower of London, paired-associate, CT mazes) are language-neutral — only instructions, UI, and the short CT text items localize.
- **Later (a future product phase):** Serbian/Croatian/English message files + translated report modules; a QA pass reviewing symbols/shapes for cultural clarity across markets. No RTL. Keeping v1 mostly non-verbal is what makes adding languages low-risk.

## 11. Lead-capture mechanics

**One capture point** — the form after the test. Fields (spec §13.1): `parent_first_name` (first name only, no surname), `email`, `phone`, `city` (for routing + campaigns), `child_gender` (optional), and three **separated, non-pre-ticked** consents (`consent_service`, `consent_parent`, `consent_marketing`). No child name; age is taken at the start.

**On submit:** validate → create/update the lead in Brevo → fire Meta `Lead` (CAPI, `event_id`) + GA4 `lead_submit` → generate the PDF server-side → email it via Brevo → show the on-screen confirmation (pentagon summary + CTA). **The PDF is not stored.** Separately, an **anonymous score row** is written to Supabase with no link to the lead. The CTA opens the booking page with the city attached: `{{BOOKING_URL}}?grad={city}`.

## 12. AI features specification

**None at run-time.** The report's personalization is a **deterministic module-assembly engine**: rich signals (per-task accuracy, level, time, error type) × a large library of report modules × assembly logic. With enough modules, two children practically never get the same report — without any AI, and fully reproducible (same answers → same report). This is a hard product rule tied to credibility and the legal posture.

## 13. Automation specification

Minimal. Brevo sends the transactional PDF email now. Email/SMS-by-city campaigns are a later product phase. **No owner notifications** on new leads (leads are visible in Brevo + the admin panel). No other automations in scope.

## 14. Acceptance criteria — what "launched" means

- [ ] Adaptive engine produces a stable score over 4–6 tasks per domain; **same answers → same path and result** (deterministic, seedable).
- [ ] The 5 indices are computed and shown **hybrid** — pentagon + per-index bar + word label (In development / Solid / Strong / Exceptional) + indicative range, **no hard number**.
- [ ] Report engine produces **visibly different reports** for different profiles (5 test profiles → 5 distinct reports).
- [ ] Validity flags work; extremes and time rules are implemented (slow ≠ wrong except the speed game; idle/tab-blur gaps excluded).
- [ ] The form validates, emails the PDF, and fires Meta `Lead` + GA4 events.
- [ ] **Only anonymous scores** are stored; the **PDF is not stored**; the two data stores **cannot be joined**.
- [ ] Macedonian live, i18n-ready; **WCAG 2.2 AA**; **Lighthouse 95+** (mobile + desktop); first load **< 2.5s on 4G**; passes **iOS Safari + Android Chrome**.
- [ ] Child reward badge shown; CTA → booking with `?grad=`.
- [ ] Legal pages + cookie banner live and **lawyer-approved**; the "informative, not diagnostic" line appears in **all 7 placements** (landing footnote, pre-start screen, results screen, PDF top+bottom, email, About-the-test page, cookie banner).
- [ ] **Vercel on Pro**; DNS cut over to `iq.iqup.mk`.

## 15. Pre-build parallel-track tasks (Cowork-led)

| Task | Needed by |
|---|---|
| Confirm brand files (logo vector delivered) + Montserrat | Phase 1.02 |
| Curate / organize real IQ UP! class photos | Phase 1.06 / 1.07 |
| Get the booking page URL | Before launch CTA |
| Get the list of centers by city | Part 2 |
| Get Brevo / Meta / GA4 access (keys, pixel ID, property ID) → Vercel env, never committed | Part 2 |
| **Start the legal review** of privacy policy + consents (MK + EU) — long lead time | Phase 3.03 |
| (Later) SR/HR/EN translations | After MVP |

---

*Phase-by-phase breakdown: see `phase-plan.md`.*
