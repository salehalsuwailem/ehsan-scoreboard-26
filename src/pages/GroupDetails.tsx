import { data, getGroup } from "@/lib/data";
import { fmtPct, rankLabel } from "@/lib/format";
import { ar } from "@/lib/i18n";
import { MedalBadge, MovementBadge, SectionTitle } from "@/components/shared";
import { CategoryCard, SummaryCard } from "@/components/cards";
import { ComponentsRadar, HistoryLineChart } from "@/components/charts";
import { GroupCompetitions } from "@/components/competitions";
import { IconAward, IconHash, IconStar, IconUsers } from "@/components/Icons";
import { NotFound } from "@/pages/NotFound";

export function GroupDetails({ id }: { id: string }) {
  const group = getGroup(id);
  if (!group) return <NotFound title={ar.group.notFound} />;

  const bestCategory = [...group.categories].sort((a, b) => b.pct - a.pct)[0];

  return (
    <>
      {/* الترويسة */}
      <div className="border-b bg-card">
        <div className="container-site flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <MedalBadge rank={group.rank} className="h-12 w-12 text-lg" />
            <div>
              <h1 className="text-hero text-primary">{group.nameAr}</h1>
              <p className="text-muted-foreground">
                {ar.group.captain}: <span className="font-semibold text-foreground">{group.captain}</span>
                <span className="mx-2 text-border" aria-hidden>
                  |
                </span>
                {ar.group.deputy}: <span className="font-semibold text-foreground">{group.deputy}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-caption text-muted-foreground">{ar.ranking.movement}:</span>
            <MovementBadge movement={group.movement} />
          </div>
        </div>
      </div>

      <div className="container-site space-y-14 py-10">
        {/* الملخص */}
        <section aria-label={ar.home.statsTitle}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard label={ar.group.currentRank} value={<span>{rankLabel(group.rank)}</span>} icon={<IconHash />} />
            <SummaryCard
              label={ar.group.totalScore}
              value={<span className="tabular">{fmtPct(group.totalPct)}</span>}
              icon={<IconStar />}
            />
            <SummaryCard
              label={ar.group.bestCategory}
              value={<span className="text-base">{bestCategory?.nameAr ?? "—"}</span>}
              hint={bestCategory ? fmtPct(bestCategory.pct) : undefined}
              icon={<IconAward />}
            />
            <SummaryCard label={ar.group.members} value={<span className="tabular">{group.members}</span>} icon={<IconUsers />} />
          </div>
        </section>

        {/* البنود التفصيلية */}
        <section aria-labelledby="categories-title">
          <SectionTitle id="categories-title" title={ar.group.categoriesTitle} subtitle={ar.group.categoriesSubtitle} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        {/* نتائج المنافسات */}
        <section aria-labelledby="competitions-title">
          <SectionTitle
            id="competitions-title"
            title={ar.group.competitionsTitle}
            subtitle={ar.group.competitionsSubtitle}
          />
          <GroupCompetitions groupId={group.id} />
        </section>

        {/* المخططات */}
        <section aria-labelledby="radar-title" className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-card border bg-card p-5 shadow-soft sm:p-6">
            <SectionTitle id="radar-title" title={ar.group.radarTitle} subtitle={ar.group.radarSubtitle} />
            <ComponentsRadar components={group.components} groupName={group.nameAr} />
          </div>
          <div className="rounded-card border bg-card p-5 shadow-soft sm:p-6">
            <SectionTitle title={ar.group.progressTitle} subtitle={ar.group.progressSubtitle} />
            <HistoryLineChart history={data.history} series={[{ id: group.id, nameAr: group.nameAr }]} height={300} />
          </div>
        </section>
      </div>
    </>
  );
}
