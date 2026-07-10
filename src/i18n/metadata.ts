import type { Metadata } from "next";

import { routing, locales } from "./routing";
// Import via the `@/` path (not `./navigation`) so the Vitest navigation stub —
// which is aliased on `@/i18n/navigation` — is picked up in component tests.
import { getPathname } from "@/i18n/navigation";

/**
 * SEO alternates helpers (Feat-Serbian-Localization).
 *
 * `alternatesFor(pathname)` builds the `hreflang` alternates (MK ↔ SR) for a
 * locale-agnostic pathname (e.g. `"/"`, `"/za-testot"`), using next-intl's
 * `getPathname` so the `as-needed` prefix rules are applied correctly (MK stays
 * unprefixed, SR gets `/sr`). `ogLocaleFor(locale)` gives the matching Open Graph
 * `og:locale` + the alternate locale. Both read the canonical locale list, so
 * adding HR/EN later needs no change here.
 */

const OG_LOCALE: Record<string, string> = {
  mk: "mk_MK",
  sr: "sr_RS",
};

/** `hreflang` alternates + canonical (default-locale) URL for a pathname. */
export function alternatesFor(pathname: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = getPathname({ href: pathname, locale });
  }
  return {
    canonical: getPathname({ href: pathname, locale: routing.defaultLocale }),
    languages,
  };
}

/** `og:locale` + `og:locale:alternate` for the active locale. */
export function ogLocaleFor(locale: string): {
  locale: string;
  alternateLocale: string[];
} {
  return {
    locale: OG_LOCALE[locale] ?? OG_LOCALE[routing.defaultLocale],
    alternateLocale: locales
      .filter((l) => l !== locale)
      .map((l) => OG_LOCALE[l]),
  };
}
