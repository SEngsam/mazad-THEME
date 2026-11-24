/**
 * Order tracking for a won lot: steps from payment to handover, then the buyer confirms receipt (releasing the money
 * to the seller) or reports a problem (holding it).
 */
import * as data from './data.js';
import { Media, esc, formatNumber, formatPrice } from './components.js';
import { catHref, catNavHTML, getUser, loadOrderActions, loadOrders, loginHref, renderShell, saveOrderAction } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const won = data.wonLots.find((w) => String(w.id) === params.get('id'));
if (!won) location.replace('404.html');
const lot = data.lots.find((l) => l.id === won?.id);

const HOUR = 3600000;
const BUYER_FEE = 0.025;
const SHIPPING = 75;
const CONFIRM_DAYS = 3;
const METHODS = { card: 'بطاقة', applepay: 'Apple Pay' };
const REASONS = ['المنتج لا يطابق الوصف', 'المنتج تالف أو ناقص', 'لم أستلم المنتج', 'سبب آخر'];
const dayFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const shield = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4" stroke-linecap="round"/></svg>';

const state = { reporting: false, error: '' };

/* ---------- order model ---------- */

function order() {
  return won ? data.orderOf(won, loadOrders()) : null;
}

/**
 * Steps for this order and how far it has got. Prototype timing: an order paid on this visit waits on the seller;
 * the paid example has been handed over and awaits confirmation; the delivered example is complete.
 */
function steps(o) {
  const action = loadOrderActions()[won.id] ?? {};
  const car = lot.cat === 1;
  const ship = o.delivery === 'ship';
  const at = (h) => o.at + h * HOUR;
  const handedOver = Boolean(won.deliveredOn) || Date.now() - o.at > 48 * HOUR;
  const list = [{ key: 'paid', title: 'تم الدفع', done: `دفعت ${formatPrice(o.total)} عبر ${METHODS[o.method] ?? ''}.`, when: o.at }];
  if (ship) {
    list.push(
      { key: 'check', title: 'استلام المنتج من البائع وفحصه', todo: 'نستلمه من البائع خلال يومي عمل ونفحص مطابقته للوصف.', done: 'فحصنا المنتج، وهو مطابق للوصف.', when: at(30) },
      { key: 'transit', title: 'في الطريق إليك', todo: `يصل إلى ${o.city} خلال 2 إلى 4 أيام عمل.`, done: 'سُلّم إلى شركة الشحن · رقم الشحنة <span dir="ltr" class="tabular">SMSA 2918 4471</span>', when: at(54) },
      { key: 'handover', title: 'تم التسليم', todo: 'نتصل بك قبل الوصول.', done: won.deliveredOn ? `استلمته في ${esc(won.deliveredOn)}.` : `سُلّم في ${esc(o.city)}.`, when: at(96) },
    );
  } else {
    const slot = new Date(at(20)).setHours(10, 0, 0, 0);
    list.push({ key: 'appointment', title: 'موعد الاستلام', todo: 'نرسل إليك الموعد خلال 24 ساعة.', done: `${esc(timeFmt.format(new Date(slot)))} · موقع البائع في ${esc(lot.city)}.`, when: at(3) });
    if (car) list.push({ key: 'transfer', title: 'نقل الملكية عبر أبشر', todo: 'بحضور مندوب مزادي عند الاستلام.', done: 'نُقلت ملكية السيارة إلى اسمك.', when: at(21) });
    list.push({ key: 'handover', title: 'الاستلام', todo: car ? 'تفحص السيارة وتستلمها مع المفتاحين والاستمارة.' : 'تستلم المنتج من البائع بحضور مندوب مزادي.', done: car ? 'استلمت السيارة بحضور مندوب مزادي.' : 'استلمت المنتج.', when: at(21.5) });
  }
  list.push({
    key: 'confirm', title: 'تأكيد الاستلام',
    todo: 'يبقى المبلغ لدينا حتى تؤكد الاستلام.',
    current: `أكّد الاستلام ليُحوَّل المبلغ إلى البائع. يُؤكَّد تلقائياً بعد ${CONFIRM_DAYS} أيام إن لم تُبلغ عن مشكلة.`,
    done: 'أكّدت الاستلام، وحوّلنا المبلغ إلى البائع.',
    when: action.confirmed ?? at(won.deliveredOn ? 100 : 26),
  });

  let reached = handedOver ? list.length - 1 : 1;
  if (won.deliveredOn || action.confirmed) reached = list.length;
  return { list, reached, report: action.report, confirmDue: handedOver && !won.deliveredOn ? at(21.5) + CONFIRM_DAYS * 24 * HOUR : 0 };
}

/* ---------- parts ---------- */

function breadcrumb(o) {
  return `
    <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted">
      <ol class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li><a href="index.html" class="text-ink-body hover:text-primary">الرئيسية</a></li><li aria-hidden="true">‹</li>
        <li><a href="account.html#won" class="text-ink-body hover:text-primary">مشترياتي</a></li><li aria-hidden="true">‹</li>
        <li aria-current="page" class="text-ink">الطلب <span dir="ltr" class="tabular">${esc(o.ref)}</span></li>
      </ol>
    </nav>`;
}

function headerCard(o, s) {
  const done = s.reached >= s.list.length;
  const chip = s.report ? ['قيد المراجعة', 'bg-accent-soft text-accent-ink']
    : done ? ['مكتمل', 'bg-mist text-ink-body']
      : s.list[s.reached].key === 'confirm' ? ['بانتظار تأكيدك', 'bg-accent-soft text-accent-ink'] : ['قيد التنفيذ', 'bg-primary-soft text-primary'];
  return `
    <header class="card flex flex-wrap items-center gap-4 p-4 sm:p-5">
      <a href="lot.html?id=${lot.id}" tabindex="-1" aria-hidden="true" class="block w-24 shrink-0 sm:w-32">${Media({ src: lot.img, className: 'aspect-[4/3] rounded-[12px]' })}</a>
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="m-0 text-xl font-bold leading-snug sm:text-2xl">${esc(lot.name)}</h1>
          <span class="whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${chip[1]}">${chip[0]}</span>
        </div>
        <p class="m-0 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-muted">
          <span>رقم الطلب <b dir="ltr" class="font-semibold text-ink tabular">${esc(o.ref)}</b></span>
          <span>لوت <span class="tabular">${esc(data.lotNumber(lot))}</span></span>
          <span>${o.delivery === 'ship' ? `توصيل إلى ${esc(o.city)}` : `استلام من البائع في ${esc(lot.city)}`}</span>
        </p>
      </div>
    </header>`;
}

function timeline(s) {
  return `
    <section aria-labelledby="track-title" class="card p-5 sm:p-6">
      <h2 id="track-title" class="m-0 mb-5 text-lg font-bold">حالة الطلب</h2>
      <ol class="m-0 list-none p-0">
        ${s.list.map((step, i) => {
          const done = i < s.reached;
          const current = i === s.reached;
          const last = i === s.list.length - 1;
          const text = done ? step.done : current ? (step.current ?? step.todo) : step.todo;
          return `
            <li class="relative flex gap-3.5 ${last ? '' : 'pb-6'}" ${current ? 'aria-current="step"' : ''}>
              ${last ? '' : `<span aria-hidden="true" class="absolute start-[13px] top-8 bottom-1 w-0.5 rounded-full ${done ? 'bg-primary' : 'bg-line'}"></span>`}
              <span class="relative grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular ${done ? 'bg-primary text-white' : current ? 'bg-white text-primary ring-2 ring-primary' : 'bg-mist text-ink-muted'}">${done ? check : i + 1}</span>
              <span class="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                <span class="flex flex-wrap items-baseline justify-between gap-x-3">
                  <b class="text-[15px] font-semibold ${done || current ? 'text-ink' : 'text-ink-muted'}">${step.title}</b>
                  ${done ? `<span class="text-xs text-ink-muted">${esc(dayFmt.format(new Date(step.when)))}</span>` : current ? '<span class="text-xs font-semibold text-primary">الآن</span>' : ''}
                </span>
                <span class="text-[13px] leading-relaxed ${done || current ? 'text-ink-body' : 'text-ink-muted'}">${text}</span>
              </span>
            </li>`;
        }).join('')}
      </ol>
    </section>`;
}

function confirmCard(s) {
  if (s.report) {
    return `
      <section aria-labelledby="report-title" class="card flex flex-col gap-2 border-accent/40 bg-accent-soft/40 p-5 sm:p-6">
        <h2 id="report-title" class="m-0 text-base font-bold">استلمنا بلاغك</h2>
        <p class="m-0 text-sm leading-relaxed text-ink-body">رقم البلاغ <b dir="ltr" class="font-semibold text-ink tabular">${esc(s.report.ref)}</b> · ${esc(s.report.reason)}. أوقفنا تحويل المبلغ إلى البائع، ويتواصل معك فريقنا خلال 24 ساعة.</p>
      </section>`;
  }
  if (s.list[s.reached]?.key !== 'confirm') return '';
  if (state.reporting) {
    return `
      <form id="report-form" novalidate class="card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="report-title">
        <h2 id="report-title" class="m-0 text-base font-bold">الإبلاغ عن مشكلة</h2>
        <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
          <legend class="mb-2 text-sm font-semibold">سبب البلاغ</legend>
          ${REASONS.map((r) => `
            <label class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
              <input type="radio" name="reason" value="${esc(r)}" class="accent-primary">${esc(r)}
            </label>`).join('')}
        </fieldset>
        <div class="flex flex-col gap-2">
          <label for="report-text" class="text-sm font-semibold">التفاصيل <span class="font-normal text-ink-muted">(اختياري)</span></label>
          <textarea id="report-text" rows="3" maxlength="500" class="rounded-[14px] border-0 bg-mist px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0" placeholder="صف المشكلة باختصار"></textarea>
        </div>
        ${state.error ? `<p class="m-0 text-sm font-semibold text-accent-strong" role="alert">${esc(state.error)}</p>` : ''}
        <div class="flex flex-wrap gap-2">
          <button type="submit" class="btn-primary px-6 py-3 text-sm">إرسال البلاغ</button>
          <button type="button" data-cancel-report class="btn-outline px-6 py-3 text-sm">إلغاء</button>
        </div>
      </form>`;
  }
  return `
    <section aria-labelledby="confirm-title" class="card flex flex-col gap-4 p-5 sm:p-6">
      <div class="flex gap-3">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">${shield}</span>
        <div class="flex flex-col gap-1">
          <h2 id="confirm-title" class="m-0 text-base font-bold">هل استلمت ${lot.cat === 1 ? 'السيارة' : 'المنتج'} كما في الوصف؟</h2>
          <p class="m-0 text-sm leading-relaxed text-ink-body">المبلغ محفوظ لدينا حتى تؤكد. آخر موعد للإبلاغ عن مشكلة: <b class="font-semibold text-ink">${esc(dayFmt.format(new Date(s.confirmDue)))}</b>.</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" data-confirm class="btn-primary px-6 py-3 text-sm">نعم، أؤكد الاستلام</button>
        <button type="button" data-report class="btn-outline px-6 py-3 text-sm">الإبلاغ عن مشكلة</button>
      </div>
    </section>`;
}

function summaryCard(o) {
  const fee = Math.round(won.price * BUYER_FEE);
  const shipping = o.delivery === 'ship' ? SHIPPING : 0;
  const row = (label, value, tone = 'text-ink') => `<div class="flex justify-between gap-3"><dt>${label}</dt><dd class="m-0 font-semibold tabular ${tone}">${value}</dd></div>`;
  return `
    <section aria-labelledby="sum-title" class="card flex flex-col gap-4 p-5">
      <h2 id="sum-title" class="m-0 text-base font-bold">ملخص الدفع</h2>
      <dl class="m-0 flex flex-col gap-2.5 text-[13px] text-ink-body">
        ${row('سعر الفوز', formatPrice(won.price))}
        ${row('عمولة المشتري (2.5%)', formatPrice(fee))}
        ${o.delivery === 'ship' ? row('التوصيل المؤمَّن', formatPrice(shipping)) : ''}
        ${row('تأمين المزايدة المدفوع', `− ${formatPrice(won.deposit)}`, 'text-primary')}
      </dl>
      <div class="flex items-baseline justify-between gap-3 border-t border-line-soft pt-3">
        <span class="text-sm font-semibold">المدفوع</span>
        <b class="text-xl font-bold tabular">${formatPrice(o.total)}</b>
      </div>
      <p class="m-0 text-xs text-ink-muted">${METHODS[o.method] ?? ''}${o.last4 ? ` <span dir="ltr" class="tabular">•••• ${esc(o.last4)}</span>` : ''} · ${esc(dayFmt.format(new Date(o.at)))}</p>
    </section>`;
}

function sellerCard() {
  const sid = data.sellerIdOf(lot);
  const seller = data.sellers[sid];
  return `
    <section aria-label="البائع" class="card flex items-center gap-3 p-5">
      <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-base font-bold text-primary">${esc(seller.name.trim()[0])}</span>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="text-xs text-ink-muted">البائع</span>
        <a href="seller.html?s=${sid}" class="truncate text-sm font-semibold text-ink hover:text-primary">${esc(seller.name)}</a>
      </div>
      <span class="shrink-0 text-xs text-ink-muted">${esc(seller.city)} · <span class="tabular">${seller.rating}</span> ★</span>
    </section>`;
}

const helpCard = `
  <section aria-labelledby="help-title" class="card flex flex-col gap-2 p-5">
    <h2 id="help-title" class="m-0 text-base font-bold">هل تحتاج إلى مساعدة؟</h2>
    <p class="m-0 text-[13px] leading-relaxed text-ink-body">فريق خدمة العملاء متاح يومياً من 9 صباحاً إلى 11 مساءً.</p>
    <p class="m-0 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold"><a href="tel:920012345" class="tabular">920012345</a><a href="help.html#contact">راسلنا</a></p>
  </section>`;

const messageView = (title, text, href, cta) => `
  <div class="card mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 py-12 text-center">
    <h1 class="m-0 text-2xl font-bold">${title}</h1>
    <p class="m-0 max-w-md text-[15px] leading-relaxed text-ink-body">${text}</p>
    <a href="${href}" class="btn-primary px-7 py-3 text-sm">${cta}</a>
  </div>`;

/* ---------- render ---------- */

function render() {
  if (!won) return;
  const root = $('#main');
  if (!getUser()) { root.innerHTML = messageView('سجّل دخولك لمتابعة طلبك', 'ادخل بنفس رقم الجوال الذي زايدت به.', loginHref(), 'تسجيل الدخول'); return; }
  const o = order();
  if (!o) { root.innerHTML = messageView('لم يُدفع هذا الطلب بعد', `ادفع قيمة ${esc(lot.name)} لنبدأ تجهيز الاستلام.`, `checkout.html?id=${won.id}`, 'ادفع الآن'); return; }
  const s = steps(o);
  document.title = `الطلب ${o.ref} · مزادي`;
  root.innerHTML = `
    ${breadcrumb(o)}
    ${headerCard(o, s)}
    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
      <div class="flex min-w-0 flex-col gap-5">
        <div id="confirm-slot" class="contents">${confirmCard(s)}</div>
        ${timeline(s)}
      </div>
      <aside aria-label="تفاصيل الطلب" class="flex flex-col gap-5 lg:sticky lg:top-[136px]">
        ${summaryCard(o)}
        ${sellerCard()}
        ${helpCard}
      </aside>
    </div>`;
}

let toastTimer;
function toast(message) {
  $('#toast').innerHTML = `<div class="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-card">${check}<span>${esc(message)}</span></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').innerHTML = ''; }, 4000);
}

/* ---------- events ---------- */

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) { location.href = catHref(cat.dataset.cat); return; }
  if (t.closest('[data-confirm]')) {
    saveOrderAction(won.id, { confirmed: Date.now() });
    render();
    toast('شكراً، حوّلنا المبلغ إلى البائع');
    $('#track-title')?.scrollIntoView({ block: 'nearest' });
    return;
  }
  if (t.closest('[data-report]')) { state.reporting = true; state.error = ''; render(); $('#report-form input')?.focus(); return; }
  if (t.closest('[data-cancel-report]')) { state.reporting = false; render(); $('[data-report]')?.focus(); }
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'report-form') return;
  event.preventDefault();
  const reason = document.querySelector('[name="reason"]:checked')?.value;
  if (!reason) { state.error = 'اختر سبب البلاغ.'; render(); $('#report-form input')?.focus(); return; }
  saveOrderAction(won.id, { report: { ref: `CS-${formatNumber(70000 + Math.floor(Math.random() * 9000)).replace(',', '')}`, reason, text: $('#report-text').value.trim(), at: Date.now() } });
  state.reporting = false;
  render();
  toast('استلمنا بلاغك');
});

/* ---------- start ---------- */

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
render();
