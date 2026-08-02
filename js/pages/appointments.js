/** المواعيد — عرض باليوم، حجز موعد جديد، وتغيير الحالة */

import { appointments, patients, doctors, settings, APPOINTMENT_STATUS } from '../store.js';
import {
  esc, h, modal, field, options, formData, toast, confirmBox, empty,
  fmtDate, fmtDay, fmtTime, today, printView,
} from '../ui.js';
import { patientForm } from './patients.js';

/** بيولّد المواعيد المتاحة حسب ساعات العمل في الإعدادات */
function timeSlots(cfg) {
  const out = [];
  const [sh, sm] = cfg.workStart.split(':').map(Number);
  const [eh, em] = cfg.workEnd.split(':').map(Number);
  const step = Number(cfg.slotMinutes) || 30;
  for (let t = sh * 60 + sm; t <= eh * 60 + em; t += step) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return out;
}

/* ————————————————————————— فورم الموعد ————————————————————————— */

export async function appointmentForm(existing = null, preset = {}) {
  const a = { ...preset, ...(existing || {}) };
  const isEdit = !!existing;

  const [pats, docs, cfg] = await Promise.all([
    patients.all(),
    doctors.active(),
    settings.get(),
  ]);

  if (!docs.length) {
    toast('ضيف طبيب واحد على الأقل الأول', 'warn');
    location.hash = '#/doctors';
    return null;
  }

  let saved = null;
  await modal(
    isEdit ? 'تعديل الموعد' : 'حجز موعد جديد',
    `
    ${field('المريض *', `<select name="patientId" required>
      <option value="">— اختار المريض —</option>
      ${options(pats.sort((x, y) => x.name.localeCompare(y.name, 'ar')), 'id',
        (p) => `${p.name} — ${p.phone}`, a.patientId)}
    </select>`)}
    <button type="button" class="btn btn--sm" data-new-patient style="margin:-8px 0 14px">+ مريض جديد</button>

    ${field('الطبيب *', `<select name="doctorId" required>
      <option value="">— اختار الطبيب —</option>
      ${options(docs, 'id', (d) => `${d.name} — ${d.specialty}`, a.doctorId)}
    </select>`)}

    <div class="field-row">
      ${field('التاريخ *', `<input type="date" name="date" value="${esc(a.date || today())}" required>`)}
      ${field('الوقت *', `<select name="time" required>
        ${timeSlots(cfg).map((t) => `<option value="${t}" ${a.time === t ? 'selected' : ''}>${fmtTime(t)}</option>`).join('')}
      </select>`)}
    </div>

    ${field('سبب الزيارة', `<input type="text" name="reason" value="${esc(a.reason || '')}" placeholder="مثلاً: كشف أول، متابعة، ألم في…">`)}

    ${isEdit ? field('الحالة', `<select name="status">
      ${Object.entries(APPOINTMENT_STATUS)
        .map(([k, v]) => `<option value="${k}" ${a.status === k ? 'selected' : ''}>${v.label}</option>`)
        .join('')}
    </select>`) : ''}

    ${field('ملاحظات', `<textarea name="notes">${esc(a.notes || '')}</textarea>`)}
    `,
    {
      okLabel: isEdit ? 'حفظ التعديلات' : 'احجز الموعد',

      // زرار "مريض جديد" بيفتح نافذة جوه النافذة وبيضيف المريض للقائمة على طول
      onOpen(node) {
        node.querySelector('[data-new-patient]').onclick = async () => {
          const p = await patientForm();
          if (!p) return;
          const sel = node.querySelector('select[name="patientId"]');
          sel.appendChild(h(`<option value="${esc(p.id)}" selected>${esc(p.name)} — ${esc(p.phone)}</option>`));
          sel.value = p.id;
        };
      },

      async onSubmit(form) {
        saved = await appointments.save({ ...a, ...formData(form) });
        toast(isEdit ? 'اتحفظ الموعد' : 'تم حجز الموعد');
      },
    }
  );

  return saved;
}

/* ————————————————————————— الصفحة ————————————————————————— */

export default {
  async render(view, { actions, reload }) {
    const addBtn = h('<button class="btn btn--primary">+ موعد جديد</button>');
    addBtn.onclick = async () => { if (await appointmentForm()) reload(); };
    actions.appendChild(addBtn);

    const cfg = await settings.get();
    let date = today();
    let statusFilter = '';

    view.innerHTML = `
      <div class="toolbar">
        <button class="btn btn--sm" id="prev">→ السابق</button>
        <input type="date" id="date" value="${date}" style="width:auto">
        <button class="btn btn--sm" id="next">التالي ←</button>
        <button class="btn btn--sm" id="today">النهاردة</button>
        <select id="status" style="width:auto">
          <option value="">كل الحالات</option>
          ${Object.entries(APPOINTMENT_STATUS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}
        </select>
        <button class="btn btn--sm" id="print">🖨️ طباعة جدول اليوم</button>
      </div>
      <div class="card">
        <div class="card__head"><h2 id="day-title"></h2><span class="cell-sub" id="count"></span></div>
        <div id="list"></div>
      </div>`;

    const el = (id) => view.querySelector('#' + id);

    const draw = async () => {
      const listEl = el('list');
      if (!listEl) return;
      el('date').value = date;
      el('day-title').textContent = `${fmtDay(date)} — ${fmtDate(date)}`;

      let rows = await appointments.detailed((a) => a.date === date);
      // ممكن المستخدم يكون خرج من الصفحة والتحميل لسه شغال
      if (!listEl.isConnected) return;
      if (statusFilter) rows = rows.filter((a) => a.status === statusFilter);
      el('count').textContent = `${rows.length} موعد`;

      listEl.innerHTML = rows.length
        ? `<div class="table-wrap"><table class="data">
            <thead><tr><th>الوقت</th><th>المريض</th><th>الطبيب</th><th>سبب الزيارة</th><th>الحالة</th><th></th></tr></thead>
            <tbody>${rows.map((a) => {
              const st = APPOINTMENT_STATUS[a.status] || APPOINTMENT_STATUS.scheduled;
              return `<tr>
                <td class="num"><strong>${esc(fmtTime(a.time))}</strong></td>
                <td>${a.patient
                  ? `<a href="#/patients/${esc(a.patient.id)}" class="cell-main">${esc(a.patient.name)}</a>
                     <div class="cell-sub">${esc(a.patient.phone)}</div>`
                  : '<span class="cell-sub">مريض محذوف</span>'}</td>
                <td>${esc(a.doctor?.name || '—')}<div class="cell-sub">${esc(a.doctor?.specialty || '')}</div></td>
                <td>${esc(a.reason || '—')}</td>
                <td>
                  <select data-status="${esc(a.id)}" style="width:auto;padding:4px 8px;font-size:12.5px">
                    ${Object.entries(APPOINTMENT_STATUS)
                      .map(([k, v]) => `<option value="${k}" ${a.status === k ? 'selected' : ''}>${v.label}</option>`)
                      .join('')}
                  </select>
                </td>
                <td class="actions">
                  <button class="btn btn--sm" data-edit="${esc(a.id)}">تعديل</button>
                  <button class="btn btn--sm btn--ghost" data-del="${esc(a.id)}" style="color:var(--danger)">حذف</button>
                </td></tr>`;
            }).join('')}</tbody></table></div>`
        : empty('🗓️', 'مفيش مواعيد في اليوم ده', 'جرّب يوم تاني أو احجز موعد جديد.');

      view.querySelectorAll('[data-status]').forEach((sel) => {
        sel.onchange = async () => {
          const a = await appointments.get(sel.dataset.status);
          await appointments.save({ ...a, status: sel.value });
          toast('اتغيّرت حالة الموعد');
          draw();
        };
      });

      view.querySelectorAll('[data-edit]').forEach((b) => {
        b.onclick = async () => {
          const a = await appointments.get(b.dataset.edit);
          if (await appointmentForm(a)) draw();
        };
      });

      view.querySelectorAll('[data-del]').forEach((b) => {
        b.onclick = async () => {
          if (!(await confirmBox('هتلغي الموعد ده نهائيًا؟'))) return;
          await appointments.remove(b.dataset.del);
          toast('اتمسح الموعد');
          draw();
        };
      });
    };

    const shift = (days) => {
      const d = new Date(date + 'T00:00:00');
      d.setDate(d.getDate() + days);
      date = d.toISOString().slice(0, 10);
      draw();
    };

    el('prev').onclick = () => shift(-1);
    el('next').onclick = () => shift(1);
    el('today').onclick = () => { date = today(); draw(); };
    el('date').onchange = (e) => { date = e.target.value; draw(); };
    el('status').onchange = (e) => { statusFilter = e.target.value; draw(); };

    el('print').onclick = async () => {
      const rows = await appointments.detailed((a) => a.date === date);
      printView(
        `جدول مواعيد ${fmtDay(date)} ${fmtDate(date)}`,
        `<div class="p-head">
          <div><div class="p-clinic">${esc(cfg.clinicName)}</div>
            <div class="p-meta">${esc(cfg.phone)} — ${esc(cfg.address)}</div></div>
          <div class="p-meta">${esc(rows.length)} موعد</div>
        </div>
        ${rows.length ? `<table>
          <thead><tr><th>الوقت</th><th>المريض</th><th>التليفون</th><th>الطبيب</th><th>سبب الزيارة</th><th>الحالة</th></tr></thead>
          <tbody>${rows.map((a) => `<tr>
            <td>${esc(fmtTime(a.time))}</td>
            <td>${esc(a.patient?.name || '—')}</td>
            <td>${esc(a.patient?.phone || '—')}</td>
            <td>${esc(a.doctor?.name || '—')}</td>
            <td>${esc(a.reason || '—')}</td>
            <td>${esc((APPOINTMENT_STATUS[a.status] || {}).label || '—')}</td>
          </tr>`).join('')}</tbody></table>` : '<p>لا توجد مواعيد في هذا اليوم.</p>'}`
      );
    };

    await draw();
  },
};
