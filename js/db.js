/**
 * طبقة التخزين — IndexedDB
 *
 * ده الملف الوحيد اللي بيلمس التخزين الفعلي. أي حاجة تانية في المشروع
 * بتتعامل مع الكائن `db` اللي تحت بس. لو حبينا نحوّل لـ Supabase أو
 * أي داتابيز على سيرفر، بنستبدل الملف ده وبس — باقي المشروع مايتغيرش.
 */

const DB_NAME = 'clinicflow';
const DB_VERSION = 1;

/** أسماء المخازن (الجداول) */
export const STORES = [
  'patients',      // المرضى
  'doctors',       // الأطباء
  'appointments',  // المواعيد
  'records',       // السجلات الطبية
  'invoices',      // الفواتير
  'services',      // الخدمات وأسعارها
  'settings',      // إعدادات العيادة
];

let _dbPromise = null;

function open() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const idb = e.target.result;
      for (const name of STORES) {
        if (!idb.objectStoreNames.contains(name)) {
          idb.createObjectStore(name, { keyPath: 'id' });
        }
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return _dbPromise;
}

function tx(storeName, mode) {
  return open().then((idb) => idb.transaction(storeName, mode).objectStore(storeName));
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** معرّف فريد بسيط — كفاية جدًا لتطبيق بيشتغل على جهاز واحد */
export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const db = {
  /** كل الصفوف في مخزن */
  async all(store) {
    return wrap((await tx(store, 'readonly')).getAll());
  },

  /** صف واحد بالمعرّف، أو undefined */
  async get(store, id) {
    return wrap((await tx(store, 'readonly')).get(id));
  },

  /** إضافة أو تعديل. بيولّد id و createdAt لو مش موجودين */
  async put(store, obj) {
    const row = { ...obj };
    if (!row.id) row.id = newId();
    if (!row.createdAt) row.createdAt = new Date().toISOString();
    row.updatedAt = new Date().toISOString();
    await wrap((await tx(store, 'readwrite')).put(row));
    return row;
  },

  /** إضافة/تعديل مجموعة صفوف مرة واحدة */
  async putMany(store, rows) {
    const out = [];
    for (const r of rows) out.push(await this.put(store, r));
    return out;
  },

  async remove(store, id) {
    return wrap((await tx(store, 'readwrite')).delete(id));
  },

  async clear(store) {
    return wrap((await tx(store, 'readwrite')).clear());
  },

  /** فلترة في الذاكرة — أحجام البيانات هنا صغيرة فده كفاية */
  async where(store, predicate) {
    return (await this.all(store)).filter(predicate);
  },

  async count(store) {
    return wrap((await tx(store, 'readonly')).count());
  },

  /** نسخة احتياطية من كل المخازن */
  async exportAll() {
    const data = {};
    for (const s of STORES) data[s] = await this.all(s);
    return {
      app: 'clinicflow',
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    };
  },

  /**
   * استرجاع نسخة احتياطية.
   * @param {object} backup الملف المصدّر
   * @param {boolean} replace لو true بيمسح الموجود الأول
   */
  async importAll(backup, replace = true) {
    if (!backup || backup.app !== 'clinicflow' || !backup.data) {
      throw new Error('الملف ده مش نسخة احتياطية صالحة من ClinicFlow');
    }
    for (const s of STORES) {
      if (!Array.isArray(backup.data[s])) continue;
      if (replace) await this.clear(s);
      for (const row of backup.data[s]) {
        await wrap((await tx(s, 'readwrite')).put(row));
      }
    }
  },

  /** مسح كل البيانات */
  async wipe() {
    for (const s of STORES) await this.clear(s);
  },
};
