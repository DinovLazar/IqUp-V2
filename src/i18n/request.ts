import { getRequestConfig } from "next-intl/server";

// MVP: a single active locale (Macedonian) served at the root — no [locale]
// routing yet. This is the next-intl "without i18n routing" setup. To add
// SR/HR/EN later, introduce a `[locale]` segment + middleware and resolve the
// locale from the request here instead of returning a constant.
export const locales = ["mk"] as const;
export const defaultLocale = "mk" satisfies (typeof locales)[number];

export default getRequestConfig(async () => {
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
