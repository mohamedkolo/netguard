/** الفواتير — إنشاء فاتورة ببنود، تحصيل، وطباعة */

import { invoices, patients, services, settings } from '../store.js';
import {
  esc, h, modal, field, options, formData, toast, confirmBox, empty,
  fmtDate, fmtMoney, today, printView, $$,
} from '../ui.js';

const STATUS = {
  paid: { label: 'مدفوعة', tone: 'ok' },
  partial: { label: 'مدفوعة جزئيًا', tone: 'warn' },
  unpaid: { label: 'غير مدفوعة', tone: 'danger' },
};

const METHODS = { cash: 'كاش', card: 'فيزا', wallet: 'محفظة إلكترونية', transfer: 'تحويل بنكي' };

/* ————————————————————————— فورم الفاتورة ————————————————————————— */

function itemRow(item = {}, srv = []) {
  return `
    <div class="item-row" data-item>
      <input type="text" data-name list="services-list" value="${esc(item.name || '')}" placeholder="اسم البند">
      <input type="number" data-qty min="1" step="1" value="${esc(item.qty || 1)}" placeholder="عدد">
      <input type="number" data-price min="0" step="5" value="${esc(item.price ?? '')}" placeholder="السعر">
      <button type="button" class="icon-btn" data-remove title="حذف البند">✕</button>
    </div>`;
}

async function invoiceForm(existing = null) {
  const inv = existing || {};
  const isEdit = !!existing;

  const [pats, srv, cfg] = await Promise.all([patients.all(), services.all(), settings.get()]);

  if (!pats.length) {
    toast('ضيف مريض واحد على الأقل الأول', 'warn');
    location.hash = '#/patients';
    return null;
  }

  const items = inv.items?.length ? inv.items : [{}];

  let saved = null;
  await modal(
    isEdit ? `تعديل الفاتورة ${inv.number || ''}` : 'فاتورة جديدة',
    `
    <datalist id="services-list">
      ${srv.map((s) => `<option value="${esc(s.name)}" data-price="${esc(s.price)}">`).join('')}
    </datalist>

    <div class="field-row">
      ${field('المريض *', `<select name="patientId" required>
        <option value="">— اختار المريض —</option>
        ${options(pats.sort((x, y) => x.name.localeCompare(y.name, 'ar')), 'id', (p) => `${p.name} — ${p.phone}`, inv.patientId)}
      </select>`)}
      ${field('التاريخ', `<input type="date" name="date" value="${esc(inv.date || today())}">`)}
    </div>

    <div class="field__label">بنود الفاتورة</div>
    <div class="items-head"><span>البند</span><span>العدد</span><span>السعر</span><span></span></div>
    <div id="items">${items.map((it) => itemRow(it, srv)).join('')}</div>
    <button type="button" class="btn btn--sm" id="add-item" style="margin-bottom:14px">+ بند جديد</button>

    <div class="field-row--3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:0 14px">
      ${field('خصم', `<input type="number" name="discount" min="0" step="5" value="${esc(inv.discount || 0)}">`)}
      ${field('المدفوع', `<input type="number" name="paid" min="0" step="5" value="${esc(inv.paid || 0)}">`)}
      ${field('طريقة الدفع', `<select name="method">
        ${Object.entries(METHODS).map(([k, v]) => `<option value="${k}" ${inv.method === k ? 'selected' : ''}>${v}</option>`).join('')}
      </select>`)}
    </div>

    <div class="totals" id="totals"></div>
    `,
    {
      okLabel: isEdit ? 'حفظ التعديلات' : 'إنشاء الفاتورة',
      wide: true,
      onOpen: (node) => wireInvoiceModal(node, cfg),
      async onSubmit(form) {
        saved = await invoices.save({ ...inv, ...formData(form), items: readItems(form) });
        toast(isEdit ? 'اتحفظت الفاتورة' : 'اتعملت الفاتورة');
      },
    }
  );
  return saved;
}

function readItems(root) {
  return $$('[data-item]', root).map((row) => ({
    name: row.querySelector('[data-name]').value.trim(),
    qty: Number(row.querySelector('[data-qty]').value) || 1,
    price: Number(row.querySelector('[data-price]').value) || 0,
  }));
}

/** بيربط منطق البنود والإجماليات جوه نافذة الفاتورة */
function wireInvoiceModal(modalEl, cfg) {
  const itemsBox = modalEl.querySelector('#items');
  const totalsBox = modalEl.querySelector('#totals');
  const srvPrices = Object.fromEntries(
    $$('#services-list option', modalEl).map((o) => [o.value, Number(o.dataset.price) || 0])
  );

  const recalc = () => {
    const items = readItems(modalEl);
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    const discount = Number(modalEl.querySelector('[name="discount"]').value) || 0;
    const net = Math.max(0, total - discount);
    const paid = Number(modalEl.querySelector('[name="paid"]').value) || 0;

    totalsBox.innerHTML = `
      <div class="totals__row"><span>الإجمالي</span><span>${esc(fmtMoney(total, cfg.currency))}</span></div>
      <div class="totals__row"><span>الخصم</span><span>- ${esc(fmtMoney(discount, cfg.currency))}</span></div>
      <div class="totals__row"><strong>المطلوب</strong><strong>${esc(fmtMoney(net, cfg.currency))}</strong></div>
      <div class="totals__row"><span>المدفوع</span><span>${esc(fmtMoney(paid, cfg.currency))}</span></div>
      <div class="totals__row" style="color:${net - paid > 0 ? 'var(--danger)' : 'var(--ok)'}">
        <strong>الباقي</strong><strong>${esc(fmtMoney(Math.max(0, net - paid), cfg.currency))}</strong></div>`;
  };

  // لما تكتب اسم خدمة معروفة، السعر بيتحط لوحده
  modalEl.addEventListener('input', (e) => {
    if (e.target.matches('[data-name]')) {
      const price = srvPrices[e.target.value];
      const priceInput = e.target.closest('[data-item]').querySelector('[data-price]');
      if (price != null && !priceInput.value) priceInput.value = price;
    }
    recalc();
  });

  modalEl.querySelector('#add-item').onclick = () => {
    itemsBox.appendChild(h(itemRow()));
    recalc();
  };

  modalEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-remove]')) {
      const rows = $$('[data-item]', modalEl);
      if (rows.length === 1) return toast('لازم بند واحد على الأقل', 'warn');
      e.target.closest('[data-item]').remove();
      recalc();
    }
  });

  recalc();
}

/* ————————————————————————— طباعة الفاتورة ————————————————————————— */

function printInvoice(inv, patient, cfg) {
  printView(
    `فاتورة ${inv.number}`,
    `<div class="p-head">
      <div><div class="p-clinic">${esc(cfg.clinicName)}</div>
        <div class="p-meta">${esc(cfg.phone)} — ${esc(cfg.address)}</div></div>
      <div class="p-meta">
        <div><strong>فاتورة رقم: ${esc(inv.number)}</strong></div>
        <div>التاريخ: ${esc(fmtDate(inv.date))}</div>
        <div>المريض: ${esc(patient?.name || '—')}</div>
      </div>
    </div>

    <table>
      <thead><tr><th>البند</th><th style="width:70px">العدد</th><th style="width:100px">السعر</th><th style="width:110px">الإجمالي</th></tr></thead>
      <tbody>${inv.items.map((it) => `<tr>
        <td>${esc(it.name)}</td>
        <td>${esc(it.qty)}</td>
        <td>${esc(fmtMoney(it.price, cfg.currency))}</td>
        <td>${esc(fmtMoney(it.price * it.qty, cfg.currency))}</td>
      </tr>`).join('')}</tbody>
    </table>

    <div class="p-totals">
      <div><span>الإجمالي</span><span>${esc(fmtMoney(inv.total, cfg.currency))}</span></div>
      <div><span>الخصم</span><span>- ${esc(fmtMoney(inv.discount, cfg.currency))}</span></div>
      <div class="p-grand"><span>المطلوب</span><span>${esc(fmtMoney(inv.net, cfg.currency))}</span></div>
      <div><span>المدفوع (${esc(METHODS[inv.method] || '—')})</span><span>${esc(fmtMoney(inv.paid, cfg.currency))}</span></div>
      <div><span>الباقي</span><span>${esc(fmtMoney(inv.due, cfg.currency))}</span></div>
    </div>`
  );
}

/* ————————————————————————— الصفحة ————————————————————————— */

export default {
  async render(view, { actions, reload }) {
    const cfg = await settings.get();

    const addBtn = h('<button class="btn btn--primary">+ فاتورة جديدة</button>');
    addBtn.onclick = async () => { if (await invoiceForm()) reload(); };
    actions.appendChild(addBtn);

    const [list, pats] = await Promise.all([invoices.all(), patients.all()]);
    const pMap = Object.fromEntries(pats.map((p) => [p.id, p]));

    const totalPaid = list.reduce((s, i) => s + (i.paid || 0), 0);
    const totalDue = list.reduce((s, i) => s + (i.due || 0), 0);

    view.innerHTML = `
      <div class="grid grid--stats" style="margin-bottom:16px">
        <div class="stat"><div class="stat__icon" style="background:var(--ok-soft)">💰</div>
          <div><div class="stat__num" style="font-size:21px">${esc(fmtMoney(totalPaid, cfg.currency))}</div>
          <div class="stat__label">إجمالي المحصّل</div></div></div>
        <div class="stat"><div class="stat__icon" style="background:var(--warn-soft)">⏳</div>
          <div><div class="stat__num" style="font-size:21px">${esc(fmtMoney(totalDue, cfg.currency))}</div>
          <div class="stat__label">مستحقات متبقية</div></div></div>
        <div class="stat"><div class="stat__icon">🧾</div>
          <div><div class="stat__num">${list.length}</div><div class="stat__label">فاتورة</div></div></div>
      </div>

      <div class="card">${
        list.length
          ? `<div class="table-wrap"><table class="data">
              <thead><tr><th>رقم الفاتورة</th><th>المريض</th><th>التاريخ</th><th>المطلوب</th><th>المدفوع</th><th>الباقي</th><th>الحالة</th><th></th></tr></thead>
              <tbody>${list
                .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                .map((i) => {
                  const st = STATUS[i.status] || STATUS.unpaid;
                  const p = pMap[i.patientId];
                  return `<tr>
                    <td class="cell-main">${esc(i.number)}</td>
                    <td>${p ? `<a href="#/patients/${esc(p.id)}">${esc(p.name)}</a>` : '<span class="cell-sub">مريض محذوف</span>'}</td>
                    <td>${esc(fmtDate(i.date))}</td>
                    <td class="num">${esc(fmtMoney(i.net, cfg.currency))}</td>
                    <td class="num">${esc(fmtMoney(i.paid, cfg.currency))}</td>
                    <td class="num" style="color:${i.due > 0 ? 'var(--danger)' : 'inherit'}">${esc(fmtMoney(i.due, cfg.currency))}</td>
                    <td><span class="badge badge--${st.tone}">${st.label}</span></td>
                    <td class="actions">
                      <button class="btn btn--sm" data-print="${esc(i.id)}">🖨️</button>
                      <button class="btn btn--sm" data-edit="${esc(i.id)}">تعديل</button>
                      <button class="btn btn--sm btn--ghost" data-del="${esc(i.id)}" style="color:var(--danger)">حذف</button>
                    </td></tr>`;
                }).join('')}</tbody></table></div>`
          : empty('🧾', 'مفيش فواتير لسه', 'اعمل أول فاتورة من الزرار اللي فوق.')
      }</div>`;

    view.querySelectorAll('[data-print]').forEach((b) => {
      b.onclick = async () => {
        const i = await invoices.get(b.dataset.print);
        printInvoice(i, pMap[i.patientId], cfg);
      };
    });

    view.querySelectorAll('[data-edit]').forEach((b) => {
      b.onclick = async () => {
        const i = await invoices.get(b.dataset.edit);
        if (await invoiceForm(i)) reload();
      };
    });

    view.querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = async () => {
        if (!(await confirmBox('هتمسح الفاتورة دي نهائيًا؟'))) return;
        await invoices.remove(b.dataset.del);
        toast('اتمسحت الفاتورة');
        reload();
      };
    });
  },
};
