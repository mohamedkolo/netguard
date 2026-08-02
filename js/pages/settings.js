/** الإعدادات — بيانات العيادة، الخدمات، النسخ الاحتياطية */

import { settings, services } from '../store.js';
import { db } from '../db.js';
import { resetSeedFlag } from '../seed.js';
import {
  esc, h, field, formData, toast, confirmBox, modal, fmtMoney, $,
} from '../ui.js';

/* ————————————————————————— النسخ الاحتياطية ————————————————————————— */

async function downloadBackup() {
  const backup = await db.exportAll();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clinicflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('اتنزّلت النسخة الاحتياطية');
}

function restoreBackup(onDone) {
  const input = h('<input type="file" accept="application/json,.json" hidden>');
  document.body.appendChild(input);

  input.onchange = async () => {
    const file = input.files?.[0];
    input.remove();
    if (!file) return;

    const ok = await confirmBox(
      'الاسترجاع هيمسح كل البيانات الحالية ويحط مكانها اللي في الملف. متأكد؟',
      'استرجع'
    );
    if (!ok) return;

    try {
      const backup = JSON.parse(await file.text());
      await db.importAll(backup, true);
      toast('تم الاسترجاع بنجاح');
      onDone();
    } catch (err) {
      toast(err.message || 'الملف مش صالح', 'error');
    }
  };

  input.click();
}

/* ————————————————————————— الخدمات ————————————————————————— */

async function serviceForm(existing = null) {
  const s = existing || {};
  let saved = null;
  await modal(
    existing ? 'تعديل الخدمة' : 'خدمة جديدة',
    `${field('اسم الخدمة *', `<input type="text" name="name" value="${esc(s.name || '')}" required>`)}
     ${field('السعر', `<input type="number" name="price" min="0" step="5" value="${esc(s.price ?? 0)}">`)}`,
    {
      async onSubmit(form) {
        saved = await services.save({ ...s, ...formData(form) });
        toast('اتحفظت الخدمة');
      },
    }
  );
  return saved;
}

/* ————————————————————————— الصفحة ————————————————————————— */

export default {
  async render(view, { reload }) {
    const [cfg, srv] = await Promise.all([settings.get(), services.all()]);

    view.innerHTML = `
      <div class="grid grid--2">
        <div class="card">
          <div class="card__head"><h2>بيانات العيادة</h2></div>
          <div class="card__body">
            <form id="clinic-form">
              ${field('اسم العيادة', `<input type="text" name="clinicName" value="${esc(cfg.clinicName)}">`)}
              <div class="field-row">
                ${field('التليفون', `<input type="tel" name="phone" value="${esc(cfg.phone)}">`)}
                ${field('العملة', `<input type="text" name="currency" value="${esc(cfg.currency)}">`)}
              </div>
              ${field('العنوان', `<input type="text" name="address" value="${esc(cfg.address)}">`)}
              <div class="field-row--3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:0 14px">
                ${field('بداية العمل', `<input type="time" name="workStart" value="${esc(cfg.workStart)}">`)}
                ${field('نهاية العمل', `<input type="time" name="workEnd" value="${esc(cfg.workEnd)}">`)}
                ${field('مدة الموعد', `<select name="slotMinutes">
                  ${[15, 20, 30, 45, 60].map((m) => `<option value="${m}" ${Number(cfg.slotMinutes) === m ? 'selected' : ''}>${m} دقيقة</option>`).join('')}
                </select>`)}
              </div>
              <button type="submit" class="btn btn--primary">حفظ البيانات</button>
            </form>
          </div>
        </div>

        <div class="card">
          <div class="card__head"><h2>الخدمات والأسعار</h2>
            <button class="btn btn--sm btn--primary" id="add-service">+ خدمة</button>
          </div>
          <div class="table-wrap"><table class="data" style="min-width:0">
            <tbody id="services">${
              srv.length
                ? srv.map((s) => `<tr>
                    <td class="cell-main">${esc(s.name)}</td>
                    <td class="num">${esc(fmtMoney(s.price, cfg.currency))}</td>
                    <td class="actions">
                      <button class="btn btn--sm" data-edit-srv="${esc(s.id)}">تعديل</button>
                      <button class="btn btn--sm btn--ghost" data-del-srv="${esc(s.id)}" style="color:var(--danger)">حذف</button>
                    </td></tr>`).join('')
                : '<tr><td class="cell-sub" style="padding:20px;text-align:center">مفيش خدمات — ضيف خدماتك وأسعارها عشان تظهر لوحدها في الفواتير.</td></tr>'
            }</tbody>
          </table></div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card__head"><h2>النسخ الاحتياطية</h2></div>
        <div class="card__body">
          <p class="cell-sub" style="margin-bottom:14px">
            بيانات العيادة محفوظة على المتصفح ده وعلى الجهاز ده بس. لو مسحت بيانات المتصفح أو غيّرت الجهاز، البيانات هتضيع —
            <strong>فنزّل نسخة احتياطية بشكل دوري</strong>، ويفضل مرة كل أسبوع.
          </p>
          <div style="display:flex;gap:9px;flex-wrap:wrap">
            <button class="btn btn--primary" id="backup">⬇️ نزّل نسخة احتياطية</button>
            <button class="btn" id="restore">⬆️ استرجع من ملف</button>
            <button class="btn btn--ghost" id="wipe" style="color:var(--danger)">🗑️ امسح كل البيانات</button>
          </div>
        </div>
      </div>`;

    /* حفظ بيانات العيادة */
    view.querySelector('#clinic-form').onsubmit = async (e) => {
      e.preventDefault();
      await settings.save(formData(e.target));
      const s = await settings.get();
      $('#brand-clinic').textContent = s.clinicName;
      document.title = `${s.clinicName} — ClinicFlow`;
      toast('اتحفظت بيانات العيادة');
    };

    /* الخدمات */
    view.querySelector('#add-service').onclick = async () => {
      if (await serviceForm()) reload();
    };
    view.querySelectorAll('[data-edit-srv]').forEach((b) => {
      b.onclick = async () => {
        const s = srv.find((x) => x.id === b.dataset.editSrv);
        if (await serviceForm(s)) reload();
      };
    });
    view.querySelectorAll('[data-del-srv]').forEach((b) => {
      b.onclick = async () => {
        if (!(await confirmBox('هتمسح الخدمة دي؟'))) return;
        await services.remove(b.dataset.delSrv);
        toast('اتمسحت الخدمة');
        reload();
      };
    });

    /* النسخ الاحتياطية */
    view.querySelector('#backup').onclick = downloadBackup;
    view.querySelector('#restore').onclick = () => restoreBackup(reload);
    view.querySelector('#wipe').onclick = async () => {
      const ok = await confirmBox(
        'هتمسح كل المرضى والمواعيد والسجلات والفواتير نهائيًا. نزّل نسخة احتياطية الأول لو مش متأكد.',
        'امسح كل حاجة'
      );
      if (!ok) return;
      await db.wipe();
      resetSeedFlag();
      toast('اتمسحت كل البيانات');
      location.hash = '#/dashboard';
      location.reload();
    };
  },
};
