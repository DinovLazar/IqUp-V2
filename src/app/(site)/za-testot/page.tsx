import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";

import { Disclaimer } from "@/components/ui/disclaimer";
import { PageShell } from "../page-shell";

// About-the-test (Phase 1.10) — §16.1 placement #6. A short parent-voice
// "what this is / what it isn't" section drawn from spec §1.1, then the FULL
// shared §D.4 disclaimer. Sync Server Component (next-intl `useTranslations` is
// isomorphic); MK `metadata` resolved in `generateMetadata`.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.about");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default function ZaTestotPage() {
  const t = useTranslations("pages.about");
  const isItems = t.raw("isItems") as string[];
  const isntItems = t.raw("isntItems") as string[];

  return (
    <PageShell>
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-display text-ink">{t("title")}</h1>
          <p className="text-body text-muted">{t("intro")}</p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {/* What it IS */}
          <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5">
            <h2 className="text-subhead text-ink">{t("isTitle")}</h2>
            <ul className="flex flex-col gap-2.5">
              {isItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-body text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* What it ISN'T */}
          <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5">
            <h2 className="text-subhead text-ink">{t("isntTitle")}</h2>
            <ul className="flex flex-col gap-2.5">
              {isntItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-tint-pur text-pur">
                    <X className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-body text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* §16.1 placement #6 — the About-the-test page shows the full §D.4 text. */}
        <section className="flex flex-col gap-2 rounded-card border border-border-pur bg-tint-pur/40 p-5">
          <h2 className="text-label text-ink">{t("noteTitle")}</h2>
          <Disclaimer variant="full" />
        </section>
      </article>
    </PageShell>
  );
}
