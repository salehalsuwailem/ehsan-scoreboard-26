import { data } from "@/lib/data";
import { fmtPct, rankLabel } from "@/lib/format";
import { ar } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui";
import { MedalBadge, ProgressBar } from "@/components/shared";

/** رأس مشترك لبطاقة منافسة: الاسم + مركز المجموعة داخل المنافسة. */
function CompHeader({ title, rank }: { title: string; rank: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="font-bold text-foreground">{title}</h3>
      <MedalBadge rank={rank} />
    </div>
  );
}

function ScoreLine({ scorePct, maxPct }: { scorePct: number; maxPct: number }) {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="text-lg font-extrabold text-primary tabular">{fmtPct(scorePct)}</span>{" "}
      {ar.group.outOf} <span className="tabular">{fmtPct(maxPct)}</span>
    </p>
  );
}

/** نتائج المجموعة في المنافسات الثلاث — كما هي محسوبة في الإكسل. */
export function GroupCompetitions({ groupId }: { groupId: string }) {
  const { football, volleyball, cultural } = data.competitions;
  const fb = football.perGroup.find((e) => e.groupId === groupId);
  const vb = volleyball.perGroup.find((e) => e.groupId === groupId);
  const cu = cultural.perGroup.find((e) => e.groupId === groupId);

  if (!fb || !vb || !cu) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* كرة القدم — أربع جولات */}
      <Card className="h-full">
        <div className="space-y-4 p-5">
          <CompHeader title={ar.competitions.football} rank={fb.rankInComp} />
          <div className="space-y-2">
            <ScoreLine scorePct={fb.scorePct} maxPct={football.weightPct} />
            <ProgressBar pct={fb.pct} label={ar.competitions.football} />
          </div>
          <ul className="grid grid-cols-2 gap-2 text-caption">
            {fb.rounds.map((round, i) => {
              const played = round.maxPoints > 0;
              return (
                <li
                  key={i}
                  className={cn(
                    "rounded-field border p-2.5",
                    played ? "bg-muted/40" : "border-dashed text-muted-foreground"
                  )}
                >
                  <p className="font-bold text-foreground">
                    {ar.competitions.round} {i + 1}
                  </p>
                  {played ? (
                    <>
                      <p className="tabular">
                        {round.points} {ar.competitions.points}
                      </p>
                      <p className="text-muted-foreground tabular">
                        {round.w} {ar.competitions.wins} · {round.d} {ar.competitions.draws} · {round.l}{" "}
                        {ar.competitions.losses}
                      </p>
                    </>
                  ) : (
                    <p>{ar.empty.noDataHint}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Card>

      {/* كرة الطائرة — جولتان */}
      <Card className="h-full">
        <div className="space-y-4 p-5">
          <CompHeader title={ar.competitions.volleyball} rank={vb.rankInComp} />
          <div className="space-y-2">
            <ScoreLine scorePct={vb.scorePct} maxPct={volleyball.weightPct} />
            <ProgressBar pct={vb.pct} label={ar.competitions.volleyball} />
          </div>
          <ul className="grid grid-cols-2 gap-2 text-caption">
            <li className="rounded-field border bg-muted/40 p-2.5">
              <p className="font-bold text-foreground">{ar.competitions.round} 1</p>
              <p className="tabular">
                {vb.round1.points} {ar.competitions.points}
              </p>
              <p className="text-muted-foreground tabular">
                {vb.round1.w} {ar.competitions.wins} · {vb.round1.d} {ar.competitions.draws} · {vb.round1.l}{" "}
                {ar.competitions.losses}
              </p>
            </li>
            <li className="rounded-field border bg-muted/40 p-2.5">
              <p className="font-bold text-foreground">{ar.competitions.round} 2</p>
              <p className="tabular">
                {vb.round2Points} {ar.competitions.points}
              </p>
            </li>
          </ul>
        </div>
      </Card>

      {/* المسابقة الثقافية — مسابقتان */}
      <Card className="h-full">
        <div className="space-y-4 p-5">
          <CompHeader title={ar.competitions.cultural} rank={cu.rankInComp} />
          <ScoreLine scorePct={cu.scorePct} maxPct={cultural.weightPct} />
          <ul className="grid grid-cols-2 gap-2 text-caption">
            {cu.contests.map((contest, i) => {
              const held = contest.position > 0;
              return (
                <li
                  key={i}
                  className={cn(
                    "rounded-field border p-2.5",
                    held ? "bg-muted/40" : "border-dashed text-muted-foreground"
                  )}
                >
                  <p className="font-bold text-foreground">
                    {ar.competitions.contest} {i + 1}
                  </p>
                  {held ? (
                    <>
                      <p>
                        {ar.competitions.position}: {rankLabel(contest.position)}
                      </p>
                      <p className="text-muted-foreground tabular">
                        {contest.points} {ar.competitions.points}
                      </p>
                    </>
                  ) : (
                    <p>{ar.empty.noDataHint}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Card>
    </div>
  );
}
