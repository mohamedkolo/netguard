import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const BASE = 'http://127.0.0.1:8899/';
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });

page.setDefaultTimeout(6000); // فشل سريع بدل ما نستنى ٣٠ ثانية لكل خطوة

page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

const step = async (label, fn) => {
  const before = errors.length;
  // نشيل أي نافذة سايبة من خطوة فشلت، عشان الفشل ما يتسلسلش
  await page.evaluate(() => {
    document.querySelectorAll('.modal-backdrop').forEach((n) => n.remove());
    document.body.classList.remove('is-locked');
  }).catch(() => {});
  try { await fn(); } catch (e) { errors.push(`STEP "${label}" failed: ${e.message.split('\n')[0]}`); }
  const news = errors.slice(before);
  console.log(`${news.length ? '✗' : '✓'} ${label}${news.length ? '\n    ' + news.join('\n    ') : ''}`);
};

await step('تحميل الصفحة', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.stat', { timeout: 5000 });
});

const routes = ['dashboard', 'appointments', 'patients', 'records', 'doctors', 'invoices', 'reports', 'settings'];
for (const r of routes) {
  await step(`صفحة ${r}`, async () => {
    await page.goto(BASE + '#/' + r);
    await page.waitForFunction(() => !document.querySelector('#view .loading'), { timeout: 5000 });
    const txt = await page.textContent('#view');
    if (!txt || txt.trim().length < 10) throw new Error('الصفحة فاضية');
  });
}

// ملف مريض
await step('ملف المريض', async () => {
  await page.goto(BASE + '#/patients');
  await page.waitForSelector('a[href^="#/patients/"]');
  await page.click('a[href^="#/patients/"]');
  await page.waitForSelector('.timeline__item', { timeout: 5000 });
});

// إضافة مريض جديد
await step('إضافة مريض جديد', async () => {
  await page.goto(BASE + '#/patients');
  await page.waitForSelector('#page-actions .btn');
  await page.click('#page-actions .btn');
  await page.waitForSelector('.modal input[name="name"]');
  await page.fill('.modal input[name="name"]', 'اختبار آلي');
  await page.fill('.modal input[name="phone"]', '01555556666');
  await page.click('.modal [data-ok]');
  await page.waitForSelector('.modal', { state: 'detached', timeout: 5000 });
  await page.waitForFunction(() => document.body.innerText.includes('اختبار آلي'), { timeout: 5000 });
});

// التحقق من أن الحفظ استمر بعد إعادة التحميل
await step('البيانات بتفضل بعد إعادة التحميل', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await page.goto(BASE + '#/patients');
  await page.waitForFunction(() => document.body.innerText.includes('اختبار آلي'), { timeout: 5000 });
});

// البحث
await step('البحث في المرضى', async () => {
  await page.fill('#q', 'اختبار');
  await page.waitForFunction(() => document.querySelectorAll('#list tbody tr').length === 1, { timeout: 4000 });
});

// حجز موعد + منع التعارض
await step('حجز موعد جديد', async () => {
  await page.goto(BASE + '#/appointments');
  await page.waitForSelector('#page-actions .btn');
  await page.click('#page-actions .btn');
  await page.waitForSelector('.modal select[name="patientId"]');
  await page.selectOption('.modal select[name="patientId"]', { index: 1 });
  await page.selectOption('.modal select[name="doctorId"]', { index: 1 });
  await page.selectOption('.modal select[name="time"]', { index: 3 });
  await page.fill('.modal input[name="reason"]', 'اختبار آلي');
  await page.click('.modal [data-ok]');
  await page.waitForSelector('.modal', { state: 'detached', timeout: 5000 });
});

await step('منع حجز نفس الطبيب في نفس الوقت', async () => {
  await page.click('#page-actions .btn');
  await page.waitForSelector('.modal select[name="patientId"]');
  await page.selectOption('.modal select[name="patientId"]', { index: 2 });
  await page.selectOption('.modal select[name="doctorId"]', { index: 1 });
  await page.selectOption('.modal select[name="time"]', { index: 3 });
  await page.click('.modal [data-ok]');
  await page.waitForSelector('.toast--error', { timeout: 4000 });
  const t = await page.textContent('.toast--error');
  if (!t.includes('محجوز')) throw new Error('رسالة الخطأ غلط: ' + t);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.modal', { state: 'detached', timeout: 4000 });
});

// نافذة جوه نافذة
await step('نافذة "مريض جديد" جوه حجز الموعد', async () => {
  await page.click('#page-actions .btn');
  await page.waitForSelector('.modal [data-new-patient]');
  await page.click('.modal [data-new-patient]');
  await page.waitForFunction(() => document.querySelectorAll('.modal').length === 2, { timeout: 4000 });
  const inner = page.locator('.modal').nth(1);
  await inner.locator('input[name="name"]').fill('مريض متداخل');
  await inner.locator('input[name="phone"]').fill('01777778888');
  await inner.locator('[data-ok]').click();
  // النافذة الداخلية تقفل والخارجية تفضل مفتوحة
  await page.waitForFunction(() => document.querySelectorAll('.modal').length === 1, { timeout: 5000 });
  const val = await page.$eval('.modal select[name="patientId"] option:checked', (o) => o.textContent);
  if (!val.includes('مريض متداخل')) throw new Error('المريض الجديد مااتحددش في القائمة: ' + val);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.modal', { state: 'detached', timeout: 4000 });
});

// فاتورة: الحساب التلقائي
await step('إنشاء فاتورة والحساب التلقائي', async () => {
  await page.goto(BASE + '#/invoices');
  await page.waitForSelector('#page-actions .btn');
  await page.click('#page-actions .btn');
  await page.waitForSelector('.modal #items');
  await page.selectOption('.modal select[name="patientId"]', { index: 1 });
  await page.fill('.modal [data-item] [data-name]', 'كشف');
  await page.fill('.modal [data-item] [data-qty]', '2');
  await page.fill('.modal [data-item] [data-price]', '100');
  await page.fill('.modal [name="discount"]', '50');
  await page.fill('.modal [name="paid"]', '100');
  await page.waitForFunction(() => document.querySelector('#totals')?.innerText.includes('150'), { timeout: 4000 });
  await page.click('.modal [data-ok]');
  await page.waitForSelector('.modal', { state: 'detached', timeout: 5000 });
  await page.waitForFunction(() => document.body.innerText.includes('INV-'), { timeout: 4000 });
});

// إضافة بند وحذفه
await step('إضافة وحذف بنود الفاتورة', async () => {
  await page.click('#page-actions .btn');
  await page.waitForSelector('.modal #add-item');
  await page.click('.modal #add-item');
  await page.waitForFunction(() => document.querySelectorAll('[data-item]').length === 2, { timeout: 4000 });
  await page.click('.modal [data-item]:last-of-type [data-remove]');
  await page.waitForFunction(() => document.querySelectorAll('[data-item]').length === 1, { timeout: 4000 });
  await page.keyboard.press('Escape');
  await page.waitForSelector('.modal', { state: 'detached', timeout: 4000 });
});

// سجل طبي
await step('إضافة سجل طبي', async () => {
  await page.goto(BASE + '#/records');
  await page.waitForSelector('#page-actions .btn');
  await page.click('#page-actions .btn');
  await page.waitForSelector('.modal textarea[name="diagnosis"]');
  await page.selectOption('.modal select[name="patientId"]', { index: 1 });
  await page.fill('.modal textarea[name="diagnosis"]', 'تشخيص اختبار آلي');
  await page.fill('.modal textarea[name="prescription"]', 'دواء ١\nدواء ٢');
  await page.click('.modal [data-ok]');
  await page.waitForSelector('.modal', { state: 'detached', timeout: 5000 });
  await page.waitForFunction(() => document.body.innerText.includes('تشخيص اختبار آلي'), { timeout: 4000 });
});

// التقارير بفترة
await step('تقرير بفترة زمنية', async () => {
  await page.goto(BASE + '#/reports');
  await page.waitForSelector('#apply');
  await page.fill('#from', '2020-01-01');
  await page.click('#apply');
  await page.waitForFunction(() => document.querySelector('#out')?.innerText.includes('محصّل'), { timeout: 4000 });
});

// النسخة الاحتياطية
await step('تنزيل نسخة احتياطية', async () => {
  await page.goto(BASE + '#/settings');
  await page.waitForSelector('#backup');
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 6000 }),
    page.click('#backup'),
  ]);
  const name = dl.suggestedFilename();
  if (!name.startsWith('clinicflow-backup-')) throw new Error('اسم الملف غلط: ' + name);
});

// حفظ إعدادات العيادة
await step('حفظ بيانات العيادة', async () => {
  await page.fill('#clinic-form input[name="clinicName"]', 'عيادة الاختبار');
  await page.click('#clinic-form button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('#brand-clinic')?.textContent === 'عيادة الاختبار', { timeout: 4000 });
});

// الوضع الليلي
await step('الوضع الليلي', async () => {
  await page.click('#theme-toggle');
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark', { timeout: 3000 });
  await page.click('#theme-toggle');
});

// عرض الموبايل
await step('عرض الموبايل والقائمة الجانبية', async () => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto(BASE + '#/dashboard');
  await page.waitForSelector('#menu-btn');
  await page.click('#menu-btn');
  await page.waitForFunction(() => document.querySelector('#sidebar').classList.contains('is-open'), { timeout: 3000 });
  const scrollsX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (scrollsX) throw new Error('الصفحة بتسكرول أفقيًا على الموبايل');
  await page.setViewportSize({ width: 1400, height: 950 });
});

// لقطات
await page.goto(BASE + '#/dashboard');
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/claude-0/-home-user-netguard/3211b5a8-f0cf-5e55-8399-dbf72a768a09/scratchpad/shot-dashboard.png' });
await page.goto(BASE + '#/appointments');
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/claude-0/-home-user-netguard/3211b5a8-f0cf-5e55-8399-dbf72a768a09/scratchpad/shot-appointments.png' });

await browser.close();

console.log('\n' + '='.repeat(50));
if (errors.length) {
  console.log(`فشل — ${errors.length} مشكلة:`);
  errors.forEach((e) => console.log(' • ' + e));
  process.exit(1);
}
console.log('كل الاختبارات نجحت ✓');
