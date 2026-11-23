/**
 * Data layer. Every page talks to the server only through this module.
 * Today it works on the sample data in mock.js; to connect the real server,
 * replace the bodies below with fetch calls and keep the signatures.
 */
import * as db from './mock.js';

const wait = (ms = 140) => new Promise((resolve) => setTimeout(resolve, ms));

export const getRole = () => localStorage.getItem('ad-role');
export const setRole = (role) => (role ? localStorage.setItem('ad-role', role) : localStorage.removeItem('ad-role'));
export const canWrite = () => getRole() === 'admin';

class ApiError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

async function guardWrite() {
  await wait();
  if (!canWrite()) throw new ApiError('forbidden', 'ليست لديك صلاحية لهذا الإجراء.');
}

const tables = {
  auctions: db.auctions, bids: db.bids, accounts: db.accounts, categories: db.categories, payments: db.payments,
  reports: db.reports, reviews: db.reviews, messages: db.messages, notificationLog: db.notificationLog, ads: db.ads,
  packages: db.packages, savedFilters: db.savedFilters, searchHistory: db.searchHistory, media: db.media, auditLog: db.auditLog,
};

function audit(action, tone, target, details = '—') {
  db.auditLog.unshift({ id: `au-${Date.now()}`, action, tone, target, details, admin: 'المشرف', at: Date.now() });
}

export const api = {
  async stats() {
    await wait();
    const statusCounts = {};
    db.auctions.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });
    return {
      pending: statusCounts.PENDING_REVIEW || 0,
      accounts: db.accounts.length, auctions: db.auctions.length, bids: db.bids.length, payments: db.payments.length,
      statusCounts, monthly: db.monthly, months: db.MONTHS, events: db.events,
    };
  },

  /** Whole table, no delay: for counts and lookups. */
  rows: (table) => tables[table],

  /** Counts for the sidebar badges (cheap, no delay). */
  badges() {
    return { review: db.auctions.filter((a) => a.status === 'PENDING_REVIEW').length, messages: db.messages.filter((m) => !m.solved).length };
  },

  async list(table, { filter, sort, page = 1, size = 20 } = {}) {
    await wait();
    if (location.hash.includes('fail=1')) throw new ApiError('network', 'تعذّر جلب البيانات.');
    let rows = tables[table];
    if (filter) rows = rows.filter(filter);
    if (sort) rows = [...rows].sort(sort);
    return { rows: rows.slice((page - 1) * size, page * size), total: rows.length, all: rows };
  },

  async get(table, id) {
    await wait(60);
    const row = tables[table].find((r) => r.id === id);
    if (!row) throw new ApiError('notfound', 'العنصر غير موجود.');
    return row;
  },

  async update(table, id, patch) {
    await guardWrite();
    const row = tables[table].find((r) => r.id === id);
    if (!row) throw new ApiError('notfound', 'العنصر غير موجود.');
    Object.assign(row, patch);
    return row;
  },

  async create(table, obj) {
    await guardWrite();
    const row = { id: `${table}-${Date.now()}`, ...obj };
    tables[table].push(row);
    return row;
  },

  async remove(table, id) {
    await guardWrite();
    const i = tables[table].findIndex((r) => r.id === id);
    if (i < 0) throw new ApiError('notfound', 'العنصر غير موجود.');
    const [row] = tables[table].splice(i, 1);
    audit('حذف', 'bad', row.title || row.name?.ar || row.name || row.id);
    return row;
  },

  /** action: APPROVE | REJECT | REQUEST_CHANGES. Reason (3+ characters) is required for the last two. */
  async reviewAuction(id, action, reason = '') {
    await guardWrite();
    const a = db.auctions.find((x) => x.id === id);
    if (!a) throw new ApiError('notfound', 'العنصر غير موجود.');
    if (a.status !== 'PENDING_REVIEW') throw new ApiError('stale', 'تغيّر المزاد أثناء المراجعة. حدّث الصفحة وأعد المحاولة.');
    if (action !== 'APPROVE' && reason.trim().length < 3) throw new ApiError('reason', 'السبب مطلوب (3 أحرف على الأقل).');
    const next = { APPROVE: 'APPROVED', REJECT: 'REJECTED', REQUEST_CHANGES: 'CHANGES_REQUESTED' }[action];
    const text = { APPROVE: 'اعتماد من المشرف', REJECT: 'رُفض من المشرف', REQUEST_CHANGES: 'طُلب تعديل من البائع' }[action];
    a.status = next;
    a.statusReason = action === 'APPROVE' ? null : reason.trim();
    a.reviewedAt = Date.now();
    a.reviewedBy = 'المشرف';
    a.history.push({ type: 'STATUS_CHANGE', text, by: 'المشرف', at: Date.now() });
    audit({ APPROVE: 'اعتماد مزاد', REJECT: 'رفض مزاد', REQUEST_CHANGES: 'طلب تعديل' }[action], action === 'APPROVE' ? 'good' : action === 'REJECT' ? 'bad' : 'warn', a.title, a.statusReason || '—');
    return a;
  },

  async cancelAuction(id, reason = '') {
    await guardWrite();
    const a = db.auctions.find((x) => x.id === id);
    if (reason.trim().length < 3) throw new ApiError('reason', 'السبب مطلوب (3 أحرف على الأقل).');
    a.status = 'CANCELLED';
    a.statusReason = reason.trim();
    a.history.push({ type: 'STATUS_CHANGE', text: 'أُلغي من المشرف', by: 'المشرف', at: Date.now() });
    audit('إلغاء مزاد', 'bad', a.title, reason.trim());
    return a;
  },

  async verifyAccount(id, verified = true) {
    await guardWrite();
    const acc = db.accounts.find((x) => x.id === id);
    acc.verified = verified;
    acc.verificationRequestedAt = null;
    audit(verified ? 'توثيق حساب' : 'إلغاء توثيق', verified ? 'good' : 'warn', acc.name);
    return acc;
  },

  async saveSettings(patch) {
    await guardWrite();
    Object.entries(patch).forEach(([k, v]) => { if (db.settings[k] !== v) audit('تعديل إعدادات', 'info', k, `من ${db.settings[k]} إلى ${v}`); });
    Object.assign(db.settings, patch);
    return db.settings;
  },
  async getSettings() { await wait(80); return db.settings; },

  async sendNotification({ to, accountId, title }) {
    await guardWrite();
    if (!title.trim()) throw new ApiError('reason', 'العنوان مطلوب.');
    db.notificationLog.unshift({ id: `n-${Date.now()}`, type: 'SYSTEM', title: title.trim(), account: to === 'all' ? 'جميع الحسابات' : db.accounts.find((a) => a.id === accountId)?.name || '—', accountId, read: false, createdAt: Date.now() });
  },

  async saveNotificationType(type, patch) {
    await guardWrite();
    Object.assign(db.notificationTypes.find((t) => t.type === type), patch);
  },

  /** order: every category once, mains first with their children after, as [{ id, parentCategoryId }]. The server needs a sort column to store this. */
  async saveCategoryOrder(order) {
    await guardWrite();
    const rows = tables.categories;
    const byId = new Map(rows.map((r) => [r.id, r]));
    const moved = order.filter((o) => (byId.get(o.id)?.parentCategoryId ?? null) !== o.parentCategoryId).length;
    const next = order.map((o) => { const r = byId.get(o.id); r.parentCategoryId = o.parentCategoryId; return r; });
    rows.splice(0, rows.length, ...next);
    audit('ترتيب الفئات', 'info', 'شجرة الفئات', moved ? `نُقلت ${moved} فئات` : 'إعادة ترتيب');
    return rows;
  },

  async currencies() { await wait(80); return { currencies: db.currencies, rates: db.exchangeRates }; },
  async notificationTypes() { await wait(80); return db.notificationTypes; },
  async adPlacements() { return db.adPlacements; },
  async reports() { return db.reports; },
};

export const ref = {
  categories: db.categories, accounts: db.accounts, cities: db.CITIES, settings: db.settings, notificationTypes: db.notificationTypes,
};
