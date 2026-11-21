import * as data from './data.js';
import { LotCard, Media, esc, formatCountdown, formatNumber, formatPrice } from './components.js';
import {
  catHref, catNavHTML, getUser, loadEventRegs, loadWatch, loginHref, renderShell, saveEventReg, saveWatch,
} from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const id = data.events[params.get('e')] ? params.get('e') : 'north-yard';
const ev = data.events[id];
const startedAt = Date.now();
const state = { watch: loadWatch() };

/* ---------- timing ---------- */

const timing = () => data.eventTiming(ev, new Date(), startedAt);

function cells(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const pad = (v) => String(v).padStart(2, '0');
  return [[pad(Math.floor(t / 86400)), 'يوم'], [pad(Math.floor((t % 86400) / 3600)), 'ساعة'], [pad(Math.floor((t % 3600) / 60)), 'دقيقة'], [pad(t % 60), 'ثانية']]
    .map(([v, l]) => `<div class="rounded-[10px] bg-white/10 px-1 py-2 text-center"><b class="block text-2xl font-bold leading-tight tabular">${v}</b><span class="text-[11px] opacity-75">${l}</span></div>`).join('');
}

const whenFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });

/* ---------- parts ---------- */

const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const icons = {
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
};
const icon = (k) => `<span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[k]}</svg></span>`;

function registerCard() {
  const t = timing();
  const reg = loadEventRegs()[id];
  const user = getUser();
  const action = !user
    ? `<a href="${loginHref()}" class="btn-primary w-full py-3.5 text-[15px]">سجّل دخولك للمشاركة</a>`
    : reg
      ? `<p class="m-0 flex items-center gap-2 rounded-xl bg-primary-soft px-3.5 py-2.5 text-sm font-semibold text-primary">${check}أنت مسجّل في هذا المزاد</p>
         <label class="flex cursor-pointer items-center justify-between gap-4 text-sm">
           <span>ذكّرني قبل البدء بساعة</span>
           <input id="remind" type="checkbox" role="switch" ${reg.remind ? 'checked' : ''} class="peer sr-only">
           <span aria-hidden="true" class="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors after:absolute after:start-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-float after:transition-transform peer-checked:bg-primary peer-checked:after:-translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2"></span>
         </label>`
      : `<button type="button" id="register" class="btn-primary w-full py-3.5 text-[15px]">سجّل للمشاركة</button>`;
  return `
    <div class="card overflow-hidden">
      <div class="on-dark bg-forest px-5 py-4 text-white">
        <div class="flex items-center justify-between gap-3 text-[13px]">
          <span class="${t.live && !ev.endsInDays ? 'rounded-md bg-lime px-2 py-0.5 font-bold text-forest' : 'opacity-85'}">${t.live && !ev.endsInDays ? '● مباشر' : t.label}</span>
          <span class="opacity-75">${esc(whenFmt.format(new Date(t.target)))}</span>
        </div>
        <div id="ev-countdown" class="mt-2.5 grid grid-cols-4 gap-2" role="timer" aria-live="off">${cells(t.target - Date.now())}</div>
      </div>
      <div class="flex flex-col gap-4 p-5">
        <dl class="m-0 flex flex-col gap-2.5 text-[13px] text-ink-body">
          <div class="flex justify-between gap-3"><dt>نوع المزاد</dt><dd class="m-0 font-semibold text-ink">${esc(ev.type)}</dd></div>
          <div class="flex justify-between gap-3"><dt>عدد ${ev.unit === 'سيارة' ? 'السيارات' : 'القطع'}</dt><dd class="m-0 font-semibold text-ink tabular">${formatNumber(ev.count)}</dd></div>
          <div class="flex justify-between gap-3"><dt>تأمين المشاركة (يُسترد)</dt><dd class="m-0 font-semibold text-ink tabular">${formatPrice(ev.deposit)}</dd></div>
        </dl>
        ${action}
        <a href="help.html#how-to-bid" class="self-center text-sm font-semibold">كيف أزايد؟</a>
      </div>
    </div>`;
}

function render() {
  const lots = ev.lots.map((lid) => data.lots.find((l) => l.id === lid)).filter(Boolean);
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.mapQuery)}`;
  document.title = `${ev.title} · مزاد`;
  $('#main').innerHTML = `
    <div class="flex flex-col gap-5">
      <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted">
        <ol class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
          <li><a href="index.html" class="text-ink-body hover:text-primary">الرئيسية</a></li><li aria-hidden="true">‹</li>
          <li><a href="auctions.html" class="text-ink-body hover:text-primary">المزادات القادمة</a></li><li aria-hidden="true">‹</li>
          <li aria-current="page" class="text-ink">${esc(ev.title)}</li>
        </ol>
      </nav>
      <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div class="relative flex min-h-[280px] overflow-hidden rounded-[22px] bg-mist text-white sm:min-h-[400px] sm:rounded-hero">
          ${Media({ src: ev.img, eager: true, className: 'absolute inset-0' })}
          <div class="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-[rgba(10,12,15,.72)] to-transparent p-6 pt-24 sm:p-8 sm:pt-32">
            <h1 class="m-0 text-2xl font-bold leading-[1.35] sm:text-[30px]">${esc(ev.title)}</h1>
            <p class="m-0 text-[15px] opacity-90">${formatNumber(ev.count)} ${esc(ev.unit)} · ${esc(ev.city)} · ${esc(ev.type)}</p>
          </div>
        </div>
        <aside id="register-card" aria-label="المشاركة في المزاد" class="lg:sticky lg:top-[136px]">${registerCard()}</aside>
      </div>
    </div>

    <section aria-label="تفاصيل المزاد" class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="card flex gap-3 p-5">${icon('eye')}<div class="flex flex-col gap-1"><h2 class="m-0 text-[15px] font-semibold">المعاينة</h2><p class="m-0 text-sm text-ink-body">${esc(ev.viewing)}</p></div></div>
      <div class="card flex gap-3 p-5">${icon('pin')}<div class="flex flex-col gap-1"><h2 class="m-0 text-[15px] font-semibold">الموقع</h2><p class="m-0 text-sm text-ink-body">${esc(ev.place)}</p><a href="${mapUrl}" target="_blank" rel="noopener" class="text-sm font-semibold">فتح في الخرائط</a></div></div>
      <div class="card flex gap-3 p-5">${icon('shield')}<div class="flex flex-col gap-1"><h2 class="m-0 text-[15px] font-semibold">شروط المشاركة</h2>
        <ul class="m-0 flex list-none flex-col gap-1 p-0 text-sm text-ink-body"><li>هوية موثّقة بنفاذ</li><li>تأمين ${formatPrice(ev.deposit)} يُسترد إن لم تفز</li><li>الدفع خلال 48 ساعة من الفوز</li></ul></div></div>
    </section>

    <section aria-labelledby="lots-title" class="flex flex-col gap-4">
      <div class="section-head">
        <h2 id="lots-title" class="section-title">أبرز ${ev.unit === 'سيارة' ? 'السيارات' : 'القطع'}</h2>
        <a href="${catHref(ev.cat)}" class="text-sm font-semibold">عرض الكل (${formatNumber(ev.count)})</a>
      </div>
      <div id="ev-lots" class="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        ${lots.map((l) => LotCard(l, { remaining: l.endsIn - elapsed, watched: state.watch.has(l.id) })).join('')}
      </div>
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
  if (t.closest('#register')) {
    saveEventReg(id, { remind: true, at: Date.now() });
    $('#register-card').innerHTML = registerCard();
    toast('تم تسجيلك في المزاد');
    $('#remind')?.focus();
    return;
  }
  const watch = t.closest('#ev-lots [data-watch]');
  if (watch) {
    const lid = Number(watch.dataset.watch);
    state.watch.has(lid) ? state.watch.delete(lid) : state.watch.add(lid);
    saveWatch(state.watch);
    render();
    document.querySelector(`#ev-lots [data-watch="${lid}"]`)?.focus();
  }
});

document.addEventListener('change', (event) => {
  if (event.target.id !== 'remind') return;
  saveEventReg(id, { ...loadEventRegs()[id], remind: event.target.checked });
  toast(event.target.checked ? 'سنذكّرك قبل البدء بساعة' : 'أوقفنا التذكير');
});

/* ---------- start ---------- */

$('#cat-nav').innerHTML = catNavHTML(data.categories, ev.cat);
render();
setInterval(() => {
  const el = $('#ev-countdown');
  if (el) el.innerHTML = cells(timing().target - Date.now());
  const byId = new Map(data.lots.map((l) => [String(l.id), l]));
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  document.querySelectorAll('#ev-lots [data-timer]').forEach((node) => {
    const left = byId.get(node.dataset.timer).endsIn - elapsed;
    node.lastElementChild.textContent = formatCountdown(left);
    node.classList.toggle('text-timer', left < 3600);
    node.classList.toggle('text-white', left >= 3600);
  });
}, 1000);
