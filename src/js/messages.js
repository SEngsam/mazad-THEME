import * as data from './data.js';
import { Media, esc, formatPrice } from './components.js';
import {
  catHref, catNavHTML, getUser, loadMsgRead, loadSent, loadStartedConvs, loginHref, markConvRead, renderShell, saveSent, saveStartedConv,
} from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const loadedAt = Date.now();
const MIN = 60000;
const params = new URLSearchParams(location.search);

const QUICK = ['هل المعاينة متاحة؟', 'هل يوجد ضمان؟', 'متى يمكن الاستلام؟', 'هل التوصيل متاح؟'];
const RISKY = /(05\d[\d\s]{7,})|(\+?966[\d\s]{8,})|(SA\d{2}[\d\s]{10,})|واتس|whats/i;

/* ---------- conversations ---------- */

const lotById = (id) => data.lots.find((l) => l.id === id);

/** A conversation with a seller about a lot, or with Mazadi support. */
function build({ id, sid, lot, support, msgs = [], read }) {
  const sent = (loadSent()[id] ?? []).map((m) => ({ from: 'me', at: m.at, text: m.text }));
  const all = [...msgs.map((m) => ({ from: m.from, at: loadedAt - m.ago * MIN, text: m.text })), ...sent].sort((a, b) => a.at - b.at);
  const readCount = loadMsgRead()[id] ?? read ?? all.length;
  return {
    id, sid, support,
    lot: lot != null ? lotById(lot) : null,
    name: support ? 'دعم مزادي' : data.sellers[sid].name,
    msgs: all,
    unread: all.filter((m, i) => m.from === 'them' && i >= readCount).length,
    last: all.at(-1)?.at ?? loadedAt,
  };
}

function conversations() {
  const seeded = data.conversations.map(build);
  const ids = new Set(seeded.map((c) => c.id));
  const started = loadStartedConvs().filter((c) => !ids.has(c.id) && data.sellers[c.sid]).map(build);
  const list = [...seeded, ...started];
  const draft = draftFromUrl(new Set(list.map((c) => c.id)));
  return [...(draft ? [draft] : []), ...list.sort((a, b) => b.last - a.last)];
}

/** messages.html?s=<seller>&lot=<id> opens (or starts) the conversation about that lot. */
function draftFromUrl(existing) {
  const sid = params.get('s');
  if (!data.sellers[sid]) return null;
  const lot = lotById(Number(params.get('lot')));
  const id = lot ? `${sid}-${lot.id}` : sid;
  if (existing.has(id)) return null;
  return build({ id, sid, lot: lot?.id });
}

function urlConvId() {
  const sid = params.get('s');
  if (!data.sellers[sid]) return null;
  const lot = lotById(Number(params.get('lot')));
  return lot ? `${sid}-${lot.id}` : sid;
}

const state = {
  open: location.hash.startsWith('#c=') ? decodeURIComponent(location.hash.slice(3)) : urlConvId(),
  query: '',
  draft: '',
};

/* ---------- formatting ---------- */

const timeFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDayFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'short' });

function dayKey(at) {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function dayLabel(at) {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  if (dayKey(at) === dayKey(today)) return 'اليوم';
  if (dayKey(at) === dayKey(yesterday)) return 'أمس';
  return dayFmt.format(new Date(at));
}
function listTime(at) {
  if (dayKey(at) === dayKey(Date.now())) return timeFmt.format(new Date(at));
  if (dayKey(at) === dayKey(Date.now() - 86400000)) return 'أمس';
  return shortDayFmt.format(new Date(at));
}

/* ---------- icons ---------- */

const shield = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4" stroke-linecap="round"/></svg>';
const back = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
const send = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5 -scale-x-100" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
const searchIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[18px] w-[18px] shrink-0 text-ink-muted" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>';
const lock = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>';
const mark = '<img src="public/assets/mazad-mark.png" alt="" class="h-6 w-6 object-contain">';

function avatar(c, size = 'h-11 w-11 text-base') {
  return c.support
    ? `<span class="grid ${size} shrink-0 place-items-center rounded-full bg-navy">${mark}</span>`
    : `<span class="grid ${size} shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-primary">${esc(c.name.trim()[0])}</span>`;
}

/* ---------- list ---------- */

function listItem(c, active) {
  const last = c.msgs.at(-1);
  const preview = last ? `${last.from === 'me' ? 'أنت: ' : ''}${last.text}` : 'ابدأ المحادثة';
  return `
    <li>
      <a href="#c=${encodeURIComponent(c.id)}" data-conv="${esc(c.id)}" ${active ? 'aria-current="true"' : ''}
        class="flex items-start gap-3 rounded-2xl px-3 py-3 text-ink transition-colors hover:bg-sand hover:text-ink ${active ? 'bg-primary-soft hover:bg-primary-soft' : ''}">
        ${avatar(c)}
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="flex items-baseline justify-between gap-2">
            <b class="truncate text-sm ${c.unread ? 'font-bold' : 'font-semibold'}">${esc(c.name)}</b>
            <span class="shrink-0 text-[11px] ${c.unread ? 'font-semibold text-primary' : 'text-ink-muted'}">${last ? listTime(c.last) : ''}</span>
          </span>
          ${c.lot ? `<span class="truncate text-xs text-ink-muted">${esc(c.lot.name)}</span>` : '<span class="text-xs text-ink-muted">المزايدة والدفع والاستلام</span>'}
          <span class="flex items-center justify-between gap-2">
            <span class="truncate text-[13px] ${c.unread ? 'font-semibold text-ink' : 'text-ink-body'}">${esc(preview)}</span>
            ${c.unread ? `<span class="min-w-[20px] shrink-0 rounded-full bg-primary px-1.5 text-center text-[11px] font-bold leading-5 text-white tabular" aria-label="${c.unread} غير مقروءة">${c.unread}</span>` : ''}
          </span>
        </span>
      </a>
    </li>`;
}

function listPane(list, open) {
  const q = state.query.trim();
  const shown = q ? list.filter((c) => `${c.name} ${c.lot?.name ?? ''}`.includes(q)) : list;
  return `
    <section aria-labelledby="inbox-title" class="${open ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-line lg:border-e">
      <div class="flex flex-col gap-3 border-b border-line-soft p-4">
        <h1 id="inbox-title" class="m-0 text-xl font-bold">الرسائل</h1>
        <label class="flex items-center gap-2 rounded-full bg-mist px-4 focus-within:ring-2 focus-within:ring-primary">
          ${searchIcon}<span class="sr-only">ابحث في المحادثات</span>
          <input id="conv-search" type="search" autocomplete="off" value="${esc(state.query)}" placeholder="ابحث باسم البائع أو المزاد"
            class="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
        </label>
      </div>
      <ul id="conv-list" class="m-0 flex min-h-0 flex-1 list-none flex-col gap-0.5 overflow-y-auto p-2">
        ${shown.length ? shown.map((c) => listItem(c, c.id === open)).join('') : `<li class="px-4 py-10 text-center text-sm text-ink-muted">لا توجد محادثة تطابق «${esc(q)}»</li>`}
      </ul>
    </section>`;
}

/* ---------- thread ---------- */

function bubbles(c) {
  if (!c.msgs.length) {
    return `
      <div class="m-auto flex max-w-sm flex-col items-center gap-2 px-4 py-10 text-center">
        <p class="m-0 text-base font-semibold text-ink">اسأل البائع عن ${c.lot ? esc(c.lot.name) : 'منتجاته'}</p>
        <p class="m-0 text-sm text-ink-body">يرد البائع عادة ${esc(data.sellers[c.sid].reply)}.</p>
      </div>`;
  }
  let prevDay = '';
  return c.msgs.map((m) => {
    const key = dayKey(m.at);
    const sep = key !== prevDay ? `<li class="my-2 self-center rounded-full bg-mist px-3 py-1 text-[11px] font-semibold text-ink-muted">${dayLabel(m.at)}</li>` : '';
    prevDay = key;
    const mine = m.from === 'me';
    return `${sep}
      <li class="flex max-w-[85%] flex-col gap-1 sm:max-w-[70%] ${mine ? 'items-end self-end' : 'items-start self-start'}">
        <p class="m-0 whitespace-pre-line break-words rounded-[18px] px-4 py-2.5 text-sm leading-relaxed ${mine ? 'rounded-ee-md bg-primary text-white' : 'rounded-es-md bg-mist text-ink'}">${esc(m.text)}</p>
        <span class="px-1 text-[11px] text-ink-muted">${timeFmt.format(new Date(m.at))}</span>
      </li>`;
  }).join('');
}

function lotStrip(lot) {
  if (!lot) return '';
  return `
    <a href="lot.html?id=${lot.id}" class="flex items-center gap-3 border-b border-line-soft bg-sand/60 px-4 py-2.5 text-ink hover:bg-sand hover:text-ink">
      <span class="block w-14 shrink-0">${Media({ src: lot.img, className: 'aspect-[4/3] rounded-lg' })}</span>
      <span class="flex min-w-0 flex-1 flex-col">
        <b class="truncate text-[13px] font-semibold">${esc(lot.name)}</b>
        <span class="text-xs text-ink-muted">أعلى مزايدة <b class="font-semibold text-ink tabular">${formatPrice(lot.bid)}</b></span>
      </span>
      <span class="shrink-0 text-[13px] font-semibold text-primary">عرض المزاد</span>
    </a>`;
}

function threadPane(c) {
  if (!c) {
    return `
      <section class="hidden min-h-0 flex-col items-center justify-center gap-2 p-8 text-center lg:flex">
        <p class="m-0 text-base font-semibold text-ink">اختر محادثة</p>
        <p class="m-0 text-sm text-ink-body">راسل البائع من صفحة أي مزاد.</p>
      </section>`;
  }
  const seller = c.support ? null : data.sellers[c.sid];
  return `
    <section aria-labelledby="thread-title" class="flex min-h-0 flex-col">
      <header class="flex items-center gap-3 border-b border-line-soft px-3 py-3 sm:px-4">
        <a href="#" data-back class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink hover:bg-sand hover:text-ink lg:hidden" aria-label="رجوع إلى المحادثات">${back}</a>
        ${avatar(c, 'h-10 w-10 text-sm')}
        <div class="flex min-w-0 flex-1 flex-col">
          <h2 id="thread-title" class="m-0 truncate text-[15px] font-bold">${esc(c.name)}</h2>
          <span class="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
            ${c.support ? '<span>متاح يومياً من 9 صباحاً إلى 11 مساءً</span>'
              : `<span class="flex items-center gap-1 font-semibold text-primary">${shield}موثّق بنفاذ</span><span>يرد ${esc(seller.reply)}</span>`}
          </span>
        </div>
        ${c.support ? '<a href="help.html" class="btn-outline shrink-0 px-4 py-2 text-[13px]">مركز المساعدة</a>'
          : `<a href="seller.html?s=${c.sid}" class="btn-outline shrink-0 px-4 py-2 text-[13px] max-sm:hidden">صفحة البائع</a>`}
      </header>
      ${lotStrip(c.lot)}
      <ol id="thread" aria-live="polite" class="m-0 flex min-h-0 flex-1 list-none flex-col gap-2 overflow-y-auto px-3 py-4 sm:px-5">${bubbles(c)}</ol>
      <div class="flex flex-col gap-2.5 border-t border-line-soft p-3 sm:p-4">
        ${c.support ? '' : `<div class="scroll-row -m-0.5 gap-2 p-0.5" role="group" aria-label="أسئلة سريعة">${QUICK.map((q) => `<button type="button" data-quick="${esc(q)}" class="shrink-0 whitespace-nowrap rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink hover:border-ink/40">${q}</button>`).join('')}</div>`}
        <p id="risk-note" class="m-0 hidden items-start gap-2 rounded-xl bg-accent-soft px-3.5 py-2.5 text-[13px] font-medium text-accent-ink">${lock}<span>لحمايتك، لا تشارك رقم جوالك أو حسابك البنكي، وادفع عبر مزادي فقط.</span></p>
        <form id="composer" class="flex items-end gap-2">
          <label for="msg" class="sr-only">اكتب رسالتك</label>
          <textarea id="msg" rows="1" maxlength="1000" placeholder="اكتب رسالتك"
            class="max-h-32 min-h-[46px] min-w-0 flex-1 resize-none rounded-[23px] border-0 bg-mist px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0">${esc(state.draft)}</textarea>
          <button type="submit" class="btn-primary h-[46px] w-[46px] shrink-0 p-0 disabled:opacity-50" aria-label="إرسال" ${state.draft.trim() ? '' : 'disabled'}>${send}</button>
        </form>
        <p class="m-0 flex items-center gap-1.5 text-[11px] text-ink-muted">${lock}لا نشارك رقمك مع البائع. المحادثة محفوظة لدى مزادي لحل أي خلاف.</p>
      </div>
    </section>`;
}

/* ---------- render ---------- */

function gateView() {
  return `
    <div class="card flex flex-col items-center gap-5 px-6 py-12 text-center sm:px-10">
      <div class="flex flex-col gap-2">
        <h1 class="m-0 text-2xl font-bold">سجّل دخولك لترى رسائلك</h1>
        <p class="m-0 max-w-md text-[15px] leading-relaxed text-ink-body">محادثاتك مع البائعين وفريق الدعم في مكان واحد.</p>
      </div>
      <a href="${loginHref()}" class="btn-primary px-8 py-3.5 text-[15px]">تسجيل الدخول</a>
    </div>`;
}

function render({ keepFocus } = {}) {
  if (!getUser()) { $('#inbox').innerHTML = gateView(); return; }
  const list = conversations();
  const wide = window.matchMedia('(min-width: 1024px)').matches;
  if (!list.some((c) => c.id === state.open)) state.open = wide ? list[0]?.id ?? null : null;
  const c = list.find((x) => x.id === state.open) ?? null;
  if (c?.unread) {
    markConvRead(c.id, c.msgs.length);
    c.unread = 0;
  }
  $('#inbox').innerHTML = `
    <div class="card grid h-[calc(100dvh-240px)] min-h-[520px] grid-cols-1 overflow-hidden lg:h-[calc(100dvh-220px)] lg:max-h-[780px] lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
      ${listPane(list, c ? c.id : null)}
      <div class="${c ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col">${threadPane(c)}</div>
    </div>`;
  const thread = $('#thread');
  if (thread) thread.scrollTop = thread.scrollHeight;
  if (keepFocus) $(keepFocus)?.focus();
  updateRisk();
}

function updateRisk() {
  const note = $('#risk-note');
  if (!note) return;
  const show = RISKY.test(state.draft);
  note.classList.toggle('hidden', !show);
  note.classList.toggle('flex', show);
}

function open(id) {
  state.open = id;
  state.draft = '';
  history.replaceState(null, '', id ? `${location.pathname}${location.search}#c=${encodeURIComponent(id)}` : `${location.pathname}${location.search}`);
  render();
  if (id) $('#msg')?.focus({ preventScroll: true });
  else $(`#conv-list a`)?.focus();
}

function sendMessage(text) {
  const body = text.trim();
  if (!body || !state.open) return;
  const c = conversations().find((x) => x.id === state.open);
  if (!c) return;
  if (!c.support && !data.conversations.some((x) => x.id === c.id)) saveStartedConv({ id: c.id, sid: c.sid, lot: c.lot?.id ?? null });
  saveSent(c.id, { text: body.slice(0, 1000), at: Date.now() });
  state.draft = '';
  render({ keepFocus: '#msg' });
}

/* ---------- events ---------- */

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) { location.href = catHref(cat.dataset.cat); return; }
  const conv = t.closest('[data-conv]');
  if (conv) { event.preventDefault(); open(conv.dataset.conv); return; }
  if (t.closest('[data-back]')) { event.preventDefault(); open(null); return; }
  const quick = t.closest('[data-quick]');
  if (quick) sendMessage(quick.dataset.quick);
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'composer') return;
  event.preventDefault();
  sendMessage(state.draft);
});

document.addEventListener('keydown', (event) => {
  if (event.target.id === 'msg' && event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    sendMessage(state.draft);
  }
});

document.addEventListener('input', (event) => {
  const t = event.target;
  if (t.id === 'msg') {
    state.draft = t.value;
    t.style.height = 'auto';
    t.style.height = `${t.scrollHeight}px`;
    t.form.querySelector('[type="submit"]').disabled = !state.draft.trim();
    updateRisk();
  }
  if (t.id === 'conv-search') {
    state.query = t.value;
    const pos = t.selectionStart;
    render();
    const input = $('#conv-search');
    input.focus();
    input.setSelectionRange(pos, pos);
  }
});

window.addEventListener('hashchange', () => {
  const id = location.hash.startsWith('#c=') ? decodeURIComponent(location.hash.slice(3)) : null;
  if (id !== state.open) { state.open = id; render(); }
});

/* ---------- start ---------- */

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
render();
