/**
 * Web API لدرع إحسان 2026 — يُصدّر كل أوراق Google Sheets كـ JSON.
 *
 * يُعيد الشكل الذي يتوقّعه scripts/sheets.ts بالضبط:
 *   { "Settings": [[..صف1..], [..صف2..], ...], "Groups": [[...]], ... }
 * كل ورقة = مصفوفة صفوف ثنائية بقيمها المحسوبة (getValues يُعيد ناتج المعادلات).
 *
 * ── خطوات النشر ──
 *   1) في Google Sheets: Extensions ▸ Apps Script.
 *   2) الصق محتوى هذا الملف في Code.gs واحفظ.
 *   3) Deploy ▸ New deployment ▸ نوع: Web app.
 *        Execute as: Me
 *        Who has access: Anyone
 *   4) انسخ رابط الـ Web app (ينتهي بـ /exec).
 *   5) ضعه في scripts/config.ts، أو الأفضل في متغيّر البيئة/السر SHEETS_API_URL.
 *
 * ملاحظة: عند تعديل بنية الأوراق لاحقاً لا حاجة لإعادة النشر — يكفي حفظ الشيت.
 */
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = {};
  ss.getSheets().forEach(function (sheet) {
    // getDataRange يبدأ من A1 ويشمل كامل نطاق البيانات — يطابق قراءة الإكسل السابقة.
    out[sheet.getName()] = sheet.getDataRange().getValues();
  });
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
