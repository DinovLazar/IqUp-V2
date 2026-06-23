import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { PuzzleBrain } from "@/components/ui/puzzle-brain";

/**
 * Shared chrome for the static `(site)` pages (Phase 1.10): /za-testot,
 * /politika-za-privatnost, /uslovi. A header with the IQ UP! wordmark linking
 * home + a "back to home" affordance, then a centered content column matching the
 * landing's max-width and brand wash. Pure presentation, no client state — renders
 * as a Server Component (next-intl `useTranslations` is isomorphic).
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common");
  return (
    <main className="flex min-h-dvh flex-col bg-grad-wash">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-field outline-none focus-visible:ring-[3px] focus-visible:ring-focus"
        >
          <PuzzleBrain completed={5} variant="chip" showTrack={false} />
          <span className="text-subhead font-extrabold tracking-tight text-pur">
            IQ UP!
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-field px-2 py-1 text-label font-semibold text-muted transition-colors outline-none hover:text-ink focus-visible:ring-[3px] focus-visible:ring-focus"
        >
          <ArrowLeft className="size-4" aria-hidden /> {t("home")}
        </Link>
      </header>
      <section className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 pb-16">
        {children}
      </section>
    </main>
  );
}
