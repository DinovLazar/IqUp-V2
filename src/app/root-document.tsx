import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { montserrat } from "./fonts";

/**
 * The shared `<html>` document shell (Feat-Serbian-Localization).
 *
 * Because the app now mixes localized routes (under `[locale]`) with
 * non-localized ones (`/admin`, `/kit`), each of those branches renders its own
 * root `<html>` (the top-level `app/layout.tsx` is a pass-through). This component
 * is the single place that markup lives, so all three stay identical apart from
 * the `lang` attribute and the (locale-appropriate) message bundle.
 *
 * `getMessages()` resolves against the active locale set by the caller
 * (`setRequestLocale` in `[locale]/layout.tsx`; the Macedonian default elsewhere).
 */
export async function RootDocument({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
