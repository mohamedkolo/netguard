/** التقارير — ملخص فترة زمنية، قابل للطباعة أو الحفظ PDF */

import { appointments, invoices, patients, doctors, records, settings, APPOINTMENT_STATUS } from '../store.js';
import { esc, fmtDate, fmtMoney, printView, today } from '../ui.js';

function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/** بيجمّع أرقام الفترة كلها في مكان واحد */
async function build(from, to) {
  const inRange = (d) => d && d >= from && d <= to;

  const [appts, invs, pats, docs, recs, cfg] = await Promise.all([
    appointments.all(), invoices.all(), patients.all(), doctors.all(), records.all(), settings.get(),
  ]);

  const a = appts.filter((x) => inRange(x.date));
  const i = invs.filter((x) => inRange(x.date));
  const r = recs.filter((x) => inRange(x.date));

  const byStatus = {};
  for (const x of a) byStatus[x.status] = (byStatus[x.status] || 0) + 1;

  const byDoctor = docs.map((d) => {
    const mine = a.filter((x) => x.doctorId === d.id);
    return {
      name: d.name,
      specialty: d.specialty,
      total: mine.length,
      done: mine.filter((x) => x.status === 'done').length,
    };
  }).filter((d) => d.total > 0).sort((x, y) => y.total - x.total);

  const diagnoses = {};
  for (const x of r) {
    const key = (x.diagnosis || '').trim();
    if (key) diagnoses[key] = (diagnoses[key] || 0) + 1;
  }
  const topDiagnoses = Object.entries(diagnoses).sort((x, y) => y[1] - x[1]).slice(0, 8);

  const newPatients = pats.filter((p) => inRange((p.createdAt || '').slice(0, 10))).length;

  return {
    cfg,
    appointments: a.length,
    byStatus,
    byDoctor,
    topDiagnoses,
    newPatients,
    records: r.length,
    invoices: i.length,
    billed: i.reduce((s, x) => s + (x.net || 0), 0),
    collected: i.reduce((s, x) => s + (x.paid || 0), 0),
    due: i.reduce((s, x) => s + (x.due || 0), 0),
  };
}

function tableRows(rows, cols) {
  if (!rows.length) return '<tr><td colspan="' + cols + '" style="text-align:center;color:var(--text-2)">لا توجد بيانات في الفترة دي</td></tr>';
  return rows;
}

export default {
  async render(view) {
    let from = monthStart();
    let to = today();

    view.innerHTML = `
      <div class="toolbar">
        <label class="cell-sub">من</label>
        <input type="date" id="from" value="${from}" style="width:auto">
        <label class="cell-sub">إلى</label>
        <input type="date" id="to" value="${to}" style="width:auto">
        <button class="btn btn--sm btn--primary" id="apply">عرض</button>
        <button class="btn btn--sm" id="print">🖨️ طباعة / حفظ PDF</button>
      </div>
      <div id="out"></div>`;

    const draw = async () => {
      const s = await build(from, to);
      const c = s.cfg.currency;

      view.querySelector('#out').innerHTML = `
        <div class="grid grid--stats" style="margin-bottom:16px">
          <div class="stat"><div class="stat__icon" style="background:var(--info-soft)">📅</div>
            <div><div class="stat__num">${s.appointments}</div><div class="stat__label">مواعيد</div></div></div>
          <div class="stat"><div class="stat__icon">🧑‍🤝‍🧑</div>
            <div><div class="stat__num">${s.newPatients}</div><div class="stat__label">مرضى جدد</div></div></div>
          <div class="stat"><div class="stat__icon" style="background:var(--ok-soft)">💰</div>
            <div><div class="stat__num" style="font-size:20px">${esc(fmtMoney(s.collected, c))}</div>
            <div class="stat__label">محصّل</div></div></div>
          <div class="stat"><div class="stat__icon" style="background:var(--warn-soft)">⏳</div>
            <div><div class="stat__num" style="font-size:20px">${esc(fmtMoney(s.due, c))}</div>
            <div class="stat__label">مستحقات</div></div></div>
        </div>

        <div class="grid grid--2">
          <div class="card">
            <div class="card__head"><h2>المواعيد حسب الطبيب</h2></div>
            <div class="table-wrap"><table class="data" style="min-width:0">
              <thead><tr><th>الطبيب</th><th>إجمالي</th><th>تم الكشف</th></tr></thead>
              <tbody>${tableRows(s.byDoctor.map((d) => `<tr>
                <td><div class="cell-main">${esc(d.name)}</div><div class="cell-sub">${esc(d.specialty)}</div></td>
                <td class="num">${d.total}</td><td class="num">${d.done}</td></tr>`), 3)}</tbody>
            </table></div>
          </div>

          <div class="card">
            <div class="card__head"><h2>حالات المواعيد</h2></div>
            <div class="table-wrap"><table class="data" style="min-width:0">
              <tbody>${tableRows(Object.entries(APPOINTMENT_STATUS).map(([k, v]) => `<tr>
                <td><span class="badge badge--${v.tone}">${v.label}</span></td>
                <td class="num">${s.byStatus[k] || 0}</td></tr>`), 2)}</tbody>
            </table></div>
          </div>

          <div class="card">
            <div class="card__head"><h2>أكتر التشخيصات تكرارًا</h2></div>
            <div class="table-wrap"><table class="data" style="min-width:0">
              <tbody>${tableRows(s.topDiagnoses.map(([d, n]) => `<tr>
                <td>${esc(d)}</td><td class="num">${n}</td></tr>`), 2)}</tbody>
            </table></div>
          </div>

          <div class="card">
            <div class="card__head"><h2>الملخص المالي</h2></div>
            <div class="table-wrap"><table class="data" style="min-width:0"><tbody>
              <tr><th>عدد الفواتير</th><td class="num">${s.invoices}</td></tr>
              <tr><th>إجمالي المطلوب</th><td class="num">${esc(fmtMoney(s.billed, c))}</td></tr>
              <tr><th>المحصّل</th><td class="num" style="color:var(--ok)">${esc(fmtMoney(s.collected, c))}</td></tr>
              <tr><th>المتبقي</th><td class="num" style="color:var(--danger)">${esc(fmtMoney(s.due, c))}</td></tr>
              <tr><th>سجلات طبية</th><td class="num">${s.records}</td></tr>
            </tbody></table></div>
          </div>
        </div>`;
      return s;
    };

    view.querySelector('#apply').onclick = () => {
      from = view.querySelector('#from').value;
      to = view.querySelector('#to').value;
      if (from > to) return;
      draw();
    };

    view.querySelector('#print').onclick = async () => {
      const s = await build(from, to);
      const c = s.cfg.currency;
      printView(
        `تقرير الفترة من ${fmtDate(from)} إلى ${fmtDate(to)}`,
        `<div class="p-head">
          <div><div class="p-clinic">${esc(s.cfg.clinicName)}</div>
            <div class="p-meta">${esc(s.cfg.phone)} — ${esc(s.cfg.address)}</div></div>
          <div class="p-meta">من ${esc(fmtDate(from))} إلى ${esc(fmtDate(to))}</div>
        </div>

        <div class="p-section"><h3>ملخص عام</h3>
          <table><tbody>
            <tr><th>عدد المواعيد</th><td>${s.appointments}</td><th>مرضى جدد</th><td>${s.newPatients}</td></tr>
            <tr><th>سجلات طبية</th><td>${s.records}</td><th>عدد الفواتير</th><td>${s.invoices}</td></tr>
          </tbody></table>
        </div>

        <div class="p-section"><h3>المواعيد حسب الطبيب</h3>
          <table><thead><tr><th>الطبيب</th><th>التخصص</th><th>إجمالي</th><th>تم الكشف</th></tr></thead>
          <tbody>${s.byDoctor.length
            ? s.byDoctor.map((d) => `<tr><td>${esc(d.name)}</td><td>${esc(d.specialty)}</td><td>${d.total}</td><td>${d.done}</td></tr>`).join('')
            : '<tr><td colspan="4">لا توجد بيانات</td></tr>'}</tbody></table>
        </div>

        ${s.topDiagnoses.length ? `<div class="p-section"><h3>أكثر التشخيصات تكرارًا</h3>
          <table><thead><tr><th>التشخيص</th><th style="width:80px">العدد</th></tr></thead>
          <tbody>${s.topDiagnoses.map(([d, n]) => `<tr><td>${esc(d)}</td><td>${n}</td></tr>`).join('')}</tbody></table>
        </div>` : ''}

        <div class="p-section"><h3>الملخص المالي</h3>
          <div class="p-totals">
            <div><span>إجمالي المطلوب</span><span>${esc(fmtMoney(s.billed, c))}</span></div>
            <div><span>المحصّل</span><span>${esc(fmtMoney(s.collected, c))}</span></div>
            <div class="p-grand"><span>المتبقي</span><span>${esc(fmtMoney(s.due, c))}</span></div>
          </div>
        </div>`
      );
    };

    await draw();
  },
};
