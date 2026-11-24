import * as data from './data.js';
import { Media, esc, formatCountdown, formatNumber } from './components.js';
import { catHref, catNavHTML, loadEventRegs, renderShell } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const loadedAt = Date.now();
const TYPES = [['all', 'الكل'], ['yard', 'حضوري'], ['online', 'إلكتروني']];
const state = { type: 'all' };

const dayFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long' });
const weekdayFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'short' });
const monthFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { month: 'short' });
const timeFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { hour: 'numeric', minute: '2-digit' });

const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

function events() {
  const now = new Date();
  return Object.entries(data.events)
    .map(([id, ev]) => ({ id, ev, t: data.eventTiming(ev, now, loadedAt) }))
    .filter(({ ev }) => state.type === 'all' || (state.type === 'yard' ? ev.type.includes('حضوري') : ev.type.includes('إلكتروني')))
    .sort((a, b) => (a.t.live === b.t.live ? a.t.start - b.t.start : a.t.live ? -1 : 1));
}

/** Group label for an event: running now, today, tomorrow, or its date. */
function groupOf({ t }) {
  if (t.live) return 'مباشر الآن';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(t.start).setHours(0, 0, 0, 0) - today) / 86400000);
  if (days === 0) return 'اليوم';
  if (days === 1) return 'غداً';
  return dayFmt.format(new Date(t.start));
}

function status({ ev, t }) {
  const left = Math.max(0, Math.floor((t.target - Date.now()) / 1000));
  if (t.live && !ev.endsInDays) return '<span class="rounded-md bg-navy px-2 py-0.5 text-[11px] font-bold text-gold">● مباشر</span>';
  return `<span class="text-[13px] text-ink-body">${t.label} <b class="font-semibold tabular ${left < 3600 ? 'text-accent-strong' : 'text-ink'}" data-left="${t.target}">${formatCountdown(left)}</b></span>`;
}

function card(item, regs) {
  const { id, ev, t } = item;
  const d = new Date(t.start);
  const registered = Boolean(regs[id]);
  const dateBlock = ev.endsInDays
    ? '<span class="text-base font-bold text-primary">الآن</span><span class="text-[11px] text-ink-body">إلكتروني</span>'
    : `<span class="text-[11px] text-ink-body">${weekdayFmt.format(d)}</span><b class="text-2xl font-bold leading-none text-primary tabular">${d.getDate()}</b><span class="text-[11px] text-ink-body">${monthFmt.format(d)}</span><span class="text-[11px] font-semibold text-ink tabular">${timeFmt.format(d)}</span>`;
  return `
    <article class="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:p-4">
      <div class="flex items-center gap-3 sm:contents">
        <div class="flex w-20 shrink-0 flex-col items-center gap-1 rounded-[14px] bg-primary-soft px-2 py-3 text-center sm:order-none">${dateBlock}</div>
        <a href="event.html?e=${id}" tabindex="-1" aria-hidden="true" class="block w-full sm:w-44 sm:shrink-0">${Media({ src: ev.img, className: 'aspect-[16/9] rounded-[12px] sm:aspect-[4/3]' })}</a>
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <a href="event.html?e=${id}" class="text-base font-semibold text-ink hover:text-primary">${esc(ev.title)}</a>
          ${registered ? `<span class="flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">${check}مسجّل</span>` : ''}
        </div>
        <p class="m-0 text-[13px] text-ink-muted"><span class="tabular">${formatNumber(ev.count)}</span> ${esc(ev.unit)} · ${esc(ev.city)} · ${esc(ev.type)}</p>
        ${status(item)}
      </div>
      <a href="event.html?e=${id}" class="btn-outline shrink-0 self-start px-5 py-2.5 text-sm sm:self-center">التفاصيل</a>
    </article>`;
}

function render() {
  $('#type-filter').innerHTML = TYPES.map(([id, label]) => `<button type="button" data-type="${id}" aria-pressed="${id === state.type}" class="shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${id === state.type ? 'border-primary bg-primary text-white' : 'border-[#E5E7EB] bg-white text-ink hover:border-ink/40'}">${label}</button>`).join('');
  const list = events();
  if (!list.length) {
    $('#schedule').innerHTML = '<p class="m-0 rounded-card border border-dashed border-line bg-white p-8 text-center text-sm text-ink-body">لا توجد مزادات قادمة من هذا النوع.</p>';
    return;
  }
  const regs = loadEventRegs();
  const groups = new Map();
  list.forEach((item) => {
    const g = groupOf(item);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(item);
  });
  $('#schedule').innerHTML = [...groups].map(([label, items], i) => `
    <section aria-labelledby="g${i}" class="flex flex-col gap-3">
      <h2 id="g${i}" class="m-0 text-lg font-bold">${esc(label)}</h2>
      <div class="flex flex-col gap-3">${items.map((it) => card(it, regs)).join('')}</div>
    </section>`).join('');
}

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) { location.href = catHref(cat.dataset.cat); return; }
  const type = t.closest('[data-type]');
  if (type) { state.type = type.dataset.type; render(); $(`[data-type="${state.type}"]`)?.focus(); }
});

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
render();
setInterval(() => {
  document.querySelectorAll('[data-left]').forEach((el) => {
    const left = Math.max(0, Math.floor((Number(el.dataset.left) - Date.now()) / 1000));
    el.textContent = formatCountdown(left);
  });
}, 1000);
