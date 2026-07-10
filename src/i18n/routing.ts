import { defineRouting } from "next-intl/routing";

/**
 * The SINGLE canonical source of the enabled locales + routing policy
 * (Feat-Serbian-Localization). Everything else — the request config, the
 * middleware, the navigation wrappers, the switcher and the metadata alternates —
 * reads the locale list from here, so adding HR/EN later is a one-line change plus
 * a message file, with NO change to the switcher or any consumer (scope 2).
 *
 * Policy (owner decisions): Macedonian is the default and is served at the ROOT
 * (no prefix — every existing MK URL is byte-for-byte unchanged), Serbian is
 * prefixed under `/sr` (`localePrefix: "as-needed"`). `localeDetection` is OFF so
 * `/` is deterministically Macedonian for a first-time visitor (no Accept-Language
 * / cookie auto-redirect off the root); the locale is chosen explicitly via the
 * header switcher and then persists through the URL prefix + the `NEXT_LOCALE`
 * cookie as the parent navigates.
 */
export const routing = defineRouting({
  locales: ["mk", "sr"],
  defaultLocale: "mk",
  localePrefix: "as-needed",
  localeDetection: false,
});

/** The enabled locales, in display order (MK first). */
export const locales = routing.locales;

/** The default locale served at the root. */
export const defaultLocale = routing.defaultLocale;

/** A single enabled locale. */
export type AppLocale = (typeof routing.locales)[number];
