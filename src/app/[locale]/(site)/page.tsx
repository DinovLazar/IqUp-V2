import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { alternatesFor, ogLocaleFor } from "@/i18n/metadata";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { Logo } from "@/components/ui/logo";

// Real landing (handover §5.1) — photo-forward, brand hero, value message, the
// functional MK/SR locale switcher (Feat-Serbian-Localization), the "Започни
// проценка" entry to /procena, and the shared "informative, not diagnostic"
// footnote (§16.1 placement #1 — the short `Disclaimer`).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  return {
    title: "IQ UP!",
    description: t("subhead"),
    alternates: alternatesFor("/"),
    openGraph: ogLocaleFor(locale),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const points = [t("point1"), t("point2"), t("point3")];

  return (
    <main className="flex min-h-dvh flex-col bg-grad-wash">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        {/* Real brand lockup (D-156); not linked — the user is already home. */}
        <Logo />
        <LocaleSwitcher />
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-10 px-5 py-8 md:flex-row md:items-center md:gap-12">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card-lg md:w-[58%]">
          <Image
            src="/images/hero-iqup-class.jpg"
            alt={t("photoAlt")}
            fill
            priority
            sizes="(min-width: 768px) 58vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex w-full flex-col gap-6 md:w-[42%]">
          <h1 className="text-display text-ink">{t("headline")}</h1>
          <p className="text-body text-muted">{t("subhead")}</p>

          <ul className="flex flex-col gap-2.5">
            {points.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-body text-ink">{p}</span>
              </li>
            ))}
          </ul>

          <Button asChild size="lg" className="self-start">
            <Link href="/procena">
              {t("cta")} <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer — placement #1 of the §16.1 disclaimer (shared component, short). */}
      <footer className="mx-auto w-full max-w-5xl px-5 py-6">
        <Disclaimer variant="short" />
      </footer>
    </main>
  );
}
