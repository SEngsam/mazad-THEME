import * as data from './data.js';
import { LotCard, SponsoredCard, esc, formatCountdown, formatNumber, formatPrice } from './components.js';
import { catHref, catNavHTML, renderShell } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const PAGE_SIZE = 9;
const SPONSORED_SLOT = 3;
const DAY = 86400;
const SORTS = ['ينتهي قريباً', 'المضاف حديثاً', 'الأقل سعراً', 'الأعلى سعراً'];
const PRICE_RANGES = [
  { label: 'أقل من 10,000', min: 0, max: 10000 },
  { label: '10,000 – 50,000', min: 10000, max: 50000 },
  { label: '50,000 – 200,000', min: 50000, max: 200000 },
  { label: 'أكثر من 200,000', min: 200000, max: 0 },
];
const cities = [...new Set(data.lots.map((l) => l.city))];
const startedAt = Date.now();
const elapsed = () => Math.floor((Date.now() - startedAt) / 1000);

/* ---------- state <-> URL ---------- */

function readState() {
  const p = new URLSearchParams(location.search);
  const int = (v) => (/^\d+$/.test(v ?? '') ? Number(v) : 0);
  const cat = int(p.get('cat'));
  return {
    q: (p.get('q') ?? '').trim().slice(0, 80),
    cat: cat < data.categories.length ? cat : 0,
    cities: (p.get('city') ?? '').split(',').filter((c) => cities.includes(c)),
    min: int(p.get('min')),
    max: int(p.get('max')),
    noReserve: p.get('nr') === '1',
    soon: p.get('soon') === '1',
    sort: Math.min(int(p.get('sort')), SORTS.length - 1),
    expanded: false,
    filtersOpen: false,
    watch: new Set(data.initialWatchlist),
  };
}

const state = readState();

function writeURL() {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.cat) p.set('cat', state.cat);
  if (state.cities.length) p.set('city', state.cities.join(','));
  if (state.min) p.set('min', state.min);
  if (state.max) p.set('max', state.max);
  if (state.noReserve) p.set('nr', '1');
  if (state.soon) p.set('soon', '1');
  if (state.sort) p.set('sort', state.sort);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

/* ---------- matching ---------- */

/** Loose Arabic matching: ignore diacritics and common letter variants. */
const normalise = (text) => String(text)
  .replace(/[ً-ْـ]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
  .toLowerCase();

function matchesQuery(lot) {
  if (!state.q) return true;
  const hay = normalise([lot.name, lot.sub, lot.city, data.categories[lot.cat], data.categoryKeywords[lot.cat], data.lotNumber(lot)].join(' '));
  return normalise(state.q).split(/\s+/).filter(Boolean).every((word) => hay.includes(word));
}

/** Lots matching every active filter except the one named in `skip` (for facet counts). */
function filtered(skip = '') {
  return data.lots.filter((l) => {
    const left = l.endsIn - elapsed();
    if (left <= 0) return false;
    if (!matchesQuery(l)) return false;
    if (skip !== 'cat' && state.cat && l.cat !== state.cat) return false;
    if (skip !== 'city' && state.cities.length && !state.cities.includes(l.city)) return false;
    if (state.min && l.bid < state.min) return false;
    if (state.max && l.bid > state.max) return false;
    if (state.noReserve && !l.noReserve) return false;
    if (state.soon && left > DAY) return false;
    return true;
  });
}

function sorted(list) {
  const out = [...list];
  if (state.sort === 0) out.sort((a, b) => a.endsIn - b.endsIn);
  if (state.sort === 1) out.sort((a, b) => b.id - a.id);
  if (state.sort === 2) out.sort((a, b) => a.bid - b.bid);
  if (state.sort === 3) out.sort((a, b) => b.bid - a.bid);
  return out;
}

const activeCount = () => [state.cat, state.cities.length, state.min || state.max, state.noReserve, state.soon].filter(Boolean).length;

/* ---------- icons ---------- */

const xIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const sliders = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';

/* ---------- page head ---------- */

function title() {
  const catName = state.cat ? data.categories[state.cat] : '';
  if (state.q && catName) return `نتائج «${state.q}» في ${catName}`;
  if (state.q) return `نتائج البحث عن «${state.q}»`;
  return catName || 'كل المزادات';
}

function renderHead() {
  const catName = state.cat ? data.categories[state.cat] : '';
  const crumbs = [
    '<li><a href="index.html" class="text-ink-body hover:text-primary">الرئيسية</a></li>',
    state.q && catName ? `<li aria-hidden="true">‹</li><li><a href="${catHref(state.cat)}" class="text-ink-body hover:text-primary">${esc(catName)}</a></li>` : '',
    `<li aria-hidden="true">‹</li><li aria-current="page" class="min-w-0 truncate text-ink">${esc(state.q ? 'نتائج البحث' : (catName || 'كل المزادات'))}</li>`,
  ].join('');
  const intro = state.q
    ? 'تشمل النتائج اسم المنتج وتفاصيله والمدينة ورقم اللوت.'
    : (data.categoryIntros[state.cat] ?? 'كل المزادات المفتوحة الآن في جميع الفئات والمدن.');
  $('#page-head').innerHTML = `
    <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted">
      <ol class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">${crumbs}</ol>
    </nav>
    <header class="flex flex-col gap-2">
      <h1 class="m-0 text-2xl font-bold leading-[1.35] sm:text-[28px]">${esc(title())}</h1>
      <p class="m-0 text-[15px] leading-relaxed text-ink-body">${esc(intro)}</p>
    </header>`;
  document.title = `${title()} · مزاد`;
  $('#q').value = state.q;
  $('#cat-nav').innerHTML = catNavHTML(data.categories, state.q ? -1 : state.cat);
}

/* ---------- filters ---------- */

const optionRow = ({ type, name, value, checked, label, count }) => `
  <label class="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-sand ${count === 0 && !checked ? 'opacity-50' : ''}">
    <span class="flex items-center gap-2.5 text-sm text-ink">
      <input type="${type}" name="${name}" value="${esc(value)}" ${checked ? 'checked' : ''} ${count === 0 && !checked ? 'disabled' : ''} class="h-4 w-4 shrink-0 accent-primary">
      ${esc(label)}
    </span>
    <span class="text-xs text-ink-muted tabular">${count}</span>
  </label>`;

function renderFacets() {
  const forCat = filtered('cat');
  $('#f-cat').innerHTML = data.categories.map((label, i) => optionRow({
    type: 'radio', name: 'cat', value: i, checked: i === state.cat, label,
    count: i === 0 ? forCat.length : forCat.filter((l) => l.cat === i).length,
  })).join('');
  const forCity = filtered('city');
  $('#f-city').innerHTML = cities.map((city) => optionRow({
    type: 'checkbox', name: 'city', value: city, checked: state.cities.includes(city), label: city,
    count: forCity.filter((l) => l.city === city).length,
  })).join('');
  $('#f-ranges').innerHTML = PRICE_RANGES.map((r, i) => {
    const on = state.min === r.min && state.max === r.max;
    return `<button type="button" data-range="${i}" aria-pressed="${on}" class="rounded-full border px-3 py-1.5 text-xs font-medium tabular transition-colors ${on ? 'border-primary bg-primary text-white' : 'border-[#E5E7EB] bg-white text-ink hover:border-ink/40'}">${r.label}</button>`;
  }).join('');
  $('#f-nr').checked = state.noReserve;
  $('#f-soon').checked = state.soon;
  $('#f-min').value = state.min ? formatNumber(state.min) : '';
  $('#f-max').value = state.max ? formatNumber(state.max) : '';
  $('#f-apply').textContent = `عرض النتائج (${formatNumber(filtered().length)})`;
}

const fieldset = (legend, body) => `
  <fieldset class="m-0 min-w-0 border-0 border-b border-line-soft p-0 pb-4 last:border-b-0">
    <legend class="mb-2 p-0 pt-4 text-sm font-semibold">${legend}</legend>
    <div class="flex flex-col gap-1">${body}</div>
  </fieldset>`;

const priceBox = (id, label) => `
  <label class="flex min-w-0 flex-1 flex-col gap-1.5 text-xs text-ink-muted">${label}
    <span class="flex items-center gap-1.5 rounded-full bg-mist px-3.5 focus-within:ring-2 focus-within:ring-primary">
      <input id="${id}" inputmode="numeric" dir="ltr" autocomplete="off" placeholder="0" class="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-left text-sm font-semibold text-ink tabular placeholder:font-normal placeholder:text-ink-muted focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
      <span class="text-xs text-ink-muted">ر.س</span>
    </span>
  </label>`;

function buildFilters() {
  $('#filters').innerHTML = `
    <div class="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-4 lg:border-0 lg:pb-0 lg:pt-5">
      <h2 class="m-0 text-lg font-bold lg:text-base">الفلاتر</h2>
      <div class="flex items-center gap-2">
        <button type="button" data-clear class="text-sm font-semibold text-primary hover:text-primary-dark">مسح الكل</button>
        <button type="button" data-close-filters class="grid h-10 w-10 place-items-center rounded-full bg-mist text-ink lg:hidden" aria-label="إغلاق الفلاتر">${xIcon.replace('h-3.5 w-3.5', 'h-4 w-4')}</button>
      </div>
    </div>
    <form id="filters-form" class="flex-1 overflow-y-auto overscroll-contain px-5 pb-2 lg:overflow-visible lg:pb-3" onsubmit="return false">
      ${fieldset('الفئة', '<div id="f-cat" class="flex flex-col"></div>')}
      ${fieldset('السعر', `<div class="flex gap-2.5">${priceBox('f-min', 'من')}${priceBox('f-max', 'إلى')}</div><div id="f-ranges" class="mt-3 flex flex-wrap gap-2"></div>`)}
      ${fieldset('المدينة', '<div id="f-city" class="flex flex-col"></div>')}
      ${fieldset('حالة المزاد', `
        <label class="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-sm hover:bg-sand"><input id="f-nr" type="checkbox" class="h-4 w-4 accent-primary">بدون حد أدنى</label>
        <label class="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-sm hover:bg-sand"><input id="f-soon" type="checkbox" class="h-4 w-4 accent-primary">ينتهي خلال 24 ساعة</label>`)}
    </form>
    <div class="border-t border-line-soft p-4 lg:hidden" style="padding-bottom: max(16px, env(safe-area-inset-bottom))">
      <button type="button" id="f-apply" data-close-filters class="btn-primary w-full py-3.5 text-[15px]"></button>
    </div>`;
}

function setFiltersOpen(open) {
  state.filtersOpen = open;
  const panel = $('#filters');
  panel.classList.toggle('hidden', !open);
  panel.classList.toggle('flex', open);
  $('#filters-backdrop').classList.toggle('hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) panel.querySelector('[data-close-filters]').focus();
  else $('#open-filters')?.focus();
}

/* ---------- toolbar & results ---------- */

function chips() {
  const list = [];
  if (state.q) list.push(['q', `«${state.q}»`]);
  if (state.cat) list.push(['cat', data.categories[state.cat]]);
  state.cities.forEach((c) => list.push([`city:${c}`, c]));
  if (state.min || state.max) {
    const label = state.min && state.max ? `${formatNumber(state.min)} – ${formatNumber(state.max)} ر.س`
      : state.min ? `من ${formatPrice(state.min)}` : `حتى ${formatPrice(state.max)}`;
    list.push(['price', label]);
  }
  if (state.noReserve) list.push(['nr', 'بدون حد أدنى']);
  if (state.soon) list.push(['soon', 'ينتهي خلال 24 ساعة']);
  return list;
}

function renderToolbar(total) {
  const active = chips();
  const n = activeCount();
  $('#toolbar').innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <button type="button" id="open-filters" class="btn-outline gap-2 px-4 py-2 text-[13px] lg:hidden" aria-haspopup="dialog">${sliders}الفلاتر${n ? ` <span class="rounded-full bg-primary px-[7px] py-0.5 text-[11px] font-semibold text-white tabular">${n}</span>` : ''}</button>
        <p class="m-0 text-sm text-ink-body"><b class="font-semibold text-ink tabular">${formatNumber(total)}</b> مزاد</p>
      </div>
      <div class="scroll-row -m-0.5 max-w-full gap-2 p-0.5" role="group" aria-label="ترتيب النتائج">
        ${SORTS.map((label, i) => `<button type="button" data-sort="${i}" aria-pressed="${i === state.sort}" class="shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${i === state.sort ? 'border-primary bg-primary text-white' : 'border-[#E5E7EB] bg-white text-ink hover:border-ink/40'}">${label}</button>`).join('')}
      </div>
    </div>
    ${active.length ? `
      <ul class="m-0 flex list-none flex-wrap items-center gap-2 p-0" aria-label="الفلاتر المفعّلة">
        ${active.map(([key, label]) => `<li><button type="button" data-remove="${esc(key)}" aria-label="إزالة ${esc(label)}" class="flex items-center gap-1.5 rounded-full bg-primary-soft py-1.5 pe-2.5 ps-3 text-[13px] font-semibold text-primary hover:bg-primary hover:text-white">${esc(label)}${xIcon}</button></li>`).join('')}
        <li><button type="button" data-clear class="px-2 py-1.5 text-[13px] font-semibold text-ink-body underline-offset-4 hover:text-ink hover:underline">مسح الكل</button></li>
      </ul>` : ''}`;
}

function emptyState() {
  const what = state.q ? `«${state.q}»` : 'هذه الفلاتر';
  const suggestions = data.categories.slice(1).map((c, i) => `<a href="${catHref(i + 1)}" class="rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink hover:border-ink/40 hover:text-ink">${c}</a>`).join('');
  return `
    <div class="col-span-full flex flex-col items-center gap-4 rounded-card border border-dashed border-line bg-white px-6 py-10 text-center">
      <p class="m-0 text-base font-semibold text-ink">لا توجد مزادات تطابق ${esc(what)}</p>
      <p class="m-0 max-w-md text-sm leading-relaxed text-ink-body">جرّب كلمة أقصر أو تهجئة أخرى، أو امسح بعض الفلاتر لترى نتائج أكثر.</p>
      ${activeCount() || state.q ? '<button type="button" data-clear class="btn-outline px-6 py-2.5 text-sm">مسح البحث والفلاتر</button>' : ''}
      <div class="flex flex-col items-center gap-2.5 pt-2">
        <span class="text-xs text-ink-muted">أو تصفّح فئة</span>
        <div class="flex flex-wrap justify-center gap-2">${suggestions}</div>
      </div>
    </div>`;
}

function renderResults() {
  const list = sorted(filtered());
  renderToolbar(list.length);
  const shown = state.expanded ? list : list.slice(0, PAGE_SIZE);
  const cards = shown.map((l) => LotCard(l, { remaining: l.endsIn - elapsed(), watched: state.watch.has(l.id) }));
  if (cards.length > SPONSORED_SLOT) cards.splice(SPONSORED_SLOT, 0, SponsoredCard(data.sponsoredLot));
  $('#results').innerHTML = cards.length ? cards.join('') : emptyState();
  const more = $('#more');
  more.classList.toggle('hidden', list.length <= PAGE_SIZE);
  more.textContent = state.expanded ? 'عرض أقل' : `عرض المزيد (${formatNumber(list.length - PAGE_SIZE)})`;
  more.setAttribute('aria-expanded', String(state.expanded));
  document.querySelectorAll('[data-watch-count]').forEach((el) => { el.textContent = state.watch.size; });
}

function update({ head = false } = {}) {
  state.expanded = false;
  writeURL();
  if (head) renderHead();
  renderFacets();
  renderResults();
}

function clearAll() {
  Object.assign(state, { q: '', cat: 0, cities: [], min: 0, max: 0, noReserve: false, soon: false });
  update({ head: true });
}

function tick() {
  const byId = new Map(data.lots.map((l) => [String(l.id), l]));
  document.querySelectorAll('#results [data-timer]').forEach((el) => {
    const left = byId.get(el.dataset.timer).endsIn - elapsed();
    el.lastElementChild.textContent = formatCountdown(left);
    el.classList.toggle('text-timer', left < 3600);
    el.classList.toggle('text-white', left >= 3600);
  });
}

/* ---------- events ---------- */

const parseAmount = (text) => Number(text.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660)).replace(/\D/g, '')) || 0;

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) {
    state.cat = Number(cat.dataset.cat);
    state.q = '';
    update({ head: true });
    return;
  }
  const sort = t.closest('[data-sort]');
  if (sort) { state.sort = Number(sort.dataset.sort); writeURL(); renderResults(); return; }
  const range = t.closest('[data-range]');
  if (range) {
    const r = PRICE_RANGES[Number(range.dataset.range)];
    const on = state.min === r.min && state.max === r.max;
    state.min = on ? 0 : r.min;
    state.max = on ? 0 : r.max;
    update();
    return;
  }
  const remove = t.closest('[data-remove]');
  if (remove) {
    const key = remove.dataset.remove;
    if (key === 'q') state.q = '';
    if (key === 'cat') state.cat = 0;
    if (key.startsWith('city:')) state.cities = state.cities.filter((c) => c !== key.slice(5));
    if (key === 'price') { state.min = 0; state.max = 0; }
    if (key === 'nr') state.noReserve = false;
    if (key === 'soon') state.soon = false;
    update({ head: key === 'q' || key === 'cat' });
    return;
  }
  if (t.closest('[data-clear]')) { clearAll(); return; }
  if (t.closest('#open-filters')) { setFiltersOpen(true); return; }
  if (t.closest('[data-close-filters]') || t.closest('#filters-backdrop')) { setFiltersOpen(false); return; }
  if (t.closest('#more')) { state.expanded = !state.expanded; renderResults(); return; }
  const watch = t.closest('#results [data-watch]');
  if (watch) {
    const id = Number(watch.dataset.watch);
    state.watch.has(id) ? state.watch.delete(id) : state.watch.add(id);
    renderResults();
    document.querySelector(`#results [data-watch="${id}"]`)?.focus();
  }
});

document.addEventListener('change', (event) => {
  const t = event.target;
  if (t.name === 'cat') { state.cat = Number(t.value); update({ head: true }); }
  if (t.name === 'city') {
    state.cities = t.checked ? [...state.cities, t.value] : state.cities.filter((c) => c !== t.value);
    update();
  }
  if (t.id === 'f-nr') { state.noReserve = t.checked; update(); }
  if (t.id === 'f-soon') { state.soon = t.checked; update(); }
  if (t.id === 'f-min' || t.id === 'f-max') {
    state.min = parseAmount($('#f-min').value);
    state.max = parseAmount($('#f-max').value);
    if (state.min && state.max && state.min > state.max) [state.min, state.max] = [state.max, state.min];
    update();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.filtersOpen) setFiltersOpen(false);
  if (event.key === 'Enter' && (event.target.id === 'f-min' || event.target.id === 'f-max')) event.target.blur();
});

// The header search stays on this page and keeps the other filters.
$('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  state.q = $('#q').value.trim().slice(0, 80);
  update({ head: true });
  $('#main').scrollIntoView({ block: 'start' });
});

/* ---------- start ---------- */

buildFilters();
renderHead();
renderFacets();
renderResults();
setInterval(tick, 1000);
