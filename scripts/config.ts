/**
 * رابط Google Apps Script Web API — مصدر الحقيقة الوحيد للنتائج.
 *
 * الطريقة المفضّلة: عرّف متغيّر البيئة SHEETS_API_URL (لا يُحفظ في المستودع).
 * أو ضع الرابط مباشرةً بدل النص النائب أدناه.
 */
const PLACEHOLDER = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";

export const SHEETS_API_URL = process.env.SHEETS_API_URL?.trim() || PLACEHOLDER;

/** هل ضُبط الرابط فعلاً (وليس النص النائب)؟ */
export const API_URL_IS_SET = /^https?:\/\//.test(SHEETS_API_URL);
