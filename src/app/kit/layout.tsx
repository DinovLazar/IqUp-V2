import type { Metadata } from "next";

import { RootDocument } from "../root-document";

// Dev-only UI-kit gallery layout (Feat-Serbian-Localization: now a root `<html>`).
// `/kit` is a local/preview verification surface, not a localized product route,
// so it renders its own `<html lang="mk">` via the shared `RootDocument` (it is not
// under the `[locale]` tree). Marked `noindex`; the page itself 404s on real
// production (`VERCEL_ENV === "production"`).
export const metadata: Metadata = {
  title: "UI Kit — IqUp-V2",
  robots: { index: false, follow: false },
};

export default function KitLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="mk">{children}</RootDocument>;
}
