import { useMemo, useState } from "react";

type GroupKey = "3+4" | "5+6" | "7+8";
type Student = { id: string; name: string; grade: number; group: GroupKey; active: boolean };
type Criterion = { id: string; name: string; kind: "score" | "bonus" | "deduction"; active: boolean };
type Scores = Record<string, Record<string, number>>;

const initialStudents: Student[] = [
["s1","احمد الحجي",3],["s2","عبدالله العزاز",3],["s3","حمد القصار",3],["s4","اياد المطوع",3],["s5","احمد عبدالرحمن الكندري",3],["s6","عثمان العبيد",3],["s7","يوسف عمر الفيلكاوي",3],["s8","عبدالله محمد المطر",3],
["s9","سالم الابراهيم",4],["s10","عبدالرحمن الابراهيم",4],["s11","يوسف الفودري",4],["s12","عبدالعزيز الخليفي",4],["s13","عمر العزاز",4],["s14","محمد الخباز",4],["s15","سلمان السعيد",4],["s16","سالم العجمي",4],["s17","بدر الرقم",4],["s18","ماجد الهاجري",4],["s19","خالد وليد الخالدي",4],["s20","عمر الشرهان",4],["s21","محمد القلاف",4],
["s22","يوسف بورحمه",5],["s23","خالد الرمح",5],["s24","عبدالعزيز العتيقي",5],["s25","عبدالوهاب الكندري",5],["s26","اديب الكندري",5],["s27","محمد المطوع",5],["s28","عبدالرحمن المذكور",5],["s29","عبدالرحمن العبيد",5],["s30","عثمان الجابر",5],["s31","سلمان الطواله",5],["s32","يوسف الفرحان",5],
["s33","عبدالرحمن الحجي",6],["s34","سليمان العبدالهادي",6],["s35","يوسف العزاز",6],["s36","احمد المهاوش",6],["s37","فيصل الرقم",6],["s38","عمر حسن الكندري",6],["s39","عيسى حسن الكندري",6],["s40","محمد الطواله",6],["s41","عثمان الجابر",6],["s42","سلمان الطواله",6],["s43","عمر العجمي",6],
["s44","ابراهيم الرمح",7],["s45","دعيج الفهد",7],["s46","محمد الملال",7],["s47","ادم السالمي",7],["s48","خالد المطيري",7],["s49","عبدالله الجيران",7],["s50","فواز الكندري",7],["s51","محمد القبندي",7],["s52","خالد المحطب",7],["s53","عبدالرحمن الملال",7],["s54","انس السعيد",7],["s55","محمد مصعب الكندري",7],["s56","جاسم العلي",7],["s57","محمد الدوسري",7],
["s58","عبدالله الحجي",8],["s59","عمر الشطي",8],["s60","فراس الكندري",8],["s61","يوسف البراك",8],["s62","عبدالله القبندي",8],["s63","راشد الانصاري",8],["s64","عبدالعزيز الخلف",8],["s65","عمر العبوه",8],["s66","محمد سالم المطوع",8],["s67","راشد وليد الخالدي",8],["s68","عبدالله المنصور",8],["s69","يوسف الخالدي",8]
].map(([id,name,grade]) => ({id:String(id),name:String(name),grade:Number(grade),group:(Number(grade)<=4?"3+4":Number(grade)<=6?"5+6":"7+8") as GroupKey,active:true}));

const initialCriteria: Criterion[] = [
["attendance","الحضور","score"],["participation","المشاركة","score"],["reflections","الخواطر","score"],
["football1","كرة قدم 1","score"],["football2","كرة قدم 2","score"],["football3","كرة قدم 3","score"],
["bowling","بولينج","score"],["olympics","أولمبياد المغامرون","score"],["tasks","التكليف","score"],
["bonus","البونص","bonus"],["deduction","الخصم","deduction"]
].map(([id,name,kind])=>({id:String(id),name:String(name),kind:kind as Criterion["kind"],active:true}));

const seedScores: Scores = {};

function App(){
  const [students,setStudents]=useState(initialStudents);
  const [criteria,setCriteria]=useState(initialCriteria);
  const [scores,setScores]=useState<Scores>(seedScores);
  const [group,setGroup]=useState<GroupKey>("3+4");
  const [grade,setGrade]=useState<"all"|3|4|5|6|7|8>("all");
  const [tab,setTab]=useState<"board"|"students"|"criteria"|"awards">("board");
  const [search,setSearch]=useState("");
  const [role,setRole]=useState<"admin"|"3+4"|"5+6"|"7+8">("admin");
  const [message,setMessage]=useState("");

  const allowedGroup = role==="admin" ? group : role;
  const visibleStudents = useMemo(()=>students.filter(s=>s.active&&s.group===allowedGroup&&(grade==="all"||s.grade===grade)&&s.name.includes(search)),[students,allowedGroup,grade,search]);
  const activeCriteria=criteria.filter(c=>c.active);
  const totalFor=(sid:string)=>activeCriteria.reduce((sum,c)=>sum+(c.kind==="deduction"?-(scores[sid]?.[c.id]||0):(scores[sid]?.[c.id]||0)),0);

  const ranking=useMemo(()=>visibleStudents.map(s=>({...s,total:totalFor(s.id)})).sort((a,b)=>b.total-a.total),[visibleStudents,scores,criteria]);
  const rankMap=new Map<string,number>(); let last:number|undefined; let rank=0;
  ranking.forEach((s,i)=>{if(s.total!==last){rank=i+1;last=s.total}rankMap.set(s.id,rank)});

  const setScore=(sid:string,cid:string,value:string)=>{
    const n=value===""?0:Math.max(0,Number(value)||0);
    setScores(prev=>({...prev,[sid]:{...(prev[sid]||{}),[cid]:n}}));
  };
  const addStudent=()=>{const name=prompt("اسم المغامر:")?.trim(); if(!name)return; const g=allowedGroup; const max=Math.max(0,...students.map(s=>Number(s.id.slice(1))||0))+1; setStudents(p=>[...p,{id:"s"+max,name,grade:Number(g[0]) as 3|5|7,group:g,active:true}]);};
  const editStudent=(s:Student)=>{const name=prompt("تعديل الاسم:",s.name)?.trim(); if(name&&name!==s.name)setStudents(p=>p.map(x=>x.id===s.id?{...x,name}:x));};
  const archiveStudent=(s:Student)=>{if(confirm(`إخفاء ${s.name} من القائمة؟`))setStudents(p=>p.map(x=>x.id===s.id?{...x,active:false}:x));};
  const addCriterion=()=>{const name=prompt("اسم البند:")?.trim(); if(!name)return; const id="c"+Date.now(); setCriteria(p=>[...p,{id,name,kind:"score",active:true}]);};
  const editCriterion=(c:Criterion)=>{const name=prompt("تعديل اسم البند:",c.name)?.trim(); if(name)setCriteria(p=>p.map(x=>x.id===c.id?{...x,name}:x));};
  const archiveCriterion=(c:Criterion)=>{if(confirm(`تعطيل بند «${c.name}»؟`))setCriteria(p=>p.map(x=>x.id===c.id?{...x,active:false}:x));};

  const save=()=>{setMessage("تم الحفظ محليًا في هذه النسخة التجريبية."); setTimeout(()=>setMessage(""),2500)};

  return <div className="app">
    <header className="topbar">
      <div className="brand"><img src="https://raw.githubusercontent.com/salehalsuwailem/ehsan-scoreboard-26/main/public/logo.png"/><div><strong>لوحة نقاط المغامرون</strong><span>أُسوة · 2026</span></div></div>
      <div className="role"><span>الصلاحية</span><select value={role} onChange={e=>setRole(e.target.value as typeof role)}><option value="admin">المدير — جميع الفئات</option><option value="3+4">مشرف 3+4</option><option value="5+6">مشرف 5+6</option><option value="7+8">مشرف 7+8</option></select></div>
    </header>

    <main>
      <section className="hero"><div><small>الفصل الحالي</small><h1>أُسوة</h1><p>إدارة المغامرين والنقاط والنتائج في مكان واحد.</p></div><button className="primary" onClick={save}>حفظ التغييرات</button></section>

      <section className="stats"><div><b>{students.filter(s=>s.active).length}</b><span>مغامر</span></div><div><b>{activeCriteria.length}</b><span>بند نقاط</span></div><div><b>{ranking.length?ranking[0].total:0}</b><span>أعلى مجموع</span></div><div><b>{allowedGroup}</b><span>الفئة الحالية</span></div></section>

      <nav className="tabs"><button className={tab==="board"?"active":""} onClick={()=>setTab("board")}>لوحة النقاط</button><button className={tab==="students"?"active":""} onClick={()=>setTab("students")}>المغامرون</button><button className={tab==="criteria"?"active":""} onClick={()=>setTab("criteria")}>بنود النقاط</button><button className={tab==="awards"?"active":""} onClick={()=>setTab("awards")}>التكريمات</button></nav>

      {tab==="board"&&<section className="panel">
        <div className="toolbar"><div><h2>لوحة النتائج</h2><p>إدخال مباشر مثل الجدول، والمجموع يُحسب تلقائيًا.</p></div><div className="filters"><select value={group} disabled={role!=="admin"} onChange={e=>setGroup(e.target.value as GroupKey)}><option>3+4</option><option>5+6</option><option>7+8</option></select><select value={grade} onChange={e=>setGrade(e.target.value==="all"?"all":Number(e.target.value) as 3|4|5|6|7|8)}><option value="all">كل الصفوف</option>{[3,4,5,6,7,8].map(g=><option key={g} value={g}>الصف {g}</option>)}</select><input placeholder="بحث بالاسم..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
        <div className="tableWrap"><table><thead><tr><th>#</th><th className="name">المغامر</th><th>الصف</th>{activeCriteria.map(c=><th key={c.id}>{c.name}</th>)}<th className="total">المجموع</th><th>المركز</th></tr></thead><tbody>{ranking.map((s,i)=><tr key={s.id}><td>{i+1}</td><td className="name"><button className="link" onClick={()=>editStudent(s)}>{s.name}</button></td><td>{s.grade}</td>{activeCriteria.map(c=><td key={c.id}><input className={c.kind==="bonus"?"bonus":c.kind==="deduction"?"deduction":""} type="number" min="0" step="1" value={scores[s.id]?.[c.id]||""} placeholder="—" onChange={e=>setScore(s.id,c.id,e.target.value)}/></td>)}<td className="total">{s.total}</td><td><span className={"rank r"+rankMap.get(s.id)}>{rankMap.get(s.id)}</span></td></tr>)}</tbody></table></div>
      </section>}

      {tab==="students"&&<section className="panel"><div className="toolbar"><div><h2>إدارة المغامرين</h2><p>إضافة وتعديل وأرشفة الأسماء. الصف والفئة التشغيلية منفصلان.</p></div><button className="primary" onClick={addStudent}>+ إضافة مغامر</button></div><div className="cards">{students.filter(s=>s.active&&s.group===allowedGroup).map(s=><div className="studentCard" key={s.id}><div><strong>{s.name}</strong><span>الصف {s.grade} · {s.group}</span></div><div><button onClick={()=>editStudent(s)}>تعديل</button><button className="danger" onClick={()=>archiveStudent(s)}>أرشفة</button></div></div>)}</div></section>}

      {tab==="criteria"&&<section className="panel"><div className="toolbar"><div><h2>بنود النقاط</h2><p>كل بند قابل للإضافة والتعديل والتعطيل.</p></div><button className="primary" onClick={addCriterion}>+ إضافة بند</button></div><div className="cards">{criteria.map(c=><div className={"studentCard "+(!c.active?"muted":"")} key={c.id}><div><strong>{c.name}</strong><span>{c.kind==="bonus"?"يُضاف تلقائيًا":c.kind==="deduction"?"يُطرح تلقائيًا":"نقاط مباشرة"}{!c.active?" · معطل":""}</span></div><div><button onClick={()=>editCriterion(c)}>تعديل</button>{c.active&&<button className="danger" onClick={()=>archiveCriterion(c)}>تعطيل</button>}</div></div>)}</div></section>}

      {tab==="awards"&&<section className="panel awards"><h2>التكريمات</h2><p>التكريمات منفصلة عن مجموع النقاط.</p><div className="awardGrid"><div>⭐<b>مغامر الأسبوع</b><span>أسبوعيًا</span></div><div>✍️<b>أفضل خاطرة</b><span>أسبوعيًا</span></div><div>⚽<b>أفضل لاعب</b><span>عند فعاليات كرة القدم</span></div></div></section>}
      {message&&<div className="toast">{message}</div>}
    </main>
  </div>
}
export default App;