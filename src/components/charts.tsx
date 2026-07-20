import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryScore, HistorySnapshot } from "@/types";
import { GROUP_CHART_COLORS } from "@/lib/constants";
import { fmtDateShort, fmtPct } from "@/lib/format";
import { ar } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";
import { EmptyState } from "@/components/shared";
import { IconTrendingUp } from "@/components/Icons";

const TOOLTIP_STYLE = { borderRadius: 14, borderColor: "hsl(220 13% 91%)", fontFamily: "inherit" };

/* -------------------------------- ChartShell ------------------------------- */

/**
 * يؤجّل تركيب المخطط (الثقيل) حتى يقترب من الشاشة،
 * ويثبّت اتجاهه LTR كي تُرسم المحاور صحيحة داخل صفحة RTL.
 */
export function ChartShell({
  label,
  height = 320,
  className,
  children,
}: {
  label: string;
  height?: number;
  className?: string;
  children: ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} dir="ltr" role="img" aria-label={label} style={{ height }} className={cn("w-full", className)}>
      {inView ? children : <div className="h-full w-full animate-pulse rounded-card bg-muted" />}
    </div>
  );
}

/* ----------------------------- HistoryLineChart ---------------------------- */

interface SeriesDef {
  id: string;
  nameAr: string;
}

/** مسار الإجمالي عبر لقطات المزامنة — خط لكل مجموعة. */
export function HistoryLineChart({
  history,
  series,
  height = 340,
}: {
  history: HistorySnapshot[];
  series: SeriesDef[];
  height?: number;
}) {
  if (history.length < 2) {
    return (
      <EmptyState
        title={ar.empty.chartNeedsHistory}
        hint={ar.empty.noDataHint}
        icon={<IconTrendingUp className="h-8 w-8" />}
      />
    );
  }

  const data = history.map((snapshot) => {
    const point: Record<string, number | string> = { name: fmtDateShort(snapshot.syncedAt) };
    for (const entry of snapshot.entries) point[entry.groupId] = entry.totalPct;
    return point;
  });

  return (
    <ChartShell label={ar.home.progressTitle} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, left: 0, right: 16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(220 13% 91%)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis unit="%" width={44} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
          <Tooltip formatter={(value: number) => fmtPct(value)} contentStyle={TOOLTIP_STYLE} />
          {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          {series.map((s, i) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.nameAr}
              stroke={GROUP_CHART_COLORS[i % GROUP_CHART_COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

/* ------------------------------ ComparisonBars ----------------------------- */

/** مقارنة أفقية للإجمالي الحالي لكل مجموعة. */
export function ComparisonBars({ rows }: { rows: { nameAr: string; totalPct: number }[] }) {
  const height = Math.max(300, rows.length * 52);

  return (
    <ChartShell label={ar.home.comparisonTitle} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, left: 8, right: 40, bottom: 4 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(220 13% 91%)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} unit="%" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="nameAr"
            width={132}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "hsl(221 39% 11%)" }}
          />
          <Tooltip
            formatter={(value: number) => fmtPct(value)}
            cursor={{ fill: "hsl(210 40% 96%)" }}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar dataKey="totalPct" name={ar.ranking.total} radius={[0, 8, 8, 0]} barSize={26}>
            {rows.map((row, i) => (
              <Cell key={row.nameAr} fill={GROUP_CHART_COLORS[i % GROUP_CHART_COLORS.length]} />
            ))}
            <LabelList
              dataKey="totalPct"
              position="right"
              formatter={(value: number) => fmtPct(value)}
              style={{ fontSize: 12, fontWeight: 700, fill: "hsl(211 76% 25%)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

/* ------------------------------ ComponentsRadar ---------------------------- */

/** نسبة الإنجاز في مكوّنات المحرّك التسعة لمجموعة واحدة. */
export function ComponentsRadar({ components, groupName }: { components: CategoryScore[]; groupName: string }) {
  const data = components.map((c) => ({ name: c.nameAr, pct: c.pct }));

  return (
    <ChartShell label={`${ar.group.radarTitle} — ${groupName}`} height={360}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="hsl(220 13% 91%)" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name={groupName} dataKey="pct" stroke="#2D9CDB" fill="#2D9CDB" fillOpacity={0.28} strokeWidth={2} />
          <Tooltip formatter={(value: number) => fmtPct(value)} contentStyle={TOOLTIP_STYLE} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
