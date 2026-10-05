import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Criterion, Group, Participant, Score, StaffProfile } from "../lib/types";
import { computeTotal, rankByTotal, scoreValue } from "../lib/ranking";

const GRADES = [3, 4, 5, 6, 7, 8];

export function Board({
  profile,
  groups,
  participants,
  criteria,
  scores,
  onScoreSaved,
  onOpenParticipant,
}: {
  profile: StaffProfile;
  groups: Group[];
  participants: Participant[];
  criteria: Criterion[];
  scores: Score[];
  onScoreSaved: (score: Score) => void;
  onOpenParticipant: (p: Participant) => void;
}) {
  const [groupFilter, setGroupFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  const criteriaById = useMemo(() => new Map(criteria.map((c) => [c.id, c])), [criteria]);

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

  const ranked = useMemo(() => {
    const withTotals = filtered.map((p) => ({ ...p, total: computeTotal(p.id, scores, criteriaById) }));
    return rankByTotal(withTotals);
  }, [filtered, scores, criteriaById]);

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

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <h2>لوحة النتائج</h2>
          <p>البونص يُضاف والخصم يُطرح تلقائيًا.</p>
        </div>
        <div className="filters">
          {profile.role === "manager" && (
            <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
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
            {GRADES.map((g) => (
              <option key={g} value={g}>
                الصف {g}
              </option>
            ))}
          </select>
          <input placeholder="بحث…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      {msg && <div className="error">{msg}</div>}
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
            {ranked.map((p) => (
              <tr key={p.id}>
                <td className={rankClass(p.rank)}>{p.rank}</td>
                <td className="name">
                  <button className="link" onClick={() => onOpenParticipant(p)}>
                    {p.name}
                  </button>
                </td>
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
    </section>
  );
}
