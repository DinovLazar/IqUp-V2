import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

// Phase 1.01 placeholder landing. No branding yet (the brand theme + real
// landing arrive in Phases 1.03 / 1.06). Its only job is to prove the
// foundations are wired: it reads Macedonian strings via next-intl and renders
// the shadcn/ui Button to confirm the component pipeline works.
export default async function HomePage() {
  const t = await getTranslations();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">{t("meta.appName")}</h1>
      <Button>{t("common.start")}</Button>
    </main>
  );
}
