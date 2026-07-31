/**
 * بيانات تجريبية — بتتحط مرة واحدة بس أول ما التطبيق يفتح على جهاز فاضي.
 * تقدر تمسحها كلها من صفحة الإعدادات.
 */

import { db } from './db.js';
import { settings } from './store.js';

const FLAG = 'clinicflow-seeded';

function dayOffset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function ensureSeed() {
  // نتأكد إن الداتابيز فاضية فعلًا، مش بس نعتمد على العلامة في localStorage
  const existing = await db.count('patients');
  if (existing > 0 || localStorage.getItem(FLAG)) {
    localStorage.setItem(FLAG, '1');
    await settings.get();
    return false;
  }

  await settings.save({});

  const docs = await db.putMany('doctors', [
    { id: 'd1', name: 'د. أحمد سليم', specialty: 'باطنة', phone: '01001234567', fee: 250, active: true },
    { id: 'd2', name: 'د. منى عبد الرحمن', specialty: 'أطفال', phone: '01112345678', fee: 200, active: true },
    { id: 'd3', name: 'د. كريم فؤاد', specialty: 'عظام', phone: '01223456789', fee: 300, active: true },
  ]);

  const pats = await db.putMany('patients', [
    { id: 'p1', name: 'محمود عبد الله', phone: '01011112222', gender: 'male', birthDate: '1988-04-12', address: 'مدينة نصر، القاهرة', bloodType: 'O+', allergies: 'حساسية من البنسلين' },
    { id: 'p2', name: 'سارة إبراهيم', phone: '01122223333', gender: 'female', birthDate: '1995-11-03', address: 'المعادي، القاهرة', bloodType: 'A+', allergies: '' },
    { id: 'p3', name: 'يوسف طارق', phone: '01233334444', gender: 'male', birthDate: '2018-06-21', address: 'الشيخ زايد، الجيزة', bloodType: 'B+', allergies: '' },
    { id: 'p4', name: 'نادية حسن', phone: '01044445555', gender: 'female', birthDate: '1962-02-17', address: 'شبرا، القاهرة', bloodType: 'AB-', allergies: 'حساسية من الأسبرين' },
  ]);

  await db.putMany('services', [
    { name: 'كشف', price: 250 },
    { name: 'استشارة', price: 150 },
    { name: 'متابعة', price: 100 },
    { name: 'تحاليل دم شاملة', price: 400 },
    { name: 'أشعة سينية', price: 350 },
    { name: 'جلسة علاج طبيعي', price: 200 },
  ]);

  await db.putMany('appointments', [
    { patientId: 'p1', doctorId: 'd1', date: dayOffset(0), time: '10:00', reason: 'ألم في المعدة', status: 'done' },
    { patientId: 'p2', doctorId: 'd1', date: dayOffset(0), time: '11:30', reason: 'متابعة تحاليل', status: 'scheduled' },
    { patientId: 'p3', doctorId: 'd2', date: dayOffset(0), time: '13:00', reason: 'كشف دوري', status: 'scheduled' },
    { patientId: 'p4', doctorId: 'd3', date: dayOffset(1), time: '10:30', reason: 'ألم في الركبة', status: 'scheduled' },
    { patientId: 'p1', doctorId: 'd1', date: dayOffset(-3), time: '12:00', reason: 'كشف أول', status: 'done' },
    { patientId: 'p2', doctorId: 'd2', date: dayOffset(-1), time: '09:30', reason: 'برد وسخونية', status: 'done' },
    { patientId: 'p4', doctorId: 'd3', date: dayOffset(-5), time: '16:00', reason: 'استشارة', status: 'cancelled' },
  ]);

  await db.putMany('records', [
    {
      patientId: 'p1', doctorId: 'd1', date: dayOffset(-3),
      symptoms: 'ألم بالمعدة بعد الأكل، حموضة متكررة',
      diagnosis: 'التهاب في جدار المعدة',
      prescription: 'أوميبرازول ٢٠ مجم — قرص قبل الفطار لمدة ١٤ يوم\nمضاد للحموضة عند اللزوم',
      notes: 'يتجنب الأكل الحار والقهوة. متابعة بعد أسبوعين.',
    },
    {
      patientId: 'p2', doctorId: 'd2', date: dayOffset(-1),
      symptoms: 'سخونية ٣٨.٥، كحة جافة، إرهاق',
      diagnosis: 'التهاب فيروسي في الجهاز التنفسي العلوي',
      prescription: 'باراسيتامول ٥٠٠ مجم كل ٨ ساعات\nشراب مهدئ للكحة',
      notes: 'راحة وسوائل. لو السخونية استمرت أكتر من ٣ أيام تعمل تحاليل.',
    },
  ]);

  await db.putMany('invoices', [
    {
      patientId: 'p1', date: dayOffset(-3), number: 'INV-000101',
      items: [{ name: 'كشف', qty: 1, price: 250 }, { name: 'تحاليل دم شاملة', qty: 1, price: 400 }],
      total: 650, discount: 50, net: 600, paid: 600, due: 0, status: 'paid', method: 'cash',
    },
    {
      patientId: 'p2', date: dayOffset(-1), number: 'INV-000102',
      items: [{ name: 'كشف', qty: 1, price: 200 }],
      total: 200, discount: 0, net: 200, paid: 100, due: 100, status: 'partial', method: 'cash',
    },
  ]);

  localStorage.setItem(FLAG, '1');
  return { doctors: docs.length, patients: pats.length };
}

/** بيسمح بإعادة إدخال البيانات التجريبية بعد المسح */
export function resetSeedFlag() {
  localStorage.removeItem(FLAG);
}
