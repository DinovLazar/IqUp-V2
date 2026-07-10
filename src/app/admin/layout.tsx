import type { Metadata } from "next";

import { RootDocument } from "../root-document";

// Admin panel layout (Phase 2.04; +Feat-Serbian-Localization: now a root `<html>`).
// The admin panel is an internal IQ UP!-staff tool and stays MACEDONIAN — it is
// deliberately NOT under the localized `[locale]` tree, so it renders its own
// `<html lang="mk">` via the shared `RootDocument`. Its job is otherwise unchanged:
// mark the whole `/admin/**` tree `noindex, nofollow` (never discoverable /
// crawled) and give a neutral page background. It renders NO authenticated chrome —
// `/admin/login` lives under this layout too, and the nav/sign-out chrome
// (`AdminShell`) is rendered only by the authenticated pages. Not linked from any
// public nav.
export const metadata: Metadata = {
  title: "IQ UP! · Админ",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootDocument locale="mk">
      <div className="min-h-full bg-bg">{children}</div>
    </RootDocument>
  );
}
