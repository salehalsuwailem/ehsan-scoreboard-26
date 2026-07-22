import type { CulturalStage, FootballRound } from "@/types";
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

/** بطاقة منافسة قائمة على الجولات (كرة القدم وكرة الطائرة — نفس التخطيط). */
function RoundsCard({
  title,
  rankInComp,
  scorePct,
  pct,
  maxPct,
  rounds,
}: {
  title: string;
  rankInComp: number;
  scorePct: number;
  pct: number;
  maxPct: number;
  rounds: FootballRound[];
}) {
  return (
    <Card className="h-full">
      <div className="space-y-4 p-5">
        <CompHeader title={title} rank={rankInComp} />
        <div className="space-y-2">
          <ScoreLine scorePct={scorePct} maxPct={maxPct} />
          <ProgressBar pct={pct} label={title} />
        </div>
        <ul className="grid grid-cols-2 gap-2 text-caption">
          {rounds.map((round, i) => {
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
  );
}

/** مرحلة داخل مسابقة ثقافية: الحالة (فائز/خاسر) والنقاط من الحد الأعلى. */
function StageRow({ title, stage }: { title: string; stage: CulturalStage }) {
  const played = stage.points > 0;
  const won = stage.points >= stage.maxPoints;
  return (
    <div className="rounded-field border bg-muted/40 p-2.5">
      <p className="font-bold text-foreground">{title}</p>
      {played ? (
        <>
          <p className={cn("font-semibold", won ? "text-success" : "text-destructive")}>
            {won ? ar.competitions.won : ar.competitions.lost}
          </p>
          <p className="text-muted-foreground tabular">
            {stage.points} {ar.group.outOf} {stage.maxPoints} {ar.competitions.points}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">{ar.competitions.notPlayed}</p>
      )}
    </div>
  );
}

/** نتائج المجموعة في المنافسات الثلاث — كما هي محسوبة في Google Sheets. */
export function GroupCompetitions({ groupId }: { groupId: string }) {
  const { football, volleyball, cultural } = data.competitions;
  const fb = football.perGroup.find((e) => e.groupId === groupId);
  const vb = volleyball.perGroup.find((e) => e.groupId === groupId);
  const cu = cultural.perGroup.find((e) => e.groupId === groupId);

  if (!fb || !vb || !cu) return null;

  // حماية من أي بيانات قديمة الشكل ريثما تُعاد المزامنة (لا تعطيل للصفحة).
  const fbRounds = fb.rounds ?? [];
  const vbRounds = vb.rounds ?? [];
  const contest1 =
    cu.contest1 ?? { stageA: { points: 0, maxPoints: 3 }, stageB: { points: 0, maxPoints: 2 } };
  const contest2 = cu.contest2 ?? { position: 0, points: 0 };
  const contest2Played = contest2.position > 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* كرة القدم — أربع جولات */}
      <RoundsCard
        title={ar.competitions.football}
        rankInComp={fb.rankInComp}
        scorePct={fb.scorePct}
        pct={fb.pct}
        maxPct={football.weightPct}
        rounds={fbRounds}
      />

      {/* كرة الطائرة — ثلاث جولات (نفس تخطيط كرة القدم) */}
      <RoundsCard
        title={ar.competitions.volleyball}
        rankInComp={vb.rankInComp}
        scorePct={vb.scorePct}
        pct={vb.pct}
        maxPct={volleyball.weightPct}
        rounds={vbRounds}
      />

      {/* المسابقة الثقافية — مسابقة ١ (مرحلتان) + مسابقة ٢ */}
      <Card className="h-full">
        <div className="space-y-4 p-5">
          <CompHeader title={ar.competitions.cultural} rank={cu.rankInComp} />
          <ScoreLine scorePct={cu.scorePct} maxPct={cultural.weightPct} />

          <div className="space-y-2">
            <p className="text-caption font-bold text-muted-foreground">{ar.competitions.contest1}</p>
            <div className="grid grid-cols-2 gap-2 text-caption">
              <StageRow title={ar.competitions.familyFeud} stage={contest1.stageA} />
              <StageRow title={ar.competitions.guessImage} stage={contest1.stageB} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-caption font-bold text-muted-foreground">{ar.competitions.contest2}</p>
            <div
              className={cn(
                "rounded-field border p-2.5 text-caption",
                contest2Played ? "bg-muted/40" : "border-dashed text-muted-foreground"
              )}
            >
              {contest2Played ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {ar.competitions.position}: {rankLabel(contest2.position)}
                  </span>
                  <span className="text-muted-foreground tabular">
                    {contest2.points} {ar.competitions.points}
                  </span>
                </div>
              ) : (
                <p>{ar.competitions.notPlayed}</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
