/** السجلات الطبية — تشخيص وروشتة لكل زيارة، مع طباعة الروشتة */

import { records, patients, doctors, settings } from '../store.js';
import {
  esc, h, modal, field, options, formData, toast, confirmBox, empty,
  fmtDate, today, printView, age,
} from '../ui.js';

async function recordForm(existing = null, preset = {}) {
  const r = { ...preset, ...(existing || {}) };
  const isEdit = !!existing;

  const [pats, docs] = await Promise.all([patients.all(), doctors.active()]);

  if (!pats.length) {
    toast('ضيف مريض واحد على الأقل الأول', 'warn');
    location.hash = '#/patients';
    return null;
  }

  let saved = null;
  await modal(
    isEdit ? 'تعديل السجل الطبي' : 'سجل طبي جديد',
    `
    <div class="field-row">
      ${field('المريض *', `<select name="patientId" required>
        <option value="">— اختار المريض —</option>
        ${options(pats.sort((x, y) => x.name.localeCompare(y.name, 'ar')), 'id', (p) => `${p.name} — ${p.phone}`, r.patientId)}
      </select>`)}
      ${field('الطبيب', `<select name="doctorId">
        <option value="">— غير محدد —</option>
        ${options(docs, 'id', (d) => `${d.name} — ${d.specialty}`, r.doctorId)}
      </select>`)}
    </div>

    ${field('تاريخ الزيارة', `<input type="date" name="date" value="${esc(r.date || today())}">`)}
    ${field('الأعراض والشكوى', `<textarea name="symptoms" placeholder="اللي المريض بيشتكي منه…">${esc(r.symptoms || '')}</textarea>`)}
    ${field('التشخيص *', `<textarea name="diagnosis" required>${esc(r.diagnosis || '')}</textarea>`)}
    ${field('الروشتة', `<textarea name="prescription" rows="5" placeholder="دواء وجرعته في كل سطر…">${esc(r.prescription || '')}</textarea>`,
      'اكتب كل دواء في سطر لوحده عشان الروشتة تطلع منظمة في الطباعة')}
    ${field('ملاحظات وتعليمات', `<textarea name="notes">${esc(r.notes || '')}</textarea>`)}
    `,
    {
      okLabel: isEdit ? 'حفظ التعديلات' : 'حفظ السجل',
      wide: true,
      async onSubmit(form) {
        saved = await records.save({ ...r, ...formData(form) });
        toast(isEdit ? 'اتحفظ السجل' : 'تم حفظ السجل الطبي');
      },
    }
  );
  return saved;
}

/** روشتة جاهزة للطباعة */
function printPrescription(rec, patient, doctor, cfg) {
  const a = age(patient?.birthDate);
  printView(
    'روشتة طبية',
    `<div class="p-head">
      <div><div class="p-clinic">${esc(cfg.clinicName)}</div>
        <div class="p-meta">${esc(cfg.phone)} — ${esc(cfg.address)}</div></div>
      <div class="p-meta">
        ${doctor ? `<div><strong>${esc(doctor.name)}</strong></div><div>${esc(doctor.specialty)}</div>` : ''}
        <div>${esc(fmtDate(rec.date))}</div>
      </div>
    </div>

    <table><tbody>
      <tr><th style="width:100px">المريض</th><td>${esc(patient?.name || '—')}</td>
          <th style="width:70px">السن</th><td>${a !== null ? esc(a) + ' سنة' : '—'}</td></tr>
      ${patient?.allergies ? `<tr><th>تحذير</th><td colspan="3"><strong>${esc(patient.allergies)}</strong></td></tr>` : ''}
    </tbody></table>

    ${rec.diagnosis ? `<div class="p-section"><h3>التشخيص</h3><p>${esc(rec.diagnosis)}</p></div>` : ''}

    <div class="p-section">
      <h3>℞ العلاج</h3>
      <div style="white-space:pre-wrap;font-size:15px;line-height:2.1;min-height:150px">${esc(rec.prescription || '—')}</div>
    </div>

    ${rec.notes ? `<div class="p-section"><h3>تعليمات</h3><p style="white-space:pre-wrap">${esc(rec.notes)}</p></div>` : ''}

    <div style="margin-top:40px;text-align:end">
      <div style="border-top:1px solid #333;display:inline-block;padding-top:6px;min-width:180px;text-align:center">
        توقيع الطبيب
      </div>
    </div>`
  );
}

export default {
  async render(view, { actions, reload }) {
    const addBtn = h('<button class="btn btn--primary">+ سجل طبي</button>');
    addBtn.onclick = async () => { if (await recordForm()) reload(); };
    actions.appendChild(addBtn);

    const [list, pats, docs, cfg] = await Promise.all([
      records.all(), patients.all(), doctors.all(), settings.get(),
    ]);
    const pMap = Object.fromEntries(pats.map((p) => [p.id, p]));
    const dMap = Object.fromEntries(docs.map((d) => [d.id, d]));

    view.innerHTML = `
      <div class="toolbar">
        <input class="search" type="search" id="q" placeholder="ابحث باسم المريض أو التشخيص…">
        <span class="cell-sub" id="count"></span>
      </div>
      <div class="card"><div id="list"></div></div>`;

    const draw = (q = '') => {
      const term = q.trim().toLowerCase();
      const rows = list
        .filter((r) => {
          if (!term) return true;
          const p = pMap[r.patientId];
          return (
            (p?.name || '').toLowerCase().includes(term) ||
            (r.diagnosis || '').toLowerCase().includes(term)
          );
        })
        .sort((x, y) => (y.date || '').localeCompare(x.date || ''));

      view.querySelector('#count').textContent = `${rows.length} سجل`;
      view.querySelector('#list').innerHTML = rows.length
        ? `<div class="table-wrap"><table class="data">
            <thead><tr><th>التاريخ</th><th>المريض</th><th>الطبيب</th><th>التشخيص</th><th></th></tr></thead>
            <tbody>${rows.map((r) => {
              const p = pMap[r.patientId];
              return `<tr>
                <td>${esc(fmtDate(r.date))}</td>
                <td>${p ? `<a href="#/patients/${esc(p.id)}" class="cell-main">${esc(p.name)}</a>` : '<span class="cell-sub">مريض محذوف</span>'}</td>
                <td>${esc(dMap[r.doctorId]?.name || '—')}</td>
                <td>${esc(r.diagnosis)}
                  ${r.prescription ? '<div class="cell-sub">📝 فيه روشتة</div>' : ''}</td>
                <td class="actions">
                  <button class="btn btn--sm" data-print="${esc(r.id)}">🖨️ روشتة</button>
                  <button class="btn btn--sm" data-edit="${esc(r.id)}">تعديل</button>
                  <button class="btn btn--sm btn--ghost" data-del="${esc(r.id)}" style="color:var(--danger)">حذف</button>
                </td></tr>`;
            }).join('')}</tbody></table></div>`
        : empty('📋', q ? 'مفيش نتائج' : 'مفيش سجلات طبية لسه',
            q ? '' : 'السجل الطبي بيوثّق كل زيارة: الأعراض والتشخيص والروشتة.');

      view.querySelectorAll('[data-print]').forEach((b) => {
        b.onclick = () => {
          const r = list.find((x) => x.id === b.dataset.print);
          printPrescription(r, pMap[r.patientId], dMap[r.doctorId], cfg);
        };
      });

      view.querySelectorAll('[data-edit]').forEach((b) => {
        b.onclick = async () => {
          const r = await records.get(b.dataset.edit);
          if (await recordForm(r)) reload();
        };
      });

      view.querySelectorAll('[data-del]').forEach((b) => {
        b.onclick = async () => {
          if (!(await confirmBox('هتمسح السجل الطبي ده نهائيًا؟'))) return;
          await records.remove(b.dataset.del);
          toast('اتمسح السجل');
          reload();
        };
      });
    };

    let timer;
    view.querySelector('#q').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => draw(e.target.value), 180);
    });

    draw();
  },
};
