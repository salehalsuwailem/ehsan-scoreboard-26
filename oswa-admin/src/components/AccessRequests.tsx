import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { AccessRequest, Group, StaffProfile } from "../lib/types";

// There used to be TWO definitions of this component in the old App.tsx —
// the second silently shadowed the first (losing the manager-claim prompt
// entirely, since only the second one's body ever ran). This is the single,
// de-duplicated version, combining the first's "claim manager" prompt with
// the fully-working request/review flow both copies shared.
export function AccessRequests({
  profile,
  groups,
  onClaim,
}: {
  profile: StaffProfile | null;
  groups: Group[];
  onClaim: () => void;
}) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    if (profile?.role !== "manager") return;
    const r = await supabase
      .from("staff_access_requests")
      .select("id,user_id,email,display_name,requested_group_id,status")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRequests((r.data as AccessRequest[]) || []);
  };

  useEffect(() => {
    load();
  }, [profile?.role]);

  if (!profile) {
    return (
      <section className="accessRequest panel">
        <h3>تفعيل حساب المدير</h3>
        <p>هذا الحساب هو أول حساب للنظام. فعّله كحساب المدير الرئيسي.</p>
        <button className="primary" onClick={onClaim}>
          تفعيل كمدير
        </button>
      </section>
    );
  }

  const submit = async () => {
    const g = group || groups[0]?.id;
    if (!g || !name.trim()) return setMsg("اكتب الاسم واختر الفئة");
    const { error } = await supabase.rpc("submit_staff_access_request", { p_group_id: g, p_display_name: name.trim() });
    setMsg(error ? error.message : "تم إرسال طلبك للمدير");
    if (!error) {
      setName("");
      setGroup("");
    }
  };

  const review = async (id: string, action: "approve" | "reject", gid?: string) => {
    const { error } = await supabase.rpc("review_staff_access_request", { p_request_id: id, p_action: action, p_group_id: gid || null });
    if (error) setMsg(error.message);
    else load();
  };

  if (profile.role !== "manager") {
    return (
      <section className="accessRequest panel">
        <h3>طلب صلاحية مشرف</h3>
        <p>اختر الفئة وأرسل الطلب للمدير لاعتماده.</p>
        <div className="requestForm">
          <input placeholder="اسمك" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">اختر الفئة</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button className="primary" onClick={submit}>
            إرسال الطلب
          </button>
        </div>
        {msg && <small>{msg}</small>}
      </section>
    );
  }

  return (
    <section className="accessRequest panel">
      <div className="toolbar">
        <div>
          <h3>طلبات الانضمام</h3>
          <p>اعتمد المشرفين وحدد فئتهم قبل منح الصلاحية.</p>
        </div>
        <span className="pill">{requests.length} طلب</span>
      </div>
      {requests.length === 0 ? (
        <div className="empty">لا توجد طلبات معلقة.</div>
      ) : (
        <div className="requestList">
          {requests.map((r) => (
            <div className="requestRow" key={r.id}>
              <div>
                <b>{r.display_name || "بدون اسم"}</b>
                <small>{r.email}</small>
              </div>
              <select defaultValue={r.requested_group_id || ""} id={"g-" + r.id}>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <button
                className="primary"
                onClick={() => {
                  const e = document.getElementById("g-" + r.id) as HTMLSelectElement;
                  review(r.id, "approve", e.value);
                }}
              >
                قبول
              </button>
              <button onClick={() => review(r.id, "reject")}>رفض</button>
            </div>
          ))}
        </div>
      )}
      {msg && <small>{msg}</small>}
    </section>
  );
}
