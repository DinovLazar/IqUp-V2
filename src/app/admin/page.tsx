import { getTranslations } from "next-intl/server";

import { requireAdminPage } from "@/lib/supabase/admin-guard";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { resolveEnvironment } from "@/lib/env";
import {
  normalizeStats,
  sortedEntries,
  sortedNumericEntries,
} from "@/features/admin";
import { INDICES } from "@/lib/indices";
import { BANDS, BAND_ORDER } from "@/components/ui/band-label";
import { Card, CardContent } from "@/components/ui/card";
import { AdminShell } from "./admin-shell";

// /admin — aggregate stats over the anonymous scores store (Store A), env-filtered.
// requireAdmin() gates it; the aggregation runs IN Postgres (the admin_score_stats
// RPC) so ONLY aggregates cross the boundary — never per-row data. Reads ONLY
// scores; it never touches the Brevo contact store (the unjoinable invariant).
export const dynamic = "force-dynamic";

const KNOWN_GENDERS = new Set(["male", "female", "undisclosed", "unknown"]);

export default async function AdminStatsPage() {
  await requireAdminPage();

  const t = await getTranslations("admin.stats");
  const env = resolveEnvironment();

  const service = getServiceRoleClient();
  const { data } = await service.rpc("admin_score_stats", {
    p_environment: env,
  });
  const stats = normalizeStats(data);

  const genderLabel = (key: string) =>
    KNOWN_GENDERS.has(key) ? t(`gender.${key}`) : key;

  return (
    <AdminShell active="stats">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-display text-ink">{t("title")}</h1>
          <p className="text-body text-muted">{t("intro")}</p>
          <p className="text-label text-muted">{t("environment", { env })}</p>
        </header>

        {/* Total */}
        <Card>
          <CardContent className="flex items-baseline justify-between gap-4">
            <span className="text-body text-muted">{t("total")}</span>
            <span className="text-display text-pur">{stats.total}</span>
          </CardContent>
        </Card>

        {stats.total === 0 ? (
          <p className="text-body text-muted">{t("empty")}</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <DistributionCard
                title={t("byAge")}
                entries={sortedNumericEntries(stats.byAge).map(
                  ([k, c]): [string, number] => [t("ageLabel", { age: k }), c],
                )}
              />
              <DistributionCard
                title={t("byGender")}
                entries={sortedEntries(stats.byGender).map(
                  ([k, c]): [string, number] => [genderLabel(k), c],
                )}
              />
              <DistributionCard
                title={t("byCity")}
                entries={sortedEntries(stats.byCity)}
              />
              <DistributionCard
                title={t("byLanguage")}
                entries={sortedEntries(stats.byLanguage)}
              />
            </div>

            {/* Per-index band distribution */}
            <section className="flex flex-col gap-3">
              <h2 className="text-subhead text-ink">{t("bandsTitle")}</h2>
              <Card>
                <CardContent className="overflow-x-auto">
                  <table className="w-full border-collapse text-label">
                    <thead>
                      <tr className="text-left text-muted">
                        <th className="px-2 py-2 font-semibold">·</th>
                        {BAND_ORDER.map((band) => (
                          <th
                            key={band}
                            className="px-2 py-2 text-right font-semibold"
                          >
                            {BANDS[band].word}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {INDICES.map((index) => (
                        <tr key={index.key} className="border-t border-border">
                          <td className="px-2 py-2">
                            <span className="inline-flex items-center gap-2 text-ink">
                              <span
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: index.color }}
                                aria-hidden
                              />
                              {index.label}
                            </span>
                          </td>
                          {BAND_ORDER.map((band) => (
                            <td
                              key={band}
                              className="px-2 py-2 text-right text-ink tabular-nums"
                            >
                              {stats.bands[index.key][band]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}

function DistributionCard({
  title,
  entries,
}: {
  title: string;
  entries: ReadonlyArray<readonly [string, number]>;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <h2 className="text-label font-semibold text-muted">{title}</h2>
        <ul className="flex flex-col gap-1.5">
          {entries.length === 0 ? (
            <li className="text-label text-muted">—</li>
          ) : (
            entries.map(([label, count]) => (
              <li
                key={label}
                className="flex items-center justify-between gap-3 text-body text-ink"
              >
                <span className="truncate">{label}</span>
                <span className="text-muted tabular-nums">{count}</span>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
