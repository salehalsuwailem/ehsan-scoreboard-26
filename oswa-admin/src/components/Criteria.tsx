import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { Criterion, CriterionKind, StaffProfile } from "../lib/types";

const KIND_LABEL: Record<CriterionKind, string> = { bonus: "يُضاف", deduction: "يُطرح", score: "نقاط مباشرة" };

function CriterionForm({ initial, onDone, onCancel }: { initial: Criterion; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial.name);
  const [kind, setKind] = useState<CriterionKind>(initial.kind);
  const [msg, setMsg] = useState("");

  const save = async () => {
    if (!name.trim()) return setMsg("اكتب اسم البند");
    const { error } = await supabase.from("criteria").update({ name: name.trim(), kind }).eq("id", initial.id);
    if (error) setMsg(error.message);
    else onDone();
  };

  return (
    <div className="requestForm">
      <input placeholder="اسم البند" value={name} onChange={(e) => setName(e.target.value)} />
      <select value={kind} onChange={(e) => setKind(e.target.value as CriterionKind)}>
        <option value="score">نقاط مباشرة</option>
        <option value="bonus">بونص (يُضاف)</option>
        <option value="deduction">خصم (يُطرح)</option>
      </select>
      <button className="primary" onClick={save}>
        حفظ
      </button>
      <button onClick={onCancel}>إلغاء</button>
      {msg && <small>{msg}</small>}
    </div>
  );
}

export function Criteria({ profile, criteria, termId, onChanged }: { profile: StaffProfile; criteria: Criterion[]; termId: string; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Criterion | null>(null);
  const isManager = profile.role === "manager";

  const toggleActive = async (c: Criterion) => {
    await supabase.from("criteria").update({ is_active: !c.is_active }).eq("id", c.id);
    onChanged();
  };

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <h2>بنود النقاط</h2>
          <p>البنود الأساسية لهذا الفصل.</p>
        </div>
        {isManager && (
          <button className="primary" onClick={() => setAdding(true)}>
            + إضافة بند
          </button>
        )}
      </div>
      {isManager && adding && (
        <div style={{ padding: "0 22px 18px" }}>
          <AddCriterionForm
            termId={termId}
            onDone={() => {
              setAdding(false);
              onChanged();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}
      {isManager && editing && (
        <div style={{ padding: "0 22px 18px" }}>
          <CriterionForm
            initial={editing}
            onDone={() => {
              setEditing(null);
              onChanged();
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
      <div className="cards">
        {criteria.map((c) => (
          <div className="card" key={c.id}>
            <div>
              <b>{c.name}</b>
              <small>{KIND_LABEL[c.kind]}</small>
            </div>
            {isManager && (
              <div>
                <button onClick={() => setEditing(c)}>تعديل</button>
                <button onClick={() => toggleActive(c)}>{c.is_active ? "تعطيل" : "تفعيل"}</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// Separate from CriterionForm's edit path because creating a NEW criterion
// needs term_id (never implied on an edit, since it can't change term).
function AddCriterionForm({ termId, onDone, onCancel }: { termId: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CriterionKind>("score");
  const [msg, setMsg] = useState("");

  const save = async () => {
    if (!name.trim()) return setMsg("اكتب اسم البند");
    const { error } = await supabase.from("criteria").insert({ name: name.trim(), kind, term_id: termId });
    if (error) setMsg(error.message);
    else onDone();
  };

  return (
    <div className="requestForm">
      <input placeholder="اسم البند" value={name} onChange={(e) => setName(e.target.value)} />
      <select value={kind} onChange={(e) => setKind(e.target.value as CriterionKind)}>
        <option value="score">نقاط مباشرة</option>
        <option value="bonus">بونص (يُضاف)</option>
        <option value="deduction">خصم (يُطرح)</option>
      </select>
      <button className="primary" onClick={save}>
        حفظ
      </button>
      <button onClick={onCancel}>إلغاء</button>
      {msg && <small>{msg}</small>}
    </div>
  );
}
