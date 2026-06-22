# Part 1 · Phase 1.02 — Design System & Key Screens · Handover

> **For Code (Phases 1.03 / 1.06 / 1.07).** Concrete, implementation-ready values. Everything here maps to the Tailwind v4 `@theme` in `src/app/globals.css`. The visual reference is the mockup file `IQ UP Phase 1-02 Design System.dc.html` (delivered alongside) — open it to see every token, the live puzzle-brain assembly, the pentagon, the full component kit, and the three key screens.

**Mood:** a children's science lab run by a serious educator. Bright/warm surface, precise/confident underneath. The "explorer" skin is a thin accent (subtle compass/star + encouraging words) — never characters, map-journeys, or extra reading.

**Anti-template rule (non-negotiable):** personality comes from color, type hierarchy and the puzzle-brain motif + purpose-built SVG — **not** from identical rounded cards, drop-shadow-on-everything, or emoji décor.

---

## 1. Design tokens → Tailwind v4 `@theme`

### 1.1 Colors

```css
@theme {
  /* index → color (fixed everywhere: screen, pentagon, PDF) */
  --color-mag:  #EC008C;   /* Логичко мислење  (Logic)            */
  --color-pur:  #762D90;   /* Primary action (buttons, key UI)    */
  --color-blu:  #00B6F1;   /* Просторно        (Spatial)          */
  --color-blu2: #6FD0F6;   /* Blue support / tints                */
  --color-teal: #00B9AD;   /* Меморија и фокус (Memory & focus)   */
  --color-org:  #F7941D;   /* Планирање и брзина (Planning/speed) */
  --color-yel:  #FFC20E;   /* Учење и STEM     (Learning & STEM)  */
  --color-grey: #999999;   /* Neutral                             */

  /* soft tints — pentagon fills, band-bar tracks, surfaces */
  --color-mag-soft:  #FCE0F1;
  --color-blu-soft:  #D6F2FD;
  --color-teal-soft: #D2F3F0;
  --color-org-soft:  #FDEBD3;
  --color-yel-soft:  #FFF2CC;

  /* text — all ≥ 4.5:1 on light bg */
  --color-ink:   #231F26;  /* body / headings        ~13:1 */
  --color-muted: #5E5862;  /* helper / secondary     ~7:1  */
  /* --color-pur as text on white ~7.2:1                  */

  /* index colors as ACCESSIBLE TEXT (darkened — for band labels only) */
  --color-mag-ink:  #B0067A;
  --color-blu-ink:  #0090C4;
  --color-teal-ink: #007D75;
  --color-org-ink:  #9A6200;
  --color-yel-ink:  #9A7400;

  /* surfaces & lines */
  --color-bg:        #FAF8F4;  /* app base                       */
  --color-surface:   #FFFFFF;
  --color-tint-pur:  #F4EFF7;  /* emphasis surface               */
  --color-border:    #EAE6E0;
  --color-border-pur:#E4D7EC;

  /* focus + states */
  --color-focus:       rgba(118,45,144,.45);  /* 3px ring        */
  --color-pur-hover:   #651E80;  /* −8% L                        */
  --color-pur-active:  #54186B;
  --color-disabled-bg: #EDE9F0;
  --color-disabled-fg: #A99CB3;

  /* gradients */
  --grad-brand: linear-gradient(90deg,#EC008C 0%,#762D90 100%);  /* progress, key accents */
  --grad-wash:  linear-gradient(150deg,#FBF2F8 0%,#EAF6FE 100%); /* hero / panel washes   */
}
```

> **Accessibility rule, enforced:** bright hues (`--yel`, `--blu2`, `--org`, raw `--blu`) are **accent/data only** — never body text. For colored *text* (band labels, index names) use the `*-ink` variants above, all ≥ 4.5:1. Every index color must be paired with a text label, icon, or shape — **never color-only.**

### 1.2 Typography — Montserrat (Cyrillic + Latin)

| Role | Family / Weight | Size | Line-height | Tracking |
|---|---|---|---|---|
| Display / title | Montserrat 800 | 28–34px | 1.12 | −0.02em |
| Subhead | Montserrat 700 | 18–22px | 1.30 | −0.01em |
| Label / button | Montserrat 600 | 14–16px | 1.20 | +0.01em |
| Body | Montserrat 400/500 | 15–16px | 1.60 | 0 |

```css
@theme {
  --font-sans: "Montserrat", system-ui, sans-serif;
  --text-display: 2rem;   --font-weight-display: 800;  /* clamp 28–34px */
  --text-subhead: 1.25rem;--font-weight-subhead: 700;
  --text-label:   0.9375rem;--font-weight-label: 600;
  --text-body:    0.9375rem;--font-weight-body: 500;
}
```
Self-host Montserrat (Cyrillic + Latin subsets) under `public/fonts/`; declare with `@font-face` and `font-display: swap`.

### 1.3 Spacing, radius, sizing

```css
@theme {
  --spacing: 4px;                 /* scale: 4 / 8 / 12 / 16 / 24 / 32 */
  --radius-card: 14px;            /* cards 12–18px                    */
  --radius-card-lg: 18px;
  --radius-badge: 30px;           /* explorer pill badges             */
  --radius-field: 11px;
  --size-tap-min: 44px;           /* every tappable target ≥ 44px     */
}
```

### 1.4 Surfaces / elevation — **without** shadow-on-everything

- **Base surface:** `--color-surface` + `1px solid --color-border`. No shadow.
- **Emphasis surface:** `--color-tint-pur` fill + `1px solid --color-border-pur`.
- **Soft wavy divider** instead of shadowed rules:
  `<path d="M0,12 Q40,2 80,12 T160,12 T240,12 T320,12" stroke="#D9CEE3" stroke-width="2.5" fill="none"/>`
- **Single restrained shadow token**, used only for modal / popover / floating menus — never a default on cards:
  ```css
  --shadow-pop: 0 6px 20px -10px rgba(60,40,80,.28);
  ```

### 1.5 Interaction states (every interactive element)

| State | Treatment |
|---|---|
| default | base token |
| hover | background −8% L (`--color-pur-hover`) |
| focus-visible | `box-shadow: 0 0 0 3px var(--color-focus)` — **always visible**, full keyboard support |
| active | `--color-pur-active`, `transform: scale(.97)` |
| disabled | `--color-disabled-bg` / `--color-disabled-fg`, `cursor: not-allowed` |

**Motion:** respect `prefers-reduced-motion: reduce` everywhere (see §2). **No anxious timers** anywhere — the only exception is the speed game (Gs), §4.2.

---

## 2. Puzzle-brain motif (progress indicator + hero motion)

A brain silhouette split into **5 puzzle regions, one per index**. As the child clears sections, regions snap into place in order, each glowing briefly in that section's color, then settling — by the end the brain is whole and color-mapped. Calm and satisfying, never frantic.

**Geometry (SVG, viewBox `0 0 200 178`):**
- One silhouette path (the brain outline) used twice: as a `clipPath` and as a `--color-tint-pur` base fill, plus a thin `--pur` @25% outline.
- **5 region paths** clipped to the silhouette, drawn with a 3px white stroke between them (the puzzle seams) + a central white fissure line + small white interlock "knobs" at the joints.
- Region → index → color (assembly order):
  1. Magenta — **Логичко мислење**
  2. Blue — **Просторно**
  3. Teal — **Меморија и фокус**
  4. Orange — **Планирање и брзина**
  5. Yellow — **Учење и STEM**
- A region is `--color-X` when its section is complete, the soft tint while filling, and `#ECE6F1` @60% when not yet reached.

**Assembly animation:**
- Per-region snap: **420ms** `cubic-bezier(.2,.8,.2,1)`.
- Glow on snap: **600ms** ease-out (`drop-shadow(0 0 7px <index color>)`), then settle **240ms**.
- Drive with Motion (Framer Motion) keyed on `completedSections`; never animate from the template/CSS keyframes alone so state survives re-renders.

**`prefers-reduced-motion: reduce` fallback (required):** no assembly. Each region **snaps/fades** straight to its final color the instant its section completes — identical end frame, no movement, no glow pulse.

**Progress bar pairing:** a slim track under the brain, `--grad-brand` fill, width = `completed/5`. Label it in words ("3 од 5 секции"), never a raw percentage to the child.

The motif also appears as a small static accent on the Landing screen and at 100% as the celebratory final state tied to the **IQ UP! Истражувач** reward.

---

## 3. Pentagon (result profile) — coordinate geometry, identical in web & PDF

**Build constraint:** must render identically in the app (web SVG) and the PDF (`@react-pdf/renderer`, which supports only `Svg / Polygon / Path / Line / Circle / Text` with explicit coordinates — **no web-only CSS, no filters, no gradient fills**). Spec it as coordinate geometry so both engines share one function.

```
center (cx, cy); radius R
angle(i)  = (-90 + i*72) · π/180        // i = 0..4, vertex 0 at top, clockwise
vertex(i) = ( cx + R·cos(angle(i)),  cy + R·sin(angle(i)) )
profile(i)= ( cx + R·(valᵢ/100)·cos(angle(i)),  cy + R·(valᵢ/100)·sin(angle(i)) )
```

- **Index order around the pentagon (fixed):** 0 Логичко (mag) · 1 Просторно (blu) · 2 Меморија (teal) · 3 Планирање (org) · 4 Учење и STEM (yel) — clamp each value to `[6,100]` so a near-zero index still renders a visible vertex.
- **Grid:** 3 concentric pentagon rings (`0.33 / 0.66 / 1.0 · R`) + 5 spokes, stroke `#E7E0EC` / `#ECE6F0`, 1px.
- **Profile polygon:** fill `--pur` @ **10% opacity**, stroke `--pur` 2.5px, `stroke-linejoin: round` — the soft-tint + violet-outline look, **not** a bold flat fill.
- **Vertices:** a `--color-X` dot (r≈6) with a 2px white ring at each `profile(i)`.
- **Labels (required, never color-only):** index name (Macedonian) at each outer vertex, pushed out to ~1.34·R, with a small color dot. Use short forms on tight layouts (Логичко / Просторно / Меморија / Планирање / STEM); full names in the PDF where space allows.

One `pentagon(values, size, {labels})` function feeds both the web component and the `@react-pdf` component — same numbers in, same shape out.

---

## 4. Component kit (Code builds in 1.03)

Each component: anatomy, sizes, full state set, the tokens used. See the mockup for the rendered reference.

### 4.1 Core kit

- **Buttons** — min-height **48px** (≥44 tap rule). *Primary:* `--pur` fill, white 600 label, radius `--radius-field`. *Secondary:* white fill, 1.5px `--pur` border, `--pur` label. *Disabled:* `--color-disabled-bg/fg`, `not-allowed`. States per §1.5.
- **Cards / surfaces** — §1.4 (tint + thin border; no default shadow).
- **Badges (explorer pills)** — radius **30px**, min-height 44px. Solid `--pur` (filled, e.g. "IQ UP! Истражувач" with a star icon) or soft-tint variants. Always icon/shape + label, never color alone.
- **Progress** — the puzzle-brain (§2) + word-labelled track.
- **Form fields** — input / select / **checkbox**. Field: 1.5px `--border` → `--pur` on focus + 3px ring; error: red border `#E0B4AE` + helper `#C0392B`. **Checkboxes are separated, clearly labelled, and NEVER pre-ticked** (consent requirement); 24px box, 7px radius, `--pur` when checked with a white Lucide check.
- **Pentagon** — §3.

### 4.2 Additional components (the three key screens need these)

- **Index band bar** — per index: color dot + name, a word-label pill (**Во развој · Солидно · Силно · Исклучително**), a track in the index color, and an **indicative** range caption ("горна третина за возраста"). **Never a hard number.** Band thresholds map from §6.4: 80–100 Исклучително · 64–79 Силно · ~ Солидно · lower Во развој (parent-facing words only; the numeric bands stay internal to scoring).
- **Confidence label** — small chip per index: **висока / средна / ниска**, with a 3-bar signal glyph. висока = green, средна = orange, ниска = grey.
- **Reward badge** — **"IQ UP! Истражувач"**: violet rounded tile + yellow star (custom SVG), celebratory child-facing line. Tied to the 100% puzzle-brain.
- **Disclaimer component** — quiet footnote (small, muted, on `--bg`), reusable: *"Едукативен, информативен скрининг — не е клинички тест и не дава дијагноза."* Placeholder now; final legal copy lands Phase 3.03. Reads as a calm note, never an alarm.
- **Answer option** — large tap target (square, ≥44px, the mock uses a responsive square ≥ 64px). Default: white + 2px `--border`. Selected: `--pur` border + `--tint-pur` fill + a violet check disc. Focus: 3px ring. The *stimulus* inside is built as custom SVG in Phase 1.04 — the option control is task-agnostic.
- **Gentle idle nudge** — calm prompt *"Сè е во ред? Тука сме ако ти треба помош."* + *"Продолжи"* button. **No timer, no penalty styling**, light-blue tint surface.

---

## 5. Key screens (mobile-first; desktop reflow noted)

All three are in the mockup at 300px phone width, in iPhone frames. Macedonian copy is the spec's canonical example text (§12, App. C/D) used as realistic placeholder — not invented parent copy.

### 5.1 Landing (`/`) — photo-forward
Logo + МК/EN switch · **real class-photo hero** (clearly-marked placeholder block — Cowork-curated asset drops in here) · ExtraBold headline · short value line · puzzle-brain **accent** (small, not the hero) · primary **"Започни проценка"** · "informative, not diagnostic" footnote.
**Desktop reflow:** two columns — photo hero left (~60%), headline + CTA right; the brain accent sits above the footer footnote.

### 5.2 Test-item — representative reasoning task (Gf matrix)
Task-agnostic chrome that wraps **any** task: puzzle-brain progress + "Секција 1 од 5" + 5 section dots at top · calm instruction ("Која фигура продолжува?" + "нема брзање") · stimulus area (placeholder matrix — real stimuli are custom SVG in 1.04) · 4 large answer options · explorer skin kept barely-there (a small compass + encouragement). **No countdown timer.** Encouragement-only copy (§12).
**Desktop reflow:** stimulus left, answer options stacked in a right column.

**Gs speed-game variant (the one screen with a timer):** the timer is a **calm orange progress ring** (`--org`), not a red counting-down number — no flashing, no panic sound, no "time left!" copy. Every reasoning task has **no** countdown; only the speed game shows time, by design (§7).

### 5.3 Report — one consistent system, two surfaces

**On-screen results summary (§10.1):** reward badge → "Когнитивен профил на Марко" → pentagon → compact band bars (word labels) → top **strength** callout → CTA **"Закажи демо час"** → **"Извештајот е пратен на e-mail"** confirmation → disclaimer.
**Desktop reflow:** pentagon left, bars + strength + CTA right.

**PDF report — first page (§9.4 / §10.3):** branded "IQ UP! когнитивен профил" — violet header with logo, **disclaimer at top and bottom** · pentagon (5 color-coded indices) · per-index **band bar + word label + confidence label + indicative range (no hard number)** · **силна страна** · **зона за раст** · **2–3 home activities** · **Дел Б** STEM readiness + the STEM bridge · expert IQ UP! positioning + CTA. Built with `@react-pdf` primitives only (§3) so the pentagon and layout render identically to screen.

**The hard rule, everywhere:** no precise IQ score, no diagnosis. The pentagon shows *shape*, the bar shows the *band*, the label shows the *word*, the range is *indicative* — never a number.

---

## 6. Definition-of-Done mapping

| DoD item | Where |
|---|---|
| Token set (colors+gradients+tints, type, spacing, radius, sizing, surface, states) | §1 |
| Puzzle-brain (geometry, section→piece, color logic, animation, reduced-motion) | §2 |
| Pentagon (coordinate geometry, basic primitives, labeled vertices) | §3 |
| Core kit with full states (buttons, cards, badges, progress, fields incl. checkbox, pentagon) | §4.1 |
| Additional components (band bar, confidence, reward, disclaimer, answer option, idle nudge) | §4.2 |
| Landing (photo-forward, placeholder marked, mobile + desktop note) | §5.1 |
| Test-item (task-agnostic chrome, no timer, Gs variant note) | §5.2 |
| Report (on-screen + PDF first page, no hard number, spec copy) | §5.3 |
| Accessibility (index→color consistency, type hierarchy, ≥44px, never color-only, ≥4.5:1 text, visible focus, no anxious timers, anti-template) | throughout |

---
*IqUp-V2 | Part 1 · Phase 1.02 Handover | 2026-06-22 · Design*
