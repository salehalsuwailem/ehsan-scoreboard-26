import { useMemo, useState } from "react";
import type { RankingRow } from "@/types";
import { MEDAL_STYLES } from "@/lib/constants";
import { fmtPct } from "@/lib/format";
import { ar } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Link } from "@/router";
import { Input } from "@/components/ui";
import { EmptyState, MedalBadge, MovementBadge } from "@/components/shared";
import { IconSearch } from "@/components/Icons";

const HEAD_CELL = "h-11 px-4 text-start align-middle text-caption font-semibold text-muted-foreground";

/** جدول الترتيب العام — بحث فوري، رأس مثبّت، تظليل أصحاب الميداليات. */
export function RankingTable({ rows }: { rows: RankingRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    return rows.filter((row) => row.nameAr.includes(q));
  }, [rows, query]);

  return (
    <div className="overflow-hidden rounded-card border bg-card shadow-soft">
      <div className="border-b p-4">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar.ranking.searchPlaceholder}
            aria-label={ar.ranking.searchPlaceholder}
            className="ps-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-4">
          <EmptyState title={ar.ranking.noResults} icon={<IconSearch className="h-8 w-8" />} />
        </div>
      ) : (
        <div className="max-h-[560px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
              <tr>
                <th className={cn(HEAD_CELL, "w-20")}>{ar.ranking.rank}</th>
                <th className={HEAD_CELL}>{ar.ranking.group}</th>
                <th className={cn(HEAD_CELL, "w-28 text-center")}>{ar.ranking.total}</th>
                <th className={cn(HEAD_CELL, "w-24 text-center")}>{ar.ranking.movement}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.groupId}
                  className={cn(
                    "relative border-t transition-colors",
                    row.medal ? MEDAL_STYLES[row.medal].row : "hover:bg-muted/50"
                  )}
                >
                  <td className="px-4 py-3">
                    <MedalBadge rank={row.rank} />
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      to={`/group/${row.groupId}`}
                      className="text-foreground after:absolute after:inset-0 hover:text-primary focus-visible:outline-none focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                    >
                      {row.nameAr}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-primary tabular">
                    {fmtPct(row.totalPct)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex justify-center">
                      <MovementBadge movement={row.movement} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
