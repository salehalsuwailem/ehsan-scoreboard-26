import { data, getAward, getGroupName } from "@/lib/data";
import { fmtPct } from "@/lib/format";
import { ar } from "@/lib/i18n";
import { Card } from "@/components/ui";
import { SectionTitle } from "@/components/shared";
import { AwardCard, StatCard } from "@/components/cards";
import { IconClock, IconTrendingUp } from "@/components/Icons";

/** ترتيب البطاقات كما طُلب: حضور، رياضي، مشروع، إعلام، خواطر، ورش، تطوّر، أعلى نتيجة. */
const AWARD_ORDER: { id: string; label: string }[] = [
  { id: "bestAttendance", label: ar.statistics.bestAttendance },
  { id: "bestSports", label: ar.statistics.bestCompetition },
  { id: "bestProject", label: ar.statistics.bestProject },
  { id: "bestMedia", label: ar.statistics.bestMedia },
  { id: "bestReflection", label: ar.statistics.bestReflection },
  { id: "bestWorkshop", label: ar.statistics.bestWorkshop },
];

export function Statistics() {
  const mostImproved = getAward("mostImproved");

  return (
    <div className="container-site py-10">
      <SectionTitle title={ar.statistics.title} subtitle={ar.statistics.subtitle} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AWARD_ORDER.map(({ id, label }) => {
          const award = getAward(id);
          if (!award) return null;
          return (
            <AwardCard
              key={id}
              award={{ ...award, titleAr: label }}
              groupName={getGroupName(award.groupId)}
            />
          );
        })}

        {/* الأكثر تطوّراً — يحتاج لقطتي مزامنة على الأقل */}
        {mostImproved ? (
          <AwardCard award={mostImproved} groupName={getGroupName(mostImproved.groupId)} />
        ) : (
          <Card className="h-full border-dashed bg-muted/40 shadow-none">
            <div className="flex items-center gap-4 p-5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                aria-hidden
              >
                <IconClock className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-caption text-muted-foreground">{ar.statistics.mostImproved}</p>
                <p className="font-bold text-muted-foreground">{ar.statistics.pendingImproved}</p>
              </div>
            </div>
          </Card>
        )}

        {/* أعلى نتيجة */}
        <StatCard
          label={ar.statistics.highestScore}
          value={fmtPct(data.stats.highestPct)}
          hint={getGroupName(data.stats.leaderGroupId)}
          icon={<IconTrendingUp />}
          tone="success"
        />
      </div>
    </div>
  );
}
