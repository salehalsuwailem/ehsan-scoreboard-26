# درع إحسان 2026 — لوحة النتائج

موقع عرض نتائج **درع إحسان 2026**: واجهة عربية (RTL) خفيفة للقراءة فقط، تعرض ترتيب المجموعات ونتائج الفئات والدوري التنافسي كما هي محسوبة في **Google Sheets**.

> **المبدأ الأساسي:** Google Sheets هو مصدر الحقيقة الوحيد. الموقع **لا يحسب ولا يعدّل** أي درجة — يعرض القيم المحسوبة فقط.

---

## مسار البيانات

```
Google Sheets  (كل المعادلات والحسابات هنا)
      ↓
Google Apps Script Web API   (يُصدّر كل الأوراق كـ JSON)
      ↓
npm run sync                 (يقرأ القيم ويولّد الملف — بدون أي إعادة حساب)
      ↓
src/data/data.json
      ↓
موقع React
```

لا Excel. لا قاعدة بيانات. لا خادم. لا تسجيل دخول. مجرد قراءة قيم من الشيت.

## التقنيات

React 18 · Vite 6 · TypeScript · Tailwind CSS · Recharts. خط IBM Plex Sans Arabic.

---

## الإعداد لأول مرة

### 1) نشر Google Apps Script

1. افتح ملف Google Sheets، ثم **Extensions ▸ Apps Script**.
2. الصق محتوى [`apps-script/Code.gs`](apps-script/Code.gs) واحفظ.
3. **Deploy ▸ New deployment ▸ Web app** — بإعداد: *Execute as: Me*، و*Who has access: Anyone*.
4. انسخ رابط الـ Web app (ينتهي بـ `/exec`).

### 2) ضبط رابط الـ API

عرّف متغيّر البيئة `SHEETS_API_URL` بالرابط (الأفضل — لا يُحفظ في المستودع)، أو ضع الرابط مباشرةً في [`scripts/config.ts`](scripts/config.ts) بدل النص النائب.

### 3) التشغيل

```bash
npm install
npm run sync     # يجلب البيانات من Google Sheets ويولّد src/data/data.json
npm run dev      # http://localhost:5173
```

يعمل الموقع مباشرةً بعد هذه الأوامر دون أي إعداد إضافي.

---

## التحديث التلقائي (الطريقة المفضّلة)

الهدف: **افتح الشيت، عدّل، احفظ — والموقع يتحدّث تلقائياً** بأقل خطوات ممكنة.

يتضمّن المشروع سير عمل GitHub Actions جاهزاً في [`.github/workflows/sync.yml`](.github/workflows/sync.yml):

1. في مستودع GitHub: **Settings ▸ Secrets and variables ▸ Actions**، أضف سرّاً باسم `SHEETS_API_URL` وقيمته رابط الـ Web app.
2. هذا كل شيء. بعدها:
   - كل 15 دقيقة (قابلة للتعديل) يجلب السير الآلي أحدث بيانات الشيت، يولّد `data.json`، ويدفع أي تغيير — فيُعيد Vercel النشر تلقائياً.
   - أو اضغط **Run workflow** من تبويب Actions لتحديث فوري.

بهذا يصبح سير عملك: **تعديل الشيت ← حفظ ← (تحديث تلقائي)**. ولأن السير الآلي يدفع `data/history.json` أيضاً، تتراكم لقطات التاريخ ويستمر مؤشر التغيّر و«الأكثر تطوّراً» بالعمل عبر الزمن.

> يمكن تسريع التحديث بتغيير `cron` إلى `*/5 * * * *` (أدنى فاصل يسمح به GitHub).

### التحديث اليدوي (بديل)

من الجهاز أو Codespaces:

```bash
SHEETS_API_URL="https://…/exec" npm run sync
git add src/data/data.json data/history.json
git commit -m "تحديث النتائج"
git push
```

---

## النشر على Vercel

1. ارفع المشروع إلى مستودع GitHub.
2. من Vercel: **Add New ▸ Project** واستورد المستودع.
3. أضف متغيّر البيئة `SHEETS_API_URL` في إعدادات المشروع على Vercel (حتى يجلب البناء أحدث البيانات).
4. لا حاجة لأي إعداد آخر — Vercel يكتشف Vite ويشغّل `npm run build` (الذي يتضمّن المزامنة).

> التوجيه يعتمد على الـ hash (`#/`، `#/statistics`، `#/group/G01`)، لذا **لا يحتاج الموقع لأي قواعد إعادة توجيه** على Vercel أو GitHub Pages أو أي استضافة ثابتة.

**متانة البناء:** إن كان الرابط غير مضبوط أو تعذّر الوصول للـ API أثناء البناء، تُبقي المزامنة آخر `data.json` منشوراً ولا يفشل البناء.

---

## ملاحظات مهمة

- **مؤشر التغيّر و«الأكثر تطوّراً»** يُحسبان من لقطات المزامنة المتتالية في `data/history.json`، لا من داخل الشيت. لذلك يظهران **بعد التحديث الثاني** للنتائج. تشغيل المزامنة مرتين على نفس البيانات لا يضيف لقطة مكررة (idempotent).
- **الموقع لا يعيد الحساب أبداً** — أي قيمة في الشيت تُعرض كما هي. يجب أن يحافظ الشيت على **نفس بنية الأوراق والأعمدة والمعادلات** (Settings, Groups, Engine, Attendance, Uniform, Competition, Haraki, Mohsen, Educational, Media, Community, Dashboard, Ranking).
- سقف التاريخ 60 لقطة — الأقدم يُحذف تلقائياً.
- الأسابيع الفارغة (كبعض البنود في بداية البرنامج) تظهر كحالات فارغة أنيقة، وليست أخطاء.

## هيكل المشروع

```
apps-script/Code.gs         كود Google Apps Script (يُنشر مرة واحدة)
.github/workflows/sync.yml  التحديث التلقائي المجدول
data/history.json           لقطات الترتيب المتراكمة (للتغيّر والمسار الزمني)
scripts/
  config.ts                 رابط الـ API (SHEETS_API_URL)
  sheets.ts                 جلب الـ API + بناء Workbook + أدوات عناوين الخلايا
  sheets-to-json.ts         المحلّل: قيم الأوراق → SeasonData (منطق مُعاد استخدامه كما هو)
  sync.ts                   يدمج التاريخ والتغيّر والجوائز ويكتب data.json
src/
  data/data.json            المخرجات المولّدة (تُستورد في الحزمة)
  pages/                    Home · GroupDetails · Statistics · NotFound
  components/               ui · shared · layout · Podium · RankingTable · cards · charts · competitions · Icons
  lib/                      data · format · constants · utils · i18n (كل النصوص العربية)
  router.tsx                موجّه خفيف مبني على الـ hash
  types.ts                  تعريفات TypeScript (SeasonData وغيرها)
```

## ملاحظات معمارية

- **طبقة البيانات فقط هي التي تغيّرت.** الواجهة والتصميم والألوان والتوجيه والمكوّنات والمخططات وواجهة `SeasonData` كلها كما هي — الموقع لا يلاحظ أي فرق.
- **إعادة استخدام كامل للمحلّل:** منطق قراءة الخلايا بالعنوان (`sheets-to-json.ts`) هو نفسه السابق حرفياً؛ استُبدل فقط مصدر التحميل. `scripts/sheets.ts` يحوّل استجابة الـ API إلى نفس شكل الـ Workbook الذي كان قارئ الإكسل ينتجه، فلم يَعُد هناك اعتماد على مكتبة `xlsx`.
- **صفر منطق مكرر:** الحسابات كلها في Google Sheets؛ المزامنة تقرأ وتنسّق فقط، وتضيف طبقة التاريخ/التغيّر/الجوائز التي يحتاجها العرض.

## أسئلة شائعة

**غيّرت خلية في الشيت ولم يتغيّر الموقع؟** انتظر دورة المزامنة التلقائية (حتى 15 دقيقة) أو شغّل **Run workflow**؛ ومحلياً `npm run sync`. تأكّد أن `SHEETS_API_URL` مضبوط في أسرار GitHub وفي Vercel.

**لماذا قد لا تطابق نسبة مجموعة جمع فئاتها يدوياً؟** المحلّل يتحقّق تلقائياً (فرق > 0.5٪ يوقف المزامنة)؛ أي فرق أصغر مصدره تقريب الشيت نفسه.

**كيف أغيّر الألوان أو الخط؟** الألوان في `tailwind.config.ts` + `src/index.css`، والخط في `index.html` و`tailwind.config.ts`.
