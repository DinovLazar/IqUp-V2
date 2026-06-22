import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";

// Montserrat, self-hosted at build time by next/font (no runtime call to Google,
// satisfying the privacy / self-host rule) and covering Macedonian Cyrillic.
// Weights map to the four type-scale roles: Body 400/500, Label 600,
// Subhead 700, Display 800. Exposed as the CSS var --font-montserrat, which
// globals.css feeds into --font-sans. If Cowork delivers brand woff2 files,
// swap this to next/font/local without touching the token layer.
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-montserrat",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("appName"),
    description: t("appName"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Locale comes from the next-intl request config (MK for the MVP). Setting it
  // on <html lang> here keeps the markup correct now and once routing is added.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
