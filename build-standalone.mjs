/**
 * بيجمّع المشروع كله (HTML + CSS + كل ملفات JS) في ملف واحد.
 *
 * الملف الناتج بيتفتح بدبل كليك عادي من غير سيرفر ولا نت — عشان النسخة
 * العادية بتستخدم JavaScript modules والمتصفح بيمنعها من الملفات المحلية.
 *
 * التشغيل:  node build-standalone.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');

/** ترتيب الملفات مهم — كل ملف بيعتمد على اللي قبله */
const MODULES = [
  'js/db.js',
  'js/ui.js',
  'js/store.js',
  'js/seed.js',
  'js/pages/dashboard.js',
  'js/pages/patients.js',
  'js/pages/appointments.js',
  'js/pages/records.js',
  'js/pages/doctors.js',
  'js/pages/invoices.js',
  'js/pages/reports.js',
  'js/pages/settings.js',
  'js/app.js',
];

/** أسماء الصفحات اللي app.js بيستوردها، عشان نحوّل export default لمتغير */
const PAGE_VARS = {
  'js/pages/dashboard.js': 'dashboard',
  'js/pages/patients.js': 'patientsPage',
  'js/pages/appointments.js': 'appointmentsPage',
  'js/pages/records.js': 'recordsPage',
  'js/pages/doctors.js': 'doctorsPage',
  'js/pages/invoices.js': 'invoicesPage',
  'js/pages/reports.js': 'reportsPage',
  'js/pages/settings.js': 'settingsPage',
};

function flatten(path) {
  let src = read(path);

  // شيل كل سطور الاستيراد — كل حاجة هتبقى في نفس النطاق
  src = src.replace(/^\s*import\s+[^;]*?;\s*$/gm, '');

  // export default {…}  →  const <اسم الصفحة> = {…}
  if (PAGE_VARS[path]) {
    src = src.replace(/^export\s+default\s+/m, `const ${PAGE_VARS[path]} = `);
  }

  // export [async] function/const/let/class  →  من غير export
  src = src.replace(/^export\s+(?=(async\s+)?(function|const|let|class)\b)/gm, '');

  return `\n/* ═══ ${path} ═══ */\n${src.trim()}\n`;
}

const css = read('css/styles.css');
const js = MODULES.map(flatten).join('\n');

/** جسم الصفحة من index.html — من بعد <body> لحد قبل <script> */
const html = read('index.html')
  .split(/<body>/)[1]
  .split(/<script/)[0]
  .trim();

const bundle = (full) => `${full ? `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ClinicFlow — منصة إدارة العيادات</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🩺</text></svg>">
` : `<title>ClinicFlow — منصة إدارة العيادات</title>
`}<style>
${css}
</style>
${full ? '</head>\n<body>' : ''}
${html}

<script>
// الاتجاه من اليمين لليسار — مضبوط هنا عشان الملف يشتغل مدموج في أي صفحة
document.documentElement.lang = 'ar';
document.documentElement.dir = 'rtl';

(function () {
'use strict';
${js}
})();
</script>
${full ? '</body>\n</html>' : ''}
`;

// نسخة كاملة للتحميل والفتح بدبل كليك
writeFileSync(join(root, 'clinicflow-standalone.html'), bundle(true));

// نسخة من غير <html>/<head>/<body> للنشر كصفحة ويب
const out = process.argv[2];
if (out) writeFileSync(out, bundle(false));

console.log('✓ clinicflow-standalone.html اتعمل' + (out ? `\n✓ ${out} اتعمل` : ''));
