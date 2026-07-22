import { useState } from "react";
import { groups } from "@/lib/data";
import { fmtPct, rankLabel } from "@/lib/format";
import { ar } from "@/lib/i18n";
import { MEDAL_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/shared";
import { IconUsers } from "@/components/Icons";
import { GroupDetailView } from "@/pages/GroupDetails";

/** المجموعات مرتّبة حسب المركز، مع المتصدّر أولاً. */
const ordered = [...groups].sort((a, b) => a.rank - b.rank);

export function Groups() {
  const [selectedId, setSelectedId] = useState<string>(ordered[0]?.id ?? "");
  const group = ordered.find((g) => g.id === selectedId) ?? ordered[0];

  if (!group) return null;

  return (
    <div className="pb-2">
      <div className="container-site pt-10">
        <SectionTitle title={ar.groupsPage.title} subtitle={ar.groupsPage.subtitle} />

        {/* منتقي المجموعة */}
        <div className="mb-2 max-w-md">
          <label htmlFor="group-select" className="mb-1.5 block text-caption font-semibold text-muted-foreground">
            {ar.groupsPage.selectLabel}
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-secondary [&_svg]:h-5 [&_svg]:w-5"
              aria-hidden
            >
              <IconUsers />
            </span>
            <select
              id="group-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={cn(
                "h-12 w-full appearance-none rounded-field border border-input bg-card ps-4 pe-11",
                "text-sm font-semibold text-foreground shadow-soft",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {ordered.map((g) => (
                <option key={g.id} value={g.id}>
                  {MEDAL_STYLES[g.rank]?.emoji ? `${MEDAL_STYLES[g.rank].emoji} ` : ""}
                  {rankLabel(g.rank)} — {g.nameAr} ({fmtPct(g.totalPct)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* تفاصيل المجموعة المختارة (بدون ترويسة مكرّرة) */}
      <div key={group.id} className="animate-fade-in">
        <GroupDetailView group={group} showHeader={false} />
      </div>
    </div>
  );
}
