import type { ReactNode } from "react";
import type { Award, CategoryScore } from "@/types";
import { fmtPct, pctState } from "@/lib/format";
import { ar } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Link } from "@/router";
import { Card } from "@/components/ui";
import { ProgressBar } from "@/components/shared";
import { IconAward } from "@/components/Icons";

/* --------------------------------- StatCard -------------------------------- */

const TONES = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  accent: "bg-accent/15 text-accent-foreground",
} as const;

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: keyof typeof TONES;
}

export function StatCard({ label, value, hint, icon, tone = "primary" }: StatCardProps) {
  return (
    <Card className="h-full">
      <div className="flex items-center gap-4 p-5">
        {icon ? (
          <span
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-btn [&_svg]:h-6 [&_svg]:w-6",
              TONES[tone]
            )}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-caption text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-extrabold text-foreground tabular" title={value}>
            {value}
          </p>
          {hint ? <p className="truncate text-caption text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------- CategoryCard ------------------------------ */

/** بند تقييم واحد: الدرجة من الحد الأعلى + شريط الإنجاز + حالة الأداء. */
export function CategoryCard({ category }: { category: CategoryScore }) {
  const state = pctState(category.pct);

  return (
    <Card className="h-full">
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-foreground">{category.nameAr}</h3>
          <span className={cn("shrink-0 text-caption font-bold", state.text)}>{state.label}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-lg font-extrabold text-primary tabular">{fmtPct(category.scorePct)}</span>{" "}
          {ar.group.outOf} <span className="tabular">{fmtPct(category.maxPct)}</span>
        </p>
        <ProgressBar pct={category.pct} label={category.nameAr} />
        <p className={cn("text-caption font-semibold tabular", state.text)}>{fmtPct(category.pct)}</p>
      </div>
    </Card>
  );
}

/* -------------------------------- AwardCard -------------------------------- */

export function AwardCard({ award, groupName }: { award: Award; groupName: string }) {
  return (
    <Card className="h-full transition-shadow hover:shadow-lift">
      <div className="flex items-center gap-4 p-5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-warning/40 to-warning/15 text-[#8a6a00]"
          aria-hidden
        >
          <IconAward className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">{award.titleAr}</p>
          <Link
            to={`/group/${award.groupId}`}
            className="block truncate font-bold text-primary hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {groupName}
          </Link>
        </div>
        {award.detail ? (
          <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-caption font-bold text-muted-foreground tabular">
            {award.detail}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

/* ------------------------------- SummaryCard ------------------------------- */

/** بطاقة رقم رئيسي مضغوطة أعلى صفحة المجموعة. */
export function SummaryCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
}) {
  return (
    <Card className="h-full">
      <div className="space-y-2 p-5">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-btn bg-secondary/10 text-secondary [&_svg]:h-5 [&_svg]:w-5"
          aria-hidden
        >
          {icon}
        </span>
        <p className="text-caption text-muted-foreground">{label}</p>
        <div className="text-lg font-extrabold text-foreground">{value}</div>
        {hint ? <p className="text-caption text-muted-foreground">{hint}</p> : null}
      </div>
    </Card>
  );
}
