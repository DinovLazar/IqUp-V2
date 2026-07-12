import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { CookieBanner } from "@/features/consent/cookie-banner";
import { RootDocument } from "../root-document";

/**
 * Localized root layout (Feat-Serbian-Localization) — the `<html>` root for every
 * public, parent/child-facing route (MK at `/`, SR under `/sr`).
 *
 * It validates the `[locale]` segment against the canonical locale list, enables
 * static rendering with `setRequestLocale`, and pre-renders both locale trees via
 * `generateStaticParams`. The non-localized `/admin` + `/kit` areas render their
 * own `<html>` (they are Macedonian-only), so they are NOT under this layout.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("appName"),
    description: t("tagline"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for this locale subtree (must precede next-intl reads).
  setRequestLocale(locale);

  // The cookie banner mounts on the PUBLIC locale tree only (D-171): passing it as a
  // child of RootDocument puts it inside the NextIntlClientProvider, so it appears
  // on every MK + SR page. `/admin` + `/kit` render their own RootDocument without
  // it, so the banner never shows there.
  return (
    <RootDocument locale={locale}>
      {children}
      <CookieBanner />
    </RootDocument>
  );
}
