import { data, getGroupName, getPodium } from "@/lib/data";
import { fmtPct } from "@/lib/format";
import { ar } from "@/lib/i18n";
import { Badge } from "@/components/ui";
import { LastUpdated, SectionTitle, Wave } from "@/components/shared";
import { Podium } from "@/components/Podium";
import { RankingTable } from "@/components/RankingTable";
import { StatCard } from "@/components/cards";
import { ComparisonBars, HistoryLineChart } from "@/components/charts";
import { IconBarChart, IconCrown, IconTrendingDown, IconTrendingUp } from "@/components/Icons";

export function Home() {
  const { meta, stats } = data;
  const podium = getPodium();

  return (
    <>
      {/* الترويسة */}
      <section className="relative overflow-hidden bg-card">
        <div className="container-site flex flex-col items-center gap-5 pb-6 pt-10 text-center sm:pt-14">
          <img src="/logo.png" alt={ar.siteName} className="w-52 sm:w-64" width={911} height={378} />
          <div className="space-y-2">
            <h1 className="text-hero text-primary">{ar.siteName}</h1>
            <p className="text-lg text-muted-foreground">
              {ar.siteTagline} — {ar.seasonLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary">
              {ar.hero.day} {meta.completedDays} {ar.hero.of} {meta.programDays}
            </Badge>
            <Badge variant="default">
              {ar.hero.week} {meta.completedWeeks} {ar.hero.of} {meta.totalWeeks}
            </Badge>
            <Badge variant="success">
              {ar.hero.completion}: {fmtPct(meta.completionPct)}
            </Badge>
          </div>
          <LastUpdated iso={meta.generatedAt} />
        </div>
        <Wave />
      </section>

      <div className="container-site space-y-16 py-12">
        {/* منصة التتويج */}
        <section aria-labelledby="podium-title">
          <SectionTitle id="podium-title" title={ar.home.podiumTitle} subtitle={ar.home.podiumSubtitle} />
          <div className="mx-auto max-w-3xl">
            <Podium podium={podium} />
          </div>
        </section>

        {/* الترتيب العام */}
        <section aria-labelledby="ranking-title">
          <SectionTitle id="ranking-title" title={ar.home.rankingTitle} subtitle={ar.home.rankingSubtitle} />
          <RankingTable rows={data.ranking} />
        </section>

        {/* لمحة سريعة */}
        <section aria-labelledby="stats-title">
          <SectionTitle id="stats-title" title={ar.home.statsTitle} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={ar.stats.leader}
              value={getGroupName(stats.leaderGroupId)}
              icon={<IconCrown />}
              tone="accent"
            />
            <StatCard label={ar.stats.highest} value={fmtPct(stats.highestPct)} icon={<IconTrendingUp />} tone="success" />
            <StatCard label={ar.stats.average} value={fmtPct(stats.averagePct)} icon={<IconBarChart />} tone="secondary" />
            <StatCard label={ar.stats.lowest} value={fmtPct(stats.lowestPct)} icon={<IconTrendingDown />} tone="primary" />
          </div>
        </section>

        {/* تطوّر النتائج */}
        <section aria-labelledby="progress-title">
          <SectionTitle id="progress-title" title={ar.home.progressTitle} subtitle={ar.home.progressSubtitle} />
          <div className="rounded-card border bg-card p-5 shadow-soft sm:p-6">
            <HistoryLineChart
              history={data.history}
              series={data.ranking.map((r) => ({ id: r.groupId, nameAr: r.nameAr }))}
            />
          </div>
        </section>

        {/* مقارنة المجموعات */}
        <section aria-labelledby="comparison-title">
          <SectionTitle id="comparison-title" title={ar.home.comparisonTitle} subtitle={ar.home.comparisonSubtitle} />
          <div className="rounded-card border bg-card p-5 shadow-soft sm:p-6">
            <ComparisonBars rows={data.ranking.map((r) => ({ nameAr: r.nameAr, totalPct: r.totalPct }))} />
          </div>
        </section>
      </div>
    </>
  );
}
