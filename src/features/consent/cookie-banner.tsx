"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { getConsent, setConsent, subscribeConsent } from "@/features/consent";
import type { ConsentDecision } from "@/features/consent";

/**
 * The cookie consent banner (Phase 3.03a — spec §16.1 placement #7 / §16.3).
 *
 * A NON-BLOCKING bottom banner (bottom sheet on mobile) with two explicit,
 * equal-weight choices — "Accept all" and "Essential only" — and NO dismiss-X, so
 * consent is never ambiguous (D-168). Analytics is off by default, so the banner
 * never traps focus or blocks the page: the parent can keep reading and decide.
 * "Accept all" is the only thing that flips `hasAnalyticsConsent()` to true, which
 * is what un-gates `trackEvent` (D-169).
 *
 * Hydration-safe + reactive via `useSyncExternalStore`: consent lives in
 * localStorage (client-only), so the SERVER snapshot is a sentinel that renders
 * `null` on the server AND during hydration (no mismatch), then the real decision
 * is read right after mount. Because it subscribes to the consent store, the banner
 * shows/hides with no manual state — including reappearing when the Privacy page's
 * "manage cookies" control withdraws consent — and needs no page reload.
 *
 * Accessibility (WCAG 2.2 AA): a labelled `role="region"` landmark, real ≥44px
 * buttons, a real focusable Privacy link, visible `focus-visible` rings, brand
 * tokens (contrast ≥ 4.5:1, never colour-only). The entrance is a calm CSS
 * slide/fade gated by `motion-safe:` and neutralised by the global
 * `prefers-reduced-motion` kill-switch (brand §8) — no anxious or timed motion.
 */
export function CookieBanner() {
  const t = useTranslations("cookie");

  const decision = React.useSyncExternalStore(
    subscribeConsent,
    () => getConsent(), // client: undefined | "accepted" | "declined"
    () => "server" as const, // server + hydration: sentinel → render null
  );

  // Show ONLY once past the "server" sentinel (mounted) and still undecided.
  if (decision !== undefined) return null;

  const choose = (choice: ConsentDecision) => setConsent(choice);

  return (
    // Wrapper spans the width but is click-through (pointer-events-none); only the
    // card is interactive, so the banner never blocks the page beneath it.
    <div
      role="region"
      aria-label={t("ariaLabel")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 sm:p-4"
    >
      <Card className="pointer-events-auto w-full max-w-2xl gap-4 shadow-pop duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-subhead text-ink">{t("heading")}</h2>
          <p className="text-body text-muted">{t("body")}</p>
          <Link
            href="/politika-za-privatnost"
            className="w-fit rounded-field text-label font-semibold text-pur underline underline-offset-2 outline-none hover:text-pur-hover focus-visible:ring-[3px] focus-visible:ring-focus"
          >
            {t("privacyLink")}
          </Link>
          <Disclaimer variant="short" className="mt-1" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => choose("declined")}
            className="sm:min-w-44"
          >
            {t("decline")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => choose("accepted")}
            className="sm:min-w-44"
          >
            {t("accept")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
