import * as data from './data.js';
import { LotCard, Media, esc, formatNumber, formatPrice, icons } from './components.js';
import { catHref, catNavHTML, getUser, loadBids, loadWatch, loginHref, renderShell, saveBid, saveWatch } from './shell.js';

renderShell();

const $ = (sel, root = document) => root.querySelector(sel);
const params = new URLSearchParams(location.search);
const lot = data.lots.find((l) => String(l.id) === params.get('id')) ?? data.lots[0];
const catName = data.categories[lot.cat];
const d = detailsFor(lot);
const startedAt = Date.now();
const OUTBID_AFTER_MS = 25000;
const SNIPING_WINDOW = 120;

const state = {
  current: lot.bid,
  bids: d.bids,
  amount: 0,
  confirming: false,
  status: null, // null | 'leading' | 'outbid'
  extraTime: 0,
  photo: 0,
  watch: loadWatch(),
  history: buildHistory(lot.bid, d.bids),
};

/* ---------- data helpers ---------- */

function detailsFor(l) {
  const own = data.lotDetails[l.id];
  if (own) return own;
  return {
    lotNo: data.lotNumber(l),
    bids: 5 + l.id * 3,
    startBid: Math.max(100, Math.round((l.bid * 0.6) / 100) * 100),
    reserveMet: !l.noReserve && l.id % 2 === 0,
    watchers: 20 + l.id * 7,
    gallery: 1,
    specs: [['الفئة', data.categories[l.cat]], ['المدينة', l.city], ['التفاصيل', l.sub]],
    inspection: null,
    description: `${l.sub}. يُسلَّم المنتج للفائز بعد إتمام الدفع، وتُراجع حالته من فريق مزاد قبل النشر.`,
    viewing: { place: l.city, times: 'بالتنسيق مع البائع بعد الفوز' },
  };
}

/** Minimum raise for a given current bid. */
function increment(bid) {
  if (bid < 10000) return 100;
  if (bid < 50000) return 250;
  if (bid < 200000) return 500;
  return 1000;
}
const minBid = () => state.current + increment(state.current);

function buildHistory(top, count) {
  const rows = [];
  let amount = top;
  const ages = ['قبل 3 دقائق', 'قبل 11 دقيقة', 'قبل 26 دقيقة', 'قبل ساعة', 'قبل ساعتين', 'قبل 5 ساعات', 'أمس', 'أمس'];
  for (let i = 0; i < Math.min(count, ages.length); i += 1) {
    rows.push({ who: `مزايد #${4821 - i * 377 + lot.id * 13}`, amount, age: ages[i] });
    amount -= increment(amount) * (1 + (i % 3));
  }
  return rows;
}

const remaining = () => lot.endsIn + state.extraTime - Math.floor((Date.now() - startedAt) / 1000);

function segments(sec) {
  const t = Math.max(0, sec);
  const pad = (v) => String(v).padStart(2, '0');
  return [
    [pad(Math.floor(t / 86400)), 'يوم'],
    [pad(Math.floor((t % 86400) / 3600)), 'ساعة'],
    [pad(Math.floor((t % 3600) / 60)), 'دقيقة'],
    [pad(t % 60), 'ثانية'],
  ];
}

function shortCountdown(sec) {
  const t = Math.max(0, sec);
  const days = Math.floor(t / 86400);
  if (days) return `${days} يوم`;
  const pad = (v) => String(v).padStart(2, '0');
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(t % 60)}` : `${pad(m)}:${pad(t % 60)}`;
}

const endFormat = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', hour: 'numeric', minute: '2-digit' });
const endsAtLabel = () => `ينتهي ${endFormat.format(new Date(startedAt + (lot.endsIn + state.extraTime) * 1000))}`;

/* ---------- icons ---------- */

const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const warnIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/></svg>';
const pin = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
const calendar = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
const shield = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4" stroke-linecap="round"/></svg>';

/* ---------- static parts ---------- */

function breadcrumb() {
  return `
    <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted">
      <ol class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li><a href="index.html" class="text-ink-body hover:text-primary">الرئيسية</a></li>
        <li aria-hidden="true">‹</li>
        <li><a href="${catHref(lot.cat)}" class="text-ink-body hover:text-primary">${esc(catName)}</a></li>
        <li aria-hidden="true">‹</li>
        <li aria-current="page" class="min-w-0 truncate text-ink">${esc(lot.name)}</li>
      </ol>
    </nav>`;
}

function titleBlock() {
  const badges = [
    `<span class="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink-body">${esc(catName)}</span>`,
    d.inspection ? `<span class="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">${shield}مفحوصة</span>` : '',
    lot.noReserve ? '<span class="whitespace-nowrap rounded-md bg-accent-soft px-2 py-1 text-xs font-semibold text-accent-ink">بدون حد أدنى</span>' : '',
  ].join('');
  return `
    <header class="flex flex-col gap-2">
      <div class="flex flex-wrap items-center gap-2">${badges}</div>
      <h1 class="m-0 text-2xl font-bold leading-[1.35] sm:text-[28px]">${esc(lot.name)}</h1>
      <p class="m-0 text-[15px] leading-relaxed text-ink-body">${esc(lot.sub)}</p>
      <p class="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
        <span>${esc(lot.city)}</span><span aria-hidden="true">·</span>
        <span class="tabular">لوت ${esc(d.lotNo)}</span><span aria-hidden="true">·</span>
        <span>${formatNumber(d.watchers)} يتابعون</span>
      </p>
    </header>`;
}

function gallery() {
  const count = d.gallery;
  const thumbs = count > 1
    ? `<div class="grid grid-cols-6 gap-2" role="group" aria-label="صور المزاد">
        ${Array.from({ length: count }, (_, i) => `
          <button type="button" data-photo="${i}" aria-pressed="${i === state.photo}" aria-label="الصورة ${i + 1} من ${count}"
            class="block rounded-[10px] outline outline-2 outline-offset-2 transition-[outline-color] ${i === state.photo ? 'outline-primary' : 'outline-transparent hover:outline-line'}">
            ${Media({ src: i === 0 ? lot.img : '', className: 'aspect-square rounded-[10px]' })}
          </button>`).join('')}
      </div>`
    : '';
  return `
    <div class="flex flex-col gap-2.5">
      <div class="relative">
        <div id="main-photo">${Media({ src: state.photo === 0 ? lot.img : '', alt: lot.name, eager: true, className: 'aspect-[4/3] rounded-card' })}</div>
        <span class="pointer-events-none absolute bottom-3 start-3 rounded-full bg-forest/[.93] px-2.5 py-1 text-xs font-semibold text-white tabular" id="photo-count" dir="ltr">${state.photo + 1} / ${count}</span>
      </div>
      ${thumbs}
    </div>`;
}

function sectionNav() {
  const items = [['specs', 'المواصفات'], d.inspection && ['inspection', 'تقرير الفحص'], ['description', 'الوصف'], ['history', 'سجل المزايدات'], ['viewing', 'المعاينة والبائع']].filter(Boolean);
  return `
    <nav aria-label="أقسام الصفحة" class="scroll-row -m-0.5 gap-2 p-0.5">
      ${items.map(([id, label]) => `<a href="#${id}" class="shrink-0 whitespace-nowrap rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-ink hover:border-ink/40 hover:text-ink">${label}</a>`).join('')}
    </nav>`;
}

const cardSection = (id, title, body, aside = '') => `
  <section id="${id}" aria-labelledby="${id}-title" class="card flex scroll-mt-48 lg:scroll-mt-40 flex-col gap-4 p-5 sm:p-6">
    <div class="section-head"><h2 id="${id}-title" class="m-0 text-lg font-bold">${title}</h2>${aside}</div>
    ${body}
  </section>`;

function specsSection() {
  const cells = d.specs.map(([k, v]) => `
    <div class="flex items-baseline justify-between gap-4 bg-white px-4 py-3 text-sm">
      <dt class="shrink-0 text-ink-muted">${esc(k)}</dt><dd class="m-0 text-end font-semibold text-ink">${esc(v)}</dd>
    </div>`);
  if (cells.length % 2) cells.push('<div class="hidden bg-white sm:block" aria-hidden="true"></div>');
  return cardSection('specs', 'المواصفات', `<dl class="m-0 grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-line bg-line-soft sm:grid-cols-2">${cells.join('')}</dl>`);
}

function inspectionSection() {
  if (!d.inspection) return '';
  const { items, by, date } = d.inspection;
  const okCount = items.filter((i) => i.ok).length;
  const rows = items.map((i) => `
    <li class="flex items-start gap-3 border-b border-line-soft py-3 last:border-0">
      <span class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${i.ok ? 'bg-primary-soft text-primary' : 'bg-accent-soft text-accent-ink'}">${i.ok ? check : warnIcon}</span>
      <span class="flex min-w-0 flex-1 flex-col gap-0.5">
        <b class="text-sm font-semibold">${esc(i.part)}</b>
        <span class="text-[13px] text-ink-body">${esc(i.note)}</span>
      </span>
      <span class="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${i.ok ? 'bg-primary-soft text-primary' : 'bg-accent-soft text-accent-ink'}">${i.ok ? 'سليم' : 'ملاحظة'}</span>
    </li>`).join('');
  const summary = `<span class="text-[13px] text-ink-muted">${esc(by)} · ${esc(date)}</span>`;
  return cardSection('inspection', 'تقرير الفحص', `
    <div class="flex flex-wrap gap-2 text-[13px]">
      <span class="rounded-full bg-primary-soft px-3 py-1 font-semibold text-primary">${okCount} سليم</span>
      <span class="rounded-full bg-accent-soft px-3 py-1 font-semibold text-accent-ink">${items.length - okCount} ملاحظة</span>
    </div>
    <ul class="m-0 list-none p-0">${rows}</ul>
    <a href="#" class="btn-outline self-start px-5 py-2.5 text-sm">عرض التقرير الكامل</a>`, summary);
}

function descriptionSection() {
  return cardSection('description', 'الوصف', `<p class="m-0 text-[15px] leading-[1.8] text-ink-body">${esc(d.description)}</p>`);
}

function historyRows() {
  return state.history.map((row, i) => {
    const mine = row.who === 'أنت';
    const initials = mine ? 'أ' : row.who.replace(/\D/g, '').slice(-2);
    return `
      <li class="flex items-center justify-between gap-3 border-b border-line-soft py-3 last:border-0">
        <span class="flex min-w-0 items-center gap-2.5">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold tabular ${mine ? 'bg-primary text-white' : 'bg-mist text-ink-body'}">${initials}</span>
          <span class="truncate text-sm font-medium ${mine ? 'text-primary' : 'text-ink'}">${esc(row.who)}</span>
          ${i === 0 ? '<span class="shrink-0 rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">الأعلى</span>' : ''}
        </span>
        <span class="shrink-0 text-end">
          <b class="block text-sm font-semibold tabular">${formatPrice(row.amount)}</b>
          <span class="text-xs text-ink-muted">${esc(row.age)}</span>
        </span>
      </li>`;
  }).join('');
}

function historySection() {
  return cardSection('history', 'سجل المزايدات', `<ul id="history-list" class="m-0 list-none p-0">${historyRows()}</ul>`,
    `<span id="history-count" class="text-[13px] text-ink-muted">${formatNumber(state.bids)} مزايدة</span>`);
}

function viewingSection() {
  const { place, times } = d.viewing;
  const sid = data.sellerIdOf(lot);
  const s = data.sellers[sid];
  return `
    <section id="viewing" aria-label="المعاينة والبائع" class="grid scroll-mt-48 lg:scroll-mt-40 grid-cols-1 gap-5 sm:grid-cols-2">
      <div class="card flex flex-col gap-3 p-5 sm:p-6">
        <h2 class="m-0 text-lg font-bold">المعاينة والاستلام</h2>
        <p class="m-0 flex items-start gap-2 text-sm text-ink-body">${pin}<span>${esc(place)}</span></p>
        <p class="m-0 flex items-start gap-2 text-sm text-ink-body">${calendar}<span>${esc(times)}</span></p>
      </div>
      <div class="card flex flex-col gap-3 p-5 sm:p-6">
        <h2 class="m-0 text-lg font-bold">البائع</h2>
        <div class="flex items-center gap-3">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-base font-bold text-primary">${esc(s.name.trim()[0])}</span>
          <span class="flex min-w-0 flex-col">
            <a href="seller.html?s=${sid}" class="truncate text-[15px] font-semibold text-ink hover:text-primary">${esc(s.name)}</a>
            <span class="flex items-center gap-1 text-xs font-semibold text-primary">${shield}هوية موثّقة بنفاذ</span>
          </span>
        </div>
        <p class="m-0 flex flex-wrap gap-x-2 text-[13px] text-ink-muted">
          <span>عضو منذ <span class="tabular">${s.since}</span></span><span aria-hidden="true">·</span>
          <span class="tabular">${formatNumber(s.deals)} صفقة</span><span aria-hidden="true">·</span>
          <span>التقييم <span class="tabular">${s.rating}</span> من 5</span>
        </p>
        <a href="seller.html?s=${sid}" class="btn-outline self-start px-5 py-2 text-[13px]">صفحة البائع</a>
      </div>
    </section>`;
}

/* ---------- bid panel ---------- */

function reserveChip() {
  if (lot.noReserve) return '<span class="whitespace-nowrap rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">بدون حد أدنى</span>';
  return d.reserveMet
    ? '<span class="whitespace-nowrap rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">تجاوز الحد الأدنى</span>'
    : '<span class="whitespace-nowrap rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">لم يصل للحد الأدنى</span>';
}

function countdownCells(sec) {
  return segments(sec).map(([v, l]) => `
    <div class="rounded-[10px] bg-white/10 px-1 py-2 text-center">
      <b class="block text-2xl font-bold leading-tight tabular">${v}</b>
      <span class="text-[11px] opacity-75">${l}</span>
    </div>`).join('');
}

function bidPanel() {
  const inc = increment(state.current);
  const deposit = Math.min(5000, Math.max(500, Math.round((lot.bid * 0.05) / 100) * 100));
  return `
    <div class="card overflow-hidden">
      <div class="on-dark bg-forest px-5 py-4 text-white">
        <div class="flex items-center justify-between gap-3 text-[13px]">
          <span class="opacity-85">ينتهي خلال</span>
          <span id="ends-at" class="opacity-75">${endsAtLabel()}</span>
        </div>
        <div id="countdown" class="mt-2.5 grid grid-cols-4 gap-2" role="timer" aria-live="off">${countdownCells(remaining())}</div>
      </div>

      <div class="flex flex-col gap-4 p-5">
        <div>
          <div class="text-[13px] text-ink-muted">المزايدة الحالية</div>
          <div id="current-bid" class="tabular text-[30px] font-bold leading-tight">${formatNumber(state.current)} <span class="text-base font-semibold">ر.س</span></div>
          <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-ink-body">
            <span id="bid-count" class="tabular">${formatNumber(state.bids)} مزايدة</span><span aria-hidden="true">·</span>
            <span>بدأ من <span class="tabular">${formatPrice(d.startBid)}</span></span>
            ${reserveChip()}
          </div>
        </div>

        <div id="bid-status" role="status" aria-live="polite"></div>

        <form id="bid-form" novalidate class="flex flex-col gap-3">
          <label for="bid-amount" class="text-sm font-semibold">مزايدتك</label>
          <div class="flex items-center gap-2 rounded-full bg-mist p-1 focus-within:ring-2 focus-within:ring-primary">
            <button type="button" data-step="1" class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-xl font-semibold text-ink shadow-float hover:text-primary" aria-label="زيادة ${formatPrice(inc)}">+</button>
            <input id="bid-amount" name="amount" inputmode="numeric" autocomplete="off" aria-describedby="bid-help"
              class="min-w-0 flex-1 rounded-full border-0 bg-transparent text-center text-lg font-bold tabular text-ink focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value="${formatNumber(state.amount)}">
            <span class="text-sm text-ink-muted">ر.س</span>
            <button type="button" data-step="-1" class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-xl font-semibold text-ink shadow-float hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" aria-label="إنقاص ${formatPrice(inc)}">−</button>
          </div>
          <p id="bid-help" class="m-0 text-xs text-ink-muted"></p>
          <div class="flex flex-wrap gap-2" role="group" aria-label="مزايدة سريعة" id="quick-bids"></div>
          <div id="bid-action"></div>
        </form>

        <button type="button" id="watch-btn" class="btn-outline w-full py-3 text-sm"></button>

        <ul class="m-0 flex list-none flex-col gap-2.5 border-t border-line-soft p-0 pt-4 text-[13px] text-ink-body">
          <li class="flex justify-between gap-3"><span>تأمين المزايدة (يُسترد)</span><b class="tabular font-semibold text-ink">${formatPrice(deposit)}</b></li>
          <li class="flex justify-between gap-3"><span>عمولة المشتري</span><b class="tabular font-semibold text-ink">2.5%</b></li>
          <li class="flex justify-between gap-3"><span>التمديد التلقائي</span><span class="text-end font-medium text-ink">دقيقتان لأي مزايدة في آخر دقيقتين</span></li>
        </ul>
        <div class="flex flex-wrap items-center gap-2 rounded-xl bg-primary-soft px-3.5 py-2.5 text-[13px] text-ink-body">
          <span>قسّط المبلغ مع</span>
          <span class="brand-pill"><img data-logo src="https://www.google.com/s2/favicons?domain=tabby.ai&amp;sz=64" alt="" width="16" height="16">تابي</span>
          <span class="brand-pill"><img data-logo src="https://www.google.com/s2/favicons?domain=tamara.co&amp;sz=64" alt="" width="16" height="16">تمارا</span>
        </div>
      </div>
    </div>`;
}

function mobileBar() {
  return `
    <div class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 pt-3 shadow-header lg:hidden" style="padding-bottom: max(12px, env(safe-area-inset-bottom))">
      <div class="mx-auto flex max-w-page items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="text-[11px] text-ink-muted">المزايدة الحالية · <span id="m-timer" class="tabular font-semibold"></span></div>
          <b id="m-bid" class="block truncate text-lg font-bold tabular">${formatPrice(state.current)}</b>
        </div>
        <a href="#bid-panel" class="btn-primary shrink-0 px-6 py-3 text-sm">زايد الآن</a>
      </div>
    </div>`;
}

/* ---------- render ---------- */

function render() {
  document.title = `${lot.name} · مزاد`;
  $('#cat-nav').innerHTML = catNavHTML(data.categories, lot.cat);
  $('#lot-root').innerHTML = `
    ${breadcrumb()}
    ${titleBlock()}
    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-8 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div class="min-w-0 lg:col-start-1 lg:row-start-1">${gallery()}</div>
      <aside id="bid-panel" aria-label="المزايدة" class="scroll-mt-48 lg:scroll-mt-40 lg:sticky lg:top-[136px] lg:col-start-2 lg:row-span-2 lg:row-start-1">${bidPanel()}</aside>
      <div class="flex min-w-0 flex-col gap-5 lg:col-start-1 lg:row-start-2">
        ${sectionNav()}
        ${specsSection()}
        ${inspectionSection()}
        ${descriptionSection()}
        ${historySection()}
        ${viewingSection()}
      </div>
    </div>
    ${mobileBar()}`;
  renderSimilar();
  renderBidUI();
  renderWatch();
  tick();
}

function renderSimilar() {
  const same = data.lots.filter((l) => l.cat === lot.cat && l.id !== lot.id);
  const others = data.lots.filter((l) => l.cat !== lot.cat && l.id !== lot.id);
  const pool = [...same, ...others].slice(0, 4);
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  $('#similar-grid').innerHTML = pool.map((l) => LotCard(l, { remaining: l.endsIn - elapsed, watched: state.watch.has(l.id) })).join('');
  $('#similar-all').href = catHref(lot.cat);
}

function parseAmount(text) {
  const western = text.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660));
  const n = Number(western.replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function renderBidUI() {
  const ended = remaining() <= 0;
  const inc = increment(state.current);
  const min = minBid();
  const valid = state.amount >= min;

  $('#bid-status').innerHTML = {
    leading: `<p class="m-0 flex items-center gap-2 rounded-xl bg-primary-soft px-3.5 py-2.5 text-sm font-semibold text-primary">${check}أنت صاحب أعلى مزايدة</p>`,
    outbid: `<p class="m-0 flex items-start gap-2 rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm font-semibold text-accent-ink">${warnIcon}<span>تجاوز مزايد آخر مزايدتك. زايد مرة أخرى لتبقى في المنافسة.</span></p>`,
  }[state.status] ?? '';

  if (ended) {
    $('#bid-form').innerHTML = `<p class="m-0 rounded-xl bg-mist px-4 py-3 text-sm text-ink-body">انتهى المزاد بمزايدة <b class="tabular text-ink">${formatPrice(state.current)}</b>.</p>`;
    return;
  }

  $('#bid-help').innerHTML = valid
    ? `أقل مزايدة مقبولة <b class="tabular font-semibold text-ink">${formatPrice(min)}</b> · الزيادة <span class="tabular">${formatPrice(inc)}</span>`
    : `<span class="font-semibold text-accent-ink">المبلغ أقل من أقل مزايدة مقبولة (${formatPrice(min)}).</span>`;
  $('[data-step="-1"]').disabled = state.amount - inc < min;

  $('#quick-bids').innerHTML = [1, 2, 5].map((k) => {
    const value = state.current + inc * k;
    const on = value === state.amount;
    return `<button type="button" data-quick="${value}" aria-pressed="${on}" class="tabular rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${on ? 'border-primary bg-primary text-white' : 'border-[#E5E7EB] bg-white text-ink hover:border-ink/40'}">${formatNumber(value)}</button>`;
  }).join('');

  $('#bid-action').innerHTML = state.confirming
    ? `<div class="flex flex-col gap-3 rounded-2xl border border-line bg-sand p-3.5">
         <p class="m-0 text-sm leading-relaxed">ستزايد بـ <b class="tabular">${formatPrice(state.amount)}</b> على ${esc(lot.name)}. المزايدة ملزمة إذا فزت بالمزاد.</p>
         <div class="flex gap-2">
           <button type="button" data-confirm class="btn-primary flex-1 py-3 text-sm">تأكيد المزايدة</button>
           <button type="button" data-cancel class="btn-outline px-5 py-3 text-sm">تراجع</button>
         </div>
       </div>`
    : `<button type="submit" class="btn-primary w-full py-3.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-50" ${valid ? '' : 'disabled'}>زايد الآن</button>
       ${getUser() ? '' : '<p class="m-0 mt-2 text-center text-xs text-ink-muted">ستسجّل دخولك برقم جوالك أولاً، ثم تعود لهذه الصفحة.</p>'}`;
}

function renderPrices() {
  $('#current-bid').innerHTML = `${formatNumber(state.current)} <span class="text-base font-semibold">ر.س</span>`;
  $('#bid-count').textContent = `${formatNumber(state.bids)} مزايدة`;
  $('#history-count').textContent = `${formatNumber(state.bids)} مزايدة`;
  $('#history-list').innerHTML = historyRows();
  $('#m-bid').textContent = formatPrice(state.current);
  $('#ends-at').textContent = endsAtLabel();
}

function renderWatch() {
  const on = state.watch.has(lot.id);
  const btn = $('#watch-btn');
  btn.setAttribute('aria-pressed', String(on));
  btn.innerHTML = `<span class="${on ? 'text-accent' : ''}">${icons.heart(on)}</span>${on ? 'في المفضلة' : 'أضف إلى المفضلة'}`;
  saveWatch(state.watch);
}

function setAmount(value) {
  state.amount = value;
  state.confirming = false;
  $('#bid-amount').value = formatNumber(value);
  renderBidUI();
}

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.innerHTML = `<div class="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-card">${check}<span>${esc(message)}</span></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.innerHTML = ''; }, 4000);
}

function placeBid() {
  const amount = state.amount;
  state.current = amount;
  state.bids += 1;
  state.history.unshift({ who: 'أنت', amount, age: 'الآن' });
  state.status = 'leading';
  saveBid({ id: lot.id, amount, status: 'leading', top: amount, at: Date.now() });
  state.confirming = false;
  if (remaining() < SNIPING_WINDOW) state.extraTime += SNIPING_WINDOW;
  state.amount = minBid();
  $('#bid-amount').value = formatNumber(state.amount);
  renderPrices();
  renderBidUI();
  toast(`تم تسجيل مزايدتك بـ ${formatPrice(amount)}`);

  // Demo: another bidder answers once, so the outbid state can be seen.
  if (!placeBid.answered) {
    placeBid.answered = true;
    setTimeout(() => {
      if (state.status !== 'leading' || remaining() <= 0) return;
      const rival = state.current + increment(state.current);
      state.current = rival;
      state.bids += 1;
      state.history.unshift({ who: `مزايد #${7315 + lot.id}`, amount: rival, age: 'الآن' });
      state.history.forEach((row, i) => { if (i > 0 && row.age === 'الآن') row.age = 'قبل دقيقة'; });
      state.status = 'outbid';
      saveBid({ ...loadBids().find((b) => b.id === lot.id), status: 'outbid', top: rival });
      if (state.amount < minBid()) state.amount = minBid();
      $('#bid-amount').value = formatNumber(state.amount);
      renderPrices();
      renderBidUI();
    }, OUTBID_AFTER_MS);
  }
}

function tick() {
  const left = remaining();
  const urgent = left < 3600;
  $('#countdown').innerHTML = left > 0 ? countdownCells(left) : '<p class="col-span-4 m-0 py-2 text-center text-lg font-bold">انتهى المزاد</p>';
  $('#countdown').classList.toggle('text-timer', urgent && left > 0);
  const m = $('#m-timer');
  m.textContent = left > 0 ? shortCountdown(left) : 'انتهى';
  m.classList.toggle('text-accent-strong', urgent);

  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const byId = new Map(data.lots.map((l) => [String(l.id), l]));
  document.querySelectorAll('#similar-grid [data-timer]').forEach((el) => {
    const l = byId.get(el.dataset.timer);
    const t = l.endsIn - elapsed;
    el.lastElementChild.textContent = shortCountdown(t);
    el.classList.toggle('text-timer', t < 3600);
    el.classList.toggle('text-white', t >= 3600);
  });
  if (left <= 0 && !tick.ended) { tick.ended = true; renderBidUI(); }
}

/* ---------- events ---------- */

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) {
    location.href = catHref(cat.dataset.cat);
    return;
  }
  const photo = t.closest('[data-photo]');
  if (photo) {
    state.photo = Number(photo.dataset.photo);
    $('#main-photo').innerHTML = Media({ src: state.photo === 0 ? lot.img : '', alt: lot.name, className: 'aspect-[4/3] rounded-card' });
    $('#photo-count').textContent = `${state.photo + 1} / ${d.gallery}`;
    document.querySelectorAll('[data-photo]').forEach((b) => {
      const on = b === photo;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('outline-primary', on);
      b.classList.toggle('outline-transparent', !on);
    });
    return;
  }
  const step = t.closest('[data-step]');
  if (step) return setAmount(Math.max(minBid(), state.amount + Number(step.dataset.step) * increment(state.current)));
  const quick = t.closest('[data-quick]');
  if (quick) return setAmount(Number(quick.dataset.quick));
  if (t.closest('[data-confirm]')) return placeBid();
  if (t.closest('[data-cancel]')) {
    state.confirming = false;
    renderBidUI();
    $('#bid-action button')?.focus();
    return;
  }
  if (t.closest('#watch-btn')) {
    state.watch.has(lot.id) ? state.watch.delete(lot.id) : state.watch.add(lot.id);
    renderWatch();
    return;
  }
  const watch = t.closest('#similar-grid [data-watch]');
  if (watch) {
    const id = Number(watch.dataset.watch);
    state.watch.has(id) ? state.watch.delete(id) : state.watch.add(id);
    saveWatch(state.watch);
    renderSimilar();
    renderWatch();
    document.querySelector(`#similar-grid [data-watch="${id}"]`)?.focus();
  }
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'bid-form') return;
  event.preventDefault();
  if (state.amount < minBid()) return;
  if (!getUser()) {
    location.href = loginHref();
    return;
  }
  state.confirming = true;
  renderBidUI();
  $('[data-confirm]')?.focus();
});

document.addEventListener('input', (event) => {
  if (event.target.id !== 'bid-amount') return;
  state.amount = parseAmount(event.target.value);
  state.confirming = false;
  renderBidUI();
});
document.addEventListener('change', (event) => {
  if (event.target.id === 'bid-amount') event.target.value = formatNumber(state.amount);
});

state.amount = minBid();
render();
setInterval(tick, 1000);
