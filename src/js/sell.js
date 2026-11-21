import * as data from './data.js';
import { LotCard, Media, esc, formatNumber, formatPrice } from './components.js';
import { catHref, catNavHTML, getUser, loginHref, renderShell, saveListing } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const STEPS = ['الفئة', 'التفاصيل', 'الصور', 'السعر والمدة', 'المراجعة'];
const DRAFT_KEY = 'mz-sell-draft';
const MAX_PHOTOS = 10;
const MIN_OPENING = 100;
const COMMISSION = 0.05;
const MIN_COMMISSION = 100;
const DURATIONS = [3, 5, 7];
const CITIES = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الأحساء', 'الطائف', 'تبوك', 'أبها', 'القصيم', 'حائل', 'جازان', 'نجران'];
const CONDITIONS = ['جديد', 'مستعمل كالجديد', 'مستعمل'];
const NO_CONDITION = [5, 8]; // land and number plates have no condition
const YEARS = Array.from({ length: 2027 - 1970 }, (_, i) => String(2026 - i));
const TITLE_HINTS = {
  1: 'مثل تويوتا لاندكروزر GXR 2021', 2: 'مثل رولكس صبمارينر 2022', 3: 'مثل آيفون 16 برو ماكس 1TB', 4: 'مثل طقم ذهب عيار 21',
  5: 'مثل أرض سكنية 600م² حي النرجس', 6: 'مثل رافعة شوكية تويوتا 3 طن', 7: 'مثل دلة نحاسية قديمة', 8: 'مثل لوحة مميزة ر س ع 7',
};
const EXTRA_FIELDS = {
  1: [
    { id: 'year', label: 'سنة الصنع', type: 'select', options: YEARS, required: true },
    { id: 'km', label: 'الممشى', type: 'number', suffix: 'كم', placeholder: '64,000' },
    { id: 'gear', label: 'ناقل الحركة', type: 'choice', options: ['أوتوماتيك', 'عادي'] },
  ],
  2: [
    { id: 'brand', label: 'الماركة', type: 'text', placeholder: 'مثل رولكس، أوميغا، كارتييه' },
    { id: 'box', label: 'المرفقات', type: 'choice', options: ['كامل المرفقات', 'العلبة فقط', 'بدون مرفقات'] },
  ],
  3: [
    { id: 'storage', label: 'السعة', type: 'choice', options: ['128GB', '256GB', '512GB', '1TB'] },
    { id: 'warranty', label: 'الضمان', type: 'choice', options: ['ضمان ساري', 'بدون ضمان'] },
  ],
  8: [{ id: 'plate', label: 'حروف وأرقام اللوحة', type: 'text', placeholder: 'مثل ر س ع 7' }],
};

const emptyDraft = () => ({ cat: 0, title: '', desc: '', city: '', condition: '', extra: {}, opening: 0, reserveOn: false, reserve: 0, days: 7, agree: false });
const state = { step: 0, draft: loadDraft(), photos: [], cover: 0, errors: {}, submitted: null, restored: false };

/* ---------- draft (kept in this browser; photos are not kept) ---------- */

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
    if (saved && typeof saved === 'object') return { ...emptyDraft(), ...saved, agree: false };
  } catch { /* storage blocked or corrupt: start fresh */ }
  return emptyDraft();
}
function saveDraft() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state.draft)); } catch { /* storage blocked: nothing to save */ }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* nothing to clear */ }
}
state.restored = Boolean(state.draft.cat || state.draft.title);

/* ---------- helpers ---------- */

const toNumber = (text) => Number(String(text).replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660)).replace(/\D/g, '')) || 0;
const commissionFor = (price) => Math.max(MIN_COMMISSION, Math.round(price * COMMISSION));
const fieldClass = (err) => `w-full rounded-full border-0 bg-mist px-5 py-3 text-[15px] text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${err ? 'ring-2 ring-accent-strong focus-visible:ring-accent-strong' : 'focus-visible:ring-primary'}`;
const help = (id, err, text) => `<p id="${id}-help" class="m-0 text-xs ${err ? 'font-semibold text-accent-ink' : 'text-ink-muted'}">${esc(err || text || '')}</p>`;

const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const xIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const upload = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/></svg>';

/* ---------- fields ---------- */

function textField({ id, label, value = '', placeholder = '', hint = '', required = false, suffix = '', numeric = false, maxlength = 80 }) {
  const err = state.errors[id];
  const input = `<input id="${id}" name="${id}" ${numeric ? 'inputmode="numeric" dir="ltr"' : ''} autocomplete="off" maxlength="${maxlength}"
      value="${esc(numeric && value ? formatNumber(value) : value)}" placeholder="${esc(placeholder)}" aria-describedby="${id}-help" ${err ? 'aria-invalid="true"' : ''}
      class="${suffix ? 'min-w-0 flex-1 border-0 bg-transparent py-3 text-[15px] font-semibold text-ink placeholder:font-normal placeholder:text-ink-muted focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0' : fieldClass(err)} ${numeric ? 'text-left tabular' : ''}">`;
  const box = suffix
    ? `<div class="flex items-center gap-2 rounded-full bg-mist px-5 focus-within:ring-2 ${err ? 'ring-2 ring-accent-strong focus-within:ring-accent-strong' : 'focus-within:ring-primary'}">${input}<span class="text-sm text-ink-muted">${suffix}</span></div>`
    : input;
  return `<div class="flex flex-col gap-2"><label for="${id}" class="text-sm font-semibold">${label}${required ? '' : ' <span class="font-normal text-ink-muted">(اختياري)</span>'}</label>${box}${help(id, err, hint)}</div>`;
}

function selectField({ id, label, options, value = '', placeholder = 'اختر', required = false }) {
  const err = state.errors[id];
  return `<div class="flex flex-col gap-2"><label for="${id}" class="text-sm font-semibold">${label}${required ? '' : ' <span class="font-normal text-ink-muted">(اختياري)</span>'}</label>
    <select id="${id}" name="${id}" aria-describedby="${id}-help" ${err ? 'aria-invalid="true"' : ''} class="select-pill ${fieldClass(err)} appearance-none pe-5 ps-12">
      <option value="">${placeholder}</option>
      ${options.map((o) => `<option ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}
    </select>${help(id, err, '')}</div>`;
}

function choiceField({ id, label, options, value = '', required = false }) {
  const err = state.errors[id];
  return `<fieldset class="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" ${err ? 'aria-invalid="true"' : ''} aria-describedby="${id}-help">
    <legend class="mb-2 p-0 text-sm font-semibold">${label}${required ? '' : ' <span class="font-normal text-ink-muted">(اختياري)</span>'}</legend>
    <div class="flex flex-wrap gap-2">
      ${options.map((o) => `<label class="cursor-pointer"><input type="radio" name="${id}" value="${esc(o)}" ${o === value ? 'checked' : ''} class="peer sr-only">
        <span class="block rounded-full border px-4 py-2 text-[13px] font-medium transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 ${err ? 'border-accent-strong' : 'border-[#E5E7EB] bg-white text-ink hover:border-ink/40'}">${esc(o)}</span></label>`).join('')}
    </div>${help(id, err, '')}</fieldset>`;
}

/* ---------- steps ---------- */

function categoryStep() {
  const err = state.errors.cat;
  return `
    <fieldset class="m-0 flex min-w-0 flex-col gap-4 border-0 p-0" aria-describedby="cat-help">
      <legend class="mb-1 p-0 text-lg font-bold">ماذا تريد أن تبيع؟</legend>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        ${data.categoryTiles.map((tile) => {
          const on = state.draft.cat === tile.cat;
          return `<label class="group cursor-pointer">
            <input type="radio" name="cat" value="${tile.cat}" ${on ? 'checked' : ''} class="peer sr-only">
            <span class="flex flex-col gap-2 rounded-[18px] border-2 bg-white p-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 ${on ? 'border-primary' : 'border-line group-hover:border-ink/30'}">
              <span class="relative block">${Media({ src: tile.img, className: 'aspect-[4/3] rounded-[12px]' })}
                ${on ? `<span class="absolute end-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-white">${check}</span>` : ''}</span>
              <span class="px-1 pb-1 text-sm font-semibold text-ink">${esc(data.categories[tile.cat])}</span>
            </span>
          </label>`;
        }).join('')}
      </div>
      ${help('cat', err, 'اختر الفئة الأقرب لمنتجك، وسنعرض لك الحقول المناسبة لها.')}
    </fieldset>`;
}

function detailsStep() {
  const d = state.draft;
  const extra = (EXTRA_FIELDS[d.cat] ?? []).map((f) => {
    const value = d.extra[f.id] ?? '';
    if (f.type === 'select') return selectField({ id: `x-${f.id}`, label: f.label, options: f.options, value, required: f.required });
    if (f.type === 'choice') return choiceField({ id: `x-${f.id}`, label: f.label, options: f.options, value, required: f.required });
    return textField({ id: `x-${f.id}`, label: f.label, value, placeholder: f.placeholder ?? '', suffix: f.suffix ?? '', numeric: f.type === 'number', required: f.required });
  }).join('');
  const descErr = state.errors.desc;
  return `
    <h2 class="m-0 text-lg font-bold">تفاصيل ${esc(data.categories[d.cat] ?? 'المنتج')}</h2>
    ${textField({ id: 'title', label: 'اسم المنتج', value: d.title, placeholder: TITLE_HINTS[d.cat] ?? '', hint: 'الماركة والموديل والسنة، كما يبحث عنها المشترون.', required: true, maxlength: 60 })}
    <div class="flex flex-col gap-2">
      <label for="desc" class="text-sm font-semibold">الوصف</label>
      <textarea id="desc" name="desc" rows="4" maxlength="600" aria-describedby="desc-help" ${descErr ? 'aria-invalid="true"' : ''}
        placeholder="الحالة، الصيانة، المرفقات، وأي عيوب يجب أن يعرفها المشتري."
        class="w-full resize-y rounded-[18px] border-0 bg-mist px-5 py-3.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${descErr ? 'ring-2 ring-accent-strong focus-visible:ring-accent-strong' : 'focus-visible:ring-primary'}">${esc(d.desc)}</textarea>
      <div class="flex justify-between gap-3">${help('desc', descErr, 'الوصف الصادق يرفع المزايدات ويقلل المرتجعات.')}<span id="desc-count" class="shrink-0 text-xs text-ink-muted tabular">${d.desc.length} / 600</span></div>
    </div>
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
      ${selectField({ id: 'city', label: 'المدينة', options: CITIES, value: d.city, placeholder: 'اختر المدينة', required: true })}
      ${extra}
    </div>
    ${NO_CONDITION.includes(d.cat) ? '' : choiceField({ id: 'condition', label: 'الحالة', options: CONDITIONS, value: d.condition, required: true })}`;
}

function photosStep() {
  const err = state.errors.photos;
  const tips = state.draft.cat === 1
    ? ['من الأمام والخلف والجانبين', 'المقصورة والعداد', 'المحرك والإطارات', 'أي خدوش أو عيوب بوضوح']
    : ['في ضوء النهار وعلى خلفية سادة', 'من أكثر من زاوية', 'الملصقات والأرقام التسلسلية', 'أي خدوش أو عيوب بوضوح'];
  const grid = state.photos.map((p, i) => `
    <li class="relative">
      <div class="media aspect-square rounded-[14px]"><img src="${p.url}" alt="${esc(`صورة ${i + 1}: ${p.name}`)}" class="is-loaded"></div>
      ${i === state.cover ? '<span class="absolute bottom-2 start-2 rounded-full bg-forest/[.93] px-2.5 py-1 text-[11px] font-semibold text-white">الغلاف</span>'
        : `<button type="button" data-cover="${i}" class="absolute bottom-2 start-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink shadow-float hover:text-primary">اجعلها الغلاف</button>`}
      <button type="button" data-remove-photo="${i}" class="absolute end-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-ink shadow-float hover:text-accent-strong" aria-label="حذف الصورة ${i + 1}">${xIcon}</button>
    </li>`).join('');
  return `
    <h2 class="m-0 text-lg font-bold">صور المنتج</h2>
    <label id="dropzone" for="photo-input" class="flex cursor-pointer flex-col items-center gap-2 rounded-[18px] border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-primary ${err ? 'border-accent-strong bg-accent-soft/40' : 'border-line bg-sand hover:border-primary hover:bg-primary-soft'}">
      <span class="text-primary">${upload}</span>
      <span class="text-[15px] font-semibold text-ink">اسحب الصور هنا أو اختر من جهازك</span>
      <span class="text-xs text-ink-muted">JPG أو PNG · حتى ${MAX_PHOTOS} صور · <span class="tabular">${state.photos.length} / ${MAX_PHOTOS}</span></span>
      <input id="photo-input" type="file" accept="image/*" multiple class="sr-only" aria-describedby="photos-help">
    </label>
    ${help('photos', err, 'الصورة الأولى هي الغلاف في نتائج البحث. ننصح بست صور أو أكثر.')}
    ${state.photos.length ? `<ul class="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">${grid}</ul>` : ''}
    <div class="rounded-[14px] bg-primary-soft px-4 py-3.5">
      <p class="m-0 mb-2 text-sm font-semibold text-ink">صوّر منتجك:</p>
      <ul class="m-0 grid list-none grid-cols-1 gap-1.5 p-0 text-[13px] text-ink-body sm:grid-cols-2">${tips.map((t) => `<li class="flex items-center gap-2"><span class="text-primary">${check}</span>${t}</li>`).join('')}</ul>
    </div>`;
}

function priceStep() {
  const d = state.draft;
  const sample = d.reserveOn && d.reserve ? d.reserve : d.opening;
  return `
    <h2 class="m-0 text-lg font-bold">السعر ومدة المزاد</h2>
    ${textField({ id: 'opening', label: 'سعر الافتتاح', value: d.opening, numeric: true, suffix: 'ر.س', placeholder: '60,000', required: true, hint: `أول مزايدة تبدأ من هذا السعر. الحد الأدنى ${formatPrice(MIN_OPENING)}.` })}
    <div class="flex flex-col gap-3 rounded-[18px] border border-line p-4">
      <label class="flex cursor-pointer items-start justify-between gap-4">
        <span class="flex flex-col gap-1"><b class="text-sm font-semibold">حد أدنى للبيع</b><span class="text-[13px] leading-relaxed text-ink-body">لن يُباع المنتج إذا انتهى المزاد تحته. بدونه تظهر شارة «بدون حد أدنى» وتجذب مزايدين أكثر.</span></span>
        <input id="reserveOn" type="checkbox" role="switch" ${d.reserveOn ? 'checked' : ''} class="peer sr-only">
        <span aria-hidden="true" class="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-line transition-colors after:absolute after:start-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-float after:transition-transform peer-checked:bg-primary peer-checked:after:-translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2"></span>
      </label>
      ${d.reserveOn ? textField({ id: 'reserve', label: 'الحد الأدنى', value: d.reserve, numeric: true, suffix: 'ر.س', required: true, hint: 'لا يظهر للمزايدين. يجب أن يكون أعلى من سعر الافتتاح أو مساوياً له.' }) : ''}
    </div>
    <fieldset class="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend class="mb-2 p-0 text-sm font-semibold">مدة المزاد</legend>
      <div class="grid grid-cols-3 gap-2">
        ${DURATIONS.map((n) => `<label class="cursor-pointer"><input type="radio" name="days" value="${n}" ${n === d.days ? 'checked' : ''} class="peer sr-only">
          <span class="flex flex-col items-center rounded-[14px] border px-3 py-3 text-center transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 border-[#E5E7EB] bg-white text-ink hover:border-ink/40">
            <b class="text-lg font-bold tabular">${n}</b><span class="text-xs">أيام</span></span></label>`).join('')}
      </div>
      <p class="m-0 text-xs text-ink-muted">يبدأ المزاد بعد مراجعة الطلب. ننصح بسبعة أيام للسيارات والعقارات.</p>
    </fieldset>
    <div class="flex flex-col gap-2.5 rounded-[18px] bg-sand p-4 text-[13px] text-ink-body">
      <div class="flex justify-between gap-3"><span>رسوم الإضافة</span><b class="font-semibold text-primary">مجاناً</b></div>
      <div class="flex justify-between gap-3"><span>عمولة البيع</span><b class="text-end font-semibold text-ink">5% من سعر البيع (لا تقل عن ${formatPrice(MIN_COMMISSION)})</b></div>
      <div class="flex justify-between gap-3 border-t border-line pt-2.5"><span>${d.reserveOn && d.reserve ? 'إذا بيع بالحد الأدنى تستلم' : 'إذا بيع بسعر الافتتاح تستلم'}</span><b id="net" class="font-semibold text-ink tabular">${sample ? formatPrice(sample - commissionFor(sample)) : '—'}</b></div>
    </div>`;
}

function reviewStep() {
  const d = state.draft;
  const extras = (EXTRA_FIELDS[d.cat] ?? []).filter((f) => d.extra[f.id]).map((f) => [f.label, f.type === 'number' ? `${formatNumber(Number(d.extra[f.id]))} ${f.suffix}` : d.extra[f.id]]);
  const group = (title, step, rows) => `
    <div class="flex flex-col gap-2 border-b border-line-soft pb-4 last:border-0">
      <div class="flex items-center justify-between gap-3"><h3 class="m-0 text-sm font-bold">${title}</h3><button type="button" data-goto="${step}" class="text-sm font-semibold text-primary hover:text-primary-dark">تعديل</button></div>
      <dl class="m-0 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">${rows.map(([k, v]) => `<div class="flex justify-between gap-3"><dt class="text-ink-muted">${esc(k)}</dt><dd class="m-0 text-end font-semibold text-ink">${esc(v)}</dd></div>`).join('')}</dl>
    </div>`;
  const err = state.errors.agree;
  return `
    <h2 class="m-0 text-lg font-bold">راجع طلبك</h2>
    <div class="flex flex-col gap-4">
      ${group('المنتج', 1, [['الفئة', data.categories[d.cat]], ['الاسم', d.title], ['المدينة', d.city], ...(d.condition && !NO_CONDITION.includes(d.cat) ? [['الحالة', d.condition]] : []), ...extras])}
      ${group('الصور', 2, [['عدد الصور', `${state.photos.length}`], ['الغلاف', state.photos[state.cover]?.name ?? '—']])}
      ${group('السعر والمدة', 3, [['سعر الافتتاح', formatPrice(d.opening)], ['الحد الأدنى', d.reserveOn ? formatPrice(d.reserve) : 'بدون حد أدنى'], ['المدة', `${d.days} أيام`]])}
    </div>
    <label class="flex cursor-pointer items-start gap-3 rounded-[14px] p-1 text-sm leading-relaxed text-ink-body">
      <input id="agree" type="checkbox" ${d.agree ? 'checked' : ''} aria-describedby="agree-help" ${err ? 'aria-invalid="true"' : ''} class="mt-1 h-4 w-4 shrink-0 accent-primary">
      <span>أؤكد أن المنتج ملكي وأن المعلومات والصور صحيحة، وأوافق على <a href="#" class="font-semibold">شروط البيع</a>.</span>
    </label>
    ${err ? help('agree', err, '') : ''}`;
}

function successView() {
  const s = state.submitted;
  return `
    <div class="flex flex-col items-center gap-5 px-6 py-12 text-center sm:px-10">
      <span class="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">${check.replace('h-4 w-4', 'h-8 w-8')}</span>
      <div class="flex flex-col gap-2">
        <h2 class="m-0 text-2xl font-bold">استلمنا طلبك</h2>
        <p class="m-0 text-[15px] text-ink-body">رقم الطلب <b class="font-semibold text-ink tabular" dir="ltr">${esc(s.ref)}</b> · ${esc(s.title)}</p>
      </div>
      <ol class="m-0 flex w-full max-w-md list-none flex-col gap-3 p-0 text-start">
        ${[['نراجع الطلب', 'خلال 48 ساعة، وقد نتواصل معك لتفاصيل إضافية.'], ...(s.cat === 1 ? [['فحص السيارة', 'نحدد موعداً لفحص معتمد مجاني قبل النشر.']] : []), ['ننشر المزاد', `لمدة ${s.days} أيام، ونرسل لك إشعاراً بكل مزايدة.`]]
          .map(([t, x], i) => `<li class="flex gap-3 rounded-[14px] bg-sand p-3.5"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white tabular">${i + 1}</span><span class="flex flex-col gap-0.5"><b class="text-sm font-semibold">${t}</b><span class="text-[13px] text-ink-body">${x}</span></span></li>`).join('')}
      </ol>
      <div class="flex flex-wrap justify-center gap-2.5">
        <a href="index.html" class="btn-primary px-7 py-3 text-sm">إلى الرئيسية</a>
        <button type="button" data-new class="btn-outline px-7 py-3 text-sm">أضف منتجاً آخر</button>
      </div>
    </div>`;
}

function gateView() {
  return `
    <div class="flex flex-col items-center gap-5 px-6 py-12 text-center sm:px-10">
      <div class="flex flex-col gap-2">
        <h2 class="m-0 text-2xl font-bold">سجّل دخولك لتبدأ البيع</h2>
        <p class="m-0 max-w-md text-[15px] leading-relaxed text-ink-body">نحتاج رقم جوالك لنتواصل معك بخصوص الطلب ونرسل لك المزايدات. يستغرق الدخول أقل من دقيقة.</p>
      </div>
      <a href="${loginHref('sell.html')}" class="btn-primary px-8 py-3.5 text-[15px]">سجّل الدخول وابدأ</a>
      <p class="m-0 text-xs text-ink-muted">ليس لديك حساب؟ نفس الخطوات تنشئ حسابك.</p>
    </div>`;
}

/* ---------- stepper & frame ---------- */

function stepper() {
  return `
    <div class="flex flex-col gap-3 border-b border-line-soft px-5 py-4 sm:px-8">
      <p class="m-0 text-[13px] text-ink-muted sm:hidden">الخطوة <span class="tabular">${state.step + 1}</span> من <span class="tabular">${STEPS.length}</span> · <b class="font-semibold text-ink">${STEPS[state.step]}</b></p>
      <ol class="m-0 flex list-none items-center gap-2 p-0" aria-label="خطوات الإضافة">
        ${STEPS.map((label, i) => {
          const done = i < state.step;
          const now = i === state.step;
          const dot = `<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold tabular ${done ? 'bg-primary-soft text-primary' : now ? 'bg-primary text-white' : 'bg-mist text-ink-muted'}">${done ? check : i + 1}</span>`;
          const name = `<span class="hidden whitespace-nowrap text-[13px] lg:inline ${now ? 'font-semibold text-ink' : 'text-ink-body'}">${label}</span>`;
          const item = done
            ? `<button type="button" data-goto="${i}" class="flex items-center gap-2 rounded-full hover:text-primary" aria-label="العودة إلى ${label}">${dot}${name}</button>`
            : `<span class="flex items-center gap-2" ${now ? 'aria-current="step"' : ''}>${dot}${name}</span>`;
          return `<li class="flex items-center gap-2 ${i < STEPS.length - 1 ? 'flex-1' : ''}">${item}${i < STEPS.length - 1 ? `<span class="h-0.5 min-w-3 flex-1 rounded-full ${done ? 'bg-primary' : 'bg-line'}" aria-hidden="true"></span>` : ''}</li>`;
        }).join('')}
      </ol>
    </div>`;
}

function render(focusFirstError = false) {
  const wizard = $('#wizard');
  if (!getUser()) { wizard.innerHTML = gateView(); renderPreview(); return; }
  if (state.submitted) { wizard.innerHTML = successView(); renderPreview(); return; }
  const views = [categoryStep, detailsStep, photosStep, priceStep, reviewStep];
  const last = state.step === STEPS.length - 1;
  wizard.innerHTML = `
    ${stepper()}
    <form id="step-form" novalidate class="flex flex-col gap-5 px-5 py-6 sm:px-8">
      ${state.restored && state.step === 0 ? '<p class="m-0 rounded-[14px] bg-primary-soft px-4 py-3 text-[13px] text-ink-body">أكملنا لك من مسودتك السابقة. الصور لا تُحفظ في المسودة، فأضفها من جديد.</p>' : ''}
      ${views[state.step]()}
    </form>
    <div class="flex items-center justify-between gap-3 border-t border-line-soft px-5 py-4 sm:px-8">
      ${state.step ? '<button type="button" data-back class="btn-outline px-6 py-3 text-sm">السابق</button>' : '<span></span>'}
      <button type="submit" form="step-form" class="btn-primary px-8 py-3 text-sm">${last ? 'أرسل للمراجعة' : 'التالي'}</button>
    </div>`;
  if (focusFirstError) wizard.querySelector('[aria-invalid="true"] input, [aria-invalid="true"], #dropzone.border-accent-strong input')?.focus();
  renderPreview();
}

function renderPreview() {
  const d = state.draft;
  const lot = {
    id: 'preview',
    name: d.title || 'اسم منتجك',
    sub: d.desc.split('\n')[0].slice(0, 70) || 'سطر من الوصف يظهر هنا',
    city: d.city || 'المدينة',
    bid: d.opening || 0,
    endsIn: d.days * 86400,
    noReserve: !d.reserveOn,
    img: state.photos[state.cover]?.url ?? '',
  };
  $('#preview').innerHTML = LotCard(lot, { remaining: lot.endsIn, watched: false });
}

/* ---------- validation ---------- */

function validate(step) {
  const d = state.draft;
  const e = {};
  if (step === 0 && !d.cat) e.cat = 'اختر فئة للمتابعة.';
  if (step === 1) {
    if (d.title.trim().length < 4) e.title = 'اكتب اسماً واضحاً للمنتج (4 أحرف على الأقل).';
    if (d.desc.trim().length > 0 && d.desc.trim().length < 20) e.desc = 'الوصف قصير. أضف تفاصيل الحالة والمرفقات (20 حرفاً على الأقل).';
    if (!d.city) e.city = 'اختر المدينة التي يوجد بها المنتج.';
    if (!NO_CONDITION.includes(d.cat) && !d.condition) e.condition = 'اختر حالة المنتج.';
    (EXTRA_FIELDS[d.cat] ?? []).filter((f) => f.required && !d.extra[f.id]).forEach((f) => { e[`x-${f.id}`] = `اختر ${f.label}.`; });
  }
  if (step === 2 && !state.photos.length) e.photos = 'أضف صورة واحدة على الأقل. المنتجات بست صور أو أكثر تحصل على مزايدات أكثر.';
  if (step === 3) {
    if (d.opening < MIN_OPENING) e.opening = `أدخل سعر افتتاح لا يقل عن ${formatPrice(MIN_OPENING)}.`;
    if (d.reserveOn && d.reserve < d.opening) e.reserve = 'الحد الأدنى يجب أن يساوي سعر الافتتاح أو يزيد عليه.';
  }
  if (step === 4 && !d.agree) e.agree = 'أكّد صحة المعلومات للمتابعة.';
  return e;
}

/* ---------- photos ---------- */

function addPhotos(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  const room = MAX_PHOTOS - state.photos.length;
  images.slice(0, room).forEach((f) => state.photos.push({ url: URL.createObjectURL(f), name: f.name }));
  state.errors = images.length > room ? { photos: `يمكن إضافة ${MAX_PHOTOS} صور كحد أقصى.` } : {};
  render();
}

/* ---------- events ---------- */

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'step-form') return;
  event.preventDefault();
  state.errors = validate(state.step);
  if (Object.keys(state.errors).length) { render(true); return; }
  if (state.step < STEPS.length - 1) {
    state.step += 1;
    state.restored = false;
    render();
    $('#wizard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#step-form input, #step-form select, #step-form textarea')?.focus({ preventScroll: true });
    return;
  }
  const d = state.draft;
  state.submitted = { ref: `SL-${String(Date.now()).slice(-6)}`, title: d.title, cat: d.cat, days: d.days };
  saveListing({ ...state.submitted, opening: d.opening, city: d.city, status: 'review', at: Date.now() });
  clearDraft();
  render();
  $('#wizard').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) { location.href = catHref(cat.dataset.cat); return; }
  if (t.closest('[data-back]')) { state.errors = {}; state.step -= 1; render(); return; }
  const go = t.closest('[data-goto]');
  if (go) { state.errors = {}; state.step = Number(go.dataset.goto); render(); return; }
  const cover = t.closest('[data-cover]');
  if (cover) { state.cover = Number(cover.dataset.cover); render(); return; }
  const remove = t.closest('[data-remove-photo]');
  if (remove) {
    const i = Number(remove.dataset.removePhoto);
    URL.revokeObjectURL(state.photos[i].url);
    state.photos.splice(i, 1);
    if (state.cover >= state.photos.length || state.cover === i) state.cover = 0;
    else if (i < state.cover) state.cover -= 1;
    render();
    return;
  }
  if (t.closest('[data-new]')) {
    state.photos.forEach((p) => URL.revokeObjectURL(p.url));
    Object.assign(state, { step: 0, draft: emptyDraft(), photos: [], cover: 0, errors: {}, submitted: null, restored: false });
    render();
  }
});

document.addEventListener('input', (event) => {
  const t = event.target;
  const d = state.draft;
  if (t.id === 'title') d.title = t.value;
  else if (t.id === 'desc') { d.desc = t.value; $('#desc-count').textContent = `${t.value.length} / 600`; }
  else if (t.id === 'opening') d.opening = toNumber(t.value);
  else if (t.id === 'reserve') d.reserve = toNumber(t.value);
  else if (t.id?.startsWith('x-') && t.tagName === 'INPUT' && t.type !== 'radio') d.extra[t.id.slice(2)] = t.inputMode === 'numeric' ? toNumber(t.value) : t.value;
  else return;
  if (state.errors[t.id]) {
    delete state.errors[t.id];
    t.removeAttribute('aria-invalid');
  }
  if (t.id === 'opening' || t.id === 'reserve') {
    const sample = d.reserveOn && d.reserve ? d.reserve : d.opening;
    $('#net').textContent = sample ? formatPrice(sample - commissionFor(sample)) : '—';
  }
  saveDraft();
  renderPreview();
});

document.addEventListener('change', (event) => {
  const t = event.target;
  const d = state.draft;
  if (t.name === 'cat') { if (d.cat !== Number(t.value)) { d.cat = Number(t.value); d.extra = {}; d.condition = ''; } state.errors = {}; render(); }
  else if (t.id === 'city') { d.city = t.value; delete state.errors.city; }
  else if (t.name === 'condition') { d.condition = t.value; delete state.errors.condition; render(); }
  else if (t.name === 'days') { d.days = Number(t.value); render(); }
  else if (t.id === 'reserveOn') { d.reserveOn = t.checked; delete state.errors.reserve; render(); $('#reserveOn').focus(); }
  else if (t.id === 'agree') { d.agree = t.checked; delete state.errors.agree; render(); }
  else if (t.id === 'photo-input') { addPhotos(t.files); return; }
  else if (t.name?.startsWith('x-') && (t.tagName === 'SELECT' || t.type === 'radio')) {
    d.extra[t.name.slice(2)] = t.value;
    delete state.errors[t.name];
    render();
  }
  else if (t.id === 'opening' || t.id === 'reserve') { t.value = (t.id === 'opening' ? d.opening : d.reserve) ? formatNumber(t.id === 'opening' ? d.opening : d.reserve) : ''; }
  saveDraft();
  renderPreview();
});

// Drag and drop photos onto the drop zone.
document.addEventListener('dragover', (event) => {
  const zone = event.target.closest?.('#dropzone');
  if (!zone) return;
  event.preventDefault();
  zone.classList.add('border-primary', 'bg-primary-soft');
});
document.addEventListener('dragleave', (event) => {
  event.target.closest?.('#dropzone')?.classList.remove('border-primary', 'bg-primary-soft');
});
document.addEventListener('drop', (event) => {
  if (!event.target.closest?.('#dropzone')) return;
  event.preventDefault();
  addPhotos(event.dataTransfer.files);
});

/* ---------- start ---------- */

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
$('#how-list').innerHTML = [
  ['أضف منتجك', 'في خمس خطوات من هنا، والإضافة مجانية.'],
  ['نراجع ونفحص', 'خلال 48 ساعة، مع فحص معتمد مجاني للسيارات.'],
  ['يبدأ المزاد', 'لمدة 3 إلى 7 أيام، وتصلك كل مزايدة.'],
  ['استلم مبلغك', 'بعد تسليم المنتج للمشتري، خلال 3 أيام عمل.'],
].map(([t, x], i) => `
  <li class="flex gap-3">
    <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary tabular">${i + 1}</span>
    <span class="flex flex-col gap-0.5"><b class="text-sm font-semibold">${t}</b><span class="text-[13px] leading-relaxed text-ink-body">${x}</span></span>
  </li>`).join('');
render();
