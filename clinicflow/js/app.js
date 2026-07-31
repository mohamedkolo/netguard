/**
 * نقطة البداية — التوجيه (router) وتشغيل الواجهة
 */

import { $, $$, toast } from './ui.js';
import { settings } from './store.js';
import { ensureSeed } from './seed.js';

import dashboard from './pages/dashboard.js';
import appointmentsPage from './pages/appointments.js';
import patientsPage from './pages/patients.js';
import recordsPage from './pages/records.js';
import doctorsPage from './pages/doctors.js';
import invoicesPage from './pages/invoices.js';
import reportsPage from './pages/reports.js';
import settingsPage from './pages/settings.js';

const ROUTES = {
  '/dashboard': { title: 'لوحة التحكم', page: dashboard },
  '/appointments': { title: 'المواعيد', page: appointmentsPage },
  '/patients': { title: 'المرضى', page: patientsPage },
  '/records': { title: 'السجلات الطبية', page: recordsPage },
  '/doctors': { title: 'الأطباء', page: doctorsPage },
  '/invoices': { title: 'الفواتير', page: invoicesPage },
  '/reports': { title: 'التقارير', page: reportsPage },
  '/settings': { title: 'الإعدادات', page: settingsPage },
};

/* ————————————————————————— التوجيه ————————————————————————— */

/** بيقسم "#/patients/abc123" إلى ["/patients", "abc123"] */
function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/dashboard';
  const parts = raw.split('/').filter(Boolean);
  return { path: '/' + (parts[0] || 'dashboard'), param: parts[1] || null };
}

async function render() {
  const { path, param } = parseHash();
  const route = ROUTES[path] || ROUTES['/dashboard'];

  $('#page-title').textContent = route.title;
  $('#page-actions').innerHTML = '';
  $('#view').innerHTML = '<div class="loading">جارِ التحميل…</div>';

  $$('.nav__item').forEach((a) => {
    a.classList.toggle('is-active', a.getAttribute('href') === '#' + path);
  });

  closeSidebar();
  window.scrollTo(0, 0);

  try {
    await route.page.render($('#view'), { param, actions: $('#page-actions'), reload: render });
  } catch (err) {
    console.error(err);
    $('#view').innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div>
      <h3>حصلت مشكلة في تحميل الصفحة</h3><p>${err.message}</p></div>`;
  }
}

/* ————————————————————————— القائمة الجانبية على الموبايل ————————————————————————— */

function openSidebar() {
  $('#sidebar').classList.add('is-open');
  $('#sidebar-scrim').classList.add('is-open');
}
function closeSidebar() {
  $('#sidebar').classList.remove('is-open');
  $('#sidebar-scrim').classList.remove('is-open');
}

/* ————————————————————————— الوضع الليلي ————————————————————————— */

function applyTheme(mode) {
  document.documentElement.dataset.theme = mode;
  localStorage.setItem('clinicflow-theme', mode);
  $('#theme-toggle').textContent = mode === 'dark' ? '☀️ الوضع النهاري' : '🌙 الوضع الليلي';
}

/* ————————————————————————— التشغيل ————————————————————————— */

async function boot() {
  applyTheme(localStorage.getItem('clinicflow-theme') || 'light');

  $('#theme-toggle').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  $('#menu-btn').addEventListener('click', openSidebar);
  $('#sidebar-scrim').addEventListener('click', closeSidebar);

  window.addEventListener('hashchange', render);

  try {
    await ensureSeed();
    const s = await settings.get();
    $('#brand-clinic').textContent = s.clinicName;
    document.title = `${s.clinicName} — ClinicFlow`;
  } catch (err) {
    console.error(err);
    toast('مشكلة في فتح قاعدة البيانات — جرّب متصفح تاني', 'error');
  }

  await render();
}

boot();
