import * as data from './data.js';
import { esc } from './components.js';
import {
  buildNotifications, catHref, catNavHTML, getUser, loadReadNotifications, loginHref, markNotificationsRead, renderShell,
} from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const FILTERS = [['all', 'الكل'], ['bids', 'المزايدات'], ['buying', 'المشتريات'], ['selling', 'المبيعات'], ['following', 'المتابعة']];
const state = { filter: 'all' };

const ICONS = {
  warn: '<path d="M12 7v6M12 17h.01"/>',
  good: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  info: '<path d="M6 10a6 6 0 0 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6Z"/><path d="M10 19.5a2 2 0 0 0 4 0"/>',
};
const TONES = { warn: 'bg-accent-soft text-accent-ink', good: 'bg-primary-soft text-primary', info: 'bg-mist text-ink-body' };

const timeFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { hour: 'numeric', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long' });

function ago(at) {
  const m = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (m < 1) return 'الآن';
  if (m < 60) return m === 1 ? 'قبل دقيقة' : m === 2 ? 'قبل دقيقتين' : m <= 10 ? `قبل ${m} دقائق` : `قبل ${m} دقيقة`;
  return timeFmt.format(new Date(at));
}

function dayLabel(at) {
  const day = new Date(at); day.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 86400000);
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'أمس';
  return dateFmt.format(new Date(at));
}

function item(n, read) {
  return `
    <li>
      <a href="${n.href}" data-notif="${esc(n.id)}" class="flex items-start gap-3 border-b border-line-soft px-4 py-4 text-ink last:border-0 hover:bg-sand hover:text-ink sm:px-5 ${read ? '' : 'bg-primary-soft/40'}">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full ${TONES[n.tone]}"><svg aria-hidden="true" viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n.tone]}</svg></span>
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="text-[15px] ${read ? 'font-medium' : 'font-bold'}">${esc(n.title)}</span>
          <span class="truncate text-[13px] text-ink-body">${esc(n.text)}</span>
        </span>
        <span class="flex shrink-0 flex-col items-end gap-1.5">
          <span class="text-xs text-ink-muted">${ago(n.at)}</span>
          ${read ? '' : '<span class="h-2.5 w-2.5 rounded-full bg-accent-strong" aria-label="غير مقروء"></span>'}
        </span>
      </a>
    </li>`;
}

function render() {
  if (!getUser()) {
    $('#notifications').innerHTML = `
      <div class="card flex flex-col items-center gap-4 px-6 py-12 text-center">
        <h1 class="m-0 text-2xl font-bold">سجّل دخولك لعرض إشعاراتك</h1>
        <a href="${loginHref()}" class="btn-primary px-7 py-3 text-sm">تسجيل الدخول</a>
      </div>`;
    return;
  }
  const read = loadReadNotifications();
  const all = buildNotifications();
  const list = all.filter((n) => state.filter === 'all' || n.kind === state.filter);
  const unread = all.filter((n) => !read.has(n.id)).length;
  const groups = new Map();
  list.forEach((n) => {
    const g = dayLabel(n.at);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(n);
  });
  $('#notifications').innerHTML = `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex flex-col gap-1">
        <h1 class="m-0 text-2xl font-bold sm:text-[28px]">الإشعارات</h1>
        <p class="m-0 text-[15px] text-ink-body">${unread ? `<span class="tabular">${unread}</span> غير مقروءة` : 'لا توجد إشعارات غير مقروءة'}</p>
      </div>
      <div class="flex items-center gap-4 text-sm">
        ${unread ? '<button type="button" id="read-all" class="font-semibold text-primary hover:text-primary-dark">تعليم الكل كمقروء</button>' : ''}
        <a href="account.html#settings" class="font-semibold">الإعدادات</a>
      </div>
    </header>
    <div class="scroll-row -m-0.5 gap-2 p-0.5" role="group" aria-label="نوع الإشعار">
      ${FILTERS.map(([id, label]) => `<button type="button" data-filter="${id}" aria-pressed="${id === state.filter}" class="shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${id === state.filter ? 'border-primary bg-primary text-white' : 'border-[#E5E7EB] bg-white text-ink hover:border-ink/40'}">${label}</button>`).join('')}
    </div>
    ${list.length ? [...groups].map(([label, items]) => `
      <section class="flex flex-col gap-2" aria-label="${esc(label)}">
        <h2 class="m-0 text-sm font-bold text-ink-muted">${esc(label)}</h2>
        <ul class="card m-0 list-none overflow-hidden p-0">${items.map((n) => item(n, read.has(n.id))).join('')}</ul>
      </section>`).join('')
      : '<p class="m-0 rounded-card border border-dashed border-line bg-white p-8 text-center text-sm text-ink-body">لا توجد إشعارات من هذا النوع.</p>'}`;
}

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) { location.href = catHref(cat.dataset.cat); return; }
  const filter = t.closest('[data-filter]');
  if (filter) { state.filter = filter.dataset.filter; render(); $(`[data-filter="${state.filter}"]`)?.focus(); return; }
  if (t.closest('#read-all')) { markNotificationsRead(buildNotifications().map((n) => n.id)); render(); return; }
  const link = t.closest('[data-notif]');
  if (link) markNotificationsRead([link.dataset.notif]);
});

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
render();
