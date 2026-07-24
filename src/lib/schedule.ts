/**
 * جدول أيام البرنامج وحساب التقدّم تلقائياً حسب تاريخ اليوم.
 *
 * القواعد المتّفق عليها:
 *  - «اليوم X من N»: X = عدد الأيام التي حان تاريخها (‎<= اليوم‎). بين البرامج
 *    يبقى الرقم على آخر يوم تم.
 *  - «الأسبوع X من W»: رقم الأسبوع يتغيّر فور بداية أول يوم برنامج فيه (لا ينتظر
 *    انتهاء آخر يوم). أي: X = أكبر رقم أسبوع تاريخ أول يوم منه ‎<= اليوم‎.
 *    بين الأسابيع (بعد آخر يوم في أسبوع وقبل أول يوم في التالي) يبقى الرقم على
 *    آخر أسبوع بدأ.
 *  - نسبة الإنجاز = الأيام المكتملة ÷ إجمالي الأيام.
 *
 * كل شيء يُحسب في المتصفّح من التاريخ الحالي، فيتحدّث يومياً بلا حاجة لمزامنة.
 */

export interface ProgramDay {
  day: number;
  /** التاريخ بصيغة YYYY-MM-DD (منطقة زمنية محلية). */
  date: string;
  week: number;
}

export const SCHEDULE: ProgramDay[] = [
  { day: 1, date: "2026-07-11", week: 1 },
  { day: 2, date: "2026-07-13", week: 1 },
  { day: 3, date: "2026-07-15", week: 1 },
  { day: 4, date: "2026-07-20", week: 2 },
  { day: 5, date: "2026-07-22", week: 2 },
  { day: 6, date: "2026-07-25", week: 3 },
  { day: 7, date: "2026-07-27", week: 3 },
  { day: 8, date: "2026-07-29", week: 3 },
  { day: 9, date: "2026-08-03", week: 4 },
  { day: 10, date: "2026-08-05", week: 4 },
  { day: 11, date: "2026-08-08", week: 4 },
];

export const PROGRAM_DAYS = SCHEDULE.length;
export const TOTAL_WEEKS = Math.max(...SCHEDULE.map((d) => d.week));

/** رقم اليوم اليومي (YYYYMMDD) لمقارنة بلا وقت ولا منطقة زمنية. */
function dayNumber(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function toDayNumber(iso: string): number {
  const [y, m, day] = iso.split("-").map(Number);
  return y * 10000 + m * 100 + day;
}

export interface ProgramProgress {
  completedDays: number;
  programDays: number;
  /** رقم الأسبوع الحالي — يبدأ من أول يوم في الأسبوع، لا بعد آخر يوم فيه. */
  currentWeek: number;
  totalWeeks: number;
  completionPct: number;
  /** أقرب يوم قادم لم يبدأ بعد (للعدّاد التنازلي)، أو null إن انتهى البرنامج. */
  nextDay: ProgramDay | null;
}

export function getProgramProgress(now: Date = new Date()): ProgramProgress {
  const today = dayNumber(now);

  const completedDays = SCHEDULE.filter((d) => toDayNumber(d.date) <= today).length;

  // أول يوم في كل أسبوع — الأسبوع "يبدأ" (يصبح الحالي) بمجرّد وصول هذا التاريخ.
  const firstDayOfWeek = new Map<number, number>();
  for (const d of SCHEDULE) {
    const n = toDayNumber(d.date);
    const existing = firstDayOfWeek.get(d.week);
    if (existing === undefined || n < existing) firstDayOfWeek.set(d.week, n);
  }
  let currentWeek = 0;
  for (const [week, firstN] of firstDayOfWeek) {
    if (firstN <= today) currentWeek = Math.max(currentWeek, week);
  }

  const completionPct = PROGRAM_DAYS ? Math.round((completedDays / PROGRAM_DAYS) * 100) : 0;
  const nextDay = SCHEDULE.find((d) => toDayNumber(d.date) > today) ?? null;

  return {
    completedDays,
    programDays: PROGRAM_DAYS,
    currentWeek,
    totalWeeks: TOTAL_WEEKS,
    completionPct,
    nextDay,
  };
}
