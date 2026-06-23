import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PuzzleBrain } from "@/components/ui/puzzle-brain";

// Real landing (handover §5.1) — photo-forward, brand hero, value message, an
// MK/EN switch (MK only active for the MVP), the "Започни проценка" entry to
// /procena, and the inline "informative, not diagnostic" footnote. Class photos
// are dashed placeholders (Cowork delivers the real assets later — clean swap).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return { title: "IQ UP!", description: t("subhead") };
}

function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex aspect-[4/3] w-full items-center justify-center rounded-card-lg border-2 border-dashed border-border-pur bg-tint-pur/50"
    >
      <span className="px-4 text-center text-label font-normal text-muted">
        {label}
      </span>
    </div>
  );
}

export default async function HomePage() {
  const t = await getTranslations("landing");
  const points = [t("point1"), t("point2"), t("point3")];

  return (
    <main className="flex min-h-dvh flex-col bg-grad-wash">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <PuzzleBrain completed={5} variant="chip" showTrack={false} />
          <span className="text-subhead font-extrabold tracking-tight text-pur">
            IQ UP!
          </span>
        </div>
        <div
          className="flex items-center gap-1 rounded-full border border-border bg-surface p-1"
          aria-label="Јазик"
        >
          <span className="rounded-full bg-pur px-3 py-1 text-label font-semibold text-white">
            {t("langMk")}
          </span>
          <span
            className="cursor-not-allowed rounded-full px-3 py-1 text-label font-semibold text-disabled-fg"
            aria-disabled
            title={t("langDisabledNote")}
          >
            {t("langEn")}
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-10 px-5 py-8 md:flex-row md:items-center md:gap-12">
        <div className="w-full md:w-[58%]">
          <PhotoPlaceholder label={t("photoPlaceholder")} />
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

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl px-5 py-6">
        <p className="text-label font-normal text-muted">{t("disclaimer")}</p>
      </footer>
    </main>
  );
}
