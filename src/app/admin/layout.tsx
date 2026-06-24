import type { Metadata } from "next";

// Admin panel layout (Phase 2.04). Its ONLY job is to mark the whole `/admin/**`
// tree `noindex, nofollow` (it must never be discoverable / crawled) and give a
// neutral page background. It deliberately renders NO authenticated chrome —
// `/admin/login` lives under this layout too, and the nav/sign-out chrome
// (`AdminShell`) is rendered only by the authenticated pages. The panel is not
// linked from any public nav.
export const metadata: Metadata = {
  title: "IQ UP! · Админ",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-full bg-bg">{children}</div>;
}
