"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { createAdminBrowserClient } from "@/lib/supabase/admin-browser";
import { Button } from "@/components/ui/button";

// Sign-out control for the admin chrome (Phase 2.04). Clears the Supabase
// session (cookie) via the browser client, then routes to the login screen.
export function SignOutButton() {
  const t = useTranslations("admin.nav");
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function signOut() {
    setBusy(true);
    try {
      const supabase = createAdminBrowserClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="default"
      onClick={signOut}
      disabled={busy}
    >
      {t("signOut")}
    </Button>
  );
}
