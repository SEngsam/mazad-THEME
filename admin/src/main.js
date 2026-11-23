import { api, canWrite, getRole, setRole } from './api.js';
import { inbox, markInboxRead, subscribe } from './live.js';
import { ago, applyRole, errorBox, esc, icon, toast } from './ui.js';
import { applyTheme, getTheme, setTheme, THEMES } from './theme.js';

applyTheme();

const themeSwitch = () => `<div role="radiogroup" aria-label="المظهر" class="ad-seg">${THEMES.map(([id, label]) => `<button type="button" role="radio" data-theme-opt="${id}" aria-checked="${getTheme() === id}">${label}</button>`).join('')}</div>`;

/* ---------- navigation ---------- */

const NAV = [
  { id: 'overview', href: '#/', label: 'نظرة عامة', icon: 'grid' },
  { id: 'review', href: '#/review', label: 'المراجعة', icon: 'check', badge: 'review' },
  { head: 'الإدارة' },
  { id: 'auctions', href: '#/auctions', label: 'المزادات', icon: 'gavel' },
  { id: 'bids', href: '#/bids', label: 'المزايدات', icon: 'pulse' },
  { id: 'accounts', href: '#/accounts', label: 'الحسابات', icon: 'user' },
  { id: 'categories', href: '#/categories', label: 'الفئات', icon: 'cats' },
  { id: 'reviews', href: '#/reviews', label: 'التقييمات', icon: 'star' },
  { head: 'المال' },
  { id: 'payments', href: '#/payments', label: 'المدفوعات', icon: 'card' },
  { id: 'packages', href: '#/packages', label: 'باقات العملات', icon: 'coin' },
  { id: 'currencies', href: '#/currencies', label: 'العملات وأسعار الصرف', icon: 'swap' },
  { head: 'المحتوى والدعم' },
  { id: 'notifications', href: '#/notifications', label: 'الإشعارات', icon: 'bell' },
  { id: 'ads', href: '#/ads', label: 'الإعلانات', icon: 'ad' },
  { id: 'messages', href: '#/messages', label: 'رسائل المستخدمين', icon: 'chat', badge: 'messages' },
  { id: 'reports', href: '#/reports', label: 'البلاغات', icon: 'flag' },
  { head: 'النظام' },
  { id: 'settings', href: '#/settings', label: 'الإعدادات', icon: 'gear' },
  { id: 'userdata', href: '#/userdata', label: 'بيانات المستخدمين', icon: 'db' },
  { id: 'media', href: '#/media', label: 'الوسائط', icon: 'image' },
  { id: 'audit', href: '#/audit', label: 'سجل التدقيق', icon: 'doc' },
];

const BOTTOM = [
  { id: 'overview', href: '#/', label: 'نظرة عامة', icon: 'grid' },
  { id: 'review', href: '#/review', label: 'المراجعة', icon: 'check', badge: 'review' },
  { id: 'auctions', href: '#/auctions', label: 'المزادات', icon: 'gavel' },
  { id: 'accounts', href: '#/accounts', label: 'الحسابات', icon: 'user' },
  { id: 'more', href: '#', label: 'المزيد', icon: 'menu' },
];

/** route pattern -> [page module, nav id] */
const ROUTES = [
  ['/', 'overview', 'overview'], ['/review', 'review', 'review'], ['/auctions', 'auctions', 'auctions'], ['/auctions/:id', 'auction-detail', 'auctions'],
  ['/bids', 'bids', 'bids'], ['/accounts', 'accounts', 'accounts'], ['/accounts/:id', 'account-detail', 'accounts'], ['/categories', 'categories', 'categories'],
  ['/reviews', 'reviews', 'reviews'], ['/payments', 'payments', 'payments'], ['/payments/:id', 'payment-detail', 'payments'], ['/packages', 'packages', 'packages'],
  ['/currencies', 'currencies', 'currencies'], ['/notifications', 'notifications', 'notifications'], ['/notifications/log', 'notifications-log', 'notifications'],
  ['/ads', 'ads', 'ads'], ['/messages', 'messages', 'messages'], ['/reports', 'reports', 'reports'], ['/userdata', 'userdata', 'userdata'],
  ['/media', 'media', 'media'], ['/audit', 'audit', 'audit'], ['/settings', 'settings', 'settings'], ['/states', 'states', null],
];

function match(path) {
  for (const [pattern, page, nav] of ROUTES) {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
    const m = path.match(re);
    if (m) return { page, nav, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

function parseHash() {
  const raw = location.hash.slice(1) || '/';
  const [path, qs = ''] = raw.split('?');
  return { path: path.replace(/(.)\/$/, '$1'), query: Object.fromEntries(new URLSearchParams(qs)) };
}

/* ---------- shell ---------- */

const app = document.getElementById('app');
let shell = false;
let unsubLive = null;
let routeSubs = [];
let clockTimer = null;

const badgeHTML = (key, count) => `<span data-badge="${key}" class="ms-auto rounded-full ${key === 'review' ? 'bg-accent-strong' : 'bg-accent'} px-1.5 text-[11px] font-bold leading-5 text-white tabular ${count ? '' : 'hidden'}">${count || ''}</span>`;

function navHTML(active) {
  const badges = api.badges();
  return NAV.map((n) => {
    if (n.head) return `<span class="ad-side-head">${n.head}</span>`;
    return `<a href="${n.href}" class="ad-nav-link" ${n.id === active ? 'aria-current="page"' : ''}>${icon(n.icon)}<span class="min-w-0 truncate">${n.label}</span>${n.badge ? badgeHTML(n.badge, badges[n.badge]) : ''}</a>`;
  }).join('');
}

function bottomHTML(active) {
  const badges = api.badges();
  return BOTTOM.map((n) => `<a href="${n.href}" ${n.id === 'more' ? 'data-more' : ''} class="ad-bn" ${n.id === active ? 'aria-current="page"' : ''}><span>${icon(n.icon)}</span>${n.label}${n.badge ? `<span data-badge="${n.badge}" class="absolute -top-0.5 start-[calc(50%+10px)] grid h-[17px] min-w-[17px] place-items-center rounded-full border-2 border-white bg-accent-strong px-1 text-[10px] font-bold text-white tabular ${badges[n.badge] ? '' : 'hidden'}">${badges[n.badge] || ''}</span>` : ''}</a>`).join('');
}

function inboxPanel(filter = 'all') {
  const all = inbox();
  const unread = all.filter((i) => i.unread);
  const list = (filter === 'unread' ? unread : all).slice(0, 6);
  const tones = { warn: 'bg-accent-soft text-accent-ink', good: 'bg-primary-soft text-primary', info: 'bg-mist text-ink-body' };
  const tab = (id, label) => `<button type="button" data-ib-tab="${id}" class="rounded-full px-3.5 py-1.5 text-xs ${filter === id ? 'bg-primary font-bold text-white' : 'bg-mist font-semibold text-ink-body'}">${label}</button>`;
  return `
    <div class="flex items-center justify-between px-4 pb-2 pt-4"><strong class="text-[15px]">الإشعارات</strong>${unread.length ? '<button type="button" data-ib-read class="text-xs font-bold text-primary">تعليم الكل كمقروء</button>' : ''}</div>
    <div class="flex gap-1.5 px-4 pb-2.5">${tab('all', 'الكل')}${tab('unread', `غير المقروءة <span class="tabular">${unread.length}</span>`)}</div>
    <div class="max-h-[min(55vh,420px)] overflow-y-auto">${list.length ? list.map((i) => `
      <a href="${i.href}" class="flex items-start gap-3 px-4 py-3 text-[13px] !text-ink hover:bg-sand ${i.unread ? 'bg-primary-soft/60' : ''}">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold ${tones[i.tone]}">${i.icon}</span>
        <span class="min-w-0 flex-1"><strong>${esc(i.title)}</strong><br><span class="block truncate text-ink-muted">${esc(i.text)}</span></span><span class="shrink-0 text-[11px] text-ink-muted">${ago(i.at)}</span></a>`).join('') : '<p class="m-0 px-4 py-10 text-center text-[13px] text-ink-muted">لا توجد إشعارات غير مقروءة.</p>'}</div>
    <a href="#/notifications/log" class="block border-t border-line-soft py-3 text-center text-[13px] font-bold">سجل الإشعارات ‹</a>`;
}

function buildShell() {
  const readonly = !canWrite();
  app.innerHTML = `
    <div class="min-h-screen lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside class="ad-side hidden px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-4 lg:self-start" aria-label="القائمة الجانبية">
        <div class="flex shrink-0 items-center justify-between px-2"><a href="#/" aria-label="مزادي"><img src="../public/assets/mazad-logo.png" alt="مزادي" width="900" height="300" class="ad-logo"></a><span class="ad-chip ad-tag bg-lime/15 text-lime">الإدارة</span></div>
        <nav id="nav" aria-label="أقسام لوحة الإدارة" class="ad-scroll flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto"></nav>
        <div class="ad-sep flex shrink-0 items-center gap-3 border-t border-white/15 px-2 pt-4">
          <span class="ad-avatar grid h-[38px] w-[38px] place-items-center rounded-full bg-lime font-bold text-forest">م</span>
          <span class="flex min-w-0 flex-1 flex-col"><span class="font-semibold">مشرف المنصة</span><span class="ad-sub text-xs text-white/60">دور: ${readonly ? 'للقراءة فقط' : 'مدير'}</span></span>
        </div>
      </aside>

      <div class="min-w-0">
        <header class="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-line bg-white px-3.5 py-2.5 lg:gap-4 lg:px-8 lg:py-3.5">
          <button type="button" id="menu" aria-label="القائمة" aria-expanded="false" class="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-forest text-lime lg:hidden">${icon('menu', 22)}</button>
          <div class="min-w-0 flex-1 basis-40"><h1 id="h-title" class="m-0 truncate text-[17px] font-bold leading-tight lg:text-[22px]"></h1><p id="h-sub" class="m-0 truncate text-[11.5px] text-ink-muted lg:text-[13px]"></p></div>
          <span class="ad-clock hidden xl:inline-flex" title="الاتصال المباشر مع الخادم"><span class="ad-dot"></span><span>مباشر · <span id="clock">--:--</span></span></span>
          <form id="gsearch" role="search" class="hidden h-11 w-[280px] items-center gap-2 rounded-full bg-mist px-4 md:flex"><span class="text-ink-muted">${icon('search', 18)}</span><label class="sr-only" for="gq">بحث</label><input id="gq" type="search" placeholder="ابحث برقم المزاد أو الحساب أو الطلب" class="h-full min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none"><kbd class="rounded-md bg-white px-1.5 text-[11px] text-ink-muted">/</kbd></form>
          <button type="button" id="msearch" aria-label="بحث" class="ad-ib md:hidden">${icon('search')}</button>
          <a href="#/messages" aria-label="رسائل المستخدمين" class="ad-ib hidden sm:grid">${icon('chat')}<span data-badge="messages" class="ad-bd !bg-accent"></span></a>
          <div class="relative">
            <button type="button" id="bell" class="ad-ib" aria-haspopup="dialog" aria-expanded="false" aria-label="الإشعارات">${icon('bell')}<span id="bell-n" class="ad-bd"></span></button>
            <div id="bell-panel" role="dialog" aria-label="الإشعارات" class="ad-pop hidden w-[390px] max-sm:fixed max-sm:inset-x-3 max-sm:top-[66px] max-sm:w-auto sm:end-0"></div>
          </div>
          <div class="relative">
            <button type="button" id="me" aria-haspopup="menu" aria-expanded="false" class="flex h-11 items-center gap-2.5 rounded-full border border-line bg-white py-0 pe-1.5 ps-3.5 text-ink">
              <span class="grid h-8 w-8 place-items-center rounded-full bg-forest text-sm font-bold text-lime">م</span>
              <span class="hidden flex-col items-start leading-tight sm:flex"><span class="text-[13px] font-semibold">مشرف المنصة</span><span class="text-[11px] text-ink-muted">${readonly ? 'للقراءة فقط' : 'مدير'}</span></span>
            </button>
            <div id="me-panel" role="menu" aria-label="الحساب" class="ad-pop hidden w-64 sm:end-0 max-sm:fixed max-sm:inset-x-3 max-sm:top-[66px] max-sm:w-auto">
              <div class="flex items-center gap-3 border-b border-line-soft p-4"><span class="grid h-10 w-10 place-items-center rounded-full bg-forest font-bold text-lime">م</span><span><strong>مشرف المنصة</strong><br><span class="text-xs text-ink-muted">دور: ${readonly ? 'للقراءة فقط' : 'مدير'}</span></span></div>
              <div class="border-b border-line-soft px-4 py-3"><div class="mb-2 text-[11px] font-semibold text-ink-muted">المظهر</div>${themeSwitch()}</div>
              <a role="menuitem" href="#/settings" class="flex items-center gap-3 px-4 py-3 text-[13px] !text-ink hover:bg-sand">${icon('gear', 18)}الإعدادات</a>
              <a role="menuitem" href="#/notifications/log" class="flex items-center gap-3 px-4 py-3 text-[13px] !text-ink hover:bg-sand">${icon('bell', 18)}سجل الإشعارات</a>
              <button type="button" role="menuitem" id="logout" class="flex w-full items-center gap-3 border-t border-line-soft px-4 py-3 text-[13px] text-accent-ink hover:bg-accent-soft">${icon('lock', 18)}تسجيل الخروج</button>
            </div>
          </div>
        </header>
        <form id="msearch-row" role="search" class="hidden border-b border-line bg-white px-3.5 pb-3 pt-1"><label class="sr-only" for="mq">بحث</label><input id="mq" type="search" placeholder="ابحث برقم المزاد أو الحساب" class="ad-input"></form>
        ${readonly ? `<div class="flex items-center gap-2.5 bg-mist px-4 py-2.5 text-[13px] text-ink-body lg:px-8">${icon('lock', 18)}أنت تتصفح بدور «للقراءة فقط». الإجراءات معطّلة.</div>` : ''}
        <main id="main" tabindex="-1" class="px-3.5 pb-28 pt-5 outline-none lg:px-8 lg:pb-10 lg:pt-6"></main>
      </div>
    </div>

    <nav id="bottom" aria-label="التنقل السريع" class="fixed inset-x-0 bottom-0 z-30 flex gap-0.5 border-t border-line bg-white px-2.5 pb-3 pt-2 shadow-[0_-10px_26px_-18px_rgba(6,46,34,.4)] lg:hidden"></nav>

    <div id="drawer" class="fixed inset-0 z-40 hidden bg-forest/60 lg:hidden">
      <aside class="ad-side absolute inset-y-0 start-0 flex w-[310px] max-w-[88vw] flex-col gap-3 p-4 shadow-2xl" aria-label="القائمة">
        <div class="flex shrink-0 items-center justify-between"><img src="../public/assets/mazad-logo.png" alt="مزادي" class="ad-logo !h-[26px]"><button type="button" id="drawer-close" aria-label="إغلاق" class="ad-x grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white">${icon('close')}</button></div>
        <nav id="nav-m" class="ad-scroll flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto"></nav>
        <div class="ad-sep flex shrink-0 items-center gap-3 border-t border-white/15 px-1.5 pt-3.5"><span class="ad-avatar grid h-[38px] w-[38px] place-items-center rounded-full bg-lime font-bold text-forest">م</span><span class="flex flex-1 flex-col"><strong class="text-[13px]">مشرف المنصة</strong><span class="ad-sub text-[11px] text-white/60">دور: ${readonly ? 'للقراءة فقط' : 'مدير'}</span></span><button type="button" id="logout-m" class="ad-out text-xs font-semibold">خروج</button></div>
      </aside>
    </div>`;

  const $ = (s) => app.querySelector(s);
  const drawer = (open) => {
    $('#drawer').classList.toggle('hidden', !open);
    $('#menu').setAttribute('aria-expanded', String(open));
    (open ? $('#drawer-close') : $('#menu')).focus();
  };
  $('#menu').addEventListener('click', () => drawer(true));
  $('#drawer-close').addEventListener('click', () => drawer(false));
  $('#drawer').addEventListener('click', (e) => { if (e.target.id === 'drawer' || e.target.closest('a')) drawer(false); });
  $('#bottom').addEventListener('click', (e) => { if (e.target.closest('[data-more]')) { e.preventDefault(); drawer(true); } });

  const out = () => { setRole(null); location.hash = '#/login'; };
  $('#logout').addEventListener('click', out);
  $('#logout-m').addEventListener('click', out);

  const go = (q) => { location.hash = `#/auctions${q ? `?q=${encodeURIComponent(q)}` : ''}`; };
  $('#gsearch').addEventListener('submit', (e) => { e.preventDefault(); go($('#gq').value.trim()); });
  $('#msearch-row').addEventListener('submit', (e) => { e.preventDefault(); go($('#mq').value.trim()); $('#msearch-row').classList.add('hidden'); });
  $('#msearch').addEventListener('click', () => { const r = $('#msearch-row'); r.classList.toggle('hidden'); if (!r.classList.contains('hidden')) $('#mq').focus(); });

  // Popovers: notifications and account menu.
  let ibFilter = 'all';
  const pops = { bell: [$('#bell'), $('#bell-panel')], me: [$('#me'), $('#me-panel')] };
  function closePops(except) {
    Object.entries(pops).forEach(([k, [btn, panel]]) => { if (k !== except) { panel.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); } });
  }
  const drawBell = () => { $('#bell-panel').innerHTML = inboxPanel(ibFilter); };
  Object.entries(pops).forEach(([k, [btn, panel]]) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = panel.classList.contains('hidden');
    closePops(k);
    if (k === 'bell' && open) { ibFilter = 'all'; drawBell(); }
    panel.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', String(open));
  }));
  $('#bell-panel').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-ib-tab]');
    if (tab) { ibFilter = tab.dataset.ibTab; drawBell(); return; }
    if (e.target.closest('[data-ib-read]')) { markInboxRead(); drawBell(); refreshBadges(); return; }
    if (e.target.closest('a')) closePops();
  });
  $('#me-panel').addEventListener('click', (e) => {
    const opt = e.target.closest('[data-theme-opt]');
    if (opt) {
      setTheme(opt.dataset.themeOpt);
      $('#me-panel').querySelectorAll('[data-theme-opt]').forEach((b) => b.setAttribute('aria-checked', String(b === opt)));
      return;
    }
    if (e.target.closest('a')) closePops();
  });

  // Clock.
  const clockFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const tickClock = () => { const c = document.getElementById('clock'); if (c) c.textContent = clockFmt.format(new Date()); };
  tickClock();
  clearInterval(clockTimer);
  clockTimer = setInterval(tickClock, 1000);

  // Live events: shell updates first, then the current page.
  unsubLive?.();
  unsubLive = subscribe((e) => {
    refreshBadges();
    if (e.type === 'submit') toast('مزاد جديد بانتظار المراجعة');
    routeSubs.forEach((fn) => fn(e));
  });
  shell = true;
}

// Global listeners are added once.
document.addEventListener('click', (e) => {
  if (!e.target.closest('#bell-panel, #me-panel, #bell, #me')) {
    document.querySelectorAll('#bell-panel, #me-panel').forEach((p) => p.classList.add('hidden'));
    document.querySelectorAll('#bell, #me').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('#bell-panel, #me-panel').forEach((p) => p.classList.add('hidden'));
    document.querySelectorAll('#bell, #me').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
    const desktop = document.getElementById('gq');
    if (desktop && desktop.offsetParent) { e.preventDefault(); desktop.focus(); } else if (document.getElementById('msearch')) { e.preventDefault(); document.getElementById('msearch').click(); }
  }
});

function refreshBadges() {
  const badges = api.badges();
  document.querySelectorAll('[data-badge]').forEach((el) => {
    const n = badges[el.dataset.badge] ?? 0;
    el.textContent = n || '';
    el.classList.toggle('hidden', !n);
  });
  const unread = inbox().filter((i) => i.unread).length;
  const bn = document.getElementById('bell-n');
  if (bn) { bn.textContent = unread > 99 ? '99+' : unread || ''; bn.hidden = !unread; }
  const bell = document.getElementById('bell');
  if (bell) bell.setAttribute('aria-label', `الإشعارات، ${unread} غير مقروءة`);
}

function drawNav(active) {
  const html = navHTML(active);
  document.getElementById('nav').innerHTML = html;
  document.getElementById('nav-m').innerHTML = html;
  document.getElementById('bottom').innerHTML = bottomHTML(BOTTOM.some((b) => b.id === active) ? active : null);
  refreshBadges();
}

const ctx = {
  setHeader(title, sub = '') {
    document.getElementById('h-title').textContent = title;
    document.getElementById('h-sub').textContent = sub;
    document.title = `${title} · لوحة إدارة مزادي`;
  },
  refreshBadges,
  /** Subscribe the current page to live events; cleared automatically on navigation. */
  onLive(fn) { routeSubs.push(fn); },
  go(hash) { location.hash = hash; },
};

/* ---------- router ---------- */

let renderId = 0;

async function route() {
  const id = ++renderId;
  const { path, query } = parseHash();
  routeSubs = [];
  document.dispatchEvent(new CustomEvent('ad-route'));

  if (path === '/login') {
    unsubLive?.(); unsubLive = null; clearInterval(clockTimer);
    shell = false;
    const mod = await import('./pages/login.js');
    document.title = 'تسجيل الدخول · لوحة إدارة مزادي';
    mod.default(app, { go: ctx.go });
    return;
  }
  if (!getRole()) { location.hash = '#/login'; return; }

  if (!shell || !document.getElementById('main')) buildShell();
  const found = match(path);
  // Fresh container per route, so listeners from the previous page never leak.
  const old = document.getElementById('main');
  const root = old.cloneNode(false);
  old.replaceWith(root);
  drawNav(found?.nav);
  window.scrollTo(0, 0);

  if (!found) {
    const mod = await import('./pages/states.js');
    ctx.setHeader('الصفحة غير موجودة');
    root.innerHTML = mod.notFound();
    return;
  }
  try {
    const mod = await import(`./pages/${found.page}.js`);
    if (id !== renderId) return;
    if (mod.adminOnly && !canWrite()) {
      const states = await import('./pages/states.js');
      ctx.setHeader(mod.meta?.title || 'غير مسموح');
      root.innerHTML = states.forbidden();
      return;
    }
    if (mod.meta) ctx.setHeader(mod.meta.title, mod.meta.sub);
    root.innerHTML = '';
    await mod.default(root, { params: found.params, query, ctx });
    applyRole(root);
  } catch (e) {
    console.error(e);
    if (id === renderId) root.innerHTML = `<div class="ad-card">${errorBox()}</div>`;
  }
}

window.addEventListener('hashchange', route);
route();
