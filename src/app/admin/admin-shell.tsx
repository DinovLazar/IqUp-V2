import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";

// Shared chrome for the AUTHENTICATED admin pages (Phase 2.04): a header with the
// admin wordmark, the two nav links (Статистика / Контакти), and sign-out, over a
// centered content column. Reuses the brand kit (no new primitive). Rendered by
// the stats + contacts pages only — never by /admin/login. Sync Server Component
// (next-intl `useTranslations`), mirroring `(site)/page-shell.tsx`.
export function AdminShell({
  active,
  children,
}: {
  active: "stats" | "contacts";
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="text-subhead text-pur">{t("appName")}</span>
          <nav className="flex items-center gap-1" aria-label="Admin">
            <NavLink href="/admin" current={active === "stats"}>
              {t("nav.stats")}
            </NavLink>
            <NavLink href="/admin/contacts" current={active === "contacts"}>
              {t("nav.contacts")}
            </NavLink>
          </nav>
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "rounded-field px-3 py-2 text-label font-semibold transition-colors",
        current ? "bg-tint-pur text-pur" : "text-ink hover:bg-tint-pur",
      )}
    >
      {children}
    </Link>
  );
}
