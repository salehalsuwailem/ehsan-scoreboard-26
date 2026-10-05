import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { Participant, Recognition, RecognitionType } from "../lib/types";

const TYPE_LABEL: Record<RecognitionType, string> = {
  adventurer_of_week: "مغامر الأسبوع",
  best_reflection: "أفضل خاطرة",
  best_player: "أفضل لاعب",
};

// "مغامر الأسبوع" و"أفضل خاطرة" أسبوعيان (week_date)، و"أفضل لاعب" مرتبط
// بحدث كرة قدم وليس أسبوعيًا بشكل تلقائي (event_date) — نفس تمييز
// week_date/event_date الموجود أصلًا في جدول recognitions.
const WEEKLY_TYPES: RecognitionType[] = ["adventurer_of_week", "best_reflection"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function RecognitionForm({
  participants,
  termId,
  onDone,
  onCancel,
}: {
  participants: Participant[];
  termId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<RecognitionType>("adventurer_of_week");
  const [participantId, setParticipantId] = useState(participants[0]?.id ?? "");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const isWeekly = WEEKLY_TYPES.includes(type);

  const save = async () => {
    if (!participantId) return setMsg("اختر المغامر");
    const payload = {
      term_id: termId,
      participant_id: participantId,
      type,
      week_date: isWeekly ? date : null,
      event_date: isWeekly ? null : date,
      note: note.trim() || null,
    };
    const { error } = await supabase.from("recognitions").insert(payload);
    if (error) setMsg(error.message);
    else onDone();
  };

  return (
    <div className="requestForm">
      <select value={type} onChange={(e) => setType(e.target.value as RecognitionType)}>
        {Object.entries(TYPE_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select value={participantId} onChange={(e) => setParticipantId(e.target.value)}>
        {participants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <input placeholder="ملاحظة (اختياري)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="primary" onClick={save}>
        حفظ
      </button>
      <button onClick={onCancel}>إلغاء</button>
      {msg && <small>{msg}</small>}
    </div>
  );
}

export function Recognitions({
  participants,
  recognitions,
  termId,
  onChanged,
}: {
  participants: Participant[];
  recognitions: Recognition[];
  termId: string;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const nameById = new Map(participants.map((p) => [p.id, p.name]));

  const remove = async (r: Recognition) => {
    await supabase.from("recognitions").delete().eq("id", r.id);
    onChanged();
  };

  const sorted = [...recognitions].sort((a, b) => (b.week_date || b.event_date || "").localeCompare(a.week_date || a.event_date || ""));

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <h2>التكريمات</h2>
          <p>مغامر الأسبوع، أفضل خاطرة، وأفضل لاعب — ضمن نطاق صلاحيتك.</p>
        </div>
        <button className="primary" onClick={() => setAdding(true)}>
          + تكريم جديد
        </button>
      </div>
      {adding && (
        <div style={{ padding: "0 22px 18px" }}>
          <RecognitionForm
            participants={participants}
            termId={termId}
            onDone={() => {
              setAdding(false);
              onChanged();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}
      <div className="cards">
        {sorted.map((r) => (
          <div className="card" key={r.id}>
            <div>
              <b>{nameById.get(r.participant_id) ?? "—"}</b>
              <small>
                {TYPE_LABEL[r.type]} · {r.week_date || r.event_date || ""}
                {r.note ? ` · ${r.note}` : ""}
              </small>
            </div>
            <div>
              <button onClick={() => remove(r)}>حذف</button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="empty">لا توجد تكريمات بعد.</div>}
      </div>
    </section>
  );
}
