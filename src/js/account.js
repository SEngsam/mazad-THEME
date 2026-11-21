import * as data from './data.js';
import { LotCard, Media, esc, formatCountdown, formatNumber, formatPrice } from './components.js';
import {
  catHref, catNavHTML, clearUser, getUser, loadBids, loadListings, loadOrders, loadWatch, loginHref, renderShell, saveWatch, setUser,
} from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const startedAt = Date.now();
const elapsed = () => Math.floor((Date.now() - startedAt) / 1000);
const lotById = (id) => data.lots.find((l) => l.id === id);
const TABS = [
  ['bids', 'مزايداتي'],
  ['watch', 'المفضلة'],
  ['selling', 'منتجاتي'],
  ['won', 'مشترياتي'],
  ['settings', 'الإعدادات'],
];

/* Example activity so every tab shows something in the prototype; the visitor's own bids and listings come first. */
const DEMO_BIDS = [
  { id: 3, amount: 4250, status: 'leading', top: 4250 },
  { id: 8, amount: 16950, status: 'outbid', top: 17200 },
];
const DEMO_LISTINGS = [
  { ref: 'SL-204511', title: 'رافعة شوكية تويوتا 3 طن', cat: 6, status: 'live', lotId: 7, bids: 9 },
  { ref: 'SL-198230', title: 'ساعة سيكو بريساج 2019', cat: 2, status: 'sold', price: 2900, city: 'الرياض' },
];

const state = {
  tab: TABS.some(([id]) => `#${id}` === location.hash) ? location.hash.slice(1) : 'bids',
  watch: loadWatch(),
  notify: { outbid: true, ending: true, news: false },
};

/* ---------- small parts ---------- */

const icons = {
  bids: '<path d="M14.5 4.5 19.5 9.5M12 7l5 5M8.5 10.5l5 5M4 20l6.5-6.5"/><path d="m11 6 2-2 7 7-2 2z"/>',
  watch: '<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.6 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.6 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"/>',
  selling: '<path d="M3.5 12.5 11 5h8v8l-7.5 7.5a1.4 1.4 0 0 1-2 0l-6-6a1.4 1.4 0 0 1 0-2Z"/><circle cx="15" cy="9" r="1.5"/>',
  won: '<path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
};
const icon = (name, size = 'h-[18px] w-[18px]') => `<svg aria-hidden="true" viewBox="0 0 24 24" class="${size} shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const shield = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4" stroke-linecap="round"/></svg>';
const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

const BADGES = {
  leading: ['أعلى مزايدة', 'bg-primary-soft text-primary'],
  outbid: ['تم تجاوزك', 'bg-accent-soft text-accent-ink'],
  review: ['قيد المراجعة', 'bg-mist text-ink-body'],
  live: ['مباشر', 'bg-primary-soft text-primary'],
  sold: ['مُباع', 'bg-ink text-white'],
  unpaid: ['بانتظار الدفع', 'bg-accent-soft text-accent-ink'],
  paid: ['تم الدفع · قيد التسليم', 'bg-primary-soft text-primary'],
  delivered: ['تم الاستلام', 'bg-mist text-ink-body'],
};
const badge = (key) => `<span class="shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${BADGES[key][1]}">${BADGES[key][0]}</span>`;

const fact = (label, value, extra = '') => `<span class="flex items-baseline gap-1.5"><span class="text-ink-muted">${label}</span><b class="font-semibold text-ink tabular ${extra}">${value}</b></span>`;

function row({ href, img, title, status, meta, facts, actions = '', after = '' }) {
  return `
    <li class="card flex flex-col gap-3 p-3 sm:p-4">
      <div class="flex gap-3 sm:gap-4">
        <a href="${href}" tabindex="-1" aria-hidden="true" class="block w-24 shrink-0 sm:w-32">${Media({ src: img, className: 'aspect-[4/3] rounded-[12px]' })}</a>
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <div class="flex items-start justify-between gap-3">
            <a href="${href}" class="min-w-0 text-[15px] font-semibold leading-snug text-ink hover:text-primary">${esc(title)}</a>
            ${badge(status)}
          </div>
          <p class="m-0 text-xs text-ink-muted">${meta}</p>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">${facts}</div>
          ${actions ? `<div class="mt-1 flex flex-wrap gap-2">${actions}</div>` : ''}
        </div>
      </div>
      ${after}
    </li>`;
}

const emptyBox = (title, text, href, cta) => `
  <div class="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-white px-6 py-10 text-center">
    <p class="m-0 text-base font-semibold text-ink">${title}</p>
    <p class="m-0 max-w-sm text-sm leading-relaxed text-ink-body">${text}</p>
    <a href="${href}" class="btn-outline px-6 py-2.5 text-sm">${cta}</a>
  </div>`;

/* ---------- data for tabs ---------- */

function myBids() {
  const own = loadBids();
  const ids = new Set(own.map((b) => b.id));
  return [...own, ...DEMO_BIDS.filter((b) => !ids.has(b.id))].filter((b) => lotById(b.id));
}
function myListings() {
  return [...loadListings(), ...DEMO_LISTINGS];
}
const PAY_METHODS = { card: 'بطاقة', applepay: 'Apple Pay', tabby: 'تابي', tamara: 'تمارا' };
const dueFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', hour: 'numeric', minute: '2-digit' });

/** Won lots with their payment status from orders paid on the checkout page. */
function myWins() {
  const orders = loadOrders();
  return data.wonLots.map((w) => ({
    ...w,
    order: orders[w.id],
    status: orders[w.id] ? 'paid' : w.dueIn ? 'unpaid' : 'delivered',
  }));
}

const counts = () => ({
  bids: myBids().length,
  watch: state.watch.size,
  selling: myListings().length,
  won: data.wonLots.length,
});

/* ---------- tabs ---------- */

function bidsTab() {
  const bids = myBids();
  if (!bids.length) return emptyBox('لم تزايد على أي مزاد بعد', 'تصفّح المزادات المفتوحة وزايد على ما يعجبك. ستجد مزايداتك وحالتها هنا.', 'search.html', 'تصفّح المزادات');
  return `<ul class="m-0 flex list-none flex-col gap-3 p-0">${bids.map((b) => {
    const lot = lotById(b.id);
    const left = lot.endsIn - elapsed();
    return row({
      href: `lot.html?id=${lot.id}`, img: lot.img, title: lot.name, status: b.status,
      meta: `${esc(data.categories[lot.cat])} · ${esc(lot.city)} · <span class="tabular">لوت ${esc(data.lotNumber(lot))}</span>`,
      facts: fact('مزايدتك', formatPrice(b.amount)) + fact('أعلى مزايدة', formatPrice(Math.max(b.top ?? 0, b.amount)))
        + fact('ينتهي خلال', `<span data-left="${lot.id}">${formatCountdown(left)}</span>`, left < 3600 ? 'text-accent-strong' : ''),
      actions: b.status === 'outbid'
        ? `<a href="lot.html?id=${lot.id}#bid-panel" class="btn-primary px-5 py-2 text-[13px]">زايد مرة أخرى</a>`
        : `<a href="lot.html?id=${lot.id}" class="btn-outline px-5 py-2 text-[13px]">عرض المزاد</a>`,
    });
  }).join('')}</ul>`;
}

function watchTab() {
  const lots = [...state.watch].map(lotById).filter(Boolean);
  if (!lots.length) return emptyBox('مفضلتك فارغة', 'اضغط على القلب في أي مزاد لتتابعه من هنا، وسنذكّرك قبل انتهائه.', 'search.html', 'تصفّح المزادات');
  return `<div class="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">${lots.map((l) => LotCard(l, { remaining: l.endsIn - elapsed(), watched: true })).join('')}</div>`;
}

function sellingTab() {
  const list = myListings();
  const add = '<a href="sell.html" class="btn-primary self-start px-6 py-2.5 text-sm">أضف منتجاً للبيع</a>';
  if (!list.length) return emptyBox('لم تعرض أي منتج بعد', 'أضف سيارتك أو مقتنياتك في خمس خطوات، والإضافة مجانية.', 'sell.html', 'ابدأ البيع');
  return `<div class="flex flex-col gap-4">${add}<ul class="m-0 flex list-none flex-col gap-3 p-0">${list.map((s) => {
    const lot = s.lotId != null ? lotById(s.lotId) : null;
    const tile = data.categoryTiles.find((t) => t.cat === s.cat);
    const facts = s.status === 'review' ? fact('سعر الافتتاح', formatPrice(s.opening ?? 0)) + fact('المدة', `${s.days} أيام`)
      : s.status === 'live' ? fact('أعلى مزايدة', formatPrice(lot.bid)) + fact('المزايدات', formatNumber(s.bids)) + fact('ينتهي خلال', `<span data-left="${lot.id}">${formatCountdown(lot.endsIn - elapsed())}</span>`)
        : fact('بيع بـ', formatPrice(s.price)) + fact('صافي المبلغ', formatPrice(s.price - Math.max(100, Math.round(s.price * 0.05))));
    return row({
      href: lot ? `lot.html?id=${lot.id}` : 'sell.html', img: lot?.img ?? tile?.img ?? '', title: s.title, status: s.status,
      meta: `${esc(data.categories[s.cat] ?? '')} · <span class="tabular" dir="ltr">${esc(s.ref)}</span>`,
      facts,
      actions: s.status === 'live' ? `<a href="lot.html?id=${lot.id}" class="btn-outline px-5 py-2 text-[13px]">عرض المزاد</a>`
        : s.status === 'review' ? '<span class="text-xs text-ink-muted">نراجع الطلب خلال 48 ساعة ونشعرك عند النشر.</span>' : '',
    });
  }).join('')}</ul></div>`;
}

function wonTab() {
  return `<ul class="m-0 flex list-none flex-col gap-3 p-0">${myWins().map((w) => {
    const lot = lotById(w.id);
    const facts = fact('سعر الفوز', formatPrice(w.price))
      + (w.status === 'unpaid' ? fact('ادفع قبل', esc(dueFmt.format(new Date(startedAt + w.dueIn * 1000))), 'text-accent-strong')
        : w.status === 'paid' ? fact('دفعت', `${formatPrice(w.order.total)} · ${PAY_METHODS[w.order.method] ?? ''}`) + fact('الاستلام', w.order.delivery === 'ship' ? `توصيل إلى ${esc(w.order.city)}` : 'من البائع')
          : fact('استلمته في', esc(w.deliveredOn)));
    return row({
      href: `lot.html?id=${lot.id}`, img: lot.img, title: lot.name, status: w.status,
      meta: `${esc(data.categories[lot.cat])} · ${esc(lot.city)} · <span class="tabular">لوت ${esc(data.lotNumber(lot))}</span>`,
      facts,
      actions: w.status === 'unpaid' ? `<a href="checkout.html?id=${w.id}" class="btn-primary px-5 py-2 text-[13px]">ادفع الآن</a>` : '',
    });
  }).join('')}</ul>`;
}

function switchRow(id, title, text) {
  return `
    <label class="flex cursor-pointer items-start justify-between gap-4 border-b border-line-soft py-4 last:border-0">
      <span class="flex flex-col gap-1"><b class="text-sm font-semibold">${title}</b><span class="text-[13px] leading-relaxed text-ink-body">${text}</span></span>
      <input type="checkbox" role="switch" data-notify="${id}" ${state.notify[id] ? 'checked' : ''} class="peer sr-only">
      <span aria-hidden="true" class="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-line transition-colors after:absolute after:start-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-float after:transition-transform peer-checked:bg-primary peer-checked:after:-translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2"></span>
    </label>`;
}

function settingsTab() {
  const user = getUser();
  return `
    <div class="flex flex-col gap-5">
      <section class="card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="profile-title">
        <h2 id="profile-title" class="m-0 text-lg font-bold">الملف الشخصي</h2>
        <form id="name-form" novalidate class="flex flex-col gap-2">
          <label for="name" class="text-sm font-semibold">الاسم <span class="font-normal text-ink-muted">(اختياري)</span></label>
          <div class="flex flex-wrap gap-2">
            <input id="name" maxlength="40" autocomplete="name" value="${esc(user.name ?? '')}" placeholder="الاسم الذي يراه البائعون"
              class="min-w-0 flex-1 rounded-full border-0 bg-mist px-5 py-3 text-[15px] text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0">
            <button type="submit" class="btn-primary px-6 py-3 text-sm">حفظ</button>
          </div>
          <p class="m-0 text-xs text-ink-muted">يظهر للبائع بعد فوزك فقط. في المزايدات تبقى «مزايد #رقم».</p>
        </form>
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4 text-sm">
          <span class="text-ink-body">رقم الجوال <b dir="ltr" class="font-semibold text-ink tabular">+966 ${esc(user.phone.slice(0, 2))} ••• ${esc(user.phone.slice(5))}</b></span>
          ${user.via === 'nafath' ? `<span class="flex items-center gap-1 text-xs font-semibold text-primary">${shield}هوية موثّقة بنفاذ</span>` : `<a href="${loginHref('account.html#settings')}" class="text-sm font-semibold">وثّق هويتك بنفاذ</a>`}
        </div>
      </section>
      <section class="card flex flex-col px-5 py-2 sm:px-6" aria-labelledby="notify-title">
        <h2 id="notify-title" class="m-0 pt-4 text-lg font-bold">الإشعارات</h2>
        ${switchRow('outbid', 'عند تجاوز مزايدتي', 'رسالة نصية فور مزايدة أحد بأعلى منك.')}
        ${switchRow('ending', 'قبل انتهاء مزاد في المفضلة', 'تذكير قبل ساعة من انتهاء أي مزاد تتابعه.')}
        ${switchRow('news', 'عروض وأخبار مزادي', 'مزادات مميزة جديدة، مرة في الأسبوع على الأكثر.')}
      </section>
      <button type="button" data-logout class="btn-outline self-start px-6 py-3 text-sm">تسجيل الخروج</button>
    </div>`;
}

/* ---------- frame ---------- */

function profileHeader() {
  const user = getUser();
  const name = user.name || 'حسابي';
  return `
    <header class="card flex flex-wrap items-center gap-4 p-5 sm:p-6">
      <span class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-soft text-xl font-bold text-primary">${esc(name.trim()[0])}</span>
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <h1 class="m-0 text-2xl font-bold leading-tight">${esc(name)}</h1>
        <p class="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
          <span dir="ltr" class="tabular">+966 ${esc(user.phone.slice(0, 2))} ••• ${esc(user.phone.slice(5))}</span>
          ${user.via === 'nafath' ? `<span class="flex items-center gap-1 font-semibold text-primary">${shield}موثّق بنفاذ</span>` : '<span>غير موثّق بنفاذ</span>'}
        </p>
      </div>
      <a href="sell.html" class="btn-outline px-5 py-2.5 text-sm">بِع منتجاً</a>
    </header>`;
}

function tabNav() {
  const c = counts();
  return `
    <nav aria-label="أقسام الحساب" class="lg:sticky lg:top-[136px]">
      <ul class="scroll-row m-0 -mx-1 list-none gap-2 p-1 lg:card lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:p-2">
        ${TABS.map(([id, label]) => {
          const on = id === state.tab;
          return `<li class="shrink-0"><a href="#${id}" data-tab="${id}" ${on ? 'aria-current="page"' : ''}
            class="flex items-center gap-2.5 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-colors lg:rounded-xl lg:border-0 lg:px-3 lg:py-2.5 lg:text-sm ${on ? 'border-primary bg-primary text-white hover:text-white lg:bg-primary-soft lg:text-primary lg:hover:text-primary' : 'border-[#E5E7EB] bg-white text-ink hover:text-ink lg:hover:bg-sand'}">
            <span class="hidden lg:inline">${icon(id)}</span>
            <span class="flex-1">${label}</span>
            ${c[id] != null ? `<span class="rounded-full px-[7px] py-0.5 text-[11px] font-semibold tabular ${on ? 'bg-white/20 lg:bg-primary lg:text-white' : 'bg-mist text-ink-body'}">${c[id]}</span>` : ''}
          </a></li>`;
        }).join('')}
      </ul>
    </nav>`;
}

function gateView() {
  return `
    <div class="card flex flex-col items-center gap-5 px-6 py-12 text-center sm:px-10">
      <div class="flex flex-col gap-2">
        <h1 class="m-0 text-2xl font-bold">سجّل دخولك لترى حسابك</h1>
        <p class="m-0 max-w-md text-[15px] leading-relaxed text-ink-body">مزايداتك ومفضلتك ومنتجاتك ومشترياتك في مكان واحد.</p>
      </div>
      <a href="${loginHref('account.html')}" class="btn-primary px-8 py-3.5 text-[15px]">تسجيل الدخول</a>
    </div>`;
}

function render() {
  if (!getUser()) { $('#account').innerHTML = gateView(); return; }
  const views = { bids: bidsTab, watch: watchTab, selling: sellingTab, won: wonTab, settings: settingsTab };
  const label = TABS.find(([id]) => id === state.tab)[1];
  $('#account').innerHTML = `
    <div class="flex flex-col gap-6">
      ${profileHeader()}
      <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        ${tabNav()}
        <section aria-labelledby="tab-title" class="flex min-w-0 flex-col gap-4">
          <h2 id="tab-title" class="m-0 text-xl font-bold">${label}</h2>
          ${views[state.tab]()}
        </section>
      </div>
    </div>`;
  document.title = `${label} · حسابي · مزادي`;
  // Keep the selected tab visible in the scrolling row on phones.
  const current = $('[data-tab][aria-current="page"]');
  const rowEl = current?.closest('ul');
  if (rowEl && rowEl.scrollWidth > rowEl.clientWidth) current.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

let toastTimer;
function toast(message) {
  $('#toast').innerHTML = `<div class="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-card">${check}<span>${esc(message)}</span></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').innerHTML = ''; }, 4000);
}

function tick() {
  document.querySelectorAll('[data-left]').forEach((el) => {
    const lot = lotById(Number(el.dataset.left));
    el.textContent = formatCountdown(lot.endsIn - elapsed());
  });
}

/* ---------- events ---------- */

function showTab(id, { focus = false } = {}) {
  state.tab = id;
  history.replaceState(null, '', `#${id}`);
  render();
  if (focus) $('#tab-title')?.focus?.();
}

window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (TABS.some(([t]) => t === id) && id !== state.tab) { state.tab = id; render(); }
});

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) { location.href = catHref(cat.dataset.cat); return; }
  const tab = t.closest('[data-tab]');
  if (tab) { event.preventDefault(); showTab(tab.dataset.tab); return; }
  if (t.closest('#watch-link') && getUser()) { event.preventDefault(); showTab('watch'); window.scrollTo({ top: 0 }); return; }
  const watch = t.closest('[data-watch]');
  if (watch) {
    state.watch.delete(Number(watch.dataset.watch));
    saveWatch(state.watch);
    render();
    toast('أزلناه من المفضلة');
    return;
  }
  if (t.closest('[data-logout]')) { clearUser(); location.href = 'index.html'; }
});

document.addEventListener('change', (event) => {
  const t = event.target;
  if (t.dataset.notify) { state.notify[t.dataset.notify] = t.checked; toast(t.checked ? 'فعّلنا الإشعار' : 'أوقفنا الإشعار'); }
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'name-form') return;
  event.preventDefault();
  setUser({ ...getUser(), name: $('#name').value.trim().slice(0, 40) });
  render();
  toast('حفظنا اسمك');
});

/* ---------- start ---------- */

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
render();
setInterval(tick, 1000);
