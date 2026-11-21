import * as data from './data.js';
import { Media, esc, formatCountdown, formatNumber, formatPrice } from './components.js';
import { catHref, catNavHTML, getUser, loadOrders, loginHref, renderShell, saveOrder } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const BUYER_FEE = 0.025;
const SHIPPING = 75;
const DEMO_CARD = '4242 4242 4242 4242';
const DECLINED_SUFFIX = '0002';
const CITIES = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الأحساء', 'الطائف', 'تبوك', 'أبها', 'القصيم', 'حائل', 'جازان', 'نجران'];
const METHODS = [
  { id: 'card', label: 'بطاقة مدى أو ائتمانية', note: 'مدى، فيزا، ماستركارد' },
  { id: 'applepay', label: 'Apple Pay', note: 'ادفع من جوالك أو ساعتك' },
  { id: 'tabby', label: 'تابي', note: 'قسّطها على 4 دفعات بدون فوائد', parts: 4 },
  { id: 'tamara', label: 'تمارا', note: 'قسّطها على 3 دفعات بدون فوائد', parts: 3 },
];

const params = new URLSearchParams(location.search);
const won = data.wonLots.find((w) => String(w.id) === params.get('id')) ?? data.wonLots.find((w) => w.dueIn);
const lot = data.lots.find((l) => l.id === won?.id);
const canShip = lot ? data.shippableCats.includes(lot.cat) : false;
const startedAt = Date.now();
const user = getUser();

const state = {
  delivery: canShip ? 'ship' : 'pickup',
  address: { city: lot?.city ?? '', district: '', street: '', notes: '' },
  method: 'card',
  card: { number: '', exp: '', cvc: '', name: '' },
  agree: false,
  errors: {},
  declined: false,
  processing: false,
  order: null,
};

/* ---------- money ---------- */

function totals() {
  const fee = Math.round(won.price * BUYER_FEE);
  const shipping = state.delivery === 'ship' ? SHIPPING : 0;
  return { fee, shipping, total: won.price + fee + shipping - won.deposit };
}

const dateFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long' });
const deadlineFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });

function schedule(parts, total) {
  const each = Math.floor(total / parts);
  return Array.from({ length: parts }, (_, i) => {
    const d = new Date(startedAt);
    d.setMonth(d.getMonth() + i);
    return { when: i === 0 ? 'اليوم' : dateFmt.format(d), amount: i === parts - 1 ? total - each * (parts - 1) : each };
  });
}

/* ---------- card checks ---------- */

const digits = (s) => String(s).replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660)).replace(/\D/g, '');
function luhn(num) {
  let sum = 0;
  [...num].reverse().forEach((ch, i) => {
    let n = Number(ch);
    if (i % 2) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  });
  return num.length >= 13 && sum % 10 === 0;
}
function brand(num) {
  if (/^4/.test(num)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(num)) return 'Mastercard';
  return '';
}
const formatCard = (num) => num.slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
function formatExp(text) {
  const d = digits(text).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/* ---------- icons ---------- */

const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const warn = '<svg aria-hidden="true" viewBox="0 0 24 24" class="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/></svg>';
const lock = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
const shield = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4" stroke-linecap="round"/></svg>';

/* ---------- fields ---------- */

const fieldClass = (err, extra = '') => `w-full rounded-full border-0 bg-mist px-5 py-3 text-[15px] text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${err ? 'ring-2 ring-accent-strong focus-visible:ring-accent-strong' : 'focus-visible:ring-primary'} ${extra}`;
const helpLine = (id, err, text = '') => (err || text ? `<p id="${id}-help" class="m-0 text-xs ${err ? 'font-semibold text-accent-ink' : 'text-ink-muted'}">${esc(err || text)}</p>` : '');

function input({ id, label, value, placeholder = '', ltr = false, numeric = false, autocomplete = 'off', optional = false, hint = '', maxlength = 60 }) {
  const err = state.errors[id];
  return `<div class="flex min-w-0 flex-col gap-2">
    <label for="${id}" class="text-sm font-semibold">${label}${optional ? ' <span class="font-normal text-ink-muted">(اختياري)</span>' : ''}</label>
    <input id="${id}" name="${id}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="${autocomplete}" maxlength="${maxlength}"
      ${ltr ? 'dir="ltr"' : ''} ${numeric ? 'inputmode="numeric"' : ''} ${err ? 'aria-invalid="true"' : ''} aria-describedby="${id}-help"
      class="${fieldClass(err, ltr ? 'text-left tabular' : '')}">
    ${helpLine(id, err, hint)}
  </div>`;
}

/* ---------- sections ---------- */

const section = (n, title, body) => `
  <section class="card flex flex-col gap-5 p-5 sm:p-6" aria-labelledby="s${n}-title">
    <h2 id="s${n}-title" class="m-0 flex items-center gap-3 text-lg font-bold">
      <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[13px] font-bold text-primary tabular">${n}</span>${title}
    </h2>
    ${body}
  </section>`;

function optionCard({ name, value, checked, title, text, aside = '' }) {
  return `<label class="cursor-pointer">
    <input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''} class="peer sr-only">
    <span class="flex items-start gap-3 rounded-[18px] border-2 p-4 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 ${checked ? 'border-primary bg-primary-soft/40' : 'border-line bg-white hover:border-ink/30'}">
      <span class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-primary' : 'border-line'}" aria-hidden="true">${checked ? '<span class="h-2.5 w-2.5 rounded-full bg-primary"></span>' : ''}</span>
      <span class="flex min-w-0 flex-1 flex-col gap-0.5"><b class="text-[15px] font-semibold text-ink">${title}</b><span class="text-[13px] leading-relaxed text-ink-body">${text}</span></span>
      ${aside ? `<span class="shrink-0 text-sm font-semibold text-ink tabular">${aside}</span>` : ''}
    </span>
  </label>`;
}

function deliverySection() {
  const options = [
    canShip && optionCard({ name: 'delivery', value: 'ship', checked: state.delivery === 'ship', title: 'توصيل مؤمَّن', text: 'نستلمه من البائع ونفحصه ثم نوصله لك خلال 2 إلى 4 أيام عمل.', aside: formatPrice(SHIPPING) }),
    optionCard({
      name: 'delivery', value: 'pickup', checked: state.delivery === 'pickup',
      title: lot.cat === 1 ? 'الاستلام ونقل الملكية' : 'الاستلام من البائع',
      text: lot.cat === 1 ? `من موقع البائع في ${esc(lot.city)}، مع نقل الملكية عبر أبشر بحضور مندوب مزادي.` : `من موقع البائع في ${esc(lot.city)} بموعد نرسله لك بعد الدفع.`,
      aside: 'مجاناً',
    }),
  ].filter(Boolean).join('');
  const a = state.address;
  const address = state.delivery === 'ship' ? `
    <div class="grid grid-cols-1 gap-4 border-t border-line-soft pt-5 sm:grid-cols-2">
      <div class="flex flex-col gap-2">
        <label for="city" class="text-sm font-semibold">المدينة</label>
        <select id="city" name="city" class="select-pill ${fieldClass(state.errors.city, 'appearance-none pe-5 ps-12')}" ${state.errors.city ? 'aria-invalid="true"' : ''} aria-describedby="city-help">
          <option value="">اختر المدينة</option>${CITIES.map((c) => `<option ${c === a.city ? 'selected' : ''}>${c}</option>`).join('')}
        </select>${helpLine('city', state.errors.city)}
      </div>
      ${input({ id: 'district', label: 'الحي', value: a.district, placeholder: 'مثل حي النرجس', autocomplete: 'address-level3' })}
      <div class="sm:col-span-2">${input({ id: 'street', label: 'الشارع ورقم المبنى', value: a.street, placeholder: 'مثل شارع الأمير سلطان، مبنى 4021', autocomplete: 'street-address', maxlength: 100 })}</div>
      <div class="sm:col-span-2">${input({ id: 'notes', label: 'ملاحظات للمندوب', value: a.notes, placeholder: 'مثل أقرب معلم أو وقت مناسب', optional: true, maxlength: 120 })}</div>
      <p class="m-0 text-[13px] text-ink-body sm:col-span-2">سنتصل بك على <b dir="ltr" class="font-semibold text-ink tabular">+966 ${esc(user.phone.slice(0, 2))} ••• ${esc(user.phone.slice(5))}</b> لتأكيد موعد التوصيل.</p>
    </div>` : '';
  return section(1, 'طريقة الاستلام', `<div class="flex flex-col gap-3" role="radiogroup" aria-labelledby="s1-title">${options}</div>${address}`);
}

function methodDetails() {
  const { total } = totals();
  const m = METHODS.find((x) => x.id === state.method);
  if (m.id === 'card') {
    const num = digits(state.card.number);
    const b = brand(num);
    return `
      <div class="grid grid-cols-1 gap-4 border-t border-line-soft pt-5 sm:grid-cols-2">
        <div class="flex flex-col gap-2 sm:col-span-2">
          <label for="cc-number" class="text-sm font-semibold">رقم البطاقة</label>
          <div class="flex items-center gap-2 rounded-full bg-mist px-5 focus-within:ring-2 ${state.errors['cc-number'] ? 'ring-2 ring-accent-strong focus-within:ring-accent-strong' : 'focus-within:ring-primary'}">
            <input id="cc-number" name="cc-number" dir="ltr" inputmode="numeric" autocomplete="cc-number" maxlength="23" placeholder="0000 0000 0000 0000" value="${esc(formatCard(num))}"
              ${state.errors['cc-number'] ? 'aria-invalid="true"' : ''} aria-describedby="cc-number-help"
              class="min-w-0 flex-1 border-0 bg-transparent py-3 text-left text-[15px] font-semibold tracking-wider text-ink tabular placeholder:font-normal placeholder:text-ink-muted focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
            <span id="cc-brand" class="text-xs font-semibold text-ink-body">${b}</span>
          </div>
          ${helpLine('cc-number', state.errors['cc-number'], `للعرض التجريبي استخدم ${DEMO_CARD}`)}
        </div>
        ${input({ id: 'cc-exp', label: 'تاريخ الانتهاء', value: state.card.exp, placeholder: 'MM/YY', ltr: true, numeric: true, autocomplete: 'cc-exp', maxlength: 5 })}
        ${input({ id: 'cc-cvc', label: 'رمز الأمان', value: state.card.cvc, placeholder: '123', ltr: true, numeric: true, autocomplete: 'cc-csc', maxlength: 4, hint: '3 أرقام خلف البطاقة' })}
        <div class="sm:col-span-2">${input({ id: 'cc-name', label: 'الاسم على البطاقة', value: state.card.name, placeholder: 'SARA ALQAHTANI', ltr: true, autocomplete: 'cc-name' })}</div>
      </div>`;
  }
  if (m.id === 'applepay') {
    return '<p class="m-0 border-t border-line-soft pt-5 text-[13px] leading-relaxed text-ink-body">عند الضغط على الدفع ستظهر نافذة Apple Pay في جهازك لتأكيد العملية ببصمة الوجه أو الإصبع.</p>';
  }
  const rows = schedule(m.parts, total);
  return `
    <div class="flex flex-col gap-3 border-t border-line-soft pt-5">
      <p class="m-0 text-[13px] text-ink-body">ستكمل التسجيل في ${m.label} ثم تعود هنا. خطة الدفع:</p>
      <ol class="m-0 grid list-none gap-2 p-0 ${m.parts === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}">
        ${rows.map((r, i) => `<li class="flex items-center justify-between gap-3 rounded-[14px] bg-sand px-4 py-3 sm:flex-col sm:items-start sm:gap-1">
          <span class="text-xs text-ink-muted">${i === 0 ? 'الدفعة الأولى · ' : ''}${r.when}</span><b class="text-[15px] font-bold text-ink tabular">${formatPrice(r.amount)}</b></li>`).join('')}
      </ol>
    </div>`;
}

function paymentSection() {
  const { total } = totals();
  const cards = METHODS.map((m) => optionCard({
    name: 'method', value: m.id, checked: state.method === m.id, title: m.label,
    text: m.parts ? `${m.note} · الدفعة ${formatPrice(Math.floor(total / m.parts))}` : m.note,
  })).join('');
  const declined = state.declined
    ? `<p class="m-0 flex items-start gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm font-semibold text-accent-ink" role="alert">${warn}<span>رفض البنك العملية ولم نخصم أي مبلغ. تأكد من رصيد البطاقة أو جرّب بطاقة أخرى أو طريقة دفع مختلفة.</span></p>`
    : '';
  return section(2, 'طريقة الدفع', `${declined}<div class="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="s2-title">${cards}</div>${methodDetails()}`);
}

function summary() {
  const { fee, shipping, total } = totals();
  const left = won.dueIn - Math.floor((Date.now() - startedAt) / 1000);
  const deadline = deadlineFmt.format(new Date(startedAt + won.dueIn * 1000));
  const m = METHODS.find((x) => x.id === state.method);
  const payLabel = state.processing ? 'جارٍ الدفع…' : m.id === 'applepay' ? `ادفع ${formatPrice(total)} بـ Apple Pay` : m.parts ? `متابعة مع ${m.label}` : `ادفع ${formatPrice(total)}`;
  return `
    <div class="card flex flex-col gap-4 p-5">
      <h2 class="m-0 text-base font-bold">ملخص الطلب</h2>
      <div class="flex gap-3">
        <a href="lot.html?id=${lot.id}" class="block w-20 shrink-0">${Media({ src: lot.img, className: 'aspect-square rounded-[12px]' })}</a>
        <div class="flex min-w-0 flex-col gap-1">
          <a href="lot.html?id=${lot.id}" class="text-sm font-semibold leading-snug text-ink hover:text-primary">${esc(lot.name)}</a>
          <span class="text-xs text-ink-muted">${esc(lot.city)} · <span class="tabular">لوت ${esc(data.lotNumber(lot))}</span></span>
          <span class="self-start rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">فزت بالمزاد</span>
        </div>
      </div>
      <dl class="m-0 flex flex-col gap-2 border-t border-line-soft pt-4 text-[13px] text-ink-body">
        <div class="flex justify-between gap-3"><dt>سعر الفوز</dt><dd class="m-0 font-semibold text-ink tabular">${formatPrice(won.price)}</dd></div>
        <div class="flex justify-between gap-3"><dt>عمولة المشتري (2.5%)</dt><dd class="m-0 font-semibold text-ink tabular">${formatPrice(fee)}</dd></div>
        <div class="flex justify-between gap-3"><dt>${state.delivery === 'ship' ? 'التوصيل المؤمَّن' : 'الاستلام'}</dt><dd class="m-0 font-semibold tabular ${shipping ? 'text-ink' : 'text-primary'}">${shipping ? formatPrice(shipping) : 'مجاناً'}</dd></div>
        <div class="flex justify-between gap-3"><dt>تأمين المزايدة المدفوع</dt><dd class="m-0 font-semibold text-primary tabular">− ${formatPrice(won.deposit)}</dd></div>
        <div class="flex items-baseline justify-between gap-3 border-t border-line pt-3"><dt class="text-sm font-semibold text-ink">الإجمالي</dt><dd class="m-0 text-2xl font-bold text-ink tabular">${formatPrice(total)}</dd></div>
      </dl>
      <p class="m-0 rounded-xl bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent-ink">ادفع قبل <b class="font-semibold">${esc(deadline)}</b> · متبقٍ <b id="due-left" class="font-semibold tabular">${formatCountdown(left)}</b></p>
      <label class="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-body">
        <input id="agree" type="checkbox" ${state.agree ? 'checked' : ''} ${state.errors.agree ? 'aria-invalid="true"' : ''} aria-describedby="agree-help" class="mt-0.5 h-4 w-4 shrink-0 accent-primary">
        <span>أوافق على <a href="help.html#terms" class="font-semibold">شروط الشراء</a> وسياسة الإرجاع.</span>
      </label>
      ${helpLine('agree', state.errors.agree)}
      <button type="submit" form="pay-form" ${state.processing ? 'disabled aria-busy="true"' : ''} class="btn-primary w-full gap-2 py-3.5 text-[15px] disabled:cursor-wait disabled:opacity-70">
        ${state.processing ? '<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden="true"></span>' : lock}${payLabel}
      </button>
      <p class="m-0 flex items-start gap-2 text-xs leading-relaxed text-ink-muted"><span class="text-primary">${shield}</span>أموالك محمية: يبقى المبلغ لدينا حتى تستلم المنتج وتتأكد من مطابقته للوصف.</p>
    </div>`;
}

function successView() {
  const o = state.order;
  const m = METHODS.find((x) => x.id === o.method);
  const steps = o.delivery === 'ship'
    ? [['نستلم المنتج من البائع', 'ونفحص مطابقته للوصف.'], ['نوصله لعنوانك', `في ${o.city} خلال 2 إلى 4 أيام عمل، ونتصل بك قبل الوصول.`], ['نحوّل المبلغ للبائع', 'بعد تأكيد استلامك.']]
    : [['نرسل لك موعد الاستلام', `من موقع البائع في ${lot.city} خلال 24 ساعة.`], ...(lot.cat === 1 ? [['نقل الملكية عبر أبشر', 'بحضور مندوب مزادي عند الاستلام.']] : []), ['نحوّل المبلغ للبائع', 'بعد تأكيد استلامك.']];
  return `
    <div class="card mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-10 text-center sm:px-10">
      <span class="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">${check.replace('h-4 w-4', 'h-8 w-8')}</span>
      <div class="flex flex-col gap-2">
        <h1 class="m-0 text-2xl font-bold sm:text-[28px]">تم الدفع بنجاح</h1>
        <p class="m-0 text-[15px] text-ink-body">رقم الطلب <b dir="ltr" class="font-semibold text-ink tabular">${esc(o.ref)}</b> · ${esc(lot.name)}</p>
      </div>
      <dl class="m-0 grid w-full grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-line bg-line-soft text-start text-sm sm:grid-cols-3">
        <div class="flex flex-col gap-1 bg-white px-4 py-3"><dt class="text-xs text-ink-muted">المبلغ</dt><dd class="m-0 font-bold text-ink tabular">${formatPrice(o.total)}</dd></div>
        <div class="flex flex-col gap-1 bg-white px-4 py-3"><dt class="text-xs text-ink-muted">طريقة الدفع</dt><dd class="m-0 font-semibold text-ink">${esc(m.id === 'card' ? 'بطاقة' : m.label)}${o.last4 ? ` <span dir="ltr" class="tabular text-ink-body">•••• ${esc(o.last4)}</span>` : ''}</dd></div>
        <div class="flex flex-col gap-1 bg-white px-4 py-3"><dt class="text-xs text-ink-muted">الاستلام</dt><dd class="m-0 font-semibold text-ink">${o.delivery === 'ship' ? `توصيل إلى ${esc(o.city)}` : `من البائع في ${esc(lot.city)}`}</dd></div>
      </dl>
      <ol class="m-0 flex w-full list-none flex-col gap-3 p-0 text-start">
        ${steps.map(([t, x], i) => `<li class="flex gap-3 rounded-[14px] bg-sand p-3.5"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white tabular">${i + 1}</span><span class="flex flex-col gap-0.5"><b class="text-sm font-semibold">${t}</b><span class="text-[13px] text-ink-body">${x}</span></span></li>`).join('')}
      </ol>
      <div class="flex flex-wrap justify-center gap-2.5">
        <a href="order.html?id=${lot.id}" class="btn-primary px-7 py-3 text-sm">تتبع الطلب</a>
        <a href="search.html" class="btn-outline px-7 py-3 text-sm">متابعة التصفح</a>
      </div>
    </div>`;
}

const messageView = (title, text, href, cta) => `
  <div class="card mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 py-12 text-center">
    <h1 class="m-0 text-2xl font-bold">${title}</h1>
    <p class="m-0 max-w-md text-[15px] leading-relaxed text-ink-body">${text}</p>
    <a href="${href}" class="btn-primary px-7 py-3 text-sm">${cta}</a>
  </div>`;

/* ---------- render ---------- */

function render() {
  const root = $('#checkout');
  if (!user) { root.innerHTML = messageView('سجّل دخولك لإتمام الشراء', 'ادخل بنفس رقم الجوال الذي زايدت به.', loginHref(), 'تسجيل الدخول'); return; }
  if (state.order) { root.innerHTML = successView(); document.title = 'تم الدفع · مزادي'; return; }
  if (!won || !lot || !won.dueIn) { root.innerHTML = messageView('لا يوجد طلب بانتظار الدفع', 'تجد كل المزادات التي فزت بها وحالة دفعها في «مشترياتي».', 'account.html#won', 'إلى مشترياتي'); return; }
  const paid = loadOrders()[lot.id];
  if (paid) { root.innerHTML = messageView('دفعت قيمة هذا المزاد', `رقم الطلب ${esc(paid.ref)}.`, `order.html?id=${lot.id}`, 'تتبع الطلب'); return; }
  root.innerHTML = `
    <div class="flex flex-col gap-5">
      <header class="flex flex-col gap-2">
        <h1 class="m-0 text-2xl font-bold leading-[1.35] sm:text-[28px]">إتمام الشراء</h1>
        <p class="m-0 text-[15px] leading-relaxed text-ink-body">تهانينا بالفوز. اختر طريقة الاستلام والدفع لإتمام شراء ${esc(lot.name)}.</p>
      </header>
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <form id="pay-form" novalidate class="flex min-w-0 flex-col gap-5">${deliverySection()}${paymentSection()}</form>
        <aside id="summary" aria-label="ملخص الطلب" class="lg:sticky lg:top-[136px]">${summary()}</aside>
      </div>
    </div>`;
}

function refreshSummary() {
  $('#summary').innerHTML = summary();
}

/* ---------- validation & pay ---------- */

function validate() {
  const e = {};
  if (state.delivery === 'ship') {
    if (!state.address.city) e.city = 'اختر مدينة التوصيل.';
    if (state.address.district.trim().length < 2) e.district = 'اكتب اسم الحي.';
    if (state.address.street.trim().length < 4) e.street = 'اكتب الشارع ورقم المبنى ليصل المندوب.';
  }
  if (state.method === 'card') {
    const num = digits(state.card.number);
    if (!luhn(num)) e['cc-number'] = 'رقم البطاقة غير صحيح. تأكد من الأرقام الـ16.';
    const [mm, yy] = state.card.exp.split('/').map(Number);
    const now = new Date(startedAt);
    const expEnd = new Date(2000 + (yy || 0), mm || 0, 1);
    if (!(mm >= 1 && mm <= 12 && yy >= 0) || expEnd <= now) e['cc-exp'] = 'تاريخ غير صالح أو البطاقة منتهية.';
    if (!/^\d{3,4}$/.test(state.card.cvc)) e['cc-cvc'] = 'رمز الأمان 3 أرقام.';
    if (state.card.name.trim().length < 3) e['cc-name'] = 'اكتب الاسم كما هو على البطاقة.';
  }
  if (!state.agree) e.agree = 'وافق على شروط الشراء للمتابعة.';
  return e;
}

function pay() {
  state.errors = validate();
  state.declined = false;
  if (Object.keys(state.errors).length) {
    render();
    document.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  state.processing = true;
  refreshSummary();
  setTimeout(() => {
    state.processing = false;
    const num = digits(state.card.number);
    if (state.method === 'card' && num.endsWith(DECLINED_SUFFIX)) {
      state.declined = true;
      render();
      $('[role="alert"]')?.scrollIntoView({ block: 'center' });
      return;
    }
    const { total } = totals();
    state.order = {
      ref: `OR-${String(Date.now()).slice(-6)}`, status: 'paid', method: state.method, total,
      delivery: state.delivery, city: state.address.city, last4: state.method === 'card' ? num.slice(-4) : '', at: Date.now(),
    };
    saveOrder(lot.id, state.order);
    render();
    window.scrollTo({ top: 0 });
  }, 1600);
}

/* ---------- events ---------- */

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'pay-form') return;
  event.preventDefault();
  if (!state.processing) pay();
});

document.addEventListener('change', (event) => {
  const t = event.target;
  if (t.name === 'delivery') { state.delivery = t.value; state.errors = {}; render(); $(`input[name="delivery"][value="${t.value}"]`)?.focus(); }
  else if (t.name === 'method') { state.method = t.value; state.errors = {}; state.declined = false; render(); $(`input[name="method"][value="${t.value}"]`)?.focus(); }
  else if (t.id === 'city') { state.address.city = t.value; delete state.errors.city; }
  else if (t.id === 'agree') { state.agree = t.checked; delete state.errors.agree; refreshSummary(); $('#agree').focus(); }
});

document.addEventListener('input', (event) => {
  const t = event.target;
  const clear = () => { if (state.errors[t.id]) { delete state.errors[t.id]; t.removeAttribute('aria-invalid'); } };
  if (['district', 'street', 'notes'].includes(t.id)) { state.address[t.id] = t.value; clear(); }
  if (t.id === 'cc-number') {
    const num = digits(t.value).slice(0, 19);
    state.card.number = num;
    t.value = formatCard(num);
    $('#cc-brand').textContent = brand(num);
    clear();
  }
  if (t.id === 'cc-exp') { state.card.exp = formatExp(t.value); t.value = state.card.exp; clear(); }
  if (t.id === 'cc-cvc') { state.card.cvc = digits(t.value).slice(0, 4); t.value = state.card.cvc; clear(); }
  if (t.id === 'cc-name') { state.card.name = t.value; clear(); }
});

document.addEventListener('click', (event) => {
  const cat = event.target.closest('#cat-nav [data-cat]');
  if (cat) location.href = catHref(cat.dataset.cat);
});

/* ---------- start ---------- */

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
render();
setInterval(() => {
  const el = $('#due-left');
  if (el) el.textContent = formatCountdown(won.dueIn - Math.floor((Date.now() - startedAt) / 1000));
}, 1000);
