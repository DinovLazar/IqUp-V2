import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { PageShell } from "../page-shell";

// Privacy policy (Phase 1.10) — a routable shell so the lead-form/confirmation
// consent link resolves instead of 404ing. The lawyer-approved body lands in
// Phase 3.03; until then a visible "pending legal review" placeholder. MK
// `metadata` + a semantic H1.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.privacy");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default function PrivacyPolicyPage() {
  const t = useTranslations("pages.privacy");
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
