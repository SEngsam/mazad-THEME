import * as data from './data.js';
import { Media, esc, formatCountdown, formatNumber, formatPrice, icons } from './components.js';
import { catHref, catNavHTML, loadWatch, renderShell, saveWatch } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const startedAt = Date.now();
const elapsed = () => Math.floor((Date.now() - startedAt) / 1000);

/* ---------- map geometry (simple equirectangular projection of the Kingdom) ---------- */

const W = 440;
const H = 350;
const project = ([lon, lat]) => [(lon - 34) * 20, (32.6 - lat) * 21];

const BORDER = [
  [34.95, 29.36], [36.07, 29.19], [36.5, 29.5], [37.5, 30], [38, 30.5], [37, 31.5], [39.2, 32.15], [42, 31.1], [44.7, 29.2], [46.5, 29.1],
  [47.7, 28.5], [48.4, 28.5], [49, 27.6], [49.6, 27], [50.1, 26.4], [50, 25.9], [50.4, 25.3], [50.8, 24.75], [51.6, 24.25], [52.6, 22.95],
  [55.2, 22.7], [55.7, 22], [55, 20], [52, 19], [49.1, 18.6], [48.2, 18.2], [47.4, 17.1], [46.4, 17.2], [44.5, 17.4], [43.3, 17],
  [42.8, 16.4], [42.6, 17], [41.8, 18], [41.2, 19.2], [40.5, 20], [39.5, 21], [39.1, 21.8], [38.8, 22.6], [38.3, 23.6], [37.4, 24.4],
  [37, 25], [36.6, 25.8], [36.2, 26.5], [35.5, 27.2], [34.8, 28], [34.6, 28.4],
];

/** Cities with auctions. A pin can cover several nearby cities. `below` puts its label under the dot. */
const PINS = [
  { id: 'riyadh', label: 'الرياض', cities: ['الرياض'], at: [46.72, 24.69] },
  { id: 'jeddah', label: 'جدة', cities: ['جدة'], at: [39.17, 21.54] },
  { id: 'dammam', label: 'الدمام والخبر', cities: ['الدمام', 'الخبر'], at: [50.1, 26.39] },
  { id: 'ahsa', label: 'الأحساء', cities: ['الأحساء'], at: [49.59, 25.38], below: true },
];
/** Other cities, shown faintly for orientation. */
const PLACES = [
  ['تبوك', [36.57, 28.38]], ['حائل', [41.69, 27.52]], ['بريدة', [43.97, 26.33]], ['المدينة المنورة', [39.61, 24.47]], ['مكة المكرمة', [39.83, 21.42]], ['أبها', [42.5, 18.22]],
];

const pct = ([x, y]) => `left:${((x / W) * 100).toFixed(2)}%;top:${((y / H) * 100).toFixed(2)}%`;

/* ---------- state ---------- */

const state = {
  cat: Number(params.get('cat')) > 0 && data.categories[Number(params.get('cat'))] ? Number(params.get('cat')) : 0,
  pin: PINS.some((p) => p.id === params.get('city')) ? params.get('city') : null,
  watch: loadWatch(),
};

const inCat = (l) => !state.cat || l.cat === state.cat;
const pinOf = (l) => PINS.find((p) => p.cities.includes(l.city));
const live = () => data.lots.filter((l) => l.endsIn - elapsed() > 0);

/* ---------- parts ---------- */

function mapSVG() {
  const border = BORDER.map(project).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return `
    <svg viewBox="0 0 ${W} ${H}" class="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id="map-dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="rgb(var(--primary) / .14)"/></pattern>
      </defs>
      <polygon points="${border}" fill="rgb(var(--primary-soft))" stroke="rgb(var(--primary) / .35)" stroke-width="1.5" stroke-linejoin="round"/>
      <polygon points="${border}" fill="url(#map-dots)"/>
      ${PLACES.map(([name, at]) => {
        const [x, y] = project(at);
        return `<circle cx="${x}" cy="${y}" r="2.5" fill="#5A6573" opacity=".45"/><text x="${x}" y="${y + 13}" text-anchor="middle" font-size="9" fill="#5A6573" opacity=".8" font-family="Readex Pro, system-ui">${name}</text>`;
      }).join('')}
      <text x="${project([36.9, 22.7])[0]}" y="${project([36.9, 22.7])[1]}" text-anchor="middle" font-size="10" fill="#5A6573" opacity=".6" font-family="Readex Pro, system-ui" transform="rotate(-52 ${project([36.9, 22.7]).join(' ')})">البحر الأحمر</text>
      <text x="${project([52.6, 25.9])[0]}" y="${project([52.6, 25.9])[1]}" text-anchor="middle" font-size="10" fill="#5A6573" opacity=".6" font-family="Readex Pro, system-ui">الخليج العربي</text>
    </svg>`;
}

function pinsHTML() {
  const lots = live().filter(inCat);
  return PINS.map((p) => {
    const n = lots.filter((l) => p.cities.includes(l.city)).length;
    if (!n) return '';
    const on = state.pin === p.id;
    const pos = pct(project(p.at));
    return `
      <span class="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${on ? 'bg-navy' : 'bg-primary'} shadow-float" style="${pos}" aria-hidden="true"></span>
      <button type="button" data-pin="${p.id}" aria-pressed="${on}" aria-label="${esc(p.label)}، ${n} مزاد"
        class="absolute flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold shadow-card transition-colors ${p.below ? 'translate-y-2.5' : '-translate-y-[calc(100%+10px)]'} ${on ? 'bg-navy text-white' : 'bg-white text-ink hover:bg-primary hover:text-white'}"
        style="${pos}">
        ${esc(p.label)}<span class="rounded-full ${on ? 'bg-gold text-navy' : 'bg-primary-soft text-primary'} px-1.5 text-[11px] font-bold leading-[18px] tabular">${n}</span>
      </button>`;
  }).join('');
}

function row(l) {
  const left = l.endsIn - elapsed();
  const watched = state.watch.has(l.id);
  return `
    <li class="card flex gap-3 p-2.5">
      <a href="lot.html?id=${l.id}" tabindex="-1" aria-hidden="true" class="block w-28 shrink-0 sm:w-32">${Media({ src: l.img, className: 'aspect-[4/3] rounded-[12px]' })}</a>
      <div class="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
        <div class="flex items-start justify-between gap-2">
          <a href="lot.html?id=${l.id}" class="min-w-0 text-[15px] font-semibold leading-snug text-ink hover:text-primary">${esc(l.name)}</a>
          <button type="button" data-watch="${l.id}" aria-pressed="${watched}" aria-label="${watched ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}: ${esc(l.name)}"
            class="-me-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-sand ${watched ? 'text-accent' : 'text-ink'}">${icons.heart(watched)}</button>
        </div>
        <p class="m-0 text-xs text-ink-muted">${esc(l.city)} · ${esc(data.categories[l.cat])}</p>
        <div class="mt-auto flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px]">
          <span class="flex items-baseline gap-1.5"><span class="text-ink-muted">المزايدة</span><b class="font-semibold text-ink tabular">${formatPrice(l.bid)}</b></span>
          <span class="flex items-baseline gap-1.5"><span class="text-ink-muted">ينتهي خلال</span><b data-left="${l.id}" class="font-semibold tabular ${left < 3600 ? 'text-accent-strong' : 'text-ink'}">${formatCountdown(left)}</b></span>
        </div>
      </div>
    </li>`;
}

function listHTML() {
  const pin = PINS.find((p) => p.id === state.pin);
  const lots = live().filter(inCat).filter((l) => !pin || pin.cities.includes(l.city)).sort((a, b) => a.endsIn - b.endsIn);
  const where = pin ? pin.label : 'كل المدن';
  return `
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="m-0 text-sm text-ink-body"><b class="font-semibold text-ink tabular">${formatNumber(lots.length)}</b> مزاد · ${esc(where)}${state.cat ? ` · ${esc(data.categories[state.cat])}` : ''}</p>
      ${pin ? '<button type="button" data-pin-clear class="text-[13px] font-semibold text-primary underline-offset-4 hover:underline">كل المدن</button>' : ''}
    </div>
    ${lots.length ? `<ul class="m-0 flex list-none flex-col gap-3 p-0">${lots.map(row).join('')}</ul>`
      : `<div class="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-white px-6 py-10 text-center">
          <p class="m-0 text-base font-semibold text-ink">لا توجد مزادات هنا الآن</p>
          <button type="button" data-cat-clear class="btn-outline px-6 py-2.5 text-sm">عرض كل الفئات</button>
        </div>`}`;
}

function render({ focus } = {}) {
  const counts = PINS.map((p) => live().filter(inCat).filter((l) => p.cities.includes(l.city)).length);
  $('#map-root').innerHTML = `
    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-8">
      <section aria-label="الخريطة" class="card overflow-hidden lg:sticky lg:top-[136px]">
        <div class="relative w-full bg-[#F4F8F6]" style="aspect-ratio:${W}/${H}">
          ${mapSVG()}
          <div class="absolute inset-0">${pinsHTML()}</div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-4 py-3 text-xs text-ink-muted">
          <span>الرقم على كل مدينة هو عدد مزاداتها المفتوحة.</span>
          <span class="tabular">${formatNumber(counts.reduce((a, b) => a + b, 0))} مزاد في ${formatNumber(counts.filter(Boolean).length)} مدن</span>
        </div>
      </section>
      <section id="map-list" aria-label="المزادات" class="flex min-w-0 flex-col gap-3">${listHTML()}</section>
    </div>`;
  $('#cat-nav').innerHTML = catNavHTML(data.categories, state.cat);
  const q = new URLSearchParams();
  if (state.cat) q.set('cat', state.cat);
  if (state.pin) q.set('city', state.pin);
  history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}`);
  const pin = PINS.find((p) => p.id === state.pin);
  const sq = new URLSearchParams();
  if (state.cat) sq.set('cat', state.cat);
  if (pin) sq.set('city', pin.cities.join(','));
  $('#list-link').href = `search.html${sq.size ? `?${sq}` : ''}`;
  if (focus) $(focus)?.focus();
}

/* ---------- events ---------- */

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) { state.cat = Number(cat.dataset.cat); render({ focus: `#cat-nav [data-cat="${state.cat}"]` }); return; }
  const pin = t.closest('[data-pin]');
  if (pin) {
    state.pin = state.pin === pin.dataset.pin ? null : pin.dataset.pin;
    render({ focus: `[data-pin="${pin.dataset.pin}"]` });
    if (state.pin && !window.matchMedia('(min-width: 1024px)').matches) $('#map-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (t.closest('[data-pin-clear]')) { state.pin = null; render({ focus: '#map-list' }); return; }
  if (t.closest('[data-cat-clear]')) { state.cat = 0; render(); return; }
  const watch = t.closest('#map-list [data-watch]');
  if (watch) {
    const id = Number(watch.dataset.watch);
    state.watch.has(id) ? state.watch.delete(id) : state.watch.add(id);
    saveWatch(state.watch);
    render({ focus: `#map-list [data-watch="${id}"]` });
  }
});

/* ---------- start ---------- */

render();
setInterval(() => {
  const byId = new Map(data.lots.map((l) => [String(l.id), l]));
  document.querySelectorAll('#map-list [data-left]').forEach((el) => {
    const left = byId.get(el.dataset.left).endsIn - elapsed();
    el.textContent = formatCountdown(left);
    el.classList.toggle('text-accent-strong', left < 3600);
    el.classList.toggle('text-ink', left >= 3600);
  });
}, 1000);
