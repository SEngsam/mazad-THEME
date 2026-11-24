import { api, canWrite } from './api.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
export const fmt = (n) => Number(n).toLocaleString('en-US');
export const money = (n) => (n == null ? '—' : `${fmt(n)} ر.س`);
export const money2 = (n) => `${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
export const mask = (v) => (canWrite() ? v : '••• مخفي');

const dateFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric' });
const dayFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { hour: '2-digit', minute: '2-digit', hour12: false });
export const fmtDate = (t) => (t ? dateFmt.format(new Date(t)) : '—');
export const fmtDay = (t) => (t ? dayFmt.format(new Date(t)) : '—');
export const fmtDateTime = (t) => (t ? `${dayFmt.format(new Date(t))} · ${timeFmt.format(new Date(t))}` : '—');
export function ago(t) {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return 'الآن';
  if (m < 60) return m === 1 ? 'قبل دقيقة' : m === 2 ? 'قبل دقيقتين' : m <= 10 ? `قبل ${m} دقائق` : `قبل ${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'قبل ساعة' : h === 2 ? 'قبل ساعتين' : h <= 10 ? `قبل ${h} ساعات` : `قبل ${h} ساعة`;
  const d = Math.round(h / 24);
  return d === 1 ? 'أمس' : d === 2 ? 'قبل يومين' : d <= 10 ? `قبل ${d} أيام` : fmtDay(t);
}

export const STATUS = {
  DRAFT: ['مسودة', 'info'], PENDING_REVIEW: ['بانتظار المراجعة', 'warn'], CHANGES_REQUESTED: ['تعديلات مطلوبة', 'warn'],
  REJECTED: ['مرفوض', 'bad'], APPROVED: ['معتمد', 'good'], SCHEDULED: ['مجدول', 'good'], LIVE: ['جارٍ', 'good'],
  CLOSED: ['مغلق', 'info'], CANCELLED: ['ملغى', 'info'],
};
export const chip = (text, tone = 'info') => `<span class="ad-chip ad-chip-${tone}">${esc(text)}</span>`;
export const statusChip = (s) => chip(STATUS[s][0], STATUS[s][1]);

const PATHS = {
  grid: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 7h6V4h-6z', check: 'm5 12.5 4.5 4.5L19 7.5',
  gavel: 'M14 4l6 6-3 3-6-6zM11 7 4 14l3 3 7-7M3 21h9', pulse: 'M3 12h4l3-8 4 16 3-8h4',
  user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c1.2-4 4.3-6 8-6s6.8 2 8 6', cats: 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  card: 'M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 10h18',
  coin: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v8M9.5 10.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H14',
  swap: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7', bell: 'M6 10a6 6 0 0 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6zM10 19.5a2 2 0 0 0 4 0',
  ad: 'M3 6h18v12H3zM3 10h18', chat: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17A1.5 1.5 0 0 1 4 15.5z',
  flag: 'M5 21V4h11l-1.5 4L16 12H5', gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
  db: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M9 9h.01', doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5', menu: 'M4 7h16M4 12h16M4 17h16', close: 'M6 6l12 12M18 6 6 18',
  lock: 'M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3', warn: 'M12 7v6M12 17h.01', back: 'm9 6 6 6-6 6',
};
export const icon = (name, size = 20) => `<svg aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${PATHS[name]}"/></svg>`;

export function toast(message, tone = 'good') {
  const host = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `pointer-events-auto rounded-full px-5 py-2.5 text-[13px] font-semibold shadow-card ${tone === 'bad' ? 'bg-accent-strong text-white' : 'bg-navy text-white'}`;
  el.textContent = message;
  host.append(el);
  setTimeout(() => el.remove(), 3200);
}

/** Dialog with an optional reason field. Resolves to the reason text, or null if cancelled. */
export function askReason({ title, text = '', label = 'السبب', required = true, confirm = 'تأكيد', danger = false, noField = false }) {
  return new Promise((resolve) => {
    const opener = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-50 grid place-items-center bg-navy/55 p-4';
    wrap.innerHTML = `
      <div role="dialog" aria-modal="true" aria-labelledby="dlg-t" class="w-full max-w-[400px] rounded-card border border-line bg-white p-5 shadow-card">
        <h2 id="dlg-t" class="ad-h2">${esc(title)}</h2>
        ${text ? `<p class="mb-0 mt-1 text-[13px] text-ink-body">${esc(text)}</p>` : ''}
        ${noField ? '' : `<label class="ad-label mt-3" for="dlg-r">${esc(label)}${required ? '' : ' (اختياري)'}</label><textarea id="dlg-r" rows="3" class="ad-input" ${required ? 'aria-describedby="dlg-e"' : ''}></textarea><p id="dlg-e" class="m-0 mt-1 hidden text-xs text-accent-ink">السبب 3 أحرف على الأقل.</p>`}
        <div class="mt-4 flex gap-2"><button type="button" data-ok class="ad-btn ${danger ? 'ad-btn-danger' : 'ad-btn-primary'} ad-btn-lg">${esc(confirm)}</button><button type="button" data-cancel class="ad-btn ad-btn-lg">إلغاء</button></div>
      </div>`;
    document.body.append(wrap);
    const field = wrap.querySelector('#dlg-r');
    (field || wrap.querySelector('[data-ok]')).focus();
    const close = (value) => { wrap.remove(); opener?.focus?.(); resolve(value); };
    wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-cancel]')) close(null); });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(null); });
    wrap.querySelector('[data-ok]').addEventListener('click', () => {
      const value = field ? field.value : '';
      if (required && field && value.trim().length < 3) {
        field.setAttribute('aria-invalid', 'true');
        wrap.querySelector('#dlg-e').classList.remove('hidden');
        field.focus();
        return;
      }
      close(value);
    });
  });
}

export function pager({ page, size, total }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total ? (page - 1) * size + 1 : 0;
  const to = Math.min(total, page * size);
  const nums = [];
  const add = (n) => nums.push(`<button type="button" data-page="${n}" class="ad-pill tabular" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`);
  const dots = '<span aria-hidden="true" class="px-1">…</span>';
  if (pages <= 6) for (let n = 1; n <= pages; n++) add(n);
  else {
    add(1);
    if (page > 3) nums.push(dots);
    for (let n = Math.max(2, page - 1); n <= Math.min(pages - 1, page + 1); n++) add(n);
    if (page < pages - 2) nums.push(dots);
    add(pages);
  }
  return `
    <nav aria-label="ترقيم الصفحات" class="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3.5 text-[13px] text-ink-muted">
      <span class="tabular">عرض ${fmt(from)}–${fmt(to)} من ${fmt(total)}</span>
      <div class="flex flex-wrap items-center gap-1.5">
        <label class="me-2 flex items-center gap-1.5 text-xs">الصفوف <select data-size class="ad-input !h-8 !w-auto !px-2.5">${[10, 20, 50].map((n) => `<option ${n === size ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <button type="button" data-page="${page - 1}" class="ad-pill" ${page <= 1 ? 'disabled' : ''}>السابق</button>
        ${nums.join('')}
        <button type="button" data-page="${page + 1}" class="ad-pill" ${page >= pages ? 'disabled' : ''}>التالي</button>
      </div>
    </nav>`;
}

export const skeleton = (rows = 5, cols = 4) => `
  <div aria-busy="true" aria-label="جارٍ التحميل">
    ${Array.from({ length: rows }, () => `<div class="flex gap-6 border-b border-line-soft py-4 last:border-0">${Array.from({ length: cols }, (_, i) => `<span class="ad-skel" style="width:${[30, 18, 14, 22, 12][i % 5]}%"></span>`).join('')}</div>`).join('')}
  </div>`;

export const emptyBox = (title, text, action = '') => `
  <div class="flex flex-col items-center gap-2 px-4 py-12 text-center">
    <span class="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">${icon('check', 26)}</span>
    <h2 class="ad-h2 mt-1">${esc(title)}</h2><p class="m-0 text-[13px] text-ink-body">${esc(text)}</p>${action}
  </div>`;

export const errorBox = (text = 'تعذّر جلب البيانات. أعد المحاولة.') => `
  <div class="flex flex-col items-center gap-2 px-4 py-12 text-center" role="alert">
    <span class="grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent-ink">${icon('warn', 26)}</span>
    <h2 class="ad-h2 mt-1">تعذّر التحميل</h2><p class="m-0 text-[13px] text-ink-body">${esc(text)}</p>
    <button type="button" data-retry class="ad-btn-primary ad-btn-lg mt-2">إعادة المحاولة</button>
  </div>`;

/** Disable every write control for the read-only role. */
export function applyRole(root) {
  if (canWrite()) return;
  root.querySelectorAll('[data-write]').forEach((el) => {
    el.disabled = true;
    el.setAttribute('aria-disabled', 'true');
    el.title = 'للقراءة فقط';
  });
}

export const catName = (id) => api.rows('categories').find((c) => c.id === id)?.name.ar || '—';
export const accName = (id) => api.rows('accounts').find((a) => a.id === id)?.name || '—';
export const catPath = (a) => [catName(a.mainCategoryId), a.subCategoryId ? catName(a.subCategoryId) : null].filter(Boolean).join(' ‹ ');

/* ---------- motion + stat cards (shared by the pages) ---------- */

export const REDUCED = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Count a number up from 0 when it appears. */
export function countUp(el, to, { prefix = '', suffix = '', ms = 900, decimals = 0, instant = false } = {}) {
  if (!el) return;
  const show = (v) => { el.textContent = `${prefix}${decimals ? v.toFixed(decimals) : fmt(Math.round(v))}${suffix}`; };
  if (REDUCED || !to || instant) { show(to); return; }
  const t0 = performance.now();
  const frame = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    show(to * (1 - (1 - k) ** 3));
    if (k < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export const flash = (el) => { if (!el || REDUCED) return; el.classList.remove('ad-flash'); void el.offsetWidth; el.classList.add('ad-flash'); };

export function spark(values, stroke) {
  const w = 80, h = 30;
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => `${(w - 2 - (i * (w - 4)) / (values.length - 1)).toFixed(1)} ${(h - 3 - ((v - min) / (max - min || 1)) * (h - 8)).toFixed(1)}`);
  return `<svg aria-hidden="true" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none" stroke="${stroke}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M${pts.join(' L')}"/></svg>`;
}

const STAT_TONE = {
  gold: ['bg-gold text-navy', '#0F172A'], accent: ['bg-accent text-white', '#fff'], primary: ['bg-primary text-white', '#F59E0B'],
  navy: ['bg-navy text-white', '#F59E0B'], outline: ['border-2 border-accent bg-white text-ink', '#D93A16'], soft: ['border border-line bg-white text-ink', '#076091'],
};

/** Colored KPI cards. items: [{id, label, value, tone, prefix, suffix, sub, spark:[…], href}] */
export function statCards(items, cols = 'grid-cols-2 xl:grid-cols-4') {
  return `<div class="grid ${cols} gap-4">${items.map((it) => {
    const [cls, strokeC] = STAT_TONE[it.tone || 'soft'];
    const tag = it.href ? `a href="${it.href}"` : 'div';
    return `<${tag} class="ad-rise flex min-h-[132px] flex-col justify-between gap-2 rounded-3xl p-5 ${cls} ${it.href ? 'hover:!text-current' : ''}">
      <span class="text-[13px] font-semibold ${it.tone === 'outline' ? 'text-accent-ink' : ''}">${esc(it.label)}</span>
      <span ${it.id ? `id="${it.id}"` : ''} data-count data-to="${it.value}" data-prefix="${esc(it.prefix || '')}" data-suffix="${esc(it.suffix || '')}" data-dec="${it.decimals || 0}" class="tabular text-[32px] font-bold leading-none lg:text-[36px] ${it.tone === 'outline' ? 'text-accent-strong' : ''}">0</span>
      <span class="flex items-end justify-between gap-2 text-xs"><span class="${it.tone === 'outline' || it.tone === 'soft' ? 'text-ink-muted' : 'opacity-80'}">${esc(it.sub || '')}</span>${it.spark ? spark(it.spark, strokeC) : ''}</span>
    </${it.href ? 'a' : 'div'}>`;
  }).join('')}</div>`;
}

export function runCounts(root, animate = true) {
  root.querySelectorAll('[data-count]').forEach((el) => countUp(el, Number(el.dataset.to), { prefix: el.dataset.prefix, suffix: el.dataset.suffix, decimals: Number(el.dataset.dec), instant: !animate }));
}

/** Dark hero strip used at the top of the detail pages. */
export const heroStrip = (inner) => `<section class="ad-rise relative overflow-hidden rounded-[26px] bg-navy p-6 text-white shadow-[0_18px_40px_-22px_rgba(15,23,42,.7)] lg:p-7">
  <svg aria-hidden="true" viewBox="0 0 200 200" class="pointer-events-none absolute -start-12 -top-16 h-64 w-64 opacity-[.07]" fill="#F59E0B"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="60" fill="#0F172A"/></svg>
  <div class="relative">${inner}</div></section>`;

/** Put a row of stat cards at the top of a page; counts animate only the first time. */
export function prependStats(root, html) {
  const animate = !root.dataset.statsDone;
  root.dataset.statsDone = '1';
  root.querySelector('[data-stats]')?.remove();
  root.insertAdjacentHTML('afterbegin', `<div data-stats class="mb-5">${html}</div>`);
  runCounts(root.querySelector('[data-stats]'), animate);
}

export const hms = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
};

/** Photo with a branded placeholder behind it (shown while loading, or when there is no photo / it fails). */
export const thumb = (src, cls = 'h-[38px] w-12 rounded-[10px]', alt = '') =>
  `<span class="ad-thumb ${cls}">${src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onload="this.classList.add('is-loaded')" onerror="this.remove()">` : ''}</span>`;
