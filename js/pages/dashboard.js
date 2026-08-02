/** لوحة التحكم — نظرة سريعة على حال العيادة النهاردة */

import { stats, appointments, settings, APPOINTMENT_STATUS } from '../store.js';
import { esc, fmtMoney, fmtTime, fmtDay, today, empty } from '../ui.js';

function statCard(icon, num, label, tone = 'brand') {
  return `
    <div class="stat">
      <div class="stat__icon" style="background:var(--${tone}-soft)">${icon}</div>
      <div>
        <div class="stat__num">${esc(num)}</div>
        <div class="stat__label">${esc(label)}</div>
      </div>
    </div>`;
}

export default {
  async render(view) {
    const [s, cfg, todays] = await Promise.all([
      stats.dashboard(),
      settings.get(),
      appointments.detailed((a) => a.date === today()),
    ]);

    const maxWeek = Math.max(1, ...s.week.map((w) => w.count));

    const rows = todays
      .map((a) => {
        const st = APPOINTMENT_STATUS[a.status] || APPOINTMENT_STATUS.scheduled;
        return `
          <tr>
            <td class="num">${fmtTime(a.time)}</td>
            <td>
              <div class="cell-main">${esc(a.patient?.name || 'مريض محذوف')}</div>
              <div class="cell-sub">${esc(a.reason || '—')}</div>
            </td>
            <td>${esc(a.doctor?.name || '—')}</td>
            <td><span class="badge badge--${st.tone}">${st.label}</span></td>
          </tr>`;
      })
      .join('');

    view.innerHTML = `
      <div class="grid grid--stats" style="margin-bottom:18px">
        ${statCard('📅', s.todayAppointments, 'مواعيد النهاردة', 'info')}
        ${statCard('⏳', s.todayPending, 'في انتظار الكشف', 'warn')}
        ${statCard('🧑‍🤝‍🧑', s.patients, 'إجمالي المرضى', 'brand')}
        ${statCard('👨‍⚕️', s.doctors, 'أطباء نشطين', 'ok')}
      </div>

      <div class="grid grid--2">
        <div class="card">
          <div class="card__head"><h2>مواعيد النهاردة — ${esc(fmtDay(today()))}</h2>
            <a class="btn btn--sm" href="#/appointments">عرض الكل</a>
          </div>
          ${
            todays.length
              ? `<div class="table-wrap"><table class="data">
                  <thead><tr><th>الوقت</th><th>المريض</th><th>الطبيب</th><th>الحالة</th></tr></thead>
                  <tbody>${rows}</tbody></table></div>`
              : empty('🗓️', 'مفيش مواعيد النهاردة', 'ابدأ بحجز موعد جديد من صفحة المواعيد.',
                  '<a class="btn btn--primary" href="#/appointments">احجز موعد</a>')
          }
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card__head"><h2>الحساب</h2></div>
            <div class="card__body" style="display:flex;flex-direction:column;gap:14px">
              <div>
                <div class="stat__label">محصّل الشهر ده</div>
                <div class="stat__num" style="color:var(--ok)">${esc(fmtMoney(s.monthRevenue, cfg.currency))}</div>
              </div>
              <div>
                <div class="stat__label">مستحقات لسه متحصّلتش</div>
                <div class="stat__num" style="color:var(--warn)">${esc(fmtMoney(s.monthDue, cfg.currency))}</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card__head"><h2>المواعيد آخر ٧ أيام</h2></div>
            <div class="card__body">
              <div class="chart">
                ${s.week
                  .map(
                    (w) => `
                  <div class="chart__col" title="${esc(w.date)}">
                    <span class="chart__val">${w.count}</span>
                    <div class="chart__bar" style="height:${(w.count / maxWeek) * 100}%"></div>
                    <span class="chart__lbl">${esc(fmtDay(w.date).replace('ال', ''))}</span>
                  </div>`
                  )
                  .join('')}
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },
};
