import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import type { Criterion, Group, Participant, Recognition, Score, StaffProfile, Term } from "./lib/types";
import { Login } from "./components/Login";
import { AccessRequests } from "./components/AccessRequests";
import { Board } from "./components/Board";
import { Participants } from "./components/Participants";
import { Criteria } from "./components/Criteria";
import { Recognitions } from "./components/Recognitions";

const logo = "/logo-mughamirun.png";
const oswaLogo = "/logo-oswa.png";

type Tab = "board" | "participants" | "criteria" | "recognitions";
const TABS: [Tab, string][] = [
  ["board", "لوحة النقاط"],
  ["participants", "المغامرون"],
  ["criteria", "بنود النقاط"],
  ["recognitions", "التكريمات"],
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!sessionLoaded) return null;
  if (!session) return <Login />;
  return <Workspace key={session.user.id} />;
}

// Everything that needs the active term's data lives here, re-mounted
// fresh (via App's key={userId}) on every sign-in/out so no stale scoped
// data from a previous session ever lingers in state.
function Workspace() {
  const [profile, setProfile] = useState<StaffProfile | null | undefined>(undefined);
  const [managerExists, setManagerExists] = useState(false);
  const [term, setTerm] = useState<Term | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [tab, setTab] = useState<Tab>("board");
  const [busy, setBusy] = useState(false);

  const loadProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return setProfile(null);
    const [profileRes, existsRes] = await Promise.all([
      supabase.from("staff_profiles").select("user_id,role,group_id,display_name").eq("user_id", uid).maybeSingle(),
      supabase.rpc("manager_exists"),
    ]);
    setManagerExists(existsRes.data === true);
    setProfile((profileRes.data as StaffProfile) ?? null);
  };

  const loadData = async () => {
    setBusy(true);
    const [termRes, groupsRes, participantsRes, criteriaRes, scoresRes, recognitionsRes, staffRes] = await Promise.all([
      supabase.from("terms").select("id,name,year,is_active").eq("is_active", true).maybeSingle(),
      supabase.from("groups").select("id,term_id,name"),
      supabase.from("participants").select("id,group_id,name,grade,is_active"),
      supabase.from("criteria").select("id,term_id,name,kind,sort_order,is_active").eq("is_active", true).order("sort_order"),
      supabase.from("scores").select("id,participant_id,criterion_id,value,note,updated_by,updated_at"),
      supabase.from("recognitions").select("id,term_id,participant_id,type,week_date,event_date,note"),
      supabase.from("staff_profiles").select("user_id,role,group_id,display_name"),
    ]);
    setTerm((termRes.data as Term) ?? null);
    setGroups((groupsRes.data as Group[]) || []);
    setParticipants((participantsRes.data as Participant[]) || []);
    setCriteria((criteriaRes.data as Criterion[]) || []);
    setScores((scoresRes.data as Score[]) || []);
    setRecognitions((recognitionsRes.data as Recognition[]) || []);
    setStaff((staffRes.data as StaffProfile[]) || []);
    setBusy(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile !== undefined) loadData();
  }, [profile]);

  const claimManager = async () => {
    const { error } = await supabase.rpc("claim_first_manager");
    if (!error) await loadProfile();
  };

  const onScoreSaved = (score: Score) => {
    setScores((prev) => {
      const next = prev.filter((s) => !(s.participant_id === score.participant_id && s.criterion_id === score.criterion_id));
      next.push(score);
      return next;
    });
  };

  const activeParticipants = participants.filter((p) => p.is_active);

  if (profile === undefined) return null;

  return (
    <div>
      <header>
        <div className="motifs" aria-hidden="true">
          <span>🏀</span>
          <span>📖</span>
          <span>⚽</span>
          <span>🏊</span>
        </div>
        <div className="brand">
          <img src={logo} alt="شعار المغامرون" />
          <div>
            <b>
              <img className="oswaBadge" src={oswaLogo} alt="" /> فصل أُسوة 2026
            </b>
            {profile && <NameTag profile={profile} groups={groups} onRenamed={loadProfile} />}
          </div>
        </div>
        <div className="headActions">
          <button onClick={() => supabase.auth.signOut()}>خروج</button>
        </div>
      </header>
      <main>
        <AccessRequests
          profile={profile}
          managerExists={managerExists}
          groups={groups}
          staff={staff}
          onClaim={claimManager}
          onStaffChanged={loadData}
        />

        {profile && term && (
          <>
            <section className="hero">
              <div className="motifs" aria-hidden="true">
                <span>🎨</span>
                <span>🏀</span>
                <span>📖</span>
                <span>⚽</span>
                <span>🔬</span>
                <span>⭐</span>
              </div>
              <div>
                <small>الفصل الحالي</small>
                <h1>{term.name}</h1>
                <p>إدارة النقاط والنتائج والتكريمات.</p>
              </div>
              <div className="pill">{activeParticipants.length} مغامر</div>
            </section>

            <nav>
              {TABS.map(([id, label]) => (
                <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </nav>

            {tab === "board" && (
              <Board
                profile={profile}
                groups={groups}
                participants={activeParticipants}
                criteria={criteria}
                scores={scores}
                staff={staff}
                onScoreSaved={onScoreSaved}
              />
            )}
            {tab === "participants" && (
              <Participants profile={profile} groups={groups} participants={participants} onChanged={loadData} />
            )}
            {tab === "criteria" && <Criteria profile={profile} criteria={criteria} termId={term.id} onChanged={loadData} />}
            {tab === "recognitions" && (
              <Recognitions participants={activeParticipants} recognitions={recognitions} termId={term.id} onChanged={loadData} />
            )}
          </>
        )}
        {busy && <div className="loading">جارٍ التحديث…</div>}
      </main>
    </div>
  );
}

// Shows this user's own name (or a role fallback if they've never set one)
// plus a small inline control to set/change it -- needed so score edits in
// النتائج can attribute "من عدّل" to a real name instead of a raw id.
function NameTag({ profile, groups, onRenamed }: { profile: StaffProfile; groups: Group[]; onRenamed: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.display_name ?? "");
  const [busy, setBusy] = useState(false);

  const roleLabel = profile.role === "manager" ? "المدير" : "مشرف " + (groups.find((g) => g.id === profile.group_id)?.name || "");

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await supabase.rpc("update_own_display_name", { p_display_name: name });
    setBusy(false);
    setEditing(false);
    onRenamed();
  };

  if (editing) {
    return (
      <form className="nameTag" onSubmit={save}>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك" />
        <button type="submit" disabled={busy} className="primary">
          حفظ
        </button>
      </form>
    );
  }

  return (
    <span className="nameTag">
      {profile.display_name || roleLabel}
      <button className="link" onClick={() => setEditing(true)} title="تعديل الاسم">
        ✎
      </button>
    </span>
  );
}
