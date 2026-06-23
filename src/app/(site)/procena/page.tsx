import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Assessment } from "./assessment";

// The assessment flow route (Phase 1.06). Browser-memory only — nothing is
// persisted before the lead form (1.08). The client `Assessment` owns the whole
// setup → pre-start → practice/real → completion state machine.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("setup");
  return { title: `${t("title")} — IQ UP!` };
}

export default function ProcenaPage() {
  return <Assessment />;
}
