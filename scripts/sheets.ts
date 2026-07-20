/**
 * مصدر البيانات: Google Apps Script Web API.
 *
 * يجلب JSON يحتوي كل أوراق Google Sheets (قيمها المحسوبة)، ويحوّله إلى نفس
 * الشكل الداخلي الذي كان قارئ الإكسل يعتمده (خريطة عنوان‑خلية → قيمة)، حتى
 * يعمل منطق التحليل في sheets-to-json.ts دون أي تغيير.
 *
 * الشكل المتوقّع من الـ API (وهو ما يُنتجه Apps Script المرفق في apps-script/Code.gs):
 *   { "Settings": [[..صف1..], [..صف2..], ...], "Groups": [[...]], ... }
 * ويتسامح المحوّل أيضاً مع { sheets: {...} } ومع { "Sheet": { values: [[...]] } }.
 */

export interface Cell {
  v: string | number;
  t: "n" | "s";
}

/** ورقة = خريطة "A1" → خلية، مع مفتاح خاص "!ref" لنطاق البيانات. */
export type Sheet = { [address: string]: Cell | string | undefined };

export interface Workbook {
  SheetNames: string[];
  Sheets: Record<string, Sheet>;
}

/* --------------------------- أدوات عناوين الخلايا -------------------------- */
/* دوال خالصة تُغني عن مكتبة xlsx (نفس سلوك XLSX.utils التي كان القارئ يستخدمها). */

/** 0 → "A", 25 → "Z", 26 → "AA". */
export function encode_col(c: number): string {
  let s = "";
  let n = c + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** { r: 0, c: 0 } → "A1". */
export function encode_cell(a: { r: number; c: number }): string {
  return encode_col(a.c) + (a.r + 1);
}

/** "A1:C10" → { s: {c,r}, e: {c,r} } (فهارس صفرية). */
export function decode_range(ref: string): {
  s: { c: number; r: number };
  e: { c: number; r: number };
} {
  const parts = ref.split(":");
  const decode = (x: string) => {
    const m = x.match(/^([A-Z]+)(\d+)$/);
    if (!m) return { c: 0, r: 0 };
    let col = 0;
    for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
    return { c: col - 1, r: parseInt(m[2], 10) - 1 };
  };
  return { s: decode(parts[0]), e: decode(parts[1] ?? parts[0]) };
}

/* ------------------------------ بناء الـ Workbook ------------------------------ */

/** قيمة خلية من Google Sheets → خلية داخلية، أو null للخلايا الفارغة. */
function toCell(v: unknown): Cell | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? { v, t: "n" } : null;
  if (typeof v === "boolean") return { v: v ? "TRUE" : "FALSE", t: "s" };
  if (v instanceof Date) return { v: v.toISOString(), t: "s" };
  return { v: String(v), t: "s" };
}

/** يستخرج خريطة { اسم الورقة → مصفوفة صفوف ثنائية } من أشكال الاستجابة المختلفة. */
function extractSheets(payload: unknown): Record<string, unknown[][]> {
  if (!payload || typeof payload !== "object") return {};
  const record = payload as Record<string, unknown>;
  const root =
    record.sheets && typeof record.sheets === "object"
      ? (record.sheets as Record<string, unknown>)
      : record;

  const out: Record<string, unknown[][]> = {};
  for (const [name, value] of Object.entries(root)) {
    const values = Array.isArray(value)
      ? value
      : value && typeof value === "object" && Array.isArray((value as { values?: unknown }).values)
        ? (value as { values: unknown[] }).values
        : null;
    if (values) out[name] = values as unknown[][];
  }
  return out;
}

/** يحوّل استجابة الـ API إلى Workbook بنفس شكل ما كان يُنتجه قارئ الإكسل. */
export function buildWorkbook(payload: unknown): Workbook {
  const sheetsData = extractSheets(payload);
  const Sheets: Record<string, Sheet> = {};
  const SheetNames: string[] = [];

  for (const [name, rows] of Object.entries(sheetsData)) {
    SheetNames.push(name);
    const sheet: Sheet = {};
    let cols = 0;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] ?? [];
      if (row.length > cols) cols = row.length;
      for (let c = 0; c < row.length; c++) {
        const cell = toCell(row[c]);
        if (cell) sheet[encode_cell({ r, c })] = cell;
      }
    }

    sheet["!ref"] =
      rows.length > 0
        ? `A1:${encode_cell({ r: rows.length - 1, c: Math.max(0, cols - 1) })}`
        : "A1:A1";
    Sheets[name] = sheet;
  }

  return { SheetNames, Sheets };
}

/* -------------------------------- جلب البيانات -------------------------------- */

/** يجلب أوراق Google Sheets من الـ Web API ويعيدها كـ Workbook جاهز للتحليل. */
export async function fetchWorkbook(url: string): Promise<Workbook> {
  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow", headers: { Accept: "application/json" } });
  } catch (err) {
    throw new Error(`تعذّر الوصول إلى الـ API: ${(err as Error).message}`);
  }
  if (!res.ok) {
    throw new Error(`فشل الاتصال بالـ API (HTTP ${res.status})`);
  }

  const text = await res.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("استجابة الـ API ليست JSON صالحاً — تأكّد من نشر Apps Script بصلاحية Anyone.");
  }

  const wb = buildWorkbook(payload);
  if (wb.SheetNames.length === 0) {
    throw new Error("الـ API لم يُعِد أي أوراق — تحقّق من الرابط وصلاحيات النشر.");
  }
  return wb;
}
