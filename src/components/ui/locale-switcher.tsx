"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";

import { locales } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The header locale switcher (Feat-Serbian-Localization) — the shared, functional
 * replacement for the old inert MK/EN JSX.
 *
 * It is driven entirely off the canonical enabled-locale list (`@/i18n/routing`),
 * so adding HR/EN later is a config + message-file change with NO edit here
 * (scope 2). One control per locale: the active one is highlighted (a filled
 * violet pill + a check glyph — NOT colour alone, per brand §10, plus
 * `aria-current`), and tapping an inactive one switches locale and navigates to the
 * equivalent route (next-intl keeps the page, swaps the `/sr` prefix).
 *
 * Rendered on the landing header and the static-page shell — deliberately NOT
 * inside the `/procena` flow, where a mid-test switch would reset the in-memory
 * session (the flow inherits the locale it was entered in).
 *
 * Accessibility: each control is a real `<button>` with a visible `focus-visible`
 * ring and a ≥44px tap target (brand §10).
 */
export function LocaleSwitcher() {
  const active = useLocale();
  const t = useTranslations("landing");
  const pathname = usePathname();
  const router = useRouter();

  // Generic label lookup: `mk` → `langMk`, `sr` → `langSr`, … so new locales need
  // only a message key, never a change here.
  const labelKey = (loc: string) =>
    `lang${loc.charAt(0).toUpperCase()}${loc.slice(1)}`;

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-border bg-surface p-1"
      role="group"
      aria-label={t("langSwitcherLabel")}
    >
      {locales.map((loc) => {
        const isActive = loc === active;
        // next-intl's typed keys don't know the dynamic label key; it exists for
        // every enabled locale by construction (mk.json / sr.json parity).
        const label = t(labelKey(loc) as "langMk");
        return (
          <button
            key={loc}
            type="button"
            aria-current={isActive ? "true" : undefined}
            aria-label={label}
            onClick={() => {
              if (!isActive) router.replace(pathname, { locale: loc });
            }}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full px-3 text-label font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-focus",
              isActive ? "bg-pur text-white" : "text-muted hover:text-ink",
            )}
          >
            {isActive && (
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}
