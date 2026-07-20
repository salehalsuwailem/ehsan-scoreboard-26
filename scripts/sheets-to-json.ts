/**
 * محلّل بيانات Google Sheets — يقرأ القيم المحسوبة (cached values) فقط.
 * الموقع لا يعيد أي حسابات: محرّك Google Sheets (Engine) هو مصدر الحقيقة الوحيد.
 *
 * الاعتماد على "مراسي" (anchors) بدل أرقام صفوف ثابتة:
 * نبحث عن الصفوف التي تبدأ بعنوان "المجموعة" في العمود A، لذلك يبقى
 * المحلّل سليماً حتى لو أُضيفت صفوف شرح أعلى الجداول.
 *
 * لا يعتمد على مكتبة xlsx: يستقبل Workbook جاهزاً من scripts/sheets.ts
 * (المبني من استجابة الـ API) ويقرأ خلاياه بالعنوان تماماً كما كان مع الإكسل.
 */
import type {
  Award,
  CulturalGroup,
  FootballGroup,
  Group,
  LeagueSummaryRow,
  RankingRow,
  SeasonData,
  SeasonStats,
  VolleyballGroup,
  WeightRow,
} from "../src/types";
import {
  type Cell,
  type Sheet,
  type Workbook,
  decode_range,
  encode_cell,
  encode_col,
} from "./sheets";

/** Math.round إلى 3 منازل عشرية — يطابق مولّد البيانات الأولي. */
function r3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** كسر (0..1) إلى نسبة مئوية (0..100). */
function pct(value: number | null): number {
  return r3((value ?? 0) * 100);
}

function cellNum(sheet: Sheet, addr: string): number | null {
  const cell = sheet[addr] as Cell | undefined;
  return typeof cell?.v === "number" ? cell.v : null;
}

function cellText(sheet: Sheet, addr: string): string {
  const cell = sheet[addr] as Cell | undefined;
  return typeof cell?.v === "string" ? cell.v : "";
}

function maxRow(sheet: Sheet): number {
  const ref = sheet["!ref"];
  return typeof ref === "string" ? decode_range(ref).e.r + 1 : 0;
}

/** أول صف تكون قيمته النصية في العمود A مساوية للنص المطلوب. */
function findRow(sheet: Sheet, text: string, from = 1): number | null {
  const last = Math.min(maxRow(sheet), 400);
  for (let r = from; r <= last; r++) {
    if (cellText(sheet, `A${r}`).trim() === text) return r;
  }
  return null;
}

/** كل الصفوف التي قيمتها في العمود A تساوي النص المطلوب. */
function findRows(sheet: Sheet, text: string): number[] {
  const rows: number[] = [];
  const last = maxRow(sheet);
  for (let r = 1; r <= last; r++) {
    if (cellText(sheet, `A${r}`).trim() === text) rows.push(r);
  }
  return rows;
}

/** صف بداية البيانات: بعد صف العنوان "المجموعة" مباشرة. */
function dataStart(sheet: Sheet, fallback: number): number {
  const header = findRow(sheet, "المجموعة");
  return header ? header + 1 : fallback;
}

/** RANK بأسلوب إكسل: التعادل يتشارك المركز والذي يليه يُتخطّى. */
function excelRank(values: number[]): number[] {
  return values.map((v) => 1 + values.filter((o) => o > v).length);
}

const GROUP_HEADER = "المجموعة";

const CATS_META: { id: string; nameAr: string; maxPct: number }[] = [
  { id: "football", nameAr: "كرة القدم", maxPct: 10 },
  { id: "volleyball", nameAr: "كرة الطائرة", maxPct: 10 },
  { id: "cultural", nameAr: "المسابقة الثقافية", maxPct: 10 },
  { id: "community", nameAr: "اترك أثراً", maxPct: 20 },
  { id: "haraki", nameAr: "البرنامج الحركي", maxPct: 10 },
  { id: "attendance", nameAr: "الحضور", maxPct: 10 },
  { id: "uniform", nameAr: "الزي الموحد", maxPct: 10 },
  { id: "reflections", nameAr: "الخواطر التربوية", maxPct: 5 },
  { id: "mohsen", nameAr: "وسام محسن", maxPct: 4 },
  { id: "mubakkirun", nameAr: "فقرة مبكرون", maxPct: 4 },
  { id: "workshops", nameAr: "الورش التدريبية", maxPct: 3 },
  { id: "media", nameAr: "الظهور الإعلامي", maxPct: 2 },
  { id: "groupPhoto", nameAr: "الصورة الجماعية", maxPct: 2 },
];

const ENGINE_META: { id: string; nameAr: string; maxPct: number; col: string }[] = [
  { id: "league", nameAr: "الدوري التنافسي", maxPct: 30, col: "D" },
  { id: "project", nameAr: "المشروع المجتمعي", maxPct: 20, col: "E" },
  { id: "haraki", nameAr: "البرنامج الحركي", maxPct: 10, col: "F" },
  { id: "uniform", nameAr: "الزي الموحد", maxPct: 10, col: "G" },
  { id: "attendance", nameAr: "الحضور", maxPct: 10, col: "H" },
  { id: "educational", nameAr: "الخواطر والورش", maxPct: 8, col: "I" },
  { id: "mohsen", nameAr: "وسام محسن", maxPct: 4, col: "J" },
  { id: "mubakkirun", nameAr: "فقرة مبكرون", maxPct: 4, col: "K" },
  { id: "mediaPhoto", nameAr: "الإعلام والصورة", maxPct: 4, col: "L" },
];

const FB_ROUND_COLS = [
  ["B", "C", "D", "E", "F", "G", "H"],
  ["I", "J", "K", "L", "M", "N", "O"],
  ["P", "Q", "R", "S", "T", "U", "V"],
  ["W", "X", "Y", "Z", "AA", "AB", "AC"],
] as const;

export function parseWorkbook(wb: Workbook, source: string): SeasonData {
  function sheet(name: string): Sheet {
    const ws = wb.Sheets[name];
    if (!ws) throw new Error(`الورقة "${name}" غير موجودة في بيانات Google Sheets`);
    return ws;
  }

  const S = sheet("Settings");
  const G = sheet("Groups");
  const E = sheet("Engine");
  const ATT = sheet("Attendance");
  const UNI = sheet("Uniform");
  const MUB = sheet("Mubakkirun");
  const HAR = sheet("Haraki");
  const MOH = sheet("Mohsen");
  const EDU = sheet("Educational");
  const MED = sheet("Media");
  const COM = sheet("Community");
  const CMP = sheet("Competition");
  const DSH = sheet("Dashboard");

  const n = Math.trunc(cellNum(S, "B7") ?? 8);
  const season = cellText(S, "B6") || "درع إحسان 2026";
  const programDays = Math.trunc(cellNum(S, "B8") ?? 11);
  const scoringDays = Math.trunc(cellNum(S, "B9") ?? 10);
  const totalWeeks = Math.trunc(cellNum(S, "B75") ?? 4);

  // ---- Groups (الصفوف 5..4+n) ----
  const groupsRaw = Array.from({ length: n }, (_, i) => {
    const r = 5 + i;
    return {
      id: `G${String(i + 1).padStart(2, "0")}`,
      index: i,
      nameAr: cellText(G, `B${r}`),
      captain: cellText(G, `C${r}`),
      deputy: cellText(G, `E${r}`),
      members: Math.trunc(cellNum(G, `D${r}`) ?? 0),
    };
  });

  // ---- Engine ----
  const engineHeader = findRow(E, GROUP_HEADER);
  if (!engineHeader) throw new Error("لم يتم العثور على جدول Engine");
  const engine = Array.from({ length: n }, (_, i) => {
    const r = engineHeader + 1 + i;
    const col = (c: string) => cellNum(E, `${c}${r}`) ?? 0;
    return {
      rank: Math.trunc(col("B")),
      total: col("C"),
      league: col("D"),
      project: col("E"),
      haraki: col("F"),
      uniform: col("G"),
      attendance: col("H"),
      educational: col("I"),
      mohsen: col("J"),
      mubakkirun: col("K"),
      mediaPhoto: col("L"),
    };
  });

  // ---- بدايات جداول الأوراق ----
  const att0 = dataStart(ATT, 6);
  const uni0 = dataStart(UNI, 6);
  const mub0 = dataStart(MUB, 6);
  const har0 = dataStart(HAR, 6);
  const moh0 = dataStart(MOH, 6);
  const med0 = dataStart(MED, 5);
  const edu0 = dataStart(EDU, 5);
  const com0 = dataStart(COM, 6) + 1; // تخطّي صف "الحد الأقصى"

  const hasNum = (ws: Sheet, r: number, c: number) => {
    const addr = encode_cell({ r: r - 1, c: c - 1 });
    return cellNum(ws, addr) !== null;
  };

  let completedDays = 0;
  for (let c = 2; c < 2 + scoringDays; c++) {
    if (Array.from({ length: n }, (_, i) => hasNum(ATT, att0 + i, c)).some(Boolean)) {
      completedDays++;
    }
  }
  let completedWeeks = 0;
  for (let c = 2; c < 2 + totalWeeks; c++) {
    const inMub = Array.from({ length: n }, (_, i) => hasNum(MUB, mub0 + i, c)).some(Boolean);
    const inMoh = Array.from({ length: n }, (_, i) => hasNum(MOH, moh0 + i, c)).some(Boolean);
    if (inMub || inMoh) completedWeeks++;
  }

  // ---- Competition: أربعة جداول بنفس عنوان "المجموعة" ----
  const compHeaders = findRows(CMP, GROUP_HEADER);
  if (compHeaders.length < 4) {
    throw new Error(`ورقة Competition: توقعنا 4 جداول، وجدنا ${compHeaders.length}`);
  }
  const [fb0, vb0, cu0, sm0] = compHeaders.slice(0, 4).map((h) => h + 1);

  const num = (ws: Sheet, row: number, col: string) => cellNum(ws, `${col}${row}`);

  const football: FootballGroup[] = [];
  const volleyball: VolleyballGroup[] = [];
  const cultural: CulturalGroup[] = [];
  const leagueSummary: LeagueSummaryRow[] = [];

  for (let i = 0; i < n; i++) {
    const groupId = groupsRaw[i].id;

    const rf = fb0 + i;
    football.push({
      groupId,
      rounds: FB_ROUND_COLS.map(([cw, cd, cl, cp, cm, cpc, cs]) => ({
        w: Math.trunc(num(CMP, rf, cw) ?? 0),
        d: Math.trunc(num(CMP, rf, cd) ?? 0),
        l: Math.trunc(num(CMP, rf, cl) ?? 0),
        points: r3(num(CMP, rf, cp) ?? 0),
        maxPoints: r3(num(CMP, rf, cm) ?? 0),
        pct: pct(num(CMP, rf, cpc)),
        scorePct: pct(num(CMP, rf, cs)),
      })),
      totalPoints: r3(num(CMP, rf, "AF") ?? 0),
      maxPoints: r3(num(CMP, rf, "AG") ?? 0),
      pct: pct(num(CMP, rf, "AH")),
      scorePct: pct(num(CMP, rf, "AI")),
      rankInComp: 0,
    });

    const rv = vb0 + i;
    volleyball.push({
      groupId,
      round1: {
        w: Math.trunc(num(CMP, rv, "B") ?? 0),
        d: Math.trunc(num(CMP, rv, "C") ?? 0),
        l: Math.trunc(num(CMP, rv, "D") ?? 0),
        points: r3(num(CMP, rv, "E") ?? 0),
      },
      round2Points: r3(num(CMP, rv, "F") ?? 0),
      totalPoints: r3(num(CMP, rv, "G") ?? 0),
      maxPoints: r3(num(CMP, rv, "H") ?? 0),
      pct: pct(num(CMP, rv, "I")),
      scorePct: pct(num(CMP, rv, "J")),
      rankInComp: 0,
    });

    const rc = cu0 + i;
    cultural.push({
      groupId,
      contests: [
        { position: Math.trunc(num(CMP, rc, "B") ?? 0), points: r3(num(CMP, rc, "C") ?? 0) },
        { position: Math.trunc(num(CMP, rc, "D") ?? 0), points: r3(num(CMP, rc, "E") ?? 0) },
      ],
      totalPoints: r3(num(CMP, rc, "F") ?? 0),
      scorePct: pct(num(CMP, rc, "G")),
      rankInComp: 0,
    });

    const rs = sm0 + i;
    leagueSummary.push({
      groupId,
      footballPct: pct(num(CMP, rs, "B")),
      volleyballPct: pct(num(CMP, rs, "C")),
      culturalPct: pct(num(CMP, rs, "D")),
      totalPct: pct(num(CMP, rs, "E")),
      rank: Math.trunc(num(CMP, rs, "F") ?? 0),
    });
  }

  for (const list of [football, volleyball, cultural]) {
    const ranks = excelRank(list.map((x) => x.scorePct));
    list.forEach((x, i) => (x.rankInComp = ranks[i]));
  }

  // ---- درجات الفئات الـ 13 لكل مجموعة ----
  function categoryScores(i: number): Record<string, number> {
    return {
      attendance: pct(cellNum(ATT, `N${att0 + i}`)),
      uniform: pct(cellNum(UNI, `N${uni0 + i}`)),
      mohsen: pct(cellNum(MOH, `G${moh0 + i}`)),
      mubakkirun: pct(cellNum(MUB, `G${mub0 + i}`)),
      haraki: pct(cellNum(HAR, `G${har0 + i}`)),
      media: pct(cellNum(MED, `C${med0 + i}`)),
      groupPhoto: pct(cellNum(MED, `E${med0 + i}`)),
      reflections: pct(cellNum(EDU, `C${edu0 + i}`)),
      workshops: pct(cellNum(EDU, `E${edu0 + i}`)),
      football: football[i].scorePct,
      volleyball: volleyball[i].scorePct,
      cultural: cultural[i].scorePct,
      community: pct(cellNum(COM, `I${com0 + i}`)),
    };
  }

  const groups: Group[] = groupsRaw.map((g, i) => {
    const scores = categoryScores(i);
    const en = engine[i];
    return {
      ...g,
      rank: en.rank,
      totalPct: pct(en.total),
      medal: en.rank >= 1 && en.rank <= 3 ? en.rank : null,
      movement: null, // تُحسب لاحقاً في sync.ts من لقطات التاريخ
      categories: CATS_META.map((c) => ({
        id: c.id,
        nameAr: c.nameAr,
        scorePct: scores[c.id],
        maxPct: c.maxPct,
        pct: c.maxPct ? r3((scores[c.id] / c.maxPct) * 100) : 0,
      })),
      components: ENGINE_META.map((c) => {
        const scorePct = pct(en[c.id as keyof typeof en] as number);
        return {
          id: c.id,
          nameAr: c.nameAr,
          scorePct,
          maxPct: c.maxPct,
          pct: c.maxPct ? r3((scorePct / c.maxPct) * 100) : 0,
        };
      }),
    };
  });

  // تحقّق تشخيصي (غير موقِف): إجمالي المحرّك (العمود C) هو المصدر الرسمي للترتيب
  // والإجمالي المعروض. إن لم يطابق مجموعُ فئاتِ مجموعةٍ إجماليَها، نسجّل تنبيهاً
  // ونُكمل — كي لا يوقف صفٌّ واحد غير متطابق تحديثَ الموقع بالكامل.
  for (const g of groups) {
    const sum = g.categories.reduce((acc, c) => acc + c.scorePct, 0);
    const diff = Math.abs(sum - g.totalPct);
    if (diff > 0.5) {
      console.warn(
        `⚠ تعارض في بيانات "${g.nameAr}": مجموع الفئات ${sum.toFixed(3)}٪ ≠ الإجمالي ` +
          `${g.totalPct.toFixed(3)}٪. سيُعرض إجمالي Engine كما هو؛ راجع قيم هذه المجموعة ` +
          `في أوراق الفئات (غالباً ورقة المسابقات Competition).`
      );
    }
  }

  // ---- جوائز ولوحة الإحصائيات من ورقة Dashboard (قيمها المحسوبة) ----
  function dashLabelValue(label: string): string | null {
    const last = Math.min(maxRow(DSH), 200);
    for (let r = 1; r <= last; r++) {
      if (cellText(DSH, `M${r}`).trim() === label) {
        return cellText(DSH, `O${r}`) || null;
      }
    }
    return null;
  }

  const nameToId = new Map(groups.map((g) => [g.nameAr, g.id]));
  const awards: Award[] = [];

  /** تنسيق نسبة للعرض: خانة عشرية واحدة مع حذف الصفر الزائد. */
  const fmt = (v: number): string => {
    const rounded = Math.round(v * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
  };

  /** نسبة إنجاز بند معيّن لمجموعة معيّنة (قيمة مخزّنة، لا حساب جديد). */
  const catPct = (groupId: string, catId: string): number | null => {
    const g = groups.find((x) => x.id === groupId);
    const c = g?.categories.find((x) => x.id === catId);
    return c ? c.pct : null;
  };

  // جوائز ورقة Dashboard — الفائز كما اختارته اللوحة نفسها
  const awardDefs: [string, string, string | null][] = [
    ["bestAttendance", "أفضل حضور", "attendance"],
    ["bestProject", "أفضل مشروع", "community"],
    ["bestCultural", "أفضل ثقافي", "cultural"],
    ["bestSports", "أفضل رياضي", null],
    ["bestMohsen", "أفضل محسن", null],
  ];
  for (const [id, titleAr, catId] of awardDefs) {
    const groupName = dashLabelValue(titleAr);
    const groupId = groupName ? nameToId.get(groupName) : undefined;
    if (!groupId) continue;
    const value = catId ? catPct(groupId, catId) : null;
    awards.push({ id, titleAr, groupId, ...(value !== null && value > 0 ? { detail: fmt(value) } : {}) });
  }

  // أفضل إعلام: نفس نمط MAX الذي تستخدمه ورقة Dashboard، على عمود Engine L
  const bestMediaIdx = engine.reduce(
    (best, en, i) => (en.mediaPhoto > engine[best].mediaPhoto ? i : best),
    0
  );
  {
    const groupId = groups[bestMediaIdx].id;
    const value = catPct(groupId, "media");
    awards.push({
      id: "bestMedia",
      titleAr: "أفضل إعلام",
      groupId,
      ...(value !== null && value > 0 ? { detail: fmt(value) } : {}),
    });
  }

  // أفضل خواطر / أفضل ورش: MAX على قيم البنود المخزّنة، والتعادل يُحسم بالترتيب العام
  const catBest = (id: string, titleAr: string, catId: string) => {
    let winner: Group | null = null;
    let best = 0;
    for (const g of groups) {
      const v = catPct(g.id, catId) ?? 0;
      if (v > best || (v === best && v > 0 && winner && g.rank < winner.rank)) {
        best = v;
        winner = g;
      }
    }
    if (winner && best > 0) {
      awards.push({ id, titleAr, groupId: winner.id, detail: fmt(best) });
    }
  };
  catBest("bestReflection", "أفضل خواطر تربوية", "reflections");
  catBest("bestWorkshop", "أفضل ورش تدريبية", "workshops");

  function dashStat(label: string, colIndex: number): number {
    const colLetter = encode_col(colIndex - 1);
    const last = Math.min(maxRow(DSH), 200);
    for (let r = 1; r <= last; r++) {
      if (cellText(DSH, `${colLetter}${r}`).trim() === label) {
        return pct(cellNum(DSH, `${colLetter}${r + 1}`));
      }
    }
    return 0;
  }

  const leader = groups.reduce((best, g) => (g.rank < best.rank ? g : best), groups[0]);
  const stats: SeasonStats = {
    highestPct: dashStat("أعلى نتيجة", 1),
    averagePct: dashStat("المتوسط العام", 5),
    lowestPct: dashStat("أدنى نتيجة", 9),
    leaderGroupId: leader.id,
    groupsCount: n,
    categoriesCount: CATS_META.length,
  };

  // ---- جدول الأوزان (Settings صفوف 14..24) ----
  const weights: WeightRow[] = [];
  for (let r = 14; r <= 24; r++) {
    const nameAr = cellText(S, `A${r}`);
    const weight = cellNum(S, `B${r}`);
    if (nameAr && weight !== null) {
      weights.push({ nameAr, weightPct: pct(weight), note: cellText(S, `E${r}`) });
    }
  }

  const ranking: RankingRow[] = [...groups]
    .map((g) => ({
      rank: g.rank,
      groupId: g.id,
      nameAr: g.nameAr,
      totalPct: g.totalPct,
      movement: g.movement,
      medal: g.medal,
    }))
    .sort((a, b) => a.rank - b.rank);

  const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  return {
    meta: {
      season,
      seasonYear: 2026,
      generatedAt,
      sourceFile: source,
      programDays,
      scoringDays,
      completedDays,
      totalWeeks,
      completedWeeks,
      completionPct: scoringDays ? r3((completedDays / scoringDays) * 100) : 0,
      comment: cellText(S, "B10"),
    },
    weights,
    groups,
    ranking,
    competitions: {
      football: {
        nameAr: "كرة القدم",
        weightPct: 10,
        roundsCount: 4,
        roundScorePct: 2.5,
        win: 3,
        draw: 1,
        loss: 0,
        perGroup: football,
      },
      volleyball: {
        nameAr: "كرة الطائرة",
        weightPct: 10,
        roundsCount: 2,
        roundScorePct: 5,
        win: 3,
        draw: 1,
        loss: 0,
        perGroup: volleyball,
      },
      cultural: {
        nameAr: "المسابقة الثقافية",
        weightPct: 10,
        contestsCount: 2,
        contestScorePct: 5,
        placePoints: [5, 4, 3, 2],
        perGroup: cultural,
      },
      leagueSummary,
    },
    awards,
    stats,
    history: [], // تُدمج في sync.ts
  };
}
