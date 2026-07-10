import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing } from "./routing";

/**
 * next-intl request configuration (Feat-Serbian-Localization).
 *
 * Now that the app has i18n routing (MK at the root, SR under `/sr`), the locale
 * comes from the matched `[locale]` segment via `requestLocale`. It is validated
 * against the canonical locale list in `routing.ts` (`hasLocale`); anything
 * unexpected falls back to the default (Macedonian). Non-localized routes
 * (`/admin`, `/kit`, `/api`) resolve to the default locale, so `getMessages()`
 * there returns the Macedonian bundle — those areas stay Macedonian.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
