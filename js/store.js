/**
 * طبقة المنطق — الكيانات والعلاقات بينها
 *
 * الملف ده بيتعامل مع db.js بس، ومش عارف حاجة عن IndexedDB نفسها.
 * كل الصفحات بتستخدم الدوال اللي هنا، مش db مباشرة.
 */

import { db, newId } from './db.js';

/* ————————————————————————— الإعدادات ————————————————————————— */

const DEFAULT_SETTINGS = {
  id: 'clinic',
  clinicName: 'عيادة النور التخصصية',
  phone: '01000000000',
  address: 'القاهرة، مصر',
  currency: 'ج.م',
  workStart: '09:00',
  workEnd: '21:00',
  slotMinutes: 30,
};

export const settings = {
  async get() {
    const s = await db.get('settings', 'clinic');
    return { ...DEFAULT_SETTINGS, ...(s || {}) };
  },
  async save(patch) {
    const current = await this.get();
    return db.put('settings', { ...current, ...patch, id: 'clinic' });
  },
};

/* ————————————————————————— المرضى ————————————————————————— */

export const patients = {
  all: () => db.all('patients'),
  get: (id) => db.get('patients', id),

  async save(p) {
    if (!p.name || !p.name.trim()) throw new Error('اسم المريض مطلوب');
    if (!p.phone || !p.phone.trim()) throw new Error('رقم التليفون مطلوب');
    return db.put('patients', {
      ...p,
      name: p.name.trim(),
      phone: p.phone.trim(),
    });
  },

  /** بيمسح المريض وكل اللي متعلق بيه */
  async remove(id) {
    for (const a of await db.where('appointments', (x) => x.patientId === id)) {
      await db.remove('appointments', a.id);
    }
    for (const r of await db.where('records', (x) => x.patientId === id)) {
      await db.remove('records', r.id);
    }
    for (const i of await db.where('invoices', (x) => x.patientId === id)) {
      await db.remove('invoices', i.id);
    }
    return db.remove('patients', id);
  },

  /** بحث بالاسم أو التليفون */
  async search(q) {
    const list = await this.all();
    if (!q || !q.trim()) return list;
    const term = q.trim().toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.phone || '').includes(term) ||
        (p.nationalId || '').includes(term)
    );
  },
};

/* ————————————————————————— الأطباء ————————————————————————— */

export const doctors = {
  all: () => db.all('doctors'),
  get: (id) => db.get('doctors', id),
  active: () => db.where('doctors', (d) => d.active !== false),

  async save(d) {
    if (!d.name || !d.name.trim()) throw new Error('اسم الطبيب مطلوب');
    if (!d.specialty || !d.specialty.trim()) throw new Error('التخصص مطلوب');
    return db.put('doctors', {
      ...d,
      name: d.name.trim(),
      specialty: d.specialty.trim(),
      fee: Number(d.fee) || 0,
      active: d.active !== false,
    });
  },

  /** الطبيب مش بيتمسح لو عليه مواعيد — بيتعطّل بس */
  async remove(id) {
    const linked = await db.where('appointments', (a) => a.doctorId === id);
    if (linked.length) {
      throw new Error(
        `مينفعش تمسح الطبيب ده — عليه ${linked.length} موعد. تقدر توقفه من "نشط" بدل ما تمسحه.`
      );
    }
    return db.remove('doctors', id);
  },
};

/* ————————————————————————— المواعيد ————————————————————————— */

export const APPOINTMENT_STATUS = {
  scheduled: { label: 'محجوز', tone: 'info' },
  done: { label: 'تم الكشف', tone: 'ok' },
  cancelled: { label: 'ملغي', tone: 'muted' },
  noshow: { label: 'لم يحضر', tone: 'warn' },
};

export const appointments = {
  all: () => db.all('appointments'),
  get: (id) => db.get('appointments', id),

  async save(a) {
    if (!a.patientId) throw new Error('اختار المريض');
    if (!a.doctorId) throw new Error('اختار الطبيب');
    if (!a.date) throw new Error('اختار التاريخ');
    if (!a.time) throw new Error('اختار الوقت');

    // منع حجز نفس الطبيب في نفس التوقيت مرتين
    const clash = (await db.where('appointments', (x) =>
      x.doctorId === a.doctorId &&
      x.date === a.date &&
      x.time === a.time &&
      x.status !== 'cancelled' &&
      x.id !== a.id
    ))[0];
    if (clash) throw new Error('الطبيب محجوز في الميعاد ده بالفعل');

    return db.put('appointments', { ...a, status: a.status || 'scheduled' });
  },

  remove: (id) => db.remove('appointments', id),

  byDate: (date) => db.where('appointments', (a) => a.date === date),
  byPatient: (patientId) => db.where('appointments', (a) => a.patientId === patientId),
  byDoctor: (doctorId) => db.where('appointments', (a) => a.doctorId === doctorId),

  /** المواعيد مع بيانات المريض والطبيب جاهزة للعرض */
  async detailed(filterFn) {
    const [list, pats, docs] = await Promise.all([
      this.all(),
      patients.all(),
      doctors.all(),
    ]);
    const pMap = Object.fromEntries(pats.map((p) => [p.id, p]));
    const dMap = Object.fromEntries(docs.map((d) => [d.id, d]));
    return list
      .filter(filterFn || (() => true))
      .map((a) => ({
        ...a,
        patient: pMap[a.patientId] || null,
        doctor: dMap[a.doctorId] || null,
      }))
      .sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));
  },
};

/* ————————————————————————— السجلات الطبية ————————————————————————— */

export const records = {
  all: () => db.all('records'),
  get: (id) => db.get('records', id),
  byPatient: (patientId) => db.where('records', (r) => r.patientId === patientId),

  async save(r) {
    if (!r.patientId) throw new Error('اختار المريض');
    if (!r.diagnosis || !r.diagnosis.trim()) throw new Error('التشخيص مطلوب');
    return db.put('records', {
      ...r,
      date: r.date || new Date().toISOString().slice(0, 10),
      diagnosis: r.diagnosis.trim(),
    });
  },

  remove: (id) => db.remove('records', id),
};

/* ————————————————————————— الخدمات ————————————————————————— */

export const services = {
  all: () => db.all('services'),
  async save(s) {
    if (!s.name || !s.name.trim()) throw new Error('اسم الخدمة مطلوب');
    return db.put('services', { ...s, name: s.name.trim(), price: Number(s.price) || 0 });
  },
  remove: (id) => db.remove('services', id),
};

/* ————————————————————————— الفواتير ————————————————————————— */

export const invoices = {
  all: () => db.all('invoices'),
  get: (id) => db.get('invoices', id),
  byPatient: (patientId) => db.where('invoices', (i) => i.patientId === patientId),

  async save(inv) {
    if (!inv.patientId) throw new Error('اختار المريض');
    const items = (inv.items || []).filter((it) => it.name && it.name.trim());
    if (!items.length) throw new Error('ضيف بند واحد على الأقل في الفاتورة');

    const total = items.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1),
      0
    );
    const discount = Number(inv.discount) || 0;
    const net = Math.max(0, total - discount);
    const paid = Number(inv.paid) || 0;

    return db.put('invoices', {
      ...inv,
      items,
      total,
      discount,
      net,
      paid,
      due: Math.max(0, net - paid),
      status: paid >= net ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      date: inv.date || new Date().toISOString().slice(0, 10),
      number: inv.number || `INV-${newId().slice(-6).toUpperCase()}`,
    });
  },

  remove: (id) => db.remove('invoices', id),
};

/* ————————————————————————— إحصائيات لوحة التحكم ————————————————————————— */

export const stats = {
  async dashboard() {
    const today = new Date().toISOString().slice(0, 10);
    const [pats, docs, appts, invs] = await Promise.all([
      patients.all(),
      doctors.all(),
      appointments.all(),
      invoices.all(),
    ]);

    const todays = appts.filter((a) => a.date === today);
    const monthPrefix = today.slice(0, 7);
    const monthInvoices = invs.filter((i) => (i.date || '').startsWith(monthPrefix));

    return {
      patients: pats.length,
      doctors: docs.filter((d) => d.active !== false).length,
      todayAppointments: todays.length,
      todayPending: todays.filter((a) => a.status === 'scheduled').length,
      monthRevenue: monthInvoices.reduce((s, i) => s + (i.paid || 0), 0),
      monthDue: invs.reduce((s, i) => s + (i.due || 0), 0),
      /** آخر 7 أيام: عدد المواعيد في كل يوم */
      week: Array.from({ length: 7 }, (_, k) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - k));
        const iso = d.toISOString().slice(0, 10);
        return { date: iso, count: appts.filter((a) => a.date === iso).length };
      }),
    };
  },
};
