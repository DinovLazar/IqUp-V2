# IqUp-V2 — Brand Guide

> The single reference for how IqUp-V2 looks, moves, and speaks. Code and Design both build against this file. It is derived from the IQ UP! specification (§12, §18, Appendix G) and the official logo palette.
>
> **Version:** 1.0 · **Created:** 2026-06-21

---

## 1. Brand essence

Light, colorful, playful, and right for children — but built to feel **expert, not AI-generated**. The product is a serious cognitive and STEM assessment that happens to be friendly. Every choice should read as crafted and intentional: a signature motif, a strong type hierarchy, purpose-built illustrations, and copy written by a person. The trap to avoid is the generic "AI template" look — identical rounded cards, drop shadows on everything, emoji décor, flat sameness.

The guiding idea: **precise underneath, approachable on the surface.** The engine measures finely; the parent sees something clear and warm.

---

## 2. Logo & signature motif

**The puzzle-brain** (from the logo) is the signature motif. It carries one idea throughout the product: the assessment *assembles a profile piece by piece*.

- **Progress** during the test = the brain filling in, piece by piece.
- **The result** = the assembled, color-coded brain — shown as a five-pointed **pentagon** profile.
- The **five indices** are each tied to one brand color (see §3), so the pentagon reads as a colored map of the child's strengths.

Use the motif with restraint and craft. It is the through-line, not decoration. No third-party characters, no extra reading layered on top — the "explorer adventure" framing is a thin, light skin only (it must never threaten the validity of the assessment).

---

## 3. Color palette

The official palette comes straight from the logo. Each of the five indices owns one hue; violet is the primary action color.

| Color | Hex | Token | Role |
|---|---|---|---|
| Magenta | `#EC008C` | `--mag` | Accent · **Logic** index |
| Violet | `#762D90` | `--pur` | **Primary action** (buttons, key UI) |
| Blue | `#00B6F1` | `--blu` | **Spatial** index |
| Light blue | `#6FD0F6` | `--blu2` | Blue support / tints |
| Teal | `#00B9AD` | `--teal` | **Memory & focus** index |
| Orange | `#F7941D` | `--org` | **Planning & speed** index |
| Yellow | `#FFC20E` | `--yel` | **Learning & STEM** index |
| Grey | `#999999` | `--grey` | Neutral (text support, borders, muted) |

### Index → color (must stay consistent everywhere: screen, pentagon, PDF)

- **Logic** = magenta
- **Spatial** = blue
- **Memory & focus** = teal
- **Planning & speed** = orange
- **Learning & STEM** = yellow
- **Primary action** = violet

**Backgrounds** are light, with gradient accents drawn from the palette. Color is never the *only* carrier of meaning (accessibility — see §10): always pair color with a label, icon, or shape.

---

## 4. Typography

**Montserrat** throughout — Cyrillic + Latin, free, friendly but clean. It must support Macedonian Cyrillic now and Serbian/Croatian/English later.

| Role | Weight / size |
|---|---|
| Display / title | ExtraBold 800 · 28–34px |
| Subhead | Bold 700 · 18–22px |
| Label / button | SemiBold 600 · 14–16px |
| Body | Regular / Medium 400/500 · 15–16px |

Lean on a **strong type hierarchy** — it's one of the things that makes the product read as expert rather than templated.

---

## 5. Spacing & shape

- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 px.
- **Corner radius:** 12–18px on cards; 30px on badges (the rounded, pill-like "explorer" badges).
- **Tap targets:** ≥ 44px — these are children using phones; everything tappable must be comfortably large.

---

## 6. Iconography & illustration

- **UI icons** (arrows, check, info, close, etc.): Lucide — clean, consistent line icons.
- **Science / subject illustrations:** custom SVG, purpose-built. These are part of what makes the product feel crafted; don't substitute generic clip-art or emoji.
- **Shapes:** soft, wavy forms and rounded badges fit the light, playful surface.
- Test stimuli (matrices, rotation shapes, the speed grid, the Tower of London, the pentagon) are **custom SVG** for full brand control and identical rendering in the app and the PDF.

---

## 7. Imagery

Use **real photographs of IQ UP! children / classes** on the landing page and in the report — authenticity is the point, and it separates this from a stock-photo template. (Photos are a client-provided, Cowork-curated asset.)

---

## 8. Motion

- The **puzzle-brain assembling** is the hero motion: gentle, satisfying, tied to progress.
- Keep transitions light and calm. The product is reassuring, not flashy.
- **No anxious timers** anywhere — with the single exception of the speed game (Gs), which has a visible timer by design. Reasoning tasks never show a countdown.
- **Respect `prefers-reduced-motion`** — if the user's device asks for reduced motion, animations scale back accordingly.

---

## 9. Voice & tone

Expert and professional, but **understandable for parents — no jargon.** Like the best educator, not a doctor handing down a diagnosis.

### Principles

- **Expert and confident, but warm.**
- **A real picture** — strengths and growth areas named clearly, without sugar-coating.
- **No attack.** Growth areas are "areas to grow," never "weakness," "problem," or "falling behind."
- **No jargon in parent-facing text** — never "neuroscience," "executive functions," or "cognitive domains" in front of a parent.
- **Subtle brand positioning, not a sales pitch** — position IQ UP!'s method; don't narrate the class.
- **For the parent, not the child** — to the child, only encouragement.
- **Never "clinical IQ."** No exact IQ number, no diagnosis. Use "cognitive profile / indicative range." This is a credibility and legal rule, not a style preference.

### Two language registers (hard rule)

- **Inside** (spec, code, internal docs): precise technical terms.
- **Everything a parent sees:** plain, understandable language, no jargon.

### Worked examples (canonical Macedonian copy)

**Strength:**
> „{Име} покажува силно просторно мислење — лесно замислува и врти облици во умот. Тоа е предноста зад геометријата, конструкцијата и инженерството."

**Growth area** — the difference matters:
> ✗ „Детето има слаба работна меморија и заостанува."
> ✓ „Способноста да задржува и реди информации е областа со најмногу простор за раст кај {Име} — вообичаено и лесно се зајакнува со игри на низи."

**IQ UP! positioning (expert, no jargon):**
> „Способноста да задржува и реди информации, да планира и да се фокусира е во основата на учењето и успехот во училиште. Програмите на IQ UP! се создадени за нивниот постепен развој. Профилот на {Име} покажува каде таа поддршка би имала најголем ефект."

**To the child (encouragement only):**
> Start: „Ајде да видиме како размислуваш! Нема грешни одговори."
> Transition: „Одлично! Сега нешто поинакво…"
> End: „Браво! Беше супер истражувач."

(Full Macedonian copy — consents, email, disclaimers — lives in the spec, Appendix D.)

---

## 10. Accessibility (WCAG 2.2 AA)

- Full keyboard support with a visible focus ring (`focus-visible`).
- Contrast ratio **≥ 4.5:1** for text.
- **Never color-only** for meaning — pair with label, icon, or shape.
- Large tap targets (≥ 44px) for children.
- Respect `prefers-reduced-motion`.
- No anxious timers except the speed game.

---

## 11. What to avoid vs. what to achieve

| Avoid | Achieve |
|---|---|
| Generic identical cards | The puzzle-brain signature motif |
| Drop shadows on everything | A strong typographic hierarchy |
| Emoji décor | Purpose-built SVG visuals |
| One flat sameness / no personality | Cohesion + copy written with craft |

---

## 12. Design tokens (quick reference)

```
Colors
--mag  #EC008C   (Logic)
--pur  #762D90   (Primary action)
--blu  #00B6F1   (Spatial)
--blu2 #6FD0F6   (Blue support)
--teal #00B9AD   (Memory & focus)
--org  #F7941D   (Planning & speed)
--yel  #FFC20E   (Learning & STEM)
--grey #999999   (Neutral)

Typography — Montserrat (Cyrillic + Latin)
Display/title   ExtraBold 800   28–34px
Subhead         Bold 700        18–22px
Label/button    SemiBold 600    14–16px
Body            Regular/Medium  400/500  15–16px

Spacing   4 / 8 / 12 / 16 / 24 / 32 px
Radius    12–18px cards · 30px badges
Targets   ≥ 44px (children on phones)
```

These tokens get implemented as the Tailwind theme config in Phase 1.03 and confirmed in the Design handover (Phase 1.02).
