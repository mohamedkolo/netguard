/** الأطباء — قائمة وإدارة */

import { doctors, appointments, settings } from '../store.js';
import { esc, h, modal, field, formData, toast, confirmBox, empty, fmtMoney } from '../ui.js';

const SPECIALTIES = [
  'باطنة', 'أطفال', 'نساء وتوليد', 'عظام', 'جلدية', 'أسنان',
  'مخ وأعصاب', 'قلب', 'أنف وأذن', 'عيون', 'مسالك بولية', 'علاج طبيعي', 'تخصص آخر',
];

async function doctorForm(existing = null) {
  const d = existing || {};
  const isEdit = !!existing;

  let saved = null;
  await modal(
    isEdit ? 'تعديل بيانات الطبيب' : 'طبيب جديد',
    `
    ${field('اسم الطبيب *', `<input type="text" name="name" value="${esc(d.name || '')}" placeholder="د. …" required>`)}
    <div class="field-row">
      ${field('التخصص *', `<select name="specialty" required>
        <option value="">— اختار —</option>
        ${SPECIALTIES.map((s) => `<option value="${esc(s)}" ${d.specialty === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
      </select>`)}
      ${field('سعر الكشف', `<input type="number" name="fee" min="0" step="5" value="${esc(d.fee ?? 0)}">`)}
    </div>
    <div class="field-row">
      ${field('التليفون', `<input type="tel" name="phone" value="${esc(d.phone || '')}">`)}
      ${field('البريد الإلكتروني', `<input type="email" name="email" value="${esc(d.email || '')}">`)}
    </div>
    ${field('أيام وساعات العمل', `<input type="text" name="schedule" value="${esc(d.schedule || '')}" placeholder="مثلاً: السبت والاثنين ٤م — ٩م">`)}
    <label class="check">
      <input type="checkbox" name="active" ${d.active !== false ? 'checked' : ''}>
      <span>نشط — يظهر في قائمة حجز المواعيد</span>
    </label>
    `,
    {
      okLabel: isEdit ? 'حفظ التعديلات' : 'إضافة الطبيب',
      async onSubmit(form) {
        saved = await doctors.save({ ...d, ...formData(form) });
        toast(isEdit ? 'اتحفظت التعديلات' : 'تمت إضافة الطبيب');
      },
    }
  );
  return saved;
}

export default {
  async render(view, { actions, reload }) {
    const addBtn = h('<button class="btn btn--primary">+ طبيب جديد</button>');
    addBtn.onclick = async () => { if (await doctorForm()) reload(); };
    actions.appendChild(addBtn);

    const [list, appts, cfg] = await Promise.all([
      doctors.all(),
      appointments.all(),
      settings.get(),
    ]);

    const counts = {};
    for (const a of appts) counts[a.doctorId] = (counts[a.doctorId] || 0) + 1;

    view.innerHTML = `<div class="card">${
      list.length
        ? `<div class="table-wrap"><table class="data">
            <thead><tr><th>الطبيب</th><th>التخصص</th><th>سعر الكشف</th><th>المواعيد</th><th>الحالة</th><th></th></tr></thead>
            <tbody>${list
              .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
              .map((d) => `<tr>
                <td><div class="cell-main">${esc(d.name)}</div>
                  <div class="cell-sub">${esc(d.phone || '')} ${d.schedule ? '· ' + esc(d.schedule) : ''}</div></td>
                <td>${esc(d.specialty)}</td>
                <td class="num">${esc(fmtMoney(d.fee, cfg.currency))}</td>
                <td class="num">${counts[d.id] || 0}</td>
                <td><span class="badge badge--${d.active !== false ? 'ok' : 'muted'}">${d.active !== false ? 'نشط' : 'موقوف'}</span></td>
                <td class="actions">
                  <button class="btn btn--sm" data-edit="${esc(d.id)}">تعديل</button>
                  <button class="btn btn--sm btn--ghost" data-del="${esc(d.id)}" style="color:var(--danger)">حذف</button>
                </td></tr>`).join('')}</tbody></table></div>`
        : empty('👨‍⚕️', 'مفيش أطباء لسه', 'لازم تضيف طبيب واحد على الأقل قبل ما تقدر تحجز مواعيد.')
    }</div>`;

    view.querySelectorAll('[data-edit]').forEach((b) => {
      b.onclick = async () => {
        const d = await doctors.get(b.dataset.edit);
        if (await doctorForm(d)) reload();
      };
    });

    view.querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = async () => {
        const d = await doctors.get(b.dataset.del);
        if (!(await confirmBox(`هتمسح "${d.name}" نهائيًا؟`))) return;
        try {
          await doctors.remove(d.id);
          toast('اتمسح الطبيب');
          reload();
        } catch (err) {
          toast(err.message, 'error');
        }
      };
    });
  },
};
