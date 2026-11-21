/**
 * Live auction room: one lot at a time, the auctioneer's clock resets on every bid and the lot is sold when it runs out.
 * Other bidders are simulated for the prototype.
 */
import * as data from './data.js';
import { Media, bidIncrement, esc, formatNumber, formatPrice } from './components.js';
import { catHref, catNavHTML, getUser, loadEventRegs, loginHref, renderShell, saveEventReg } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const id = data.events[params.get('e')] ? params.get('e') : 'north-yard';
if (params.has('e') && id !== params.get('e')) location.replace('404.html');
const ev = data.events[id];
// Timed online auctions have no live room: their lots are bid on from the lot page.
if (ev.endsInDays) location.replace(`event.html?e=${id}`);

const ROUND = 15; // seconds the auctioneer waits after the last bid
const NEXT_IN = 6; // seconds between a sale and the next lot
const inHall = ev.type.includes('حضوري');
const lots = ev.lots.map((lid) => data.lots.find((l) => l.id === lid)).filter(Boolean);
const firstNo = Math.min(13, ev.count - lots.length + 1);

/** Lots sold earlier in the session (prototype examples), shown at the top of the running order. */
const SOLD_EARLIER = {
  1: [['جي إم سي يوكن 2020', 131500], ['كيا K5 2023', 74000]],
  5: [['أرض سكنية 450م² حي العارض', 610000]],
  6: [['حفار كاتربيلر 320', 212000], ['شاحنة مرسيدس أكتروس 2017', 168000]],
  7: [['سيف عربي قديم', 7800], ['مبخرة فضية', 2300]],
  8: [['لوحة د ل م 55', 18500], ['لوحة ن ن ر 900', 9200]],
};
const soldEarlier = (SOLD_EARLIER[ev.cat] ?? []).slice(0, firstNo - 1);

const room = {
  index: 0,
  price: 0,
  leader: null, // 'me' | { no, channel }
  wasLeading: false,
  deadline: 0,
  target: 0,
  phase: 'open', // 'open' | 'sold' | 'ended'
  nextAt: 0,
  feed: [],
  results: [], // { price, me }
  viewers: 1200 + Math.floor(Math.random() * 300),
};
let rivalTimer;

/* ---------- helpers ---------- */

const rnd = (min, max) => min + Math.random() * (max - min);
const roundTo = (n, step) => Math.round(n / step) * step;
const lot = () => lots[room.index];
const registered = () => Boolean(loadEventRegs()[id]);
const leftMs = () => Math.max(0, room.deadline - Date.now());
const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const shield = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4" stroke-linecap="round"/></svg>';

function ago(at) {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 5) return 'الآن';
  if (s < 60) return s <= 10 ? `قبل ${s} ثوانٍ` : `قبل ${s} ثانية`;
  const m = Math.round(s / 60);
  return m === 1 ? 'قبل دقيقة' : m === 2 ? 'قبل دقيقتين' : m <= 10 ? `قبل ${m} دقائق` : `قبل ${m} دقيقة`;
}

const PHASES = [['open', 'مفتوحة'], ['once', 'دفعة أولى'], ['twice', 'دفعة ثانية']];
function phaseKey() {
  const s = leftMs() / 1000;
  return s > 10 ? 'open' : s > 5 ? 'once' : 'twice';
}

const bidderNo = () => String(1000 + Math.floor(Math.random() * 9000));
const channel = () => (inHall && Math.random() < 0.55 ? 'في الساحة' : 'إلكتروني');

/* ---------- simulation ---------- */

function addBid(amount, who) {
  room.price = amount;
  room.leader = who;
  room.deadline = Date.now() + ROUND * 1000;
  room.feed.unshift({ amount, who, at: Date.now() });
  room.feed.length = Math.min(room.feed.length, 30);
}

function scheduleRival(delay) {
  clearTimeout(rivalTimer);
  rivalTimer = setTimeout(() => {
    if (room.phase !== 'open') return;
    const next = room.price + bidIncrement(room.price);
    // Rivals stop at their limit; a visitor in the lead may be challenged once more before they give up.
    if (next > room.target) return;
    addBid(next, { no: bidderNo(), channel: channel() });
    update();
    scheduleRival(rnd(2500, 9000));
  }, delay);
}

function startLot() {
  const l = lot();
  const inc = bidIncrement(l.bid);
  room.phase = 'open';
  room.feed = [];
  room.leader = null;
  room.wasLeading = false;
  room.target = roundTo(l.bid * rnd(1.01, 1.07), inc);
  let price = roundTo(l.bid * 0.88, inc);
  const t0 = Date.now() - 40000;
  [0, 1, 2].forEach((i) => {
    room.feed.unshift({ amount: price, who: { no: bidderNo(), channel: channel() }, at: t0 + i * 12000 });
    price += bidIncrement(price);
  });
  const top = room.feed[0];
  room.price = top.amount;
  room.leader = top.who;
  room.deadline = Date.now() + ROUND * 1000;
  render();
  scheduleRival(rnd(2000, 4000));
}

function sell() {
  clearTimeout(rivalTimer);
  const me = room.leader === 'me';
  room.results[room.index] = { price: room.price, me };
  room.phase = 'sold';
  room.nextAt = Date.now() + NEXT_IN * 1000;
  update();
  if (me) toast(`فزت باللوت بـ ${formatPrice(room.price)}`);
}

function next() {
  if (room.index + 1 >= lots.length) {
    room.phase = 'ended';
    render();
    return;
  }
  room.index += 1;
  startLot();
}

/* ---------- parts ---------- */

function header() {
  return `
    <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted">
      <ol class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li><a href="index.html" class="text-ink-body hover:text-primary">الرئيسية</a></li><li aria-hidden="true">‹</li>
        <li><a href="event.html?e=${id}" class="text-ink-body hover:text-primary">${esc(ev.title)}</a></li><li aria-hidden="true">‹</li>
        <li aria-current="page" class="text-ink">غرفة المزاد</li>
      </ol>
    </nav>
    <section aria-label="حالة المزاد" class="on-dark flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-card bg-forest px-5 py-4 text-white sm:px-6">
      <div class="flex min-w-0 flex-col gap-1.5">
        <p class="m-0 flex flex-wrap items-center gap-2 text-[13px]">
          ${room.phase === 'ended' ? '<b class="rounded-md bg-white/15 px-2 py-0.5 font-bold">انتهى</b>' : '<b class="rounded-md bg-lime px-2 py-0.5 font-bold text-forest">● مباشر</b>'}
          <span class="opacity-80">${esc(ev.type)} · ${esc(ev.city)}</span>
        </p>
        <h1 class="m-0 text-xl font-bold leading-snug sm:text-2xl">${esc(ev.title)}</h1>
      </div>
      <dl class="m-0 flex gap-6 text-[13px]">
        <div class="flex flex-col"><dt class="opacity-75">اللوت</dt><dd id="lot-pos" class="m-0 text-base font-bold tabular">${room.phase === 'ended' ? `${formatNumber(ev.count)} من ${formatNumber(ev.count)}` : `${firstNo + room.index} من ${formatNumber(ev.count)}`}</dd></div>
        <div class="flex flex-col"><dt class="opacity-75">يتابعون الآن</dt><dd id="viewers" class="m-0 text-base font-bold tabular">${formatNumber(room.viewers)}</dd></div>
      </dl>
    </section>`;
}

function stage() {
  const l = lot();
  return `
    <div class="relative overflow-hidden rounded-[22px] bg-mist text-white sm:rounded-hero">
      ${Media({ src: l.img, eager: true, alt: l.name, className: 'aspect-[4/3] sm:aspect-[16/10]' })}
      <span class="absolute start-3 top-3 flex items-center gap-1.5 rounded-full bg-forest/90 px-3 py-1.5 text-xs font-semibold sm:start-4 sm:top-4">
        <span class="h-2 w-2 rounded-full bg-accent-strong motion-safe:animate-pulse" aria-hidden="true"></span>${inHall ? 'بث مباشر من الساحة' : 'مزاد إلكتروني مباشر'}
      </span>
      <span class="absolute end-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink tabular sm:end-4 sm:top-4">لوت ${esc(data.lotNumber(l))}</span>
      <div id="sold-overlay" class="absolute inset-0 hidden flex-col items-center justify-center gap-1 bg-forest/80 text-center"></div>
    </div>`;
}

function lotInfo() {
  const l = lot();
  const specs = data.lotDetails[l.id]?.specs?.slice(0, 4) ?? [['الفئة', data.categories[l.cat]], ['المدينة', l.city]];
  return `
    <section aria-labelledby="lot-name" class="card flex flex-col gap-3 p-5 sm:p-6">
      <div class="flex flex-col gap-1">
        <h2 id="lot-name" class="m-0 text-xl font-bold leading-snug">${esc(l.name)}</h2>
        <p class="m-0 text-sm text-ink-body">${esc(l.sub)}</p>
      </div>
      <dl class="m-0 grid grid-cols-2 gap-3 sm:grid-cols-4">
        ${specs.map(([k, v]) => `<div class="flex flex-col gap-0.5 rounded-xl bg-sand px-3 py-2.5"><dt class="text-xs text-ink-muted">${esc(k)}</dt><dd class="m-0 text-sm font-semibold">${esc(v)}</dd></div>`).join('')}
      </dl>
      <p class="m-0 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
        <a href="lot.html?id=${l.id}" target="_blank" rel="noopener">تفاصيل اللوت</a>
        ${data.inspectionReports[l.id] ? `<a href="inspection.html?id=${l.id}" target="_blank" rel="noopener">تقرير الفحص</a>` : ''}
      </p>
    </section>`;
}

function panel() {
  return `
    <div class="card overflow-hidden">
      <div class="on-dark bg-forest px-5 py-4 text-white">
        <div class="flex items-center justify-between gap-3 text-[13px]">
          <span id="clock-label" class="opacity-85">يُغلق خلال</span>
          <ol id="phases" class="m-0 flex list-none gap-1 p-0 text-[11px]" aria-label="مراحل البيع"></ol>
        </div>
        <b id="clock" class="mt-1.5 block text-[40px] font-bold leading-none tabular" role="timer" aria-live="off">00:15</b>
        <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15" aria-hidden="true"><div id="clock-bar" class="h-full rounded-full bg-lime transition-[width] duration-200 ease-linear" style="width: 100%"></div></div>
      </div>
      <div class="flex flex-col gap-4 p-5">
        <div>
          <div class="text-[13px] text-ink-muted">المزايدة الحالية</div>
          <div id="price" class="tabular text-[32px] font-bold leading-tight"></div>
          <div id="leader" class="mt-1 text-[13px] text-ink-body"></div>
        </div>
        <div id="status" role="status" aria-live="polite"></div>
        <div id="action" class="flex flex-col gap-2.5"></div>
        <ul class="m-0 flex list-none flex-col gap-2.5 border-t border-line-soft p-0 pt-4 text-[13px] text-ink-body">
          <li class="flex justify-between gap-3"><span>تأمين المشاركة (يُسترد)</span><b class="tabular font-semibold text-ink">${formatPrice(ev.deposit)}</b></li>
          <li class="flex justify-between gap-3"><span>عمولة المشتري</span><b class="tabular font-semibold text-ink">2.5%</b></li>
          <li class="flex justify-between gap-3"><span>الدفع</span><span class="font-medium text-ink">خلال 48 ساعة من الفوز</span></li>
        </ul>
      </div>
    </div>`;
}

function queue() {
  const rows = [
    ...soldEarlier.map(([name, price], i) => ({ no: firstNo - soldEarlier.length + i, name, img: '', note: `بيع بـ ${formatPrice(price)}`, chip: ['مُباع', 'bg-mist text-ink-body'] })),
    ...lots.map((l, i) => {
      const r = room.results[i];
      const current = i === room.index && room.phase !== 'ended';
      return {
        no: firstNo + i, name: l.name, img: l.img, current,
        note: r ? `بيع بـ ${formatPrice(r.price)}${r.me ? ' · لك' : ''}` : current ? 'يُعرض الآن' : `يبدأ من ${formatPrice(roundTo(l.bid * 0.88, bidIncrement(l.bid)))}`,
        chip: r ? (r.me ? ['فزت به', 'bg-primary text-white'] : ['مُباع', 'bg-mist text-ink-body']) : current ? ['الآن', 'bg-lime text-forest'] : null,
      };
    }),
  ];
  const more = ev.count - (firstNo + lots.length - 1);
  return `
    <section aria-labelledby="queue-title" class="card overflow-hidden">
      <h2 id="queue-title" class="m-0 border-b border-line-soft px-5 py-3.5 text-base font-bold">ترتيب العرض</h2>
      <ol class="m-0 list-none p-0">
        ${rows.map((r) => `
          <li class="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0 ${r.current ? 'bg-primary-soft/60' : ''}" ${r.current ? 'aria-current="true"' : ''}>
            ${r.img ? `<span class="block w-14 shrink-0">${Media({ src: r.img, className: 'aspect-[4/3] rounded-lg' })}</span>` : `<span class="grid h-[42px] w-14 shrink-0 place-items-center rounded-lg bg-sand text-xs font-semibold text-ink-muted tabular">${r.no}</span>`}
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="truncate text-sm font-semibold">${esc(r.name)}</span>
              <span class="text-xs text-ink-muted"><span class="tabular">لوت ${r.no}</span> · ${r.note}</span>
            </span>
            ${r.chip ? `<span class="shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${r.chip[1]}">${r.chip[0]}</span>` : ''}
          </li>`).join('')}
        ${more > 0 ? `<li class="px-4 py-3 text-center text-xs text-ink-muted">تليها ${formatNumber(more)} ${more <= 10 ? 'لوتات' : 'لوتاً'} أخرى</li>` : ''}
      </ol>
    </section>`;
}

function feedSection() {
  return `
    <section aria-labelledby="feed-title" class="card overflow-hidden">
      <div class="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-3.5">
        <h2 id="feed-title" class="m-0 text-base font-bold">سجل المزايدات</h2>
        <span id="feed-count" class="text-xs text-ink-muted tabular"></span>
      </div>
      <ol id="feed" class="m-0 max-h-[420px] list-none overflow-y-auto overscroll-contain p-0"></ol>
    </section>`;
}

function feedRows() {
  return room.feed.map((b, i) => {
    const me = b.who === 'me';
    return `
      <li class="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-2.5 last:border-0 ${me ? 'bg-primary-soft/50' : ''}">
        <span class="flex min-w-0 items-center gap-2.5">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${me ? 'bg-primary text-white' : 'bg-mist text-ink-body'}">${me ? 'أنت' : esc(b.who.no.slice(0, 2))}</span>
          <span class="flex min-w-0 flex-col">
            <b class="truncate text-sm font-semibold">${me ? 'مزايدتك' : `مزايد #${esc(b.who.no)}`}${i === 0 && room.phase === 'open' ? ' <span class="text-xs font-semibold text-primary">· الأعلى</span>' : ''}</b>
            <span class="text-xs text-ink-muted">${me ? 'إلكتروني' : esc(b.who.channel)} · ${ago(b.at)}</span>
          </span>
        </span>
        <b class="shrink-0 text-sm font-bold tabular">${formatPrice(b.amount)}</b>
      </li>`;
  }).join('');
}

function endedView() {
  const won = room.results.filter((r) => r.me).length;
  return `
    ${header()}
    <div class="card flex flex-col items-center gap-4 px-6 py-12 text-center sm:px-10">
      <span class="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">${check.replace('h-4 w-4', 'h-7 w-7')}</span>
      <div class="flex flex-col gap-2">
        <h2 class="m-0 text-2xl font-bold">انتهت جلسة المزاد</h2>
        <p class="m-0 max-w-md text-[15px] leading-relaxed text-ink-body">${won ? `فزت بـ${won === 1 ? 'لوت واحد' : won === 2 ? 'لوتين' : ` ${won} لوتات`}. سنرسل إليك تفاصيل الدفع خلال دقائق.` : 'شكراً لمتابعتك. يُعاد تأمين المشاركة إلى حسابك خلال 3 أيام عمل.'}</p>
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <a href="auctions.html" class="btn-primary px-6 py-3 text-sm">المزادات القادمة</a>
        <a href="account.html#wallet" class="btn-outline px-6 py-3 text-sm">المحفظة</a>
      </div>
    </div>
    ${queue()}`;
}

function mobileBar() {
  return `
    <div id="m-bar" class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 pt-3 shadow-header lg:hidden" style="padding-bottom: max(12px, env(safe-area-inset-bottom))">
      <div class="mx-auto flex max-w-page items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="text-[11px] text-ink-muted">المزايدة الحالية · <span id="m-clock" class="tabular font-semibold"></span></div>
          <b id="m-price" class="block truncate text-lg font-bold tabular"></b>
        </div>
        <div id="m-action" class="shrink-0"></div>
      </div>
    </div>`;
}

/* ---------- render / update ---------- */

let actionMode = '';
const shown = { feed: '', queue: '' };

function render() {
  document.title = `غرفة المزاد · ${ev.title} · مزادي`;
  actionMode = '';
  shown.feed = '';
  shown.queue = '';
  if (room.phase === 'ended') {
    $('#main').innerHTML = endedView();
    return;
  }
  $('#main').innerHTML = `
    ${header()}
    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-8">
      <div class="min-w-0 lg:col-start-1 lg:row-start-1">${stage()}</div>
      <aside aria-label="المزايدة" class="flex flex-col gap-5 lg:sticky lg:top-[136px] lg:col-start-2 lg:row-span-3 lg:row-start-1">
        <div id="panel">${panel()}</div>
        <div id="queue">${queue()}</div>
      </aside>
      <div class="min-w-0 lg:col-start-1 lg:row-start-2">${lotInfo()}</div>
      <div class="min-w-0 lg:col-start-1 lg:row-start-3">${feedSection()}</div>
    </div>
    ${mobileBar()}`;
  shown.queue = `${room.index}-${room.phase}`;
  update();
}

function actionHTML(mode, compact = false) {
  const size = compact ? 'px-5 py-3 text-sm' : 'w-full py-3.5 text-[15px]';
  const nextBid = room.price + bidIncrement(room.price);
  switch (mode) {
    case 'login': return `<a href="${loginHref()}" class="btn-primary ${size}">${compact ? 'سجّل دخولك' : 'سجّل دخولك للمزايدة'}</a>`;
    case 'register': return `<button type="button" data-register class="btn-primary ${size}">${compact ? 'سجّل للمزايدة' : `سجّل للمزايدة · تأمين ${formatPrice(ev.deposit)}`}</button>`;
    case 'leading': return `<button type="button" disabled class="btn ${size} cursor-not-allowed bg-primary-soft text-primary">${compact ? 'أنت الأعلى' : 'بانتظار مزايدة أعلى'}</button>`;
    case 'sold': return `<button type="button" disabled class="btn ${size} cursor-not-allowed bg-mist text-ink-muted">${compact ? 'بيع' : 'أُغلق البيع على هذا اللوت'}</button>`;
    default: {
      if (compact) return `<button type="button" data-bid="${nextBid}" class="btn-primary ${size}">زايد <span class="tabular" data-next-label>${formatNumber(nextBid)}</span></button>`;
      const inc = bidIncrement(room.price);
      return `
        <button type="button" data-bid="${nextBid}" class="btn-primary ${size}">زايد بـ <span class="tabular" data-next-label>${formatPrice(nextBid)}</span></button>
        <div class="grid grid-cols-3 gap-2" role="group" aria-label="مزايدة أعلى">
          ${[2, 5, 10].map((k) => `<button type="button" data-jump="${k}" class="rounded-full border border-line bg-white px-2 py-2 text-[13px] font-semibold text-ink hover:border-ink/40 tabular">+${formatNumber(inc * k)}</button>`).join('')}
        </div>`;
    }
  }
}

function currentMode() {
  if (room.phase !== 'open') return 'sold';
  if (!getUser()) return 'login';
  if (!registered()) return 'register';
  return room.leader === 'me' ? 'leading' : 'bid';
}

function statusHTML() {
  const box = (tone, text) => `<p class="m-0 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${tone}">${text}</p>`;
  if (room.phase === 'sold') {
    const r = room.results[room.index];
    const nextIn = Math.max(0, Math.ceil((room.nextAt - Date.now()) / 1000));
    const tail = room.index + 1 < lots.length ? `<span class="block text-xs font-normal opacity-80">اللوت التالي خلال <span class="tabular">${nextIn}</span> ث</span>` : '';
    return r.me
      ? box('bg-primary-soft text-primary', `${check}<span>فزت بهذا اللوت بـ <span class="tabular">${formatPrice(r.price)}</span>. ادفع خلال 48 ساعة.${tail}</span>`)
      : box('bg-mist text-ink-body', `<span>بيع لمزايد آخر بـ <span class="tabular">${formatPrice(r.price)}</span>.${tail}</span>`);
  }
  if (room.leader === 'me') return box('bg-primary-soft text-primary', `${check}<span>مزايدتك هي الأعلى</span>`);
  if (room.wasLeading) return box('bg-accent-soft text-accent-ink', '<span>تجاوز مزايد آخر مزايدتك</span>');
  if (getUser() && registered()) return `<p class="m-0 flex items-center gap-1.5 text-xs font-semibold text-primary">${shield}التأمين محجوز، ويمكنك المزايدة</p>`;
  return '';
}

function update() {
  if (room.phase === 'ended' || !$('#price')) return;
  const left = leftMs();
  const secs = Math.ceil(left / 1000);
  const sold = room.phase === 'sold';
  const key = phaseKey();

  $('#clock').textContent = sold ? 'بيع' : `00:${String(secs).padStart(2, '0')}`;
  $('#clock-label').textContent = sold ? 'أُغلق البيع' : 'يُغلق خلال';
  const bar = $('#clock-bar');
  bar.style.width = sold ? '0%' : `${(left / (ROUND * 1000)) * 100}%`;
  bar.classList.toggle('bg-lime', key === 'open');
  bar.classList.toggle('bg-accent', key === 'once');
  bar.classList.toggle('bg-timer', key === 'twice');
  const at = PHASES.findIndex(([k]) => k === key);
  $('#phases').innerHTML = PHASES.map(([k, label], i) => {
    const on = !sold && k === key;
    return `<li class="rounded-full px-2 py-0.5 font-semibold ${on ? 'bg-lime text-forest' : !sold && i < at ? 'bg-white/20' : 'bg-white/10 opacity-70'}" ${on ? 'aria-current="step"' : ''}>${label}</li>`;
  }).join('');

  $('#price').innerHTML = `${formatNumber(room.price)} <span class="text-base font-semibold">ر.س</span>`;
  $('#leader').innerHTML = room.leader === 'me'
    ? '<b class="font-semibold text-primary">الأعلى: أنت</b>'
    : `الأعلى: مزايد <span class="tabular">#${esc(room.leader.no)}</span> · ${esc(room.leader.channel)}`;
  $('#status').innerHTML = statusHTML();

  const mode = currentMode();
  if (mode !== actionMode) {
    actionMode = mode;
    const hadFocus = document.activeElement?.closest('#action, #m-action');
    $('#action').innerHTML = actionHTML(mode);
    $('#m-action').innerHTML = actionHTML(mode, true);
    if (hadFocus) ($('#action button:not([disabled]), #action a') ?? $('#action button'))?.focus();
  } else if (mode === 'bid') {
    const nextBid = room.price + bidIncrement(room.price);
    document.querySelectorAll('[data-bid]').forEach((b) => { b.dataset.bid = nextBid; });
    $('#action [data-next-label]').textContent = formatPrice(nextBid);
    $('#m-action [data-next-label]').textContent = formatNumber(nextBid);
    const inc = bidIncrement(room.price);
    document.querySelectorAll('[data-jump]').forEach((b) => { b.textContent = `+${formatNumber(inc * Number(b.dataset.jump))}`; });
  }

  $('#m-price').textContent = formatPrice(room.price);
  $('#m-clock').textContent = sold ? 'بيع' : `00:${String(secs).padStart(2, '0')}`;
  $('#m-clock').classList.toggle('text-timer', !sold && key === 'twice');

  const overlay = $('#sold-overlay');
  overlay.classList.toggle('hidden', !sold);
  overlay.classList.toggle('flex', sold);
  if (sold) {
    const r = room.results[room.index];
    overlay.innerHTML = `<span class="text-sm opacity-85">${r.me ? 'بيع لك' : 'بيع'}</span><b class="text-3xl font-bold tabular sm:text-4xl">${formatPrice(r.price)}</b>`;
  }

  // The feed's relative times change once a second; the running order only when a lot is sold or replaced.
  const feedKey = `${room.feed.length}-${room.feed[0]?.at}-${room.phase}-${Math.floor(Date.now() / 1000)}`;
  if (feedKey !== shown.feed) {
    shown.feed = feedKey;
    $('#feed').innerHTML = feedRows();
    $('#feed-count').textContent = `${formatNumber(room.feed.length)} مزايدة`;
  }
  const queueKey = `${room.index}-${room.phase}`;
  if (queueKey !== shown.queue) { shown.queue = queueKey; $('#queue').innerHTML = queue(); }
  $('#viewers').textContent = formatNumber(room.viewers);
}

let toastTimer;
function toast(message) {
  $('#toast').innerHTML = `<div class="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-card">${check}<span>${esc(message)}</span></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').innerHTML = ''; }, 3500);
}

/* ---------- events ---------- */

function placeBid(amount) {
  if (currentMode() !== 'bid' || amount <= room.price) return;
  addBid(amount, 'me');
  room.wasLeading = true;
  update();
  // Rivals answer while the price is under their limit; otherwise the clock runs out and the lot is sold to the visitor.
  if (amount + bidIncrement(amount) <= room.target) scheduleRival(rnd(2500, 6000));
  else clearTimeout(rivalTimer);
}

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) { location.href = catHref(cat.dataset.cat); return; }
  if (t.closest('[data-register]')) {
    saveEventReg(id, { remind: true, at: Date.now() });
    toast('تم تسجيلك وحجز التأمين');
    update();
    return;
  }
  const bid = t.closest('[data-bid]');
  if (bid) { placeBid(Number(bid.dataset.bid)); return; }
  const jump = t.closest('[data-jump]');
  if (jump) placeBid(room.price + bidIncrement(room.price) * Number(jump.dataset.jump));
});

/* ---------- start ---------- */

$('#cat-nav').innerHTML = catNavHTML(data.categories, ev.cat);
startLot();
setInterval(() => {
  if (room.phase === 'open' && leftMs() === 0) sell();
  else if (room.phase === 'sold' && Date.now() >= room.nextAt) next();
  else update();
}, 250);
setInterval(() => {
  room.viewers = Math.max(800, room.viewers + Math.round(rnd(-12, 18)));
}, 4000);
