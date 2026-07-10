import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { Logo } from "@/components/ui/logo";

/**
 * Shared chrome for the static `(site)` pages (Phase 1.10): /za-testot,
 * /politika-za-privatnost, /uslovi. A header with the IQ UP! wordmark linking
 * home, the functional MK/SR locale switcher (Feat-Serbian-Localization) and a
 * "back to home" affordance, then a centered content column matching the landing's
 * max-width and brand wash. Pure presentation, no client state — renders as a
 * Server Component (next-intl `useTranslations` is isomorphic). The `Link`s use the
 * locale-aware navigation so a Serbian visitor keeps the `/sr` prefix.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common");
  return (
    <main className="flex min-h-dvh flex-col bg-grad-wash">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-5">
        <Link
          href="/"
          className="flex items-center rounded-field outline-none focus-visible:ring-[3px] focus-visible:ring-focus"
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-field px-2 py-1 text-label font-semibold text-muted transition-colors outline-none hover:text-ink focus-visible:ring-[3px] focus-visible:ring-focus sm:flex"
          >
            <ArrowLeft className="size-4" aria-hidden /> {t("home")}
          </Link>
        </div>
      </header>
      <section className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 pb-16">
        {children}
      </section>
    </main>
  );
}
