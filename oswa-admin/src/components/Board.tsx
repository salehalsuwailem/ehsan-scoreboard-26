import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Criterion, Group, Participant, Score, StaffProfile } from "../lib/types";
import { computeTotal, rankByTotal, scoreValue, signedContribution } from "../lib/ranking";

type RankedParticipant = Participant & { total: number; rank: number };

export function Board({
  profile,
  groups,
  participants,
  criteria,
  scores,
  onScoreSaved,
}: {
  profile: StaffProfile;
  groups: Group[];
  participants: Participant[];
  criteria: Criterion[];
  scores: Score[];
  onScoreSaved: (score: Score) => void;
}) {
  const [view, setView] = useState<"entry" | "results">("entry");
  const [groupFilter, setGroupFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const criteriaById = useMemo(() => new Map(criteria.map((c) => [c.id, c])), [criteria]);

  // Only the grades that actually exist within the currently selected group
  // (and, for a supervisor, participants are already RLS-scoped to their
  // own group) -- not a hardcoded 3..8, so nobody is offered grades that
  // don't apply to what they're looking at.
  const availableGrades = useMemo(() => {
    const scoped = participants.filter((p) => groupFilter === "all" || p.group_id === groupFilter);
    return [...new Set(scoped.map((p) => p.grade))].sort((a, b) => a - b);
  }, [participants, groupFilter]);

  const filtered = useMemo(
    () =>
      participants.filter(
        (p) =>
          (groupFilter === "all" || p.group_id === groupFilter) &&
          (gradeFilter === "all" || String(p.grade) === gradeFilter) &&
          (!search.trim() || p.name.includes(search.trim())),
      ),
    [participants, groupFilter, gradeFilter, search],
  );

  // Ranked once here (by total, competition-style) and reused by both views —
  // the entry table below displays this same rank number/color per row, it
  // just doesn't reorder rows by it (see entryRows).
  const ranked = useMemo((): RankedParticipant[] => {
    const withTotals = filtered.map((p) => ({ ...p, total: computeTotal(p.id, scores, criteriaById) }));
    return rankByTotal(withTotals);
  }, [filtered, scores, criteriaById]);

  // A fixed order (grade, then name) for the data-entry table, so a row
  // never jumps while someone is mid-way through typing scores for a list
  // top to bottom — only the rank badge/number updates in place.
  const entryRows = useMemo(
    () => [...ranked].sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, "ar")),
    [ranked],
  );

  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  const saveScore = async (participantId: string, criterionId: string, raw: string) => {
    const value = raw.trim() === "" ? 0 : Number(raw);
    if (!Number.isFinite(value) || value < 0) return;
    // Upsert on the DB's own unique(participant_id, criterion_id) index —
    // this is what actually prevents duplicate score rows, not anything
    // the client has to track; always exactly one row per pair.
    const { data, error } = await supabase
      .from("scores")
      .upsert({ participant_id: participantId, criterion_id: criterionId, value }, { onConflict: "participant_id,criterion_id" })
      .select("id,participant_id,criterion_id,value,note")
      .single();
    if (error) setMsg(error.message);
    else if (data) onScoreSaved(data as Score);
  };

  const rankClass = (rank: number) => (rank === 1 ? "rank1" : rank === 2 ? "rank2" : rank === 3 ? "rank3" : "");

  const podium = {
    first: ranked.filter((p) => p.rank === 1),
    second: ranked.filter((p) => p.rank === 2),
    third: ranked.filter((p) => p.rank === 3),
  };

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <h2>{view === "entry" ? "إدخال النقاط" : "لوحة النتائج"}</h2>
          <p>{view === "entry" ? "البونص يُضاف والخصم يُطرح تلقائيًا." : "الترتيب والتفاصيل لكل مغامر."}</p>
        </div>
        <div className="filters">
          <div className="viewToggle">
            <button className={view === "entry" ? "active" : ""} onClick={() => setView("entry")}>
              إدخال النقاط
            </button>
            <button className={view === "results" ? "active" : ""} onClick={() => setView("results")}>
              النتائج
            </button>
          </div>
          {profile.role === "manager" && (
            <select
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setGradeFilter("all");
              }}
            >
              <option value="all">كل الفئات</option>
              {groups.map((g) => (
                <option value={g.id} key={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option value="all">كل الصفوف</option>
            {availableGrades.map((g) => (
              <option key={g} value={g}>
                الصف {g}
              </option>
            ))}
          </select>
          <input placeholder="بحث…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      {msg && <div className="error">{msg}</div>}

      {view === "entry" && (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>المغامر</th>
                <th>الصف</th>
                {criteria.map((c) => (
                  <th key={c.id}>{c.name}</th>
                ))}
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {entryRows.map((p) => (
                <tr key={p.id}>
                  <td className={rankClass(p.rank)}>{p.rank}</td>
                  <td className="name">{p.name}</td>
                  <td>{p.grade}</td>
                  {criteria.map((c) => (
                    <td key={c.id}>
                      <input
                        type="number"
                        min="0"
                        defaultValue={scoreValue(p.id, c.id, scores) ?? ""}
                        onBlur={(e) => saveScore(p.id, c.id, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="total">{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "results" && (
        <div className="results">
          <div className="podium">
            <PodiumTile people={podium.second} cls="silver" label="الثاني" />
            <PodiumTile people={podium.first} cls="gold" label="الأول" tall />
            <PodiumTile people={podium.third} cls="bronze" label="الثالث" />
          </div>
          <div className="resultsList">
            {ranked.map((p) => {
              const g = groupById.get(p.group_id);
              const open = openId === p.id;
              return (
                <div key={p.id} className="resultRow">
                  <button className="resultRowHead" onClick={() => setOpenId(open ? null : p.id)}>
                    <span className={"resultRank " + rankClass(p.rank)}>{p.rank}</span>
                    <span className="resultName">{p.name}</span>
                    <small>
                      الصف {p.grade} · {g?.name || ""}
                    </small>
                    <b className="resultTotal">{p.total}</b>
                  </button>
                  {open && (
                    <div className="resultDetail">
                      {criteria.map((c) => {
                        const v = scoreValue(p.id, c.id, scores);
                        if (v === null) return null;
                        const signed = signedContribution(v, c.kind);
                        return (
                          <div key={c.id} className="resultDetailRow">
                            <span>{c.name}</span>
                            <b className={signed < 0 ? "neg" : ""}>
                              {signed > 0 ? "+" : ""}
                              {signed}
                            </b>
                          </div>
                        );
                      })}
                      {criteria.every((c) => scoreValue(p.id, c.id, scores) === null) && (
                        <div className="resultDetailRow">
                          <span>لا توجد نقاط مسجّلة بعد.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {ranked.length === 0 && <div className="empty">لا يوجد مغامرون لعرضهم.</div>}
          </div>
        </div>
      )}
    </section>
  );
}

function PodiumTile({ people, cls, label, tall }: { people: RankedParticipant[]; cls: string; label: string; tall?: boolean }) {
  return (
    <div className={"podiumTile " + cls + (tall ? " tall" : "")}>
      <div className="podiumNames">
        {people.length === 0 && <span className="podiumEmpty">—</span>}
        {people.map((p) => (
          <div key={p.id}>
            <b>{p.name}</b>
            <small>{p.total} نقطة</small>
          </div>
        ))}
      </div>
      <div className="podiumBlock">{label}</div>
    </div>
  );
}
