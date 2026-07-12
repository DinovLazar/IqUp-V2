"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { clearConsent } from "@/features/consent";

/**
 * "Manage cookies" control (Phase 3.03a — spec §16.3 / GDPR "withdraw as easily as
 * give"). A real button on the Privacy page that clears the stored decision, which
 * notifies the always-mounted `CookieBanner` to reappear so the parent can choose
 * again. Withdrawing consent is therefore exactly one click — no harder than
 * giving it. Copy is single-sourced from the `cookie.*` keys (never hardcoded).
 */
export function CookieSettings() {
  const t = useTranslations("cookie");
  return (
    <Button type="button" variant="secondary" onClick={() => clearConsent()}>
      {t("manageLabel")}
    </Button>
  );
}
