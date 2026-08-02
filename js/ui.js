/**
 * أدوات الواجهة المشتركة — نوافذ، تنبيهات، تنسيق، جداول
 */

/* ————————————————————————— تنسيق ————————————————————————— */

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** 2026-07-31 → 31 يوليو 2026 */
export function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${AR_MONTHS[m - 1]} ${y}`;
}

/** 2026-07-31 → الجمعة */
export function fmtDay(iso) {
  if (!iso) return '';
  const dt = new Date(iso + 'T00:00:00');
  return isNaN(dt) ? '' : AR_DAYS[dt.getDay()];
}

/** 14:30 → 2:30 م */
export function fmtTime(hhmm) {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? 'ص' : 'م';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function fmtMoney(n, currency = 'ج.م') {
  // أرقام لاتينية (1، 2، 3) عشان تبقى زي التواريخ والأوقات في باقي التطبيق —
  // 'ar-EG' لوحدها بتطلع أرقام هندية (١، ٢، ٣) وبتبقى متضاربة مع باقي الأرقام
  const num = (Number(n) || 0).toLocaleString('ar-EG-u-nu-latn', { maximumFractionDigits: 2 });
  return `${num} ${currency}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** بيحسب السن من تاريخ الميلاد */
export function age(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (isNaN(b)) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const mDiff = now.getMonth() - b.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

/** بيمنع حقن HTML من بيانات المستخدم */
export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ————————————————————————— DOM ————————————————————————— */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** بيبني عنصر من HTML نصّي */
export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* ————————————————————————— تنبيهات ————————————————————————— */

export function toast(message, type = 'ok') {
  const host = $('#toasts');
  const node = h(`<div class="toast toast--${type}">${esc(message)}</div>`);
  host.appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-in'));
  setTimeout(() => {
    node.classList.remove('is-in');
    setTimeout(() => node.remove(), 250);
  }, 3200);
}

/* ————————————————————————— نافذة منبثقة ————————————————————————— */

/** مكدّس النوافذ — بيسمح بفتح نافذة جوه نافذة (مثلاً "مريض جديد" من جوه حجز موعد) */
const _stack = [];

/**
 * بيفتح نافذة. بيرجّع Promise بينتهي لما النافذة تتقفل.
 * @param {string} title العنوان
 * @param {string} bodyHtml محتوى النافذة
 * @param {object} opts { okLabel, wide, onOpen(node), onSubmit(form, node) }
 *   onOpen بيتنادى فورًا بعد ما النافذة تظهر — استخدمه لربط أي أزرار جواها.
 *   لو onSubmit رجّع false النافذة بتفضل مفتوحة.
 */
export function modal(title, bodyHtml, opts = {}) {
  const node = h(`
    <div class="modal-backdrop">
      <div class="modal ${opts.wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true">
        <header class="modal__head">
          <h2>${esc(title)}</h2>
          <button class="icon-btn" data-close aria-label="إغلاق">✕</button>
        </header>
        <form class="modal__body" novalidate>${bodyHtml}</form>
        <footer class="modal__foot">
          <button type="button" class="btn btn--ghost" data-close>إلغاء</button>
          <button type="button" class="btn btn--primary" data-ok>${esc(opts.okLabel || 'حفظ')}</button>
        </footer>
      </div>
    </div>
  `);

  // النوافذ المتداخلة لازم تبقى فوق اللي تحتها
  node.style.zIndex = 100 + _stack.length * 10;
  document.body.appendChild(node);
  document.body.classList.add('is-locked');

  return new Promise((resolve) => {
    const close = () => {
      const i = _stack.indexOf(entry);
      if (i === -1) return;
      _stack.splice(i, 1);
      node.remove();
      document.removeEventListener('keydown', onKey);
      if (!_stack.length) document.body.classList.remove('is-locked');
      resolve();
    };

    const onKey = (e) => {
      // Escape بيقفل النافذة اللي فوق خالص بس
      if (e.key === 'Escape' && _stack[_stack.length - 1] === entry) close();
    };

    const entry = { node, close };
    _stack.push(entry);
    document.addEventListener('keydown', onKey);

    node.addEventListener('click', (e) => {
      if (e.target === node || e.target.closest('[data-close]')) close();
    });

    const submit = async () => {
      const form = node.querySelector('form');
      const okBtn = node.querySelector('[data-ok]');
      okBtn.disabled = true;
      try {
        const done = await opts.onSubmit?.(form, node);
        if (done !== false) close();
        else okBtn.disabled = false;
      } catch (err) {
        toast(err.message || 'حصل خطأ', 'error');
        okBtn.disabled = false;
      }
    };

    node.querySelector('[data-ok]').addEventListener('click', submit);
    node.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      submit();
    });

    // الربط بيحصل والنافذة مفتوحة، مش بعد ما تتقفل
    opts.onOpen?.(node);
    node.querySelector('input, select, textarea')?.focus();
  });
}

/** بيقفل النافذة اللي فوق خالص */
export function closeModal() {
  _stack[_stack.length - 1]?.close();
}

/** تأكيد قبل حذف — بيرجّع true/false */
export function confirmBox(message, okLabel = 'احذف') {
  return new Promise((resolve) => {
    const node = h(`
      <div class="modal-backdrop">
        <div class="modal modal--sm" role="dialog" aria-modal="true">
          <div class="modal__body confirm">
            <div class="confirm__icon">⚠️</div>
            <p>${esc(message)}</p>
          </div>
          <footer class="modal__foot">
            <button class="btn btn--ghost" data-no>تراجع</button>
            <button class="btn btn--danger" data-yes>${esc(okLabel)}</button>
          </footer>
        </div>
      </div>
    `);
    document.body.appendChild(node);
    document.body.classList.add('is-locked');

    const done = (val) => {
      node.remove();
      document.body.classList.remove('is-locked');
      resolve(val);
    };
    node.querySelector('[data-yes]').onclick = () => done(true);
    node.querySelector('[data-no]').onclick = () => done(false);
    node.onclick = (e) => { if (e.target === node) done(false); };
  });
}

/* ————————————————————————— نماذج ————————————————————————— */

/** بيقرا كل حقول الفورم في كائن */
export function formData(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    out[el.name] = el.type === 'checkbox' ? el.checked : el.value;
  }
  return out;
}

export function field(label, inputHtml, hint = '') {
  return `
    <label class="field">
      <span class="field__label">${esc(label)}</span>
      ${inputHtml}
      ${hint ? `<span class="field__hint">${esc(hint)}</span>` : ''}
    </label>`;
}

export function options(list, valueKey, labelFn, selected) {
  return list
    .map((it) => {
      const v = it[valueKey];
      return `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(labelFn(it))}</option>`;
    })
    .join('');
}

/* ————————————————————————— حالة فاضية ————————————————————————— */

export function empty(icon, title, hint = '', actionHtml = '') {
  return `
    <div class="empty">
      <div class="empty__icon">${icon}</div>
      <h3>${esc(title)}</h3>
      ${hint ? `<p>${esc(hint)}</p>` : ''}
      ${actionHtml}
    </div>`;
}

/* ————————————————————————— طباعة / PDF ————————————————————————— */

/**
 * بيجهّز محتوى للطباعة وبيفتح نافذة الطباعة.
 * المتصفح نفسه بيدي خيار "حفظ كـ PDF" — وده أحسن من مكتبات PDF
 * لأنه بيتعامل مع العربي والاتجاه من اليمين لليسار صح ١٠٠٪.
 */
export function printView(title, bodyHtml) {
  const host = $('#print-area');
  host.innerHTML = `
    <div class="print-doc">
      <h1 class="print-doc__title">${esc(title)}</h1>
      ${bodyHtml}
      <div class="print-doc__foot">
        طُبع في ${fmtDate(today())} — ClinicFlow
      </div>
    </div>`;
  document.body.classList.add('is-printing');

  const cleanup = () => {
    document.body.classList.remove('is-printing');
    host.innerHTML = '';
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  setTimeout(() => window.print(), 80);
}
