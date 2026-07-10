import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { requireAdminPage } from "@/lib/supabase/admin-guard";
import {
  fetchAllContactsFromList,
  resolveBrevoListId,
} from "@/lib/brevo/server";
import {
  CONTACTS_PAGE_SIZE,
  filterContacts,
  paginate,
  parseContactFilters,
  type ContactFilters,
} from "@/features/admin";
import { GENDER_VALUES } from "@/features/lead/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminShell } from "../admin-shell";

// /admin/contacts — contacts read LIVE from the env-resolved Brevo list (prod → 7,
// else → 8). requireAdmin() gates it. Columns are the displayed fields ONLY —
// first name, email, phone, city, gender, the three consents, signup time — NO
// age, NO results (decision 1). Filters (city/gender/marketing) + pagination run
// server-side (the Brevo key never reaches the client). This page reads ONLY
// Brevo; it never touches the scores store (the unjoinable invariant).
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

/** Build a query string from defined, non-empty values. */
function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function pageNumber(params: SearchParams): number {
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Drop undefined keys so qs() only carries active filters. */
function filterQuery(filters: ContactFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (filters.city) out.city = filters.city;
  if (filters.gender) out.gender = filters.gender;
  if (filters.marketing) out.marketing = filters.marketing;
  return out;
}

export default async function AdminContactsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminPage();

  const params = await searchParams;
  const t = await getTranslations("admin.contacts");
  const tg = await getTranslations("admin.stats.gender");

  const listId = resolveBrevoListId();
  const filters = parseContactFilters(params);
  const page = pageNumber(params);

  const { contacts, truncated } = await fetchAllContactsFromList({ listId });
  const filtered = filterContacts(contacts, filters);
  const view = paginate(filtered, page, CONTACTS_PAGE_SIZE);

  const fieldClass =
    "flex min-h-11 w-full rounded-field border-[1.5px] border-border bg-surface px-3.5 py-2.5 text-body text-ink outline-none focus-visible:border-pur focus-visible:ring-[3px] focus-visible:ring-focus";

  const genderLabel = (code: string) =>
    code === "male" || code === "female" || code === "undisclosed"
      ? tg(code)
      : t("dash");

  const from = view.total === 0 ? 0 : (view.page - 1) * CONTACTS_PAGE_SIZE + 1;
  const to = (view.page - 1) * CONTACTS_PAGE_SIZE + view.items.length;

  const baseQuery = filterQuery(filters);

  return (
    <AdminShell active="contacts">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-display text-ink">{t("title")}</h1>
          <p className="text-body text-muted">{t("intro", { listId })}</p>
        </header>

        {/* Filters — a plain GET form (server-side filtering; no client JS). */}
        <Card>
          <CardContent>
            <form
              method="get"
              action="/admin/contacts"
              className="flex flex-wrap items-end gap-4"
            >
              <Field className="min-w-40 flex-1">
                <Label htmlFor="f-city">{t("cityLabel")}</Label>
                <Input
                  id="f-city"
                  name="city"
                  defaultValue={filters.city ?? ""}
                  placeholder={t("cityPlaceholder")}
                />
              </Field>

              <Field className="min-w-40">
                <Label htmlFor="f-gender">{t("genderLabel")}</Label>
                <select
                  id="f-gender"
                  name="gender"
                  defaultValue={filters.gender ?? ""}
                  className={fieldClass}
                >
                  <option value="">{t("genderAny")}</option>
                  {GENDER_VALUES.map((g) => (
                    <option key={g} value={g}>
                      {tg(g)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field className="min-w-40">
                <Label htmlFor="f-marketing">{t("marketingLabel")}</Label>
                <select
                  id="f-marketing"
                  name="marketing"
                  defaultValue={filters.marketing ?? ""}
                  className={fieldClass}
                >
                  <option value="">{t("marketingAny")}</option>
                  <option value="yes">{t("marketingYes")}</option>
                  <option value="no">{t("marketingNo")}</option>
                </select>
              </Field>

              <div className="flex gap-2">
                <Button type="submit">{t("apply")}</Button>
                <Button asChild variant="ghost">
                  {/* next/link (not the locale-aware nav): admin is MK-only and
                      lives outside the [locale] tree (Feat-Serbian-Localization). */}
                  <Link href="/admin/contacts">{t("clear")}</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Export */}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <a href={`/api/admin/export${qs(baseQuery)}`}>{t("exportAll")}</a>
          </Button>
          <Button asChild variant="secondary">
            <a
              href={`/api/admin/export${qs({ ...baseQuery, marketing: "yes" })}`}
            >
              {t("exportMarketing")}
            </a>
          </Button>
        </div>

        {truncated && (
          <p className="text-label text-muted">
            {t("truncatedNote", { max: contacts.length })}
          </p>
        )}

        {/* Table */}
        {view.total === 0 ? (
          <p className="text-body text-muted">{t("empty")}</p>
        ) : (
          <>
            <Card>
              <CardContent className="overflow-x-auto">
                <table className="w-full border-collapse text-label">
                  <thead>
                    <tr className="text-left text-muted">
                      <th className="px-2 py-2 font-semibold">
                        {t("columns.firstName")}
                      </th>
                      <th className="px-2 py-2 font-semibold">
                        {t("columns.email")}
                      </th>
                      <th className="px-2 py-2 font-semibold">
                        {t("columns.phone")}
                      </th>
                      <th className="px-2 py-2 font-semibold">
                        {t("columns.city")}
                      </th>
                      <th className="px-2 py-2 font-semibold">
                        {t("columns.gender")}
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        {t("columns.consentService")}
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        {t("columns.consentParent")}
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        {t("columns.consentMarketing")}
                      </th>
                      <th className="px-2 py-2 font-semibold">
                        {t("columns.signupAt")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.items.map((c, i) => (
                      <tr
                        key={`${c.email}-${i}`}
                        className="border-t border-border align-top text-ink"
                      >
                        <td className="px-2 py-2">
                          {c.firstName || t("dash")}
                        </td>
                        <td className="px-2 py-2 break-all">{c.email}</td>
                        <td className="px-2 py-2">{c.phone || t("dash")}</td>
                        <td className="px-2 py-2">{c.city || t("dash")}</td>
                        <td className="px-2 py-2">{genderLabel(c.gender)}</td>
                        <td className="px-2 py-2 text-center">
                          {c.consentService ? t("yes") : t("no")}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {c.consentParent ? t("yes") : t("no")}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {c.consentMarketing ? t("yes") : t("no")}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {c.signupAt || t("dash")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-label text-muted">
                {t("showing", { from, to, total: view.total })}
              </p>
              <div className="flex items-center gap-3">
                {view.page > 1 ? (
                  <Button asChild variant="secondary" size="default">
                    <a
                      href={`/admin/contacts${qs({ ...baseQuery, page: view.page - 1 })}`}
                    >
                      {t("prev")}
                    </a>
                  </Button>
                ) : (
                  <Button variant="secondary" disabled>
                    {t("prev")}
                  </Button>
                )}
                <span className="text-label text-muted">
                  {t("page", {
                    page: view.page,
                    pageCount: view.pageCount,
                  })}
                </span>
                {view.page < view.pageCount ? (
                  <Button asChild variant="secondary" size="default">
                    <a
                      href={`/admin/contacts${qs({ ...baseQuery, page: view.page + 1 })}`}
                    >
                      {t("next")}
                    </a>
                  </Button>
                ) : (
                  <Button variant="secondary" disabled>
                    {t("next")}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
