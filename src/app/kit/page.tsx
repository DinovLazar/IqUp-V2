import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { KitGallery } from "./kit-gallery";

// Dev-only verification surface for the UI kit (Phase 1.03). Not linked from any
// production nav and marked noindex. It renders on local dev and on Vercel
// preview builds (for QA) but 404s on real production (VERCEL_ENV === "production").
export const metadata: Metadata = {
  title: "UI Kit — IqUp-V2",
  robots: { index: false, follow: false },
};

export default function KitPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return <KitGallery />;
}
