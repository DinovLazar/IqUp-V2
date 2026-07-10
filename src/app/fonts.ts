import { Montserrat } from "next/font/google";

/**
 * Montserrat, self-hosted at build time by next/font (no runtime call to Google,
 * satisfying the privacy / self-host rule). Shared by every `<html>`-rendering
 * layout ([locale], admin, kit) so the whole app uses the one font instance.
 *
 * Subsets: `latin` + `cyrillic` (Macedonian) + **`latin-ext`** — the last is
 * required for the Serbian latinica diacritics (č ć š ž đ dž lj nj), which the
 * base `latin` subset does not cover (Feat-Serbian-Localization).
 *
 * Weights map to the four type-scale roles: Body 400/500, Label 600,
 * Subhead 700, Display 800. Exposed as the CSS var --font-montserrat, which
 * globals.css feeds into --font-sans.
 */
export const montserrat = Montserrat({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-montserrat",
});
