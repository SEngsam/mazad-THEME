import * as data from './data.js';
import {
  AdBanner, CategoryTile, HeroLot, LotCard, Media, PickCard, SoonRow, SortTab, SponsoredCard, TrustItem,
  formatCountdown,
} from './components.js';
import { catHref, catNavHTML, loadWatch, renderShell, saveWatch } from './shell.js';
import { initHomeFilter } from './homefilter.js';

renderShell();

const PAGE_SIZE = 8;
const SPONSORED_SLOT = 3;

// Old links to the home page with a category or search now open the listing page.
if (/[?&](cat|q)=/.test(location.search)) location.replace(`search.html${location.search}`);

const state = {
  cat: 0,
  tab: 0,
  query: '',
  expanded: false,
  showAds: document.documentElement.dataset.ads !== 'off',
  watch: loadWatch(),
  startedAt: Date.now(),
};

const $ = (sel) => document.querySelector(sel);
const elapsed = () => Math.floor((Date.now() - state.startedAt) / 1000);
const remainingFor = (lot) => lot.endsIn - elapsed();

function visibleLots() {
  const q = state.query.trim();
  let pool = data.lots.filter((lot) => state.cat === 0 || lot.cat === state.cat);
  if (q) pool = pool.filter((lot) => [lot.name, lot.sub, lot.city, data.categories[lot.cat]].some((s) => s.includes(q)));
  if (state.tab === 0) pool = [...pool].sort((a, b) => a.endsIn - b.endsIn);
  if (state.tab === 1) pool = [...pool].reverse();
  if (state.tab === 2) pool = [...pool].sort((a, b) => a.bid - b.bid);
  if (state.tab === 3) pool = pool.filter((lot) => lot.noReserve);
  return pool;
}

function renderNav() {
  $('#cat-nav').innerHTML = catNavHTML(data.categories, state.cat);
}

function renderCategories() {
  $('#category-grid').innerHTML = data.categoryTiles
    .map((tile) => CategoryTile({ ...tile, label: data.categories[tile.cat], active: tile.cat === state.cat }))
    .join('');
}

function renderLots() {
  const pool = visibleLots();
  const shown = state.expanded ? pool : pool.slice(0, PAGE_SIZE);
  const cards = shown.map((lot) => LotCard(lot, { remaining: remainingFor(lot), watched: state.watch.has(lot.id) }));
  if (state.showAds && cards.length > SPONSORED_SLOT) cards.splice(SPONSORED_SLOT, 0, SponsoredCard(data.sponsoredLot));

  $('#live-title').textContent = state.query
    ? `نتائج «${state.query}»`
    : `مزادات ${state.cat === 0 ? 'مباشرة' : data.categories[state.cat]}`;
  $('#live-count').textContent = `· ${pool.length} مزاد`;
  $('#sort-tabs').innerHTML = data.sortTabs.map((label, i) => SortTab({ index: i, label, active: i === state.tab })).join('');
  $('#lot-grid').innerHTML = cards.length
    ? cards.join('')
    : '<p class="col-span-full m-0 rounded-card border border-dashed border-line bg-white p-8 text-center text-sm text-ink-body">لا توجد مزادات مطابقة حالياً.</p>';

  const more = $('#show-more');
  more.classList.toggle('hidden', pool.length <= PAGE_SIZE);
  more.textContent = state.expanded ? 'عرض أقل' : 'عرض المزيد';
  more.setAttribute('aria-expanded', String(state.expanded));
}

function renderWatchCount() {
  const n = state.watch.size;
  document.querySelectorAll('[data-watch-count]').forEach((el) => { el.textContent = n; });
  $('#watch-link').setAttribute('aria-label', `المفضلة، ${n} عناصر`);
}

function renderStatic() {
  const hero = data.lots[0];
  $('#hero-main').innerHTML = HeroLot(hero, { remaining: remainingFor(hero), watchers: data.lotDetails[hero.id].watchers });
  $('#hero-soon').innerHTML = data.lots
    .filter((lot) => lot.id !== hero.id)
    .sort((a, b) => a.endsIn - b.endsIn)
    .slice(0, 4)
    .map((lot) => SoonRow(lot, remainingFor(lot)))
    .join('');
  $('#picks').innerHTML = data.picks.map(PickCard).join('');
  $('#trust').innerHTML = data.trust.map(TrustItem).join('');
  $('#sell-media').innerHTML = Media({ src: data.ads.sell, className: 'absolute inset-0' });

  document.querySelectorAll('[data-ad-slot]').forEach((el) => { el.hidden = !state.showAds; });
  if (state.showAds) {
    $('#ad-leaderboard').innerHTML = AdBanner({ src: data.ads.leaderboard, label: 'إعلان · 1200×110', className: 'h-full overflow-hidden rounded-[14px]' });
    $('#ad-mid').innerHTML = data.ads.mid
      .map((src) => AdBanner({ src, className: 'aspect-[16/5] overflow-hidden rounded-2xl' }))
      .join('');
  }
}

function renderDynamic() {
  renderNav();
  renderCategories();
  renderLots();
  renderWatchCount();
}

function tick() {
  const byId = new Map(data.lots.map((lot) => [String(lot.id), lot]));
  document.querySelectorAll('[data-timer]').forEach((el) => {
    const left = remainingFor(byId.get(el.dataset.timer));
    el.lastElementChild.textContent = formatCountdown(left);
    el.classList.toggle('text-timer', left < 3600);
    el.classList.toggle('text-white', left >= 3600);
  });
}

document.addEventListener('click', (event) => {
  const catBtn = event.target.closest('[data-cat]');
  if (catBtn) {
    location.href = catHref(catBtn.dataset.cat);
    return;
  }

  const tabBtn = event.target.closest('[data-tab]');
  if (tabBtn) {
    state.tab = Number(tabBtn.dataset.tab);
    return renderLots();
  }

  const watchBtn = event.target.closest('[data-watch]');
  if (watchBtn) {
    const id = Number(watchBtn.dataset.watch);
    state.watch.has(id) ? state.watch.delete(id) : state.watch.add(id);
    saveWatch(state.watch);
    renderLots();
    renderWatchCount();
    document.querySelector(`[data-watch="${id}"]`)?.focus();
  }
});

$('#show-more').addEventListener('click', () => {
  state.expanded = !state.expanded;
  renderLots();
});

renderStatic();
renderDynamic();
initHomeFilter({ data, remainingFor });
setInterval(tick, 1000);
