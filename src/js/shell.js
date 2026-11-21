/**
 * Site shell shared by every page: announcement bar, sticky header (logo, search, account, category nav) and footer.
 * Pages hold <div id="site-top" class="contents"></div> and <div id="site-footer" class="contents mt-auto"></div>.
 */

const heartIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[22px] w-[22px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.6 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.6 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"/></svg>';
const userIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[22px] w-[22px] sm:hidden" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/></svg>';

const bellIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[22px] w-[22px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10a6 6 0 0 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6Z"/><path d="M10 19.5a2 2 0 0 0 4 0"/></svg>';

/* ---------- notifications dropdown ---------- */

const NOTIF_ICONS = {
  warn: '<path d="M12 7v6M12 17h.01"/>',
  good: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  info: '<path d="M6 10a6 6 0 0 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6Z"/><path d="M10 19.5a2 2 0 0 0 4 0"/>',
};
const NOTIF_TONES = { warn: 'bg-accent-soft text-accent-ink', good: 'bg-primary-soft text-primary', info: 'bg-mist text-ink-body' };
const notifTimeFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { hour: 'numeric', minute: '2-digit' });
const notifDayFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long' });
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escText = (v) => String(v).replace(/[&<>"']/g, (c) => ESC[c]);
let notifFilter = 'all';

function notifAgo(at) {
  const m = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (m < 1) return 'الآن';
  if (m < 60) return m === 1 ? 'قبل دقيقة' : m === 2 ? 'قبل دقيقتين' : m <= 10 ? `قبل ${m} دقائق` : `قبل ${m} دقيقة`;
  return notifTimeFmt.format(new Date(at));
}

function notifDay(at) {
  const day = new Date(at); day.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 86400000);
  return diff === 0 ? 'اليوم' : diff === 1 ? 'أمس' : notifDayFmt.format(new Date(at));
}

function notifRow(n, read) {
  return `
    <li>
      <a href="${n.href}" data-notif="${escText(n.id)}" class="flex items-start gap-3 px-4 py-3 text-ink hover:bg-sand hover:text-ink ${read ? '' : 'bg-primary-soft/50'}">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full ${NOTIF_TONES[n.tone]}"><svg aria-hidden="true" viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${NOTIF_ICONS[n.tone]}</svg></span>
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="flex items-baseline justify-between gap-3">
            <span class="flex items-center gap-1.5 text-sm ${read ? 'font-medium' : 'font-bold'}">${read ? '' : '<span class="h-2 w-2 shrink-0 rounded-full bg-accent-strong" role="img" aria-label="غير مقروء"></span>'}${escText(n.title)}</span>
            <span class="shrink-0 text-[11px] text-ink-muted">${notifAgo(n.at)}</span>
          </span>
          <span class="truncate text-[13px] text-ink-body">${escText(n.text)}</span>
        </span>
      </a>
    </li>`;
}

function unreadCount() {
  const read = loadReadNotifications();
  return buildNotifications().filter((n) => !read.has(n.id)).length;
}

function panelHTML() {
  const read = loadReadNotifications();
  const all = buildNotifications();
  const unread = all.filter((n) => !read.has(n.id)).length;
  const list = notifFilter === 'unread' ? all.filter((n) => !read.has(n.id)) : all;
  const groups = new Map();
  list.forEach((n) => { const g = notifDay(n.at); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(n); });
  const tab = (id, label) => `<button type="button" data-notif-filter="${id}" aria-pressed="${notifFilter === id}" class="rounded-full px-3 py-1 text-xs font-semibold transition-colors ${notifFilter === id ? 'bg-primary text-white' : 'text-ink-body hover:bg-sand'}">${label}</button>`;
  return `
    <div class="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
      <h2 id="notif-title" tabindex="-1" class="m-0 text-base font-bold">الإشعارات</h2>
      ${unread ? '<button type="button" data-notif-readall class="text-xs font-semibold text-primary hover:text-primary-dark">تعليم الكل كمقروء</button>' : ''}
    </div>
    <div class="flex gap-1 px-3 pt-2.5" role="group" aria-label="عرض">${tab('all', 'الكل')}${tab('unread', `غير المقروءة${unread ? ` <span class="tabular">${unread}</span>` : ''}`)}</div>
    <div class="max-h-[min(60vh,460px)] overflow-y-auto overscroll-contain pb-1">
      ${list.length ? [...groups].map(([label, items]) => `
        <p class="m-0 px-4 pb-1 pt-3 text-xs font-semibold text-ink-muted">${escText(label)}</p>
        <ul class="m-0 list-none p-0">${items.map((n) => notifRow(n, read.has(n.id))).join('')}</ul>`).join('')
        : '<p class="m-0 px-4 py-10 text-center text-sm text-ink-body">لا توجد إشعارات غير مقروءة.</p>'}
    </div>
    <a href="account.html#settings" class="block border-t border-line-soft px-4 py-3 text-center text-sm font-semibold">إعدادات الإشعارات</a>`;
}

function bellLink() {
  const unread = unreadCount();
  return `
    <div class="relative">
      <button type="button" id="bell" aria-expanded="false" aria-controls="notif-panel" aria-haspopup="dialog" aria-label="الإشعارات، ${unread} غير مقروءة"
        class="relative flex items-center rounded-full px-2 py-2.5 text-ink hover:text-primary aria-expanded:text-primary sm:px-2.5">
        ${bellIcon}<span data-notif-count ${unread ? '' : 'hidden'} class="absolute -end-0.5 top-0.5 min-w-[18px] rounded-full bg-accent-strong px-1 text-center text-[10px] font-bold leading-[18px] text-white ring-2 ring-white tabular">${unread}</span>
      </button>
      <div id="notif-panel" role="dialog" aria-labelledby="notif-title"
        class="absolute end-0 top-full z-40 mt-2 hidden w-[380px] flex-col overflow-hidden rounded-card border border-line bg-white text-start shadow-card max-sm:fixed max-sm:inset-x-3 max-sm:mt-0 max-sm:w-auto"></div>
    </div>`;
}

function setPanelOpen(open) {
  const panel = document.getElementById('notif-panel');
  const bell = document.getElementById('bell');
  if (!panel || !bell) return;
  if (open) { notifFilter = 'all'; panel.innerHTML = panelHTML(); }
  panel.classList.toggle('hidden', !open);
  panel.classList.toggle('flex', open);
  bell.setAttribute('aria-expanded', String(open));
  // On phones the panel is fixed to the screen: open it just under the bell.
  panel.style.top = open && window.matchMedia('(max-width: 639px)').matches ? `${Math.round(bell.getBoundingClientRect().bottom + 8)}px` : '';
  if (open) document.getElementById('notif-title')?.focus();
}

function refreshPanel() {
  const panel = document.getElementById('notif-panel');
  if (panel && !panel.classList.contains('hidden')) panel.innerHTML = panelHTML();
  const unread = unreadCount();
  document.querySelectorAll('[data-notif-count]').forEach((el) => { el.textContent = unread; el.hidden = !unread; });
  document.getElementById('bell')?.setAttribute('aria-label', `الإشعارات، ${unread} غير مقروءة`);
}

let notifWired = false;
function wireNotifications() {
  if (notifWired) return;
  notifWired = true;
  document.addEventListener('click', (event) => {
    const t = event.target;
    const panel = document.getElementById('notif-panel');
    if (t.closest('#bell')) { setPanelOpen(panel.classList.contains('hidden')); return; }
    if (!panel || panel.classList.contains('hidden')) return;
    const filter = t.closest('[data-notif-filter]');
    if (filter) { notifFilter = filter.dataset.notifFilter; refreshPanel(); panel.querySelector(`[data-notif-filter="${notifFilter}"]`)?.focus(); return; }
    if (t.closest('[data-notif-readall]')) { markNotificationsRead(buildNotifications().map((n) => n.id)); document.getElementById('notif-title')?.focus(); return; }
    const row = t.closest('[data-notif]');
    if (row) { markNotificationsRead([row.dataset.notif]); return; }
    if (!t.closest('#notif-panel')) setPanelOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    const panel = document.getElementById('notif-panel');
    if (event.key === 'Escape' && panel && !panel.classList.contains('hidden')) { setPanelOpen(false); document.getElementById('bell')?.focus(); }
  });
}

const topHTML = (user) => `
    <div class="on-dark bg-forest text-[13px] text-white">
      <div class="container-page flex items-center justify-between gap-3 py-[9px]">
        <p class="m-0 min-w-0 truncate">
          <b class="me-2 rounded-md bg-lime px-2 py-0.5 font-bold text-forest">● مباشر</b><a href="live.html?e=north-yard" class="text-white underline-offset-4 hover:text-white hover:underline">مزاد سيارات ساحة الشمال الليلة 8:00م · 42 سيارة</a>
        </p>
        <div class="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <span class="hidden opacity-85 sm:inline">قسّط مع</span>
          <span class="brand-pill">
            <img data-logo src="https://www.google.com/s2/favicons?domain=tabby.ai&amp;sz=64" alt="" width="16" height="16">تابي
          </span>
          <span class="brand-pill">
            <img data-logo src="https://www.google.com/s2/favicons?domain=tamara.co&amp;sz=64" alt="" width="16" height="16">تمارا
          </span>
        </div>
      </div>
    </div>

    <header class="sticky top-0 z-20 border-b border-line bg-white shadow-header">
      <div class="container-page flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-3 py-3 lg:flex-nowrap lg:gap-6 lg:py-3.5">
        <a href="index.html" class="shrink-0" aria-label="مزادي — الرئيسية">
          <img src="public/assets/mazad-logo.png" alt="مزادي" width="900" height="284" class="block h-7 w-auto min-[360px]:h-8 sm:h-10">
        </a>

        <form id="search-form" role="search" action="search.html" class="order-last flex w-full items-center rounded-full bg-mist p-1 focus-within:ring-2 focus-within:ring-primary lg:order-none lg:w-auto lg:min-w-[260px] lg:flex-1">
          <label for="q" class="sr-only">ابحث في المزادات</label>
          <input id="q" name="q" type="search" autocomplete="off" placeholder="ابحث عن سيارة، ساعة، جوال، أو رقم لوت"
            class="min-w-0 flex-1 border-0 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted rounded-full focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:px-[18px]">
          <button type="submit" class="btn-primary px-5 py-2.5 text-sm sm:px-[22px]">بحث</button>
        </form>

        <nav aria-label="الحساب" class="ms-auto flex shrink-0 items-center gap-0.5 text-sm sm:gap-1.5">
          ${user ? bellLink() : ''}
          <a id="watch-link" href="account.html#watch" class="flex items-center gap-1 rounded-full px-2 py-2.5 font-medium text-ink hover:text-primary sm:gap-1.5 sm:px-3.5">
            <span class="sm:hidden">${heartIcon}</span>
            <span class="hidden whitespace-nowrap sm:inline">المفضلة</span>
            <span data-watch-count class="tabular rounded-full bg-accent-soft px-[7px] py-0.5 text-[11px] font-semibold text-accent-ink">${loadWatch().size}</span>
          </a>
          <a href="${user ? 'account.html' : loginHref()}" class="flex items-center rounded-full px-2 py-2.5 font-medium text-ink hover:text-primary sm:px-3.5" aria-label="${user ? 'حسابي' : 'تسجيل الدخول'}">
            ${userIcon}
            <span class="hidden whitespace-nowrap sm:inline">${user ? 'حسابي' : 'تسجيل الدخول'}</span>
          </a>
          <a href="sell.html" class="btn-outline px-3 py-2 text-[13px] sm:px-[18px] sm:py-2.5 sm:text-sm">بِع معنا</a>
        </nav>
      </div>

      <nav aria-label="الفئات" class="container-page">
        <div id="cat-nav" class="scroll-row -mx-1 gap-0.5 px-1"></div>
      </nav>
    </header>`;

const footerHTML = `
    <footer class="mt-auto border-t border-line-soft bg-primary-soft">
      <div class="container-page grid grid-cols-2 gap-7 pb-6 pt-10 text-sm sm:grid-cols-3 lg:grid-cols-4">
        <div class="col-span-2 flex flex-col gap-2.5 sm:col-span-3 lg:col-span-1">
          <img src="public/assets/mazad-logo.png" alt="مزادي" width="900" height="284" class="block h-11 w-auto self-start">
          <p class="m-0 text-[13px] leading-[1.8] text-ink-muted">سجل تجاري 1010XXXXXX<br>موثّق في المركز السعودي للأعمال</p>
          <div class="flex flex-wrap gap-2">
            <a href="#" class="whitespace-nowrap rounded-[10px] bg-ink px-3.5 py-2 text-xs text-white hover:bg-black hover:text-white">App Store</a>
            <a href="#" class="whitespace-nowrap rounded-[10px] bg-ink px-3.5 py-2 text-xs text-white hover:bg-black hover:text-white">Google Play</a>
          </div>
        </div>
        <nav aria-labelledby="f-bidders" class="flex flex-col gap-2.5">
          <h2 id="f-bidders" class="m-0 text-sm font-semibold">المزايدون</h2>
          <a href="auctions.html" class="text-ink-body">المزادات القادمة</a>
          <a href="help.html#how-to-bid" class="text-ink-body">كيف أزايد</a>
          <a href="help.html#fees" class="text-ink-body">الرسوم</a>
          <a href="help.html#protection" class="text-ink-body">حماية المشتري</a>
        </nav>
        <nav aria-labelledby="f-sellers" class="flex flex-col gap-2.5">
          <h2 id="f-sellers" class="m-0 text-sm font-semibold">البائعون</h2>
          <a href="sell.html" class="text-ink-body">ابدأ البيع</a>
          <a href="account.html#selling" class="text-ink-body">لوحة البائع</a>
          <a href="help.html#contact" class="text-ink-body">أعلن معنا</a>
        </nav>
        <div class="flex flex-col gap-2.5">
          <h2 class="m-0 text-sm font-semibold">تواصل</h2>
          <a href="tel:920012345" class="tabular text-ink-body">920012345</a>
          <a href="help.html" class="text-ink-body">مركز المساعدة</a>
        </div>
      </div>
      <div class="container-page flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pb-7 pt-4 text-xs text-ink-muted">
        <span>© 2026 مزادي · جميع الحقوق محفوظة</span>
        <ul class="m-0 flex list-none flex-wrap items-center gap-2 p-0" aria-label="وسائل الدفع">
          <li class="pay-badge">مدى<img data-logo src="https://commons.wikimedia.org/wiki/Special:FilePath/Mada_Logo.svg" alt="مدى"></li>
          <li class="pay-badge">Apple Pay<img data-logo src="https://commons.wikimedia.org/wiki/Special:FilePath/Apple_Pay_logo.svg" alt="Apple Pay"></li>
          <li class="pay-badge">فيزا<img data-logo src="https://commons.wikimedia.org/wiki/Special:FilePath/Visa_Inc._logo.svg" alt="فيزا"></li>
          <li class="pay-badge">تابي<img data-logo src="https://www.google.com/s2/favicons?domain=tabby.ai&amp;sz=128" alt="تابي"></li>
          <li class="pay-badge">تمارا<img data-logo src="https://www.google.com/s2/favicons?domain=tamara.co&amp;sz=128" alt="تمارا"></li>
        </ul>
      </div>
    </footer>`;

import * as data from './data.js';
import { initSelects } from './select.js';

/* ---------- browser storage (prototype: everything is kept in this browser only) ---------- */

function readStore(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    return value ?? fallback;
  } catch { return fallback; }
}
function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: keep it for this page only */ }
}

/** Watched lot ids, shared by every page. */
export const loadWatch = () => new Set(readStore('mz-watch', data.initialWatchlist));
export function saveWatch(set) {
  writeStore('mz-watch', [...set]);
  document.querySelectorAll('[data-watch-count]').forEach((el) => { el.textContent = set.size; });
}

/** Bids the visitor placed: [{ id, amount, status: 'leading' | 'outbid', top, at }]. Newest first, one per lot. */
export const loadBids = () => readStore('mz-bids', []);
export function saveBid(bid) {
  writeStore('mz-bids', [bid, ...loadBids().filter((b) => b.id !== bid.id)]);
}

/** Listings the visitor submitted from the sell page. */
export const loadListings = () => readStore('mz-listings', []);
export function saveListing(listing) {
  writeStore('mz-listings', [listing, ...loadListings()]);
}

/** Paid orders by lot id: { [id]: { ref, status: 'paid', method, total, delivery, at } }. */
export const loadOrders = () => readStore('mz-orders', {});
export function saveOrder(id, order) {
  writeStore('mz-orders', { ...loadOrders(), [id]: order });
}

/** Event registrations by event id: { [id]: { remind: boolean, at } }. */
export const loadEventRegs = () => readStore('mz-events', {});
export function saveEventReg(id, reg) {
  writeStore('mz-events', { ...loadEventRegs(), [id]: reg });
}

/* ---------- notifications (built from the visitor's activity plus prototype examples) ---------- */

const MIN = 60000;
const HOUR = 60 * MIN;
const pageLoadedAt = Date.now();
const priceText = (n) => `${n.toLocaleString('en-US')} ر.س`;

/** All notifications, newest first: { id, kind: 'bids'|'buying'|'selling'|'following', tone: 'warn'|'good'|'info', title, text, href, at }. */
export function buildNotifications(now = Date.now()) {
  const lotOf = (id) => data.lots.find((l) => l.id === id);
  const list = [];
  const ownBids = loadBids();
  const bids = [...ownBids, ...[{ id: 8, status: 'outbid', top: 17200, at: now - 2 * HOUR }, { id: 3, status: 'leading', amount: 4250, at: now - 30 * MIN }]
    .filter((b) => !ownBids.some((o) => o.id === b.id))];
  bids.forEach((b) => {
    const lot = lotOf(b.id);
    if (!lot) return;
    list.push(b.status === 'outbid'
      ? { id: `bid-${b.id}-out`, kind: 'bids', tone: 'warn', title: 'تجاوز مزايد آخر مزايدتك', text: `${lot.name} · أعلى مزايدة ${priceText(b.top)}`, href: `lot.html?id=${lot.id}#bid-panel`, at: b.at ?? now - HOUR }
      : { id: `bid-${b.id}-lead`, kind: 'bids', tone: 'good', title: 'مزايدتك هي الأعلى', text: `${lot.name} · ${priceText(b.amount ?? b.top)}`, href: `lot.html?id=${lot.id}`, at: b.at ?? now - HOUR });
  });
  const orders = loadOrders();
  data.wonLots.forEach((w) => {
    const lot = lotOf(w.id);
    if (orders[w.id]) list.push({ id: `paid-${w.id}`, kind: 'buying', tone: 'good', title: 'تم الدفع', text: `${lot.name} · رقم الطلب ${orders[w.id].ref}`, href: 'account.html#won', at: orders[w.id].at });
    else if (w.dueIn) list.push({ id: `won-${w.id}`, kind: 'buying', tone: 'warn', title: 'فزت بالمزاد، أكمل الدفع', text: `${lot.name} · ${priceText(w.price)}`, href: `checkout.html?id=${w.id}`, at: now - 3 * HOUR });
    else list.push({ id: `delivered-${w.id}`, kind: 'buying', tone: 'info', title: 'تم تسليم مشترياتك', text: lot.name, href: 'account.html#won', at: now - 26 * HOUR });
  });
  loadListings().forEach((l) => list.push({ id: `listing-${l.ref}`, kind: 'selling', tone: 'info', title: 'استلمنا طلب البيع', text: `${l.title} · نراجعه خلال 48 ساعة`, href: 'account.html#selling', at: l.at }));
  list.push(
    { id: 'listing-live-7', kind: 'selling', tone: 'good', title: 'نُشر منتجك في المزاد', text: 'رافعة شوكية تويوتا 3 طن', href: 'lot.html?id=7', at: now - 50 * HOUR },
    { id: 'listing-sold-198230', kind: 'selling', tone: 'good', title: 'بيع منتجك', text: `ساعة سيكو بريساج 2019 · ${priceText(2900)}`, href: 'account.html#selling', at: now - 74 * HOUR },
  );
  Object.entries(loadEventRegs()).forEach(([id, reg]) => {
    const ev = data.events[id];
    if (ev && reg.remind) list.push({ id: `event-${id}`, kind: 'following', tone: 'info', title: 'تذكير بموعد المزاد', text: ev.title, href: `event.html?e=${id}`, at: reg.at });
  });
  const elapsed = Math.floor((now - pageLoadedAt) / 1000);
  [...loadWatch()].map(lotOf).filter((l) => l && l.endsIn - elapsed > 0 && l.endsIn - elapsed < 3600)
    .forEach((l) => list.push({ id: `ending-${l.id}`, kind: 'following', tone: 'warn', title: 'مزاد في مفضلتك ينتهي خلال أقل من ساعة', text: l.name, href: `lot.html?id=${l.id}`, at: now - 5 * MIN }));
  return list.sort((a, b) => b.at - a.at);
}

export const loadReadNotifications = () => new Set(readStore('mz-notif-read', []));
export function markNotificationsRead(ids) {
  writeStore('mz-notif-read', [...new Set([...loadReadNotifications(), ...ids])]);
  refreshPanel();
}

/* ---------- sign-in state ---------- */

const USER_KEY = 'mz-user';

export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'); } catch { return null; }
}
export function setUser(user) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* storage blocked: stay signed out */ }
}
export function clearUser() {
  try { localStorage.removeItem(USER_KEY); } catch { /* nothing to clear */ }
}
/** Login link that brings the visitor back to the current page afterwards. */
export function loginHref(next = location.pathname.split('/').pop() + location.search) {
  return next && !next.startsWith('login.html') ? `login.html?next=${encodeURIComponent(next)}` : 'login.html';
}

/** Address of a category's listing page (0 = all auctions). */
export const catHref = (i) => (Number(i) > 0 ? `search.html?cat=${i}` : 'search.html');

/** Category nav buttons. `active` is the selected category index, or -1 for none. */
export function catNavHTML(categories, active) {
  return categories
    .map((label, i) => {
      const on = i === active;
      return `<button type="button" data-cat="${i}" aria-pressed="${on}" class="shrink-0 whitespace-nowrap border-b-[2.5px] px-3.5 pb-3 pt-2.5 text-sm transition-colors ${on ? 'border-primary font-semibold text-ink' : 'border-transparent text-ink-body hover:text-ink'}">${label}</button>`;
    })
    .join('');
}

/** Hide partner/payment logos that fail to load so their text label shows instead. */
let fallbacksWired = false;
function wireLogoFallbacks() {
  document.querySelectorAll('img[data-logo]').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) img.remove();
  });
  if (fallbacksWired) return;
  fallbacksWired = true;
  document.addEventListener('error', (event) => {
    if (event.target.matches?.('img[data-media], img[data-logo]')) event.target.remove();
  }, true);
  document.addEventListener('load', (event) => {
    if (event.target.matches?.('img[data-media]')) event.target.classList.add('is-loaded');
  }, true);
}

export function renderShell() {
  document.getElementById('site-top').innerHTML = topHTML(getUser());
  document.getElementById('site-footer').innerHTML = footerHTML;
  wireLogoFallbacks();
  wireNotifications();
  initSelects();
}
