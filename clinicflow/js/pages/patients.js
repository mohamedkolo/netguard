/** المرضى — قائمة، إضافة/تعديل، وملف المريض الكامل */

import { patients, appointments, records, invoices, doctors, settings, APPOINTMENT_STATUS } from '../store.js';
import {
  esc, h, modal, field, formData, toast, confirmBox, empty,
  fmtDate, fmtTime, fmtMoney, age, printView, today,
} from '../ui.js';

const GENDER = { male: 'ذكر', female: 'أنثى' };

/* ————————————————————————— فورم المريض ————————————————————————— */

export async function patientForm(existing = null) {
  const p = existing || {};
  const isEdit = !!existing;

  let saved = null;
  await modal(
    isEdit ? 'تعديل بيانات المريض' : 'مريض جديد',
    `
    ${field('الاسم بالكامل *', `<input type="text" name="name" value="${esc(p.name || '')}" required>`)}
    <div class="field-row">
      ${field('رقم التليفون *', `<input type="tel" name="phone" value="${esc(p.phone || '')}" required>`)}
      ${field('الرقم القومي', `<input type="text" name="nationalId" value="${esc(p.nationalId || '')}">`)}
    </div>
    <div class="field-row">
      ${field('النوع', `<select name="gender">
        <option value="male" ${p.gender === 'male' ? 'selected' : ''}>ذكر</option>
        <option value="female" ${p.gender === 'female' ? 'selected' : ''}>أنثى</option>
      </select>`)}
      ${field('تاريخ الميلاد', `<input type="date" name="birthDate" value="${esc(p.birthDate || '')}">`)}
    </div>
    <div class="field-row">
      ${field('فصيلة الدم', `<select name="bloodType">
        ${['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
          .map((b) => `<option value="${b}" ${p.bloodType === b ? 'selected' : ''}>${b || '— غير محدد —'}</option>`)
          .join('')}
      </select>`)}
      ${field('العنوان', `<input type="text" name="address" value="${esc(p.address || '')}">`)}
    </div>
    ${field('حساسية أو تحذيرات طبية', `<textarea name="allergies" placeholder="مثلاً: حساسية من البنسلين">${esc(p.allergies || '')}</textarea>`,
      'بيظهر تحذير أحمر في ملف المريض لو كتبت هنا حاجة')}
    ${field('ملاحظات', `<textarea name="notes">${esc(p.notes || '')}</textarea>`)}
    `,
    {
      okLabel: isEdit ? 'حفظ التعديلات' : 'إضافة المريض',
      async onSubmit(form) {
        saved = await patients.save({ ...p, ...formData(form) });
        toast(isEdit ? 'اتحفظت التعديلات' : 'تمت إضافة المريض');
      },
    }
  );
  return saved;
}

/* ————————————————————————— ملف المريض ————————————————————————— */

async function renderProfile(view, id, reload) {
  const p = await patients.get(id);
  if (!p) {
    view.innerHTML = empty('🔍', 'المريض ده مش موجود', '', '<a class="btn btn--primary" href="#/patients">رجوع للمرضى</a>');
    return;
  }

  const [appts, recs, invs, docs, cfg] = await Promise.all([
    appointments.byPatient(id),
    records.byPatient(id),
    invoices.byPatient(id),
    doctors.all(),
    settings.get(),
  ]);
  const dMap = Object.fromEntries(docs.map((d) => [d.id, d]));

  const a = age(p.birthDate);
  const totalDue = invs.reduce((s, i) => s + (i.due || 0), 0);

  view.innerHTML = `
    <a class="btn btn--sm btn--ghost" href="#/patients" style="margin-bottom:14px">→ كل المرضى</a>

    ${p.allergies ? `<div class="card" style="border-color:var(--danger);margin-bottom:16px">
      <div class="card__body" style="display:flex;gap:10px;align-items:center">
        <span style="font-size:20px">⚠️</span>
        <div><strong style="color:var(--danger)">تحذير طبي:</strong> ${esc(p.allergies)}</div>
      </div></div>` : ''}

    <div class="grid grid--2">
      <div class="card">
        <div class="card__head">
          <h2>${esc(p.name)}</h2>
          <button class="btn btn--sm" data-edit>تعديل</button>
          <button class="btn btn--sm" data-print>🖨️ طباعة الملف</button>
        </div>
        <div class="card__body">
          <table class="data" style="min-width:0">
            <tbody>
              <tr><th style="width:130px">التليفون</th><td>${esc(p.phone)}</td></tr>
              <tr><th>السن</th><td>${a !== null ? esc(a) + ' سنة' : '—'}</td></tr>
              <tr><th>النوع</th><td>${esc(GENDER[p.gender] || '—')}</td></tr>
              <tr><th>فصيلة الدم</th><td>${esc(p.bloodType || '—')}</td></tr>
              <tr><th>العنوان</th><td>${esc(p.address || '—')}</td></tr>
              <tr><th>الرقم القومي</th><td>${esc(p.nationalId || '—')}</td></tr>
              <tr><th>ملاحظات</th><td>${esc(p.notes || '—')}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="grid grid--stats">
          <div class="stat"><div class="stat__icon">📅</div>
            <div><div class="stat__num">${appts.length}</div><div class="stat__label">موعد</div></div></div>
          <div class="stat"><div class="stat__icon" style="background:var(--warn-soft)">💰</div>
            <div><div class="stat__num" style="font-size:19px">${esc(fmtMoney(totalDue, cfg.currency))}</div>
            <div class="stat__label">مستحق عليه</div></div></div>
        </div>

        <div class="card">
          <div class="card__head"><h2>المواعيد</h2></div>
          ${appts.length ? `<div class="table-wrap"><table class="data" style="min-width:0">
            <tbody>${appts
              .sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time))
              .map((ap) => {
                const st = APPOINTMENT_STATUS[ap.status] || APPOINTMENT_STATUS.scheduled;
                return `<tr>
                  <td>${esc(fmtDate(ap.date))}<div class="cell-sub">${esc(fmtTime(ap.time))}</div></td>
                  <td>${esc(dMap[ap.doctorId]?.name || '—')}<div class="cell-sub">${esc(ap.reason || '')}</div></td>
                  <td><span class="badge badge--${st.tone}">${st.label}</span></td>
                </tr>`;
              })
              .join('')}</tbody></table></div>`
            : '<div class="card__body cell-sub">مفيش مواعيد مسجّلة.</div>'}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card__head"><h2>السجل الطبي (${recs.length})</h2>
        <a class="btn btn--sm btn--primary" href="#/records">إضافة سجل</a>
      </div>
      <div class="card__body">
        ${recs.length ? `<div class="timeline">${recs
          .sort((x, y) => (y.date || '').localeCompare(x.date || ''))
          .map((r) => `
            <div class="timeline__item">
              <div class="timeline__head">
                <span class="timeline__date">${esc(fmtDate(r.date))}</span>
                <span class="badge badge--muted">${esc(dMap[r.doctorId]?.name || 'طبيب غير محدد')}</span>
              </div>
              <dl class="timeline__body">
                ${r.symptoms ? `<dt>الأعراض</dt><dd>${esc(r.symptoms)}</dd>` : ''}
                <dt>التشخيص</dt><dd>${esc(r.diagnosis)}</dd>
                ${r.prescription ? `<dt>الروشتة</dt><dd>${esc(r.prescription)}</dd>` : ''}
                ${r.notes ? `<dt>ملاحظات</dt><dd>${esc(r.notes)}</dd>` : ''}
              </dl>
            </div>`).join('')}</div>`
          : '<div class="cell-sub">مفيش سجلات طبية لسه.</div>'}
      </div>
    </div>`;

  view.querySelector('[data-edit]').onclick = async () => {
    if (await patientForm(p)) reload();
  };

  view.querySelector('[data-print]').onclick = () => {
    printView(
      `الملف الطبي — ${p.name}`,
      `
      <div class="p-head">
        <div><div class="p-clinic">${esc(cfg.clinicName)}</div>
          <div class="p-meta">${esc(cfg.phone)} — ${esc(cfg.address)}</div></div>
        <div class="p-meta">تاريخ الطباعة: ${esc(fmtDate(today()))}</div>
      </div>

      <div class="p-section">
        <h3>بيانات المريض</h3>
        <table><tbody>
          <tr><th style="width:130px">الاسم</th><td>${esc(p.name)}</td>
              <th style="width:90px">التليفون</th><td>${esc(p.phone)}</td></tr>
          <tr><th>السن</th><td>${a !== null ? esc(a) + ' سنة' : '—'}</td>
              <th>فصيلة الدم</th><td>${esc(p.bloodType || '—')}</td></tr>
          <tr><th>النوع</th><td>${esc(GENDER[p.gender] || '—')}</td>
              <th>العنوان</th><td>${esc(p.address || '—')}</td></tr>
          ${p.allergies ? `<tr><th>تحذيرات</th><td colspan="3"><strong>${esc(p.allergies)}</strong></td></tr>` : ''}
        </tbody></table>
      </div>

      <div class="p-section">
        <h3>السجل الطبي</h3>
        ${recs.length ? recs
          .sort((x, y) => (y.date || '').localeCompare(x.date || ''))
          .map((r) => `
            <table><tbody>
              <tr><th style="width:110px">التاريخ</th><td>${esc(fmtDate(r.date))}</td>
                  <th style="width:90px">الطبيب</th><td>${esc(dMap[r.doctorId]?.name || '—')}</td></tr>
              ${r.symptoms ? `<tr><th>الأعراض</th><td colspan="3">${esc(r.symptoms)}</td></tr>` : ''}
              <tr><th>التشخيص</th><td colspan="3">${esc(r.diagnosis)}</td></tr>
              ${r.prescription ? `<tr><th>الروشتة</th><td colspan="3" style="white-space:pre-wrap">${esc(r.prescription)}</td></tr>` : ''}
              ${r.notes ? `<tr><th>ملاحظات</th><td colspan="3">${esc(r.notes)}</td></tr>` : ''}
            </tbody></table>`).join('')
          : '<p>لا توجد سجلات.</p>'}
      </div>`
    );
  };
}

/* ————————————————————————— القائمة ————————————————————————— */

export default {
  async render(view, { param, actions, reload }) {
    if (param) return renderProfile(view, param, reload);

    const addBtn = h('<button class="btn btn--primary">+ مريض جديد</button>');
    addBtn.onclick = async () => { if (await patientForm()) reload(); };
    actions.appendChild(addBtn);

    const list = await patients.all();

    view.innerHTML = `
      <div class="toolbar">
        <input class="search" type="search" id="q" placeholder="ابحث بالاسم أو التليفون…">
        <span class="cell-sub" id="count">${list.length} مريض</span>
      </div>
      <div class="card"><div id="list"></div></div>`;

    const draw = async (q = '') => {
      const rows = await patients.search(q);
      view.querySelector('#count').textContent = `${rows.length} مريض`;

      view.querySelector('#list').innerHTML = rows.length
        ? `<div class="table-wrap"><table class="data">
            <thead><tr><th>الاسم</th><th>التليفون</th><th>السن</th><th>فصيلة الدم</th><th></th></tr></thead>
            <tbody>${rows
              .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
              .map((p) => {
                const a = age(p.birthDate);
                return `<tr>
                  <td><a href="#/patients/${esc(p.id)}" class="cell-main">${esc(p.name)}</a>
                    ${p.allergies ? '<span class="badge badge--danger" style="margin-inline-start:6px">⚠️ حساسية</span>' : ''}</td>
                  <td class="num">${esc(p.phone)}</td>
                  <td>${a !== null ? esc(a) : '—'}</td>
                  <td>${esc(p.bloodType || '—')}</td>
                  <td class="actions">
                    <button class="btn btn--sm" data-edit="${esc(p.id)}">تعديل</button>
                    <button class="btn btn--sm btn--ghost" data-del="${esc(p.id)}" style="color:var(--danger)">حذف</button>
                  </td></tr>`;
              })
              .join('')}</tbody></table></div>`
        : empty('🧑‍🤝‍🧑', q ? 'مفيش نتائج للبحث ده' : 'مفيش مرضى لسه', q ? '' : 'ابدأ بإضافة أول مريض.');

      view.querySelectorAll('[data-edit]').forEach((b) => {
        b.onclick = async () => {
          const p = await patients.get(b.dataset.edit);
          if (await patientForm(p)) draw(view.querySelector('#q').value);
        };
      });

      view.querySelectorAll('[data-del]').forEach((b) => {
        b.onclick = async () => {
          const p = await patients.get(b.dataset.del);
          const ok = await confirmBox(
            `هتمسح "${p.name}" وكل مواعيده وسجلاته وفواتيره. الخطوة دي مالهاش رجعة.`
          );
          if (!ok) return;
          await patients.remove(p.id);
          toast('اتمسح المريض');
          draw(view.querySelector('#q').value);
        };
      });
    };

    let timer;
    view.querySelector('#q').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => draw(e.target.value), 180);
    });

    await draw();
  },
};
