/**
 * npm run sync — مزامنة Google Sheets مع الموقع.
 *
 * 1) يجلب كل الأوراق من Google Apps Script Web API (القيم المحسوبة).
 * 2) يقرأ القيم فقط عبر sheets-to-json.ts (بدون أي إعادة حساب).
 * 3) يحسب "التغيّر" (⬆⬇➖) بمقارنة الترتيب الحالي مع آخر لقطة مختلفة
 *    في data/history.json — أي أننا نقارن نتائج Google Sheets نفسها عبر الزمن.
 * 4) يكتب src/data/data.json (مع التاريخ مدمجاً) و data/history.json.
 *
 * إن تعذّر الوصول للـ API: تحذير فقط، ويبقى آخر data.json منشوراً كما هو
 * (لا يفشل البناء ما دام data.json موجوداً).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parseWorkbook } from "./sheets-to-json";
import { fetchWorkbook } from "./sheets";
import { API_URL_IS_SET, SHEETS_API_URL } from "./config";
import type { HistorySnapshot, SeasonData } from "../src/types";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const JSON_PATH = path.join(ROOT, "src", "data", "data.json");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");
const HISTORY_CAP = 60;

function loadHistory(): HistorySnapshot[] {
  try {
    const raw = fs.readFileSync(HISTORY_PATH, "utf-8");
    const parsed = JSON.parse(raw) as HistorySnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** بصمة النتائج: نفس الإجماليات ⇒ نفس اللقطة (لمنع التكرار عند إعادة البناء). */
function signature(entries: { groupId: string; totalPct: number }[]): string {
  return [...entries]
    .sort((a, b) => a.groupId.localeCompare(b.groupId))
    .map((e) => `${e.groupId}:${e.totalPct}`)
    .join("|");
}

/** يبقي آخر data.json منشوراً بدل إفشال البناء عند تعذّر المزامنة. */
function keepExistingOrFail(reason: string): void {
  console.warn(`⚠ ${reason}`);
  if (fs.existsSync(JSON_PATH)) {
    console.warn("→ سيبقى آخر data.json منشوراً كما هو.");
    return;
  }
  console.error("✗ لا يوجد src/data/data.json أيضاً — لا يمكن بناء الموقع بدون بيانات.");
  process.exit(1);
}

async function main(): Promise<void> {
  if (!API_URL_IS_SET) {
    keepExistingOrFail("لم يُضبط رابط الـ API (SHEETS_API_URL) في scripts/config.ts أو متغيّرات البيئة.");
    return;
  }

  console.log("↺ جلب البيانات من Google Sheets…");
  let data: SeasonData;
  try {
    const wb = await fetchWorkbook(SHEETS_API_URL);
    data = parseWorkbook(wb, "Google Sheets");
  } catch (err) {
    keepExistingOrFail((err as Error).message);
    return;
  }

  const history = loadHistory();
  const currentEntries = data.groups.map((g) => ({
    groupId: g.id,
    rank: g.rank,
    totalPct: g.totalPct,
  }));
  const currentSig = signature(currentEntries);

  // آخر لقطة "مختلفة" عن الوضع الحالي = مرجع حساب التغيّر
  const previous = [...history].reverse().find((s) => signature(s.entries) !== currentSig);
  const prevRanks = new Map(previous?.entries.map((e) => [e.groupId, e.rank]) ?? []);

  for (const group of data.groups) {
    const prev = prevRanks.get(group.id);
    group.movement = prev === undefined ? null : prev - group.rank;
  }
  for (const row of data.ranking) {
    const prev = prevRanks.get(row.groupId);
    row.movement = prev === undefined ? null : prev - row.rank;
  }

  // أضف لقطة جديدة فقط إذا تغيّرت النتائج فعلاً
  const latest = history[history.length - 1];
  if (!latest || signature(latest.entries) !== currentSig) {
    history.push({ syncedAt: data.meta.generatedAt, entries: currentEntries });
    console.log("＋ لقطة جديدة أُضيفت إلى التاريخ.");
  } else {
    console.log("＝ النتائج لم تتغيّر — لن تُضاف لقطة مكررة.");
  }
  while (history.length > HISTORY_CAP) history.shift();

  data.history = history;

  // «الأكثر تطوّراً» — أكبر صعود موجب في الترتيب مقارنةً باللقطة السابقة
  const improved = data.groups
    .filter((g) => (g.movement ?? 0) > 0)
    .sort((a, b) => (b.movement ?? 0) - (a.movement ?? 0) || a.rank - b.rank)[0];
  if (improved) {
    const m = improved.movement ?? 0;
    const detail = m === 1 ? "+مركز واحد" : m === 2 ? "+مركزين" : `+${m} مراكز`;
    data.awards.push({ id: "mostImproved", titleAr: "الأكثر تطوّراً", groupId: improved.id, detail });
  }

  fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), "utf-8");
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");

  console.log("✓ تمت المزامنة:");
  console.log(`   آخر تحديث: ${data.meta.generatedAt}`);
  console.log(`   اليوم ${data.meta.completedDays} من ${data.meta.scoringDays} — الأسبوع ${data.meta.completedWeeks} من ${data.meta.totalWeeks}`);
  for (const row of data.ranking) {
    const move =
      row.movement === null ? "—" : row.movement > 0 ? `⬆${row.movement}` : row.movement < 0 ? `⬇${Math.abs(row.movement)}` : "➖";
    console.log(`   ${row.rank}. ${row.nameAr} — ${row.totalPct}% ${move}`);
  }
}

main().catch((err) => {
  console.error(`✗ فشلت المزامنة: ${(err as Error).message}`);
  process.exit(1);
});
