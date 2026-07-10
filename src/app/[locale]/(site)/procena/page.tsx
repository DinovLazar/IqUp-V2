import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Assessment } from "./assessment";

// The assessment flow route (Phase 1.06). Browser-memory only — nothing is
// persisted before the lead form (1.08). The client `Assessment` owns the whole
// setup → pre-start → practice/real → completion state machine and inherits the
// locale it was entered in (the switcher is intentionally NOT rendered here).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "setup" });
  return { title: `${t("title")} — IQ UP!` };
}

export default async function ProcenaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Assessment />;
}
