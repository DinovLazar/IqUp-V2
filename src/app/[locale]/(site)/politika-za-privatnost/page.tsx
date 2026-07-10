import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { alternatesFor, ogLocaleFor } from "@/i18n/metadata";
import { PageShell } from "../page-shell";

// Privacy policy (Phase 1.10) — a routable shell so the lead-form/confirmation
// consent link resolves instead of 404ing. The lawyer-approved body lands in
// Phase 3.03 (MK) — the SR translation is likewise a functional placeholder
// pending its own Serbian/EU legal review. Locale-aware `metadata` + hreflang.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternatesFor("/politika-za-privatnost"),
    openGraph: ogLocaleFor(locale),
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.privacy");
  return (
    <PageShell>
      <article className="flex flex-col gap-5">
        <h1 className="text-display text-ink">{t("title")}</h1>
        <p className="rounded-card border border-border bg-surface p-5 text-body text-muted">
          {t("pending")}
        </p>
      </article>
    </PageShell>
  );
}
