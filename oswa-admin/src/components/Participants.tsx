import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Group, Participant, StaffProfile } from "../lib/types";

const GRADES = [3, 4, 5, 6, 7, 8];

function ParticipantForm({
  initial,
  groups,
  defaultGroupId,
  onDone,
  onCancel,
}: {
  initial?: Participant;
  groups: Group[];
  defaultGroupId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [grade, setGrade] = useState(initial?.grade ?? 3);
  const [groupId, setGroupId] = useState(initial?.group_id ?? defaultGroupId);
  const [msg, setMsg] = useState("");
  const canChangeGroup = groups.length > 1;

  const save = async () => {
    if (!name.trim()) return setMsg("اكتب اسم المغامر");
    const payload = { name: name.trim(), grade, group_id: groupId };
    const { error } = initial
      ? await supabase.from("participants").update(payload).eq("id", initial.id)
      : await supabase.from("participants").insert(payload);
    if (error) setMsg(error.message);
    else onDone();
  };

  return (
    <div className="requestForm">
      <input placeholder="اسم المغامر" value={name} onChange={(e) => setName(e.target.value)} />
      <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
        {GRADES.map((g) => (
          <option key={g} value={g}>
            الصف {g}
          </option>
        ))}
      </select>
      {canChangeGroup && (
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      )}
      <button className="primary" onClick={save}>
        حفظ
      </button>
      <button onClick={onCancel}>إلغاء</button>
      {msg && <small>{msg}</small>}
    </div>
  );
}

export function Participants({
  profile,
  groups,
  participants,
  onChanged,
}: {
  profile: StaffProfile;
  groups: Group[];
  participants: Participant[];
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Participant | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const visible = useMemo(() => participants.filter((p) => p.is_active !== showArchived), [participants, showArchived]);
  const defaultGroupId = profile.role === "supervisor" && profile.group_id ? profile.group_id : groups[0]?.id ?? "";

  const archive = async (p: Participant, active: boolean) => {
    await supabase.from("participants").update({ is_active: active }).eq("id", p.id);
    onChanged();
  };

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <h2>المغامرون</h2>
          <p>إضافة وتعديل وأرشفة حسب صلاحيتك.</p>
        </div>
        <div className="filters">
          <label>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> إظهار المؤرشفين
          </label>
          <button className="primary" onClick={() => setAdding(true)}>
            + إضافة مغامر
          </button>
        </div>
      </div>
      {adding && (
        <div style={{ padding: "0 22px 18px" }}>
          <ParticipantForm
            groups={groups}
            defaultGroupId={defaultGroupId}
            onDone={() => {
              setAdding(false);
              onChanged();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}
      {editing && (
        <div style={{ padding: "0 22px 18px" }}>
          <ParticipantForm
            initial={editing}
            groups={groups}
            defaultGroupId={defaultGroupId}
            onDone={() => {
              setEditing(null);
              onChanged();
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
      <div className="cards">
        {visible.map((p) => (
          <div className="card" key={p.id}>
            <div>
              <b>{p.name}</b>
              <small>الصف {p.grade}</small>
            </div>
            <div>
              <button onClick={() => setEditing(p)}>تعديل</button>
              <button onClick={() => archive(p, !p.is_active)}>{p.is_active ? "إخفاء" : "إظهار"}</button>
            </div>
          </div>
        ))}
        {visible.length === 0 && <div className="empty">لا يوجد مغامرون لعرضهم.</div>}
      </div>
    </section>
  );
}
