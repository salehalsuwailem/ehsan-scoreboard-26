import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { Criterion, CriterionKind, Group, StaffProfile } from "../lib/types";

const KIND_LABEL: Record<CriterionKind, string> = { bonus: "يُضاف", deduction: "يُطرح", score: "نقاط مباشرة" };

// Manager can touch anything. A supervisor can only touch a criterion
// that's scoped to their own group -- never a global one, never another
// group's. Mirrors the server-side RLS exactly (criteria.group_id =
// current_staff_group_id()) so the UI never offers a control the DB would
// reject.
function canEdit(profile: StaffProfile, c: Criterion) {
  return profile.role === "manager" || (c.group_id !== null && c.group_id === profile.group_id);
}

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

export function Criteria({
  profile,
  groups,
  criteria,
  termId,
  onChanged,
}: {
  profile: StaffProfile;
  groups: Group[];
  criteria: Criterion[];
  termId: string;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Criterion | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isManager = profile.role === "manager";
  const canAdd = isManager || !!profile.group_id;

  // One shared ordering space across every criterion (global and
  // group-scoped alike) -- this is what both the entry table's columns
  // and this grid's card order follow, so "move up/down" here is exactly
  // "move left/right" there.
  const sorted = [...criteria].sort((a, b) => a.sort_order - b.sort_order);

  const toggleActive = async (c: Criterion) => {
    await supabase.from("criteria").update({ is_active: !c.is_active }).eq("id", c.id);
    onChanged();
  };

  // Moves a single row to sit between its two new neighbours by giving it
  // the midpoint of their sort_order -- never touches the neighbours'
  // rows, which is what lets a supervisor reorder their own item past a
  // global one they otherwise can't edit (RLS only ever sees a write to
  // the one row they own).
  const move = async (c: Criterion, dir: "up" | "down") => {
    const idx = sorted.findIndex((x) => x.id === c.id);
    if (dir === "up" && idx <= 0) return;
    if (dir === "down" && idx >= sorted.length - 1) return;
    let newOrder: number;
    if (dir === "up") {
      const before = sorted[idx - 2]?.sort_order;
      const after = sorted[idx - 1].sort_order;
      newOrder = before === undefined ? after - 1 : (before + after) / 2;
    } else {
      const before = sorted[idx + 1].sort_order;
      const after = sorted[idx + 2]?.sort_order;
      newOrder = after === undefined ? before + 1 : (before + after) / 2;
    }
    setBusyId(c.id);
    await supabase.from("criteria").update({ sort_order: newOrder }).eq("id", c.id);
    setBusyId(null);
    onChanged();
  };

  const scopeLabel = (c: Criterion) => (c.group_id ? groups.find((g) => g.id === c.group_id)?.name || "فئة" : "عام لكل الفئات");

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <h2>بنود النقاط</h2>
          <p>البنود الأساسية لهذا الفصل.</p>
        </div>
        {canAdd && (
          <button className="primary" onClick={() => setAdding(true)}>
            + إضافة بند
          </button>
        )}
      </div>
      {canAdd && adding && (
        <div style={{ padding: "0 22px 18px" }}>
          <AddCriterionForm
            termId={termId}
            groups={groups}
            isManager={isManager}
            myGroupId={profile.group_id}
            nextSortOrder={(sorted[sorted.length - 1]?.sort_order ?? 0) + 1}
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
        {sorted.map((c, i) => {
          const editable = canEdit(profile, c);
          return (
            <div className={"card criterionCard" + (c.is_active ? "" : " inactive")} key={c.id}>
              <div className="criterionTop">
                <div>
                  <b>{c.name}</b>
                  <small>{KIND_LABEL[c.kind]}</small>
                  <span className={"criterionScope" + (c.group_id ? " own" : "")}>{scopeLabel(c)}</span>
                </div>
              </div>
              {editable && (
                <div className="criterionActions">
                  <button
                    className="moveBtn"
                    disabled={i === 0 || busyId === c.id}
                    onClick={() => move(c, "up")}
                    title="تحريك لأعلى"
                  >
                    ▲
                  </button>
                  <button
                    className="moveBtn"
                    disabled={i === sorted.length - 1 || busyId === c.id}
                    onClick={() => move(c, "down")}
                    title="تحريك لأسفل"
                  >
                    ▼
                  </button>
                  <button onClick={() => setEditing(c)}>تعديل</button>
                  <button onClick={() => toggleActive(c)}>{c.is_active ? "تعطيل" : "تفعيل"}</button>
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && <div className="empty">لا توجد بنود بعد.</div>}
      </div>
    </section>
  );
}

// Separate from CriterionForm's edit path because creating a NEW criterion
// needs term_id and an initial group scope (neither ever changes on an
// edit, since a criterion's term/ownership shouldn't move after creation).
function AddCriterionForm({
  termId,
  groups,
  isManager,
  myGroupId,
  nextSortOrder,
  onDone,
  onCancel,
}: {
  termId: string;
  groups: Group[];
  isManager: boolean;
  myGroupId: string | null;
  nextSortOrder: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CriterionKind>("score");
  const [scopeGroupId, setScopeGroupId] = useState(""); // manager only; "" = عام لكل الفئات
  const [msg, setMsg] = useState("");

  const save = async () => {
    if (!name.trim()) return setMsg("اكتب اسم البند");
    const group_id = isManager ? scopeGroupId || null : myGroupId;
    const { error } = await supabase
      .from("criteria")
      .insert({ name: name.trim(), kind, term_id: termId, group_id, sort_order: nextSortOrder });
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
      {isManager ? (
        <select value={scopeGroupId} onChange={(e) => setScopeGroupId(e.target.value)}>
          <option value="">عام لكل الفئات</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              خاص بفئة: {g.name}
            </option>
          ))}
        </select>
      ) : (
        <small>سيُضاف هذا البند لفئتك فقط -- لن يظهر عند الفئات الأخرى.</small>
      )}
      <button className="primary" onClick={save}>
        حفظ
      </button>
      <button onClick={onCancel}>إلغاء</button>
      {msg && <small>{msg}</small>}
    </div>
  );
}
