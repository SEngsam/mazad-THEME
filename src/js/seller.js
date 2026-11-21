import * as data from './data.js';
import { LotCard, esc, formatCountdown, formatNumber, formatPrice } from './components.js';
import { catHref, catNavHTML, loadWatch, renderShell, saveWatch } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const sid = data.sellers[params.get('s')] ? params.get('s') : 'alwafa';
if (params.has('s') && sid !== params.get('s')) location.replace('404.html');
const seller = data.sellers[sid];
const startedAt = Date.now();
const FOLLOW_KEY = 'mz-follow';
const TABS = [['lots', 'المزادات الحالية'], ['sold', 'المبيعات السابقة'], ['reviews', 'التقييمات']];

/** Lots on sale by this seller (the generic seller owns every lot no named seller lists). */
const lots = data.lots.filter((l) => data.sellerIdOf(l) === sid);
const reviewCount = seller.stars.reduce((a, b) => a + b, 0);

const state = {
  tab: TABS.some(([t]) => `#${t}` === location.hash) ? location.hash.slice(1) : 'lots',
  watch: loadWatch(),
  following: readFollow().includes(sid),
};

function readFollow() {
  try { return JSON.parse(localStorage.getItem(FOLLOW_KEY) ?? '[]'); } catch { return []; }
}
function writeFollow(on) {
  try {
    const list = readFollow().filter((x) => x !== sid);
    localStorage.setItem(FOLLOW_KEY, JSON.stringify(on ? [...list, sid] : list));
  } catch { /* storage blocked: keep it for this page */ }
}

/* ---------- parts ---------- */

const shield = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4" stroke-linecap="round"/></svg>';
const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const starPath = 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z';

function stars(n, size = 'h-4 w-4') {
  return `<span class="flex items-center gap-0.5" aria-label="${n} من 5">${[1, 2, 3, 4, 5].map((i) => `<svg aria-hidden="true" viewBox="0 0 24 24" class="${size} ${i <= Math.round(n) ? 'text-primary' : 'text-line'}" fill="currentColor"><path d="${starPath}"/></svg>`).join('')}</span>`;
}

function header() {
  return `
    <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted">
      <ol class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li><a href="index.html" class="text-ink-body hover:text-primary">الرئيسية</a></li><li aria-hidden="true">‹</li><li aria-current="page" class="text-ink">${esc(seller.name)}</li>
      </ol>
    </nav>
    <header class="card flex flex-col gap-5 p-5 sm:p-6">
      <div class="flex flex-wrap items-center gap-4">
        <span class="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary-soft text-2xl font-bold text-primary">${esc(seller.name.trim()[0])}</span>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <h1 class="m-0 text-2xl font-bold leading-tight sm:text-[28px]">${esc(seller.name)}</h1>
          <p class="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
            <span class="flex items-center gap-1 font-semibold text-primary">${shield}هوية موثّقة بنفاذ</span>
            <span>${esc(seller.city)}</span><span>عضو منذ <span class="tabular">${seller.since}</span></span>
          </p>
        </div>
        <button type="button" id="follow" aria-pressed="${state.following}" class="${state.following ? 'btn-primary' : 'btn-outline'} w-full px-6 py-2.5 text-sm sm:w-auto">${state.following ? `${check}تتابع البائع` : 'متابعة البائع'}</button>
      </div>
      <dl class="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line-soft sm:grid-cols-4">
        ${[['الصفقات المكتملة', formatNumber(seller.deals)], ['التقييم', `${seller.rating} من 5`], ['مطابقة الوصف', `${seller.match}%`], ['سرعة الرد', seller.reply]]
          .map(([k, v]) => `<div class="flex flex-col gap-1 bg-white px-4 py-3"><dt class="text-xs text-ink-muted">${k}</dt><dd class="m-0 text-lg font-bold text-ink tabular">${esc(v)}</dd></div>`).join('')}
      </dl>
    </header>`;
}

function tabs() {
  const counts = { lots: lots.length, sold: seller.sold.length, reviews: reviewCount };
  return `
    <div class="scroll-row -m-0.5 gap-2 p-0.5" role="tablist" aria-label="أقسام صفحة البائع">
      ${TABS.map(([id, label]) => {
        const on = id === state.tab;
        return `<button type="button" role="tab" id="tab-${id}" aria-selected="${on}" aria-controls="panel" data-tab="${id}" class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${on ? 'border-primary bg-primary text-white' : 'border-[#E5E7EB] bg-white text-ink hover:border-ink/40'}">
          ${label}<span class="rounded-full px-[7px] py-0.5 text-[11px] font-semibold tabular ${on ? 'bg-white/20' : 'bg-mist text-ink-body'}">${formatNumber(counts[id])}</span></button>`;
      }).join('')}
    </div>`;
}

function lotsPanel() {
  if (!lots.length) return '<p class="m-0 rounded-card border border-dashed border-line bg-white p-8 text-center text-sm text-ink-body">لا توجد مزادات حالية لهذا البائع.</p>';
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return `<div id="seller-lots" class="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">${lots.map((l) => LotCard(l, { remaining: l.endsIn - elapsed, watched: state.watch.has(l.id) })).join('')}</div>`;
}

function soldPanel() {
  return `<ul class="card m-0 flex list-none flex-col px-5 py-1 sm:px-6">${seller.sold.map((s) => `
    <li class="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft py-4 last:border-0">
      <span class="flex flex-col gap-0.5"><b class="text-[15px] font-semibold">${esc(s.name)}</b><span class="text-xs text-ink-muted">${esc(s.date)}</span></span>
      <span class="flex items-center gap-3"><b class="text-[15px] font-semibold tabular">${formatPrice(s.price)}</b><span class="rounded-md bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">مُباع</span></span>
    </li>`).join('')}</ul>`;
}

function reviewsPanel() {
  const max = Math.max(...seller.stars);
  const bars = seller.stars.map((n, i) => `
    <div class="flex items-center gap-3 text-xs">
      <span class="w-3 text-ink-body tabular">${5 - i}</span>
      <span class="h-2 flex-1 overflow-hidden rounded-full bg-mist"><span class="block h-full rounded-full bg-primary" style="width:${max ? (n / max) * 100 : 0}%"></span></span>
      <span class="w-8 text-end text-ink-muted tabular">${n}</span>
    </div>`).join('');
  return `
    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div class="card flex flex-col gap-4 p-5">
        <div class="flex items-end gap-3"><b class="text-[40px] font-bold leading-none tabular">${seller.rating}</b><span class="pb-1 text-sm text-ink-muted">من 5</span></div>
        ${stars(seller.rating, 'h-5 w-5')}
        <p class="m-0 text-[13px] text-ink-muted"><span class="tabular">${formatNumber(reviewCount)}</span> تقييماً من مشترين أتمّوا الشراء</p>
        <div class="flex flex-col gap-2" aria-label="توزيع التقييمات">${bars}</div>
      </div>
      <ul class="m-0 flex list-none flex-col gap-3 p-0">${seller.reviews.map((r) => `
        <li class="card flex flex-col gap-2.5 p-5">
          <div class="flex flex-wrap items-center justify-between gap-2">${stars(r.stars)}<span class="text-xs text-ink-muted">${esc(r.date)}</span></div>
          <p class="m-0 text-[15px] leading-relaxed text-ink">${esc(r.text)}</p>
          <p class="m-0 text-xs text-ink-muted">${esc(r.who)} · ${esc(r.item)}</p>
        </li>`).join('')}</ul>
    </div>`;
}

function render() {
  const panels = { lots: lotsPanel, sold: soldPanel, reviews: reviewsPanel };
  document.title = `${seller.name} · مزادي`;
  $('#main').innerHTML = `
    ${header()}
    <section class="flex flex-col gap-4">
      ${tabs()}
      <div id="panel" role="tabpanel" aria-labelledby="tab-${state.tab}">${panels[state.tab]()}</div>
    </section>`;
}

let toastTimer;
function toast(message) {
  $('#toast').innerHTML = `<div class="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-card">${check}<span>${esc(message)}</span></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').innerHTML = ''; }, 3500);
}

/* ---------- events ---------- */

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) { location.href = catHref(cat.dataset.cat); return; }
  const tab = t.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    history.replaceState(null, '', `${location.pathname}${location.search}#${state.tab}`);
    render();
    $(`#tab-${state.tab}`)?.focus();
    return;
  }
  if (t.closest('#follow')) {
    state.following = !state.following;
    writeFollow(state.following);
    render();
    $('#follow').focus();
    toast(state.following ? 'ستصلك المزادات الجديدة لهذا البائع' : 'ألغيت متابعة البائع');
    return;
  }
  const watch = t.closest('#seller-lots [data-watch]');
  if (watch) {
    const id = Number(watch.dataset.watch);
    state.watch.has(id) ? state.watch.delete(id) : state.watch.add(id);
    saveWatch(state.watch);
    render();
    document.querySelector(`#seller-lots [data-watch="${id}"]`)?.focus();
  }
});

/* ---------- start ---------- */

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
render();
setInterval(() => {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const byId = new Map(data.lots.map((l) => [String(l.id), l]));
  document.querySelectorAll('#seller-lots [data-timer]').forEach((node) => {
    const left = byId.get(node.dataset.timer).endsIn - elapsed;
    node.lastElementChild.textContent = formatCountdown(left);
    node.classList.toggle('text-timer', left < 3600);
    node.classList.toggle('text-white', left >= 3600);
  });
}, 1000);
