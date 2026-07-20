import type { Group } from "@/types";
import { MEDAL_STYLES } from "@/lib/constants";
import { AnimatedNumber } from "@/components/shared";
import { Link } from "@/router";
import { cn } from "@/lib/utils";

const HEIGHTS: Record<number, string> = { 1: "h-28 sm:h-36", 2: "h-20 sm:h-28", 3: "h-16 sm:h-20" };
const ORDER: Record<number, string> = { 1: "order-2", 2: "order-1", 3: "order-3" };

/** منصة التتويج — حركة دخول متدرجة بـ CSS فقط، وتحترم تقليل الحركة تلقائياً. */
export function Podium({ podium }: { podium: Group[] }) {
  return (
    <ol className="grid grid-cols-3 items-end gap-3 sm:gap-6" aria-label="منصة التتويج">
      {podium.map((group, i) => {
        const medal = MEDAL_STYLES[group.rank];
        return (
          <li
            key={group.id}
            className={cn("flex min-w-0 animate-fade-up flex-col items-center gap-3", ORDER[group.rank])}
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <Link
              to={`/group/${group.id}`}
              className="group flex w-full min-w-0 flex-col items-center gap-1.5 rounded-card p-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-3xl sm:text-4xl" aria-hidden>
                {medal?.emoji}
              </span>
              <span
                className="w-full truncate font-bold text-primary group-hover:text-secondary sm:text-lg"
                title={group.nameAr}
              >
                {group.nameAr}
              </span>
              <span className="text-caption text-muted-foreground">{medal?.label}</span>
              <span className="text-xl font-extrabold text-foreground sm:text-2xl">
                <AnimatedNumber value={group.totalPct} suffix="%" />
              </span>
            </Link>
            <div
              className={cn(
                "w-full rounded-t-card border border-b-0 shadow-soft",
                HEIGHTS[group.rank],
                group.rank === 1 && "bg-gradient-to-b from-warning/40 to-warning/10",
                group.rank === 2 && "bg-gradient-to-b from-slate-200 to-slate-100/40",
                group.rank === 3 && "bg-gradient-to-b from-accent/35 to-accent/10"
              )}
            >
              <span className="flex justify-center pt-2 text-lg font-extrabold text-primary/60 tabular">
                {group.rank}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
