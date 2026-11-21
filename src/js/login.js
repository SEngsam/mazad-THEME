import * as data from './data.js';
import { esc } from './components.js';
import { catHref, catNavHTML, clearUser, getUser, renderShell, setUser } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const DEMO_CODE = '1234';
const CODE_LENGTH = 4;
const RESEND_AFTER = 60;
const NAFATH_WINDOW = 90;
const NAFATH_DEMO_APPROVE_MS = 5000;

const params = new URLSearchParams(location.search);
/** Only same-site relative pages are allowed as the return address. */
const rawNext = params.get('next') ?? '';
const next = /^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(rawNext) ? rawNext : 'index.html';

const state = {
  step: getUser() ? 'signed-in' : 'phone',
  phone: '',
  phoneError: '',
  codeError: '',
  resendAt: 0,
  nafathNumber: 0,
  nafathUntil: 0,
};
let timer;
let nafathTimer;

/* ---------- helpers ---------- */

const toWestern = (text) => text.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660));

/** Normalise to the 9-digit Saudi mobile number (5XXXXXXXX), or '' if it isn't one. */
function normalisePhone(text) {
  let digits = toWestern(text).replace(/\D/g, '');
  if (digits.startsWith('00966')) digits = digits.slice(5);
  else if (digits.startsWith('966')) digits = digits.slice(3);
  if (digits.startsWith('05')) digits = digits.slice(1);
  return /^5\d{8}$/.test(digits) ? digits : '';
}
const prettyPhone = (p) => `+966 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`;
const maskedPhone = (p) => `+966 ${p.slice(0, 2)} ••• ${p.slice(5)}`;
const secondsLeft = (until) => Math.max(0, Math.ceil((until - Date.now()) / 1000));
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/* ---------- icons ---------- */

const shield = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4" stroke-linecap="round"/></svg>';
const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const back = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';

/* ---------- steps ---------- */

const heading = (title, sub) => `
  <div class="flex flex-col gap-2">
    <h1 class="m-0 text-2xl font-bold leading-[1.35] sm:text-[28px]">${title}</h1>
    <p class="m-0 text-[15px] leading-relaxed text-ink-body">${sub}</p>
  </div>`;

const backButton = (label) => `
  <button type="button" data-go="phone" class="flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:text-primary-dark">${back}${label}</button>`;

function phoneStep() {
  const err = state.phoneError;
  return `
    ${heading('تسجيل الدخول', 'أدخل رقم جوالك وسنرسل لك رمز تحقق. إذا كان الرقم جديداً ننشئ لك حساباً.')}
    <form id="phone-form" novalidate class="flex flex-col gap-3">
      <label for="phone" class="text-sm font-semibold">رقم الجوال</label>
      <div class="flex items-center gap-2 rounded-full bg-mist p-1 ps-5 focus-within:ring-2 ${err ? 'ring-2 ring-accent-strong focus-within:ring-accent-strong' : 'focus-within:ring-primary'}">
        <input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" dir="ltr" placeholder="5X XXX XXXX"
          aria-describedby="phone-help" ${err ? 'aria-invalid="true"' : ''} value="${esc(state.phone)}"
          class="min-w-0 flex-1 rounded-full border-0 bg-transparent py-3 text-left text-base font-semibold tracking-wide text-ink placeholder:font-normal placeholder:text-ink-muted focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
        <span dir="ltr" class="rounded-full bg-white px-3.5 py-2.5 text-sm font-semibold text-ink-body tabular">+966</span>
      </div>
      <p id="phone-help" class="m-0 text-xs ${err ? 'font-semibold text-accent-ink' : 'text-ink-muted'}">${err || 'رقم سعودي يبدأ بـ 5، مثل 5X XXX XXXX'}</p>
      <button type="submit" class="btn-primary mt-1 w-full py-3.5 text-[15px]">أرسل رمز التحقق</button>
    </form>

    <div class="flex items-center gap-3 text-xs text-ink-muted" aria-hidden="true"><span class="h-px flex-1 bg-line"></span>أو<span class="h-px flex-1 bg-line"></span></div>

    <button type="button" data-go="nafath" class="btn-outline w-full py-3.5 text-[15px]">${shield}الدخول عبر نفاذ</button>

    <p class="m-0 text-xs leading-[1.8] text-ink-muted">بالمتابعة أنت توافق على <a href="help.html#terms" class="font-semibold">الشروط والأحكام</a> و<a href="help.html#privacy" class="font-semibold">سياسة الخصوصية</a>.</p>`;
}

function codeBoxes() {
  const err = state.codeError;
  return Array.from({ length: CODE_LENGTH }, (_, i) => `
    <input data-code="${i}" type="text" inputmode="numeric" autocomplete="${i === 0 ? 'one-time-code' : 'off'}" maxlength="${i === 0 ? CODE_LENGTH : 1}"
      aria-label="الرقم ${i + 1} من ${CODE_LENGTH}" ${err ? 'aria-invalid="true"' : ''}
      class="h-14 w-14 rounded-[14px] border-0 bg-mist text-center text-2xl font-bold text-ink tabular focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 sm:h-16 sm:w-16 ${err ? 'ring-2 ring-accent-strong focus-visible:ring-accent-strong' : 'focus-visible:ring-primary'}">`).join('');
}

function otpStep() {
  const wait = secondsLeft(state.resendAt);
  return `
    ${backButton('تغيير الرقم')}
    ${heading('أدخل رمز التحقق', `أرسلنا رمزاً من ${CODE_LENGTH} أرقام إلى <span dir="ltr" class="whitespace-nowrap font-semibold text-ink tabular">${prettyPhone(state.phone)}</span>`)}
    <form id="code-form" novalidate class="flex flex-col gap-4">
      <fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
        <legend class="mb-3 p-0 text-sm font-semibold">رمز التحقق</legend>
        <div dir="ltr" class="flex justify-end gap-2.5 sm:gap-3">${codeBoxes()}</div>
      </fieldset>
      <p id="code-help" role="status" class="m-0 text-xs ${state.codeError ? 'font-semibold text-accent-ink' : 'text-ink-muted'}">${state.codeError || `للعرض التجريبي استخدم الرمز <b class="tabular text-ink">${DEMO_CODE}</b>`}</p>
      <button type="submit" class="btn-primary w-full py-3.5 text-[15px]">تحقق ودخول</button>
    </form>
    <p id="resend" class="m-0 text-sm text-ink-body">${wait
      ? `لم يصلك الرمز؟ يمكنك إعادة الإرسال بعد <b class="tabular text-ink">${mmss(wait)}</b>`
      : 'لم يصلك الرمز؟ <button type="button" data-resend class="font-semibold text-primary hover:text-primary-dark">أعد إرسال الرمز</button>'}</p>`;
}

function nafathStep() {
  const left = secondsLeft(state.nafathUntil);
  return `
    ${backButton('الدخول برقم الجوال')}
    ${heading('الدخول عبر نفاذ', 'افتح تطبيق نفاذ على جوالك واختر الرقم الظاهر هنا لتأكيد هويتك.')}
    <div class="flex flex-col items-center gap-3 rounded-[18px] bg-primary-soft px-6 py-8 text-center">
      <span class="text-sm text-ink-body">اختر هذا الرقم في تطبيق نفاذ</span>
      <b class="text-[56px] font-bold leading-none text-primary tabular" aria-live="off">${state.nafathNumber}</b>
      <span id="nafath-left" class="flex items-center gap-2 text-sm text-ink-body">
        <span class="h-2 w-2 animate-pulse rounded-full bg-primary motion-reduce:animate-none" aria-hidden="true"></span>
        بانتظار التأكيد · <b class="tabular text-ink">${mmss(left)}</b>
      </span>
    </div>
    <p class="m-0 text-xs leading-[1.8] text-ink-muted">للعرض التجريبي يتأكد الدخول تلقائياً بعد ثوانٍ.</p>`;
}

function doneStep() {
  return `
    <div class="flex flex-col items-center gap-4 py-10 text-center">
      <span class="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">${check.replace('h-4 w-4', 'h-8 w-8')}</span>
      ${heading('أهلاً بك في مزاد', 'تم تسجيل دخولك. جارٍ إعادتك إلى حيث كنت…')}
      <a href="${esc(next)}" class="btn-primary px-7 py-3 text-sm">متابعة</a>
    </div>`;
}

function signedInStep() {
  const user = getUser();
  return `
    ${heading('أنت مسجّل الدخول', `برقم الجوال <span dir="ltr" class="whitespace-nowrap font-semibold text-ink tabular">${esc(maskedPhone(user.phone))}</span>${user.via === 'nafath' ? ' · هوية موثّقة بنفاذ' : ''}`)}
    <div class="flex flex-wrap gap-2.5">
      <a href="${esc(next)}" class="btn-primary px-7 py-3 text-sm">متابعة التصفح</a>
      <button type="button" data-logout class="btn-outline px-7 py-3 text-sm">تسجيل الخروج</button>
    </div>`;
}

/* ---------- render & flow ---------- */

function render(focus) {
  clearInterval(timer);
  const views = { phone: phoneStep, otp: otpStep, nafath: nafathStep, done: doneStep, 'signed-in': signedInStep };
  $('#auth').innerHTML = views[state.step]();
  if (state.step === 'otp' || state.step === 'nafath') timer = setInterval(tickStep, 1000);
  if (focus) $(focus)?.focus();
}

function tickStep() {
  if (state.step === 'otp') {
    const wait = secondsLeft(state.resendAt);
    $('#resend').innerHTML = wait
      ? `لم يصلك الرمز؟ يمكنك إعادة الإرسال بعد <b class="tabular text-ink">${mmss(wait)}</b>`
      : 'لم يصلك الرمز؟ <button type="button" data-resend class="font-semibold text-primary hover:text-primary-dark">أعد إرسال الرمز</button>';
    if (!wait) clearInterval(timer);
  }
  if (state.step === 'nafath') {
    const left = secondsLeft(state.nafathUntil);
    $('#nafath-left b').textContent = mmss(left);
    if (!left) {
      clearTimeout(nafathTimer);
      state.step = 'phone';
      state.phoneError = 'انتهت مهلة نفاذ. حاول مرة أخرى أو ادخل برقم جوالك.';
      render('#phone');
    }
  }
}

function signIn(user) {
  setUser(user);
  state.step = 'done';
  render();
  renderShell();
  $('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
  setTimeout(() => { location.href = next; }, 1800);
}

function startNafath() {
  state.nafathNumber = 10 + Math.floor(Math.random() * 90);
  state.nafathUntil = Date.now() + NAFATH_WINDOW * 1000;
  state.step = 'nafath';
  render();
  clearTimeout(nafathTimer);
  nafathTimer = setTimeout(() => {
    if (state.step === 'nafath') signIn({ phone: '512345678', via: 'nafath' });
  }, NAFATH_DEMO_APPROVE_MS);
}

function codeValue() {
  return [...document.querySelectorAll('[data-code]')].map((i) => i.value).join('');
}

function submitCode() {
  const code = codeValue();
  if (code.length < CODE_LENGTH) {
    state.codeError = `أدخل الرمز كاملاً (${CODE_LENGTH} أرقام).`;
    render('[data-code="0"]');
    return;
  }
  if (code !== DEMO_CODE) {
    state.codeError = 'الرمز غير صحيح. تأكد من الرسالة وحاول مرة أخرى.';
    render('[data-code="0"]');
    return;
  }
  signIn({ phone: state.phone, via: 'phone' });
}

/* ---------- events ---------- */

document.addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.id === 'phone-form') {
    const typed = $('#phone').value;
    const phone = normalisePhone(typed);
    if (!phone) {
      state.phone = typed;
      state.phoneError = typed.trim() ? 'رقم الجوال غير صحيح. يجب أن يبدأ بـ 5 ويتكون من 9 أرقام.' : 'أدخل رقم جوالك للمتابعة.';
      render('#phone');
      return;
    }
    state.phone = phone;
    state.phoneError = '';
    state.codeError = '';
    state.resendAt = Date.now() + RESEND_AFTER * 1000;
    state.step = 'otp';
    render('[data-code="0"]');
  }
  if (event.target.id === 'code-form') submitCode();
});

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) { location.href = catHref(cat.dataset.cat); return; }
  const go = t.closest('[data-go]');
  if (go) {
    clearTimeout(nafathTimer);
    if (go.dataset.go === 'nafath') { startNafath(); return; }
    state.step = 'phone';
    state.phoneError = '';
    if (/^5\d{8}$/.test(state.phone)) state.phone = `${state.phone.slice(0, 2)} ${state.phone.slice(2, 5)} ${state.phone.slice(5)}`;
    render('#phone');
    return;
  }
  if (t.closest('[data-resend]')) {
    state.resendAt = Date.now() + RESEND_AFTER * 1000;
    state.codeError = '';
    render('[data-code="0"]');
    $('#code-help').textContent = 'أرسلنا رمزاً جديداً.';
    return;
  }
  if (t.closest('[data-logout]')) {
    clearUser();
    state.step = 'phone';
    state.phone = '';
    renderShell();
    $('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
    render('#phone');
  }
});

document.addEventListener('input', (event) => {
  const box = event.target.closest('[data-code]');
  if (!box) return;
  const boxes = [...document.querySelectorAll('[data-code]')];
  const digits = toWestern(box.value).replace(/\D/g, '');
  if (digits.length > 1) {
    // Pasted or autofilled the whole code into one box: spread it.
    digits.slice(0, CODE_LENGTH).split('').forEach((d, i) => { boxes[i].value = d; });
    boxes[Math.min(digits.length, CODE_LENGTH) - 1].focus();
  } else {
    box.value = digits;
    if (digits) boxes[Number(box.dataset.code) + 1]?.focus();
  }
  if (codeValue().length === CODE_LENGTH) submitCode();
});

document.addEventListener('keydown', (event) => {
  const box = event.target.closest?.('[data-code]');
  if (!box) return;
  const i = Number(box.dataset.code);
  const boxes = document.querySelectorAll('[data-code]');
  if (event.key === 'Backspace' && !box.value && i > 0) { boxes[i - 1].value = ''; boxes[i - 1].focus(); event.preventDefault(); }
  if (event.key === 'ArrowLeft' && i < CODE_LENGTH - 1) boxes[i + 1].focus();
  if (event.key === 'ArrowRight' && i > 0) boxes[i - 1].focus();
});

/* ---------- start ---------- */

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
$('#why-list').innerHTML = data.trust.slice(0, 3).map((item) => `
  <li class="flex gap-3">
    <span class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime text-forest">${check}</span>
    <span class="flex flex-col gap-1"><b class="text-[15px] font-semibold">${esc(item.title)}</b><span class="text-[13px] leading-[1.7] text-white/85">${esc(item.text)}</span></span>
  </li>`).join('');
render(state.step === 'phone' ? '#phone' : null);
