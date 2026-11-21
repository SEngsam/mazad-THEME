import * as data from './data.js';
import { esc } from './components.js';
import { catHref, catNavHTML, getUser, renderShell } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);

/* ---------- content ---------- */

const SECTIONS = [
  ['how-to-bid', 'كيف أزايد'],
  ['fees', 'الرسوم'],
  ['protection', 'حماية المشتري'],
  ['selling', 'البيع في مزاد'],
  ['faq', 'الأسئلة الشائعة'],
  ['terms', 'الشروط والخصوصية'],
  ['contact', 'تواصل معنا'],
];

const BID_STEPS = [
  ['سجّل دخولك', 'برقم جوالك ورمز تحقق، أو عبر نفاذ. نفس الخطوات تنشئ حساباً جديداً.'],
  ['اختر المزاد وادفع التأمين', 'تأمين 5% من مزايدتك الأولى (من 500 إلى 5,000 ر.س)، يُسترد كاملاً إذا لم تفز.'],
  ['زايد', 'اختر المبلغ أو إحدى المزايدات السريعة، ثم أكّد. كل مزايدة ملزمة إذا فزت.'],
  ['تابع المزاد', 'نرسل لك رسالة إذا تجاوزك أحد. أي مزايدة في آخر دقيقتين تمدد المزاد دقيقتين.'],
  ['ادفع واستلم', 'إذا فزت، ادفع خلال 48 ساعة من «مشترياتي»، واختر التوصيل أو الاستلام.'],
];

const FEES = [
  ['إضافة منتج للبيع', '—', 'مجاناً'],
  ['العمولة', '2.5% من سعر الفوز', '5% من سعر البيع، لا تقل عن 100 ر.س'],
  ['تأمين المزايدة', '5% من أول مزايدة (500 – 5,000 ر.س)، يُسترد أو يُخصم من المبلغ', '—'],
  ['التوصيل المؤمَّن', '75 ر.س للساعات والجوالات والمجوهرات والتحف', '—'],
  ['فحص السيارات', '—', 'مجاناً قبل النشر'],
];

const PROTECTION = [
  ['أموالك عندنا حتى تستلم', 'لا نحوّل المبلغ للبائع حتى تؤكد استلام المنتج.'],
  ['مطابق للوصف أو تسترد', 'إذا وصلك المنتج مختلفاً عن وصفه، أبلغنا خلال 48 ساعة من الاستلام ونعيد لك المبلغ.'],
  ['بائعون موثّقون بنفاذ', 'كل بائع ومزايد متحقق من هويته قبل أول عملية.'],
  ['فحص قبل المزاد', 'تقرير فحص معتمد لكل سيارة، وشهادة أصالة للساعات والمجوهرات.'],
];

const SELL_STEPS = [
  ['أضف منتجك', 'في خمس خطوات: الفئة، التفاصيل، الصور، السعر والمدة، المراجعة.'],
  ['نراجع ونفحص', 'خلال 48 ساعة، مع فحص معتمد مجاني للسيارات.'],
  ['يبدأ المزاد', 'لمدة 3 أو 5 أو 7 أيام، وتصلك كل مزايدة.'],
  ['استلم مبلغك', 'بعد تسليم المنتج وتأكيد المشتري، خلال 3 أيام عمل.'],
];

const FAQ = [
  ['المزايدة', [
    ['هل المزايدة ملزمة؟', 'نعم. إذا انتهى المزاد ومزايدتك هي الأعلى فأنت ملزم بالشراء. لذلك نطلب تأكيداً قبل كل مزايدة.'],
    ['ما هو تأمين المزايدة؟', 'مبلغ نحجزه عند أول مزايدة لك على المزاد: 5% منها، بحد أدنى 500 ر.س وأقصى 5,000 ر.س. إذا لم تفز نعيده كاملاً خلال 3 أيام عمل، وإذا فزت يُخصم من المبلغ المطلوب.'],
    ['لماذا تمدد المزاد بعد مزايدتي؟', 'أي مزايدة في آخر دقيقتين تمدد المزاد دقيقتين، ليتمكن الآخرون من الرد. هذا يمنع الفوز بمزايدة في آخر ثانية.'],
    ['ماذا يعني «بدون حد أدنى»؟', 'يُباع المنتج لأعلى مزايدة مهما كانت. المزادات الأخرى لها حد أدنى سري لا يُباع المنتج تحته.'],
    ['كيف أعرف أن أحداً تجاوز مزايدتي؟', 'نرسل لك رسالة نصية فوراً، وتظهر الحالة «تم تجاوزك» في «مزايداتي». يمكنك إيقاف الرسائل من الإعدادات.'],
  ]],
  ['الدفع والاستلام', [
    ['متى يجب أن أدفع بعد الفوز؟', 'خلال 48 ساعة من انتهاء المزاد، من «حسابي» ثم «مشترياتي». يظهر لك الموعد والوقت المتبقي.'],
    ['ما طرق الدفع المتاحة؟', 'مدى، فيزا، ماستركارد، Apple Pay، أو التقسيط مع تابي (4 دفعات) أو تمارا (3 دفعات) بدون فوائد.'],
    ['كيف أستلم السيارة؟', 'من موقع البائع بموعد نرسله لك، وننقل الملكية عبر أبشر بحضور مندوب مزاد.'],
    ['هل توصلون لكل المدن؟', 'نوصل الساعات والجوالات والمجوهرات والتحف لكل مدن المملكة خلال 2 إلى 4 أيام عمل.'],
  ]],
  ['البيع', [
    ['كم تكلفة البيع في مزاد؟', 'الإضافة مجانية. نأخذ 5% من سعر البيع فقط إذا بيع المنتج، بحد أدنى 100 ر.س.'],
    ['متى أستلم مبلغي؟', 'خلال 3 أيام عمل بعد أن يستلم المشتري المنتج ويؤكد مطابقته للوصف.'],
    ['ماذا لو لم يصل المزاد للحد الأدنى؟', 'لا يُباع المنتج ولا ندفعك شيئاً. يمكنك إعادة عرضه أو تعديل الحد الأدنى من «منتجاتي».'],
  ]],
  ['الحساب', [
    ['كيف أوثّق هويتي بنفاذ؟', 'من «حسابي» ثم «الإعدادات» ثم «وثّق هويتك بنفاذ». اختر الرقم الظاهر في تطبيق نفاذ.'],
    ['هل يرى البائع اسمي ورقمي؟', 'لا. تظهر في المزايدات «مزايد #رقم». يرى البائع اسمك فقط بعد فوزك ودفعك.'],
  ]],
];

/* ---------- helpers ---------- */

const normalise = (text) => String(text)
  .replace(/[ً-ْـ]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
  .toLowerCase();

const ICONS = {
  'how-to-bid': '<path d="M14.5 4.5 19.5 9.5M12 7l5 5M8.5 10.5l5 5M4 20l6.5-6.5"/><path d="m11 6 2-2 7 7-2 2z"/>',
  fees: '<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M3.5 10h17M7.5 14.5h3"/>',
  protection: '<path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  selling: '<path d="M3.5 12.5 11 5h8v8l-7.5 7.5a1.4 1.4 0 0 1-2 0l-6-6a1.4 1.4 0 0 1 0-2Z"/><circle cx="15" cy="9" r="1.5"/>',
  faq: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.3M12 16.5h.01"/>',
  terms: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/>',
  contact: '<path d="M5.5 4.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 4 6.1 1.5 1.5 0 0 1 5.5 4.5Z"/>',
};
const icon = (id, cls = 'h-5 w-5') => `<svg aria-hidden="true" viewBox="0 0 24 24" class="${cls} shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[id]}</svg>`;
const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const chevron = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

const sectionWrap = (id, title, body, sub = '') => `
  <section id="${id}" aria-labelledby="${id}-title" class="flex scroll-mt-48 flex-col gap-4 lg:scroll-mt-40">
    <div class="flex flex-col gap-1">
      <h2 id="${id}-title" class="section-title">${title}</h2>
      ${sub ? `<p class="m-0 text-[15px] text-ink-body">${sub}</p>` : ''}
    </div>
    ${body}
  </section>`;

const steps = (list) => `
  <ol class="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 ${list.length === 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}">
    ${list.map(([t, x], i) => `<li class="card flex flex-col gap-2 p-4">
      <span class="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-bold text-white tabular">${i + 1}</span>
      <b class="text-[15px] font-semibold">${t}</b><span class="text-[13px] leading-relaxed text-ink-body">${x}</span></li>`).join('')}
  </ol>`;

const faqItem = ([q, a], open = false) => `
  <details class="group border-b border-line-soft last:border-0" ${open ? 'open' : ''}>
    <summary class="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold text-ink hover:text-primary [&::-webkit-details-marker]:hidden">${esc(q)}${chevron}</summary>
    <p class="m-0 pb-4 text-sm leading-[1.8] text-ink-body">${esc(a)}</p>
  </details>`;

/* ---------- views ---------- */

function head() {
  return `
    <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted">
      <ol class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li><a href="index.html" class="text-ink-body hover:text-primary">الرئيسية</a></li><li aria-hidden="true">‹</li><li aria-current="page" class="text-ink">مركز المساعدة</li>
      </ol>
    </nav>
    <div class="on-dark flex flex-col gap-5 rounded-[22px] bg-forest p-6 text-white sm:rounded-hero sm:p-10">
      <div class="flex flex-col gap-2">
        <h1 class="m-0 text-2xl font-bold leading-[1.35] sm:text-[30px]">كيف نقدر نساعدك؟</h1>
        <p class="m-0 text-[15px] leading-[1.8] text-white/85">إجابات عن المزايدة والدفع والبيع، أو تواصل معنا مباشرة.</p>
      </div>
      <form id="help-search" role="search" class="flex max-w-2xl items-center rounded-full bg-white p-1 focus-within:ring-2 focus-within:ring-lime" onsubmit="return false">
        <label for="hq" class="sr-only">ابحث في الأسئلة الشائعة</label>
        <input id="hq" type="search" autocomplete="off" placeholder="مثل: تأمين المزايدة، التقسيط، نقل الملكية"
          class="min-w-0 flex-1 rounded-full border-0 bg-transparent px-5 py-3 text-[15px] text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
        <button type="submit" class="btn-lime px-6 py-3 text-sm">بحث</button>
      </form>
    </div>
    <div id="search-results" aria-live="polite"></div>
    <ul id="topics" class="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-6">
      ${SECTIONS.filter(([id]) => id !== 'terms').map(([id, label]) => `<li><a href="#${id}" class="card flex h-full flex-col gap-3 p-4 text-ink hover:border-primary hover:text-ink">
        <span class="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">${icon(id)}</span><b class="text-sm font-semibold">${label}</b></a></li>`).join('')}
    </ul>`;
}

function body() {
  const contactForm = `
    <form id="contact-form" novalidate class="card flex flex-col gap-4 p-5 sm:p-6">
      <h3 class="m-0 text-base font-bold">اكتب لنا</h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-2"><label for="c-topic" class="text-sm font-semibold">الموضوع</label>
          <select id="c-topic" class="select-pill w-full appearance-none rounded-full border-0 bg-mist py-3 pe-5 ps-12 text-[15px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0">
            <option>مزايدة أو مزاد</option><option>الدفع والاستلام</option><option>البيع في مزاد</option><option>الإعلان معنا</option><option>غير ذلك</option>
          </select></div>
        <div class="flex flex-col gap-2"><label for="c-phone" class="text-sm font-semibold">رقم الجوال للرد</label>
          <input id="c-phone" type="tel" inputmode="tel" dir="ltr" autocomplete="tel-national" placeholder="5X XXX XXXX" value="${getUser() ? `0${esc(getUser().phone)}` : ''}"
            class="w-full rounded-full border-0 bg-mist px-5 py-3 text-left text-[15px] text-ink tabular placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0" aria-describedby="c-phone-help">
          <p id="c-phone-help" class="m-0 text-xs text-ink-muted"></p></div>
      </div>
      <div class="flex flex-col gap-2"><label for="c-msg" class="text-sm font-semibold">رسالتك</label>
        <textarea id="c-msg" rows="4" maxlength="800" placeholder="اكتب رقم اللوت أو الطلب إن وُجد، وكيف نقدر نساعدك." aria-describedby="c-msg-help"
          class="w-full resize-y rounded-[18px] border-0 bg-mist px-5 py-3.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"></textarea>
        <p id="c-msg-help" class="m-0 text-xs text-ink-muted"></p></div>
      <button type="submit" class="btn-primary self-start px-7 py-3 text-sm">أرسل</button>
    </form>`;
  return [
    sectionWrap('how-to-bid', 'كيف أزايد', `${steps(BID_STEPS)}<a href="search.html" class="btn-outline self-start px-6 py-2.5 text-sm">تصفّح المزادات المفتوحة</a>`, 'خمس خطوات من التسجيل حتى استلام ما فزت به.'),
    sectionWrap('fees', 'الرسوم', `
      <ul class="m-0 flex list-none flex-col gap-px overflow-hidden rounded-card border border-line bg-line-soft p-0 sm:hidden">
        ${FEES.map(([k, b, s]) => `<li class="flex flex-col gap-1.5 bg-white px-4 py-3.5 text-[13px]"><b class="text-sm font-semibold text-ink">${k}</b>
          <span class="flex gap-2"><span class="w-14 shrink-0 text-ink-muted">المشتري</span><span class="text-ink-body">${b}</span></span>
          <span class="flex gap-2"><span class="w-14 shrink-0 text-ink-muted">البائع</span><span class="${s.startsWith('مجاناً') ? 'font-semibold text-primary' : 'text-ink-body'}">${s}</span></span></li>`).join('')}
      </ul>
      <div class="card hidden overflow-x-auto sm:block">
        <table class="w-full border-collapse text-sm">
          <thead><tr class="bg-sand text-start text-[13px] text-ink-muted"><th scope="col" class="px-5 py-3 text-start font-semibold">البند</th><th scope="col" class="px-5 py-3 text-start font-semibold">المشتري</th><th scope="col" class="px-5 py-3 text-start font-semibold">البائع</th></tr></thead>
          <tbody>${FEES.map(([k, b, s]) => `<tr class="border-t border-line-soft"><th scope="row" class="px-5 py-3.5 text-start font-semibold text-ink">${k}</th><td class="px-5 py-3.5 text-ink-body">${b}</td><td class="px-5 py-3.5 ${s.startsWith('مجاناً') ? 'font-semibold text-primary' : 'text-ink-body'}">${s}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="flex flex-col gap-2 rounded-card bg-primary-soft p-5 text-sm text-ink-body sm:p-6">
        <b class="text-[15px] font-semibold text-ink">مثال: فزت بخاتم بـ 26,900 ر.س واستلمته من البائع</b>
        <span>26,900 + عمولة 673 − تأمين مدفوع 1,300 = <b class="font-semibold text-ink tabular">26,273 ر.س</b> تدفعها بعد الفوز.</span>
      </div>`, 'لا رسوم على التسجيل أو التصفح. تدفع فقط عند بيع أو شراء فعلي.'),
    sectionWrap('protection', 'حماية المشتري', `
      <div class="grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line bg-line-soft sm:grid-cols-2">
        ${PROTECTION.map(([t, x]) => `<div class="flex gap-3 bg-white p-5"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">${check}</span><span class="flex flex-col gap-1"><b class="text-[15px] font-semibold">${t}</b><span class="text-[13px] leading-[1.7] text-ink-body">${x}</span></span></div>`).join('')}
      </div>`),
    sectionWrap('selling', 'البيع في مزاد', `${steps(SELL_STEPS)}<a href="sell.html" class="btn-primary self-start px-6 py-2.5 text-sm">ابدأ البيع</a>`, 'اعرض سيارتك أو مقتنياتك لآلاف المزايدين في المملكة.'),
    sectionWrap('faq', 'الأسئلة الشائعة', `<div class="grid grid-cols-1 gap-5 xl:grid-cols-2">${FAQ.map(([group, items]) => `
      <div class="card flex flex-col px-5 pt-2 sm:px-6"><h3 class="m-0 pb-1 pt-4 text-sm font-bold text-primary">${group}</h3>${items.map((it) => faqItem(it)).join('')}</div>`).join('')}</div>`),
    sectionWrap('terms', 'الشروط والخصوصية', `
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div class="card flex flex-col gap-3 p-5 sm:p-6"><h3 class="m-0 text-base font-bold">أهم شروط الشراء والبيع</h3>
          <ul class="m-0 flex list-disc flex-col gap-2 ps-5 text-sm leading-[1.8] text-ink-body">
            <li>المزايدة ملزمة؛ عدم الدفع خلال 48 ساعة من الفوز يُفقدك التأمين ويوقف حسابك عن المزايدة.</li>
            <li>البائع مسؤول عن صحة الوصف والصور، ونلغي البيع إذا لم يطابق المنتج وصفه.</li>
            <li>لا يحق للبائع إلغاء المزاد بعد أول مزايدة.</li>
            <li>نحتفظ بالمبلغ حتى يؤكد المشتري الاستلام، ثم نحوّله للبائع خلال 3 أيام عمل.</li>
          </ul></div>
        <div id="privacy" class="card flex scroll-mt-48 flex-col gap-3 p-5 sm:p-6 lg:scroll-mt-40"><h3 class="m-0 text-base font-bold">سياسة الخصوصية باختصار</h3>
          <ul class="m-0 flex list-disc flex-col gap-2 ps-5 text-sm leading-[1.8] text-ink-body">
            <li>نستخدم رقم جوالك للدخول والتنبيهات فقط، ولا نعرضه لأحد.</li>
            <li>في المزايدات يظهر «مزايد #رقم» بدلاً من اسمك.</li>
            <li>بيانات البطاقة تُعالَج لدى بوابة الدفع ولا نحفظها.</li>
            <li>يمكنك إيقاف رسائل العروض من الإعدادات متى شئت.</li>
          </ul></div>
      </div>`),
    sectionWrap('contact', 'تواصل معنا', `
      <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        ${contactForm}
        <div class="card flex flex-col gap-4 p-5 sm:p-6">
          <div class="flex flex-col gap-1"><span class="text-[13px] text-ink-muted">الهاتف الموحد</span><a href="tel:920012345" class="text-2xl font-bold text-ink tabular hover:text-primary">920012345</a></div>
          <div class="flex flex-col gap-1 border-t border-line-soft pt-4"><span class="text-[13px] text-ink-muted">ساعات العمل</span><b class="text-sm font-semibold">يومياً من 9 صباحاً إلى 11 مساءً</b></div>
          <div class="flex flex-col gap-1 border-t border-line-soft pt-4"><span class="text-[13px] text-ink-muted">للإعلان في مزاد</span><span class="text-sm text-ink-body">اختر «الإعلان معنا» في النموذج، ويتواصل معك فريق الإعلانات خلال يوم عمل.</span></div>
        </div>
      </div>`, 'نرد على الرسائل خلال ساعات العمل، عادة خلال ساعتين.'),
  ].join('');
}

function sideNav() {
  return `<ul class="card m-0 flex list-none flex-col gap-1 p-2">${SECTIONS.map(([id, label]) => `
    <li><a href="#${id}" data-nav="${id}" class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-sand hover:text-ink">${icon(id, 'h-[18px] w-[18px]')}${label}</a></li>`).join('')}</ul>`;
}

/* ---------- search ---------- */

function renderSearch(q) {
  const out = $('#search-results');
  const words = normalise(q).split(/\s+/).filter(Boolean);
  if (!words.length) { out.innerHTML = ''; $('#topics').classList.remove('hidden'); return; }
  const hits = FAQ.flatMap(([, items]) => items).filter(([qq, a]) => {
    const hay = normalise(`${qq} ${a}`);
    return words.every((w) => hay.includes(w));
  });
  $('#topics').classList.add('hidden');
  out.innerHTML = hits.length
    ? `<div class="flex flex-col gap-3"><p class="m-0 text-sm text-ink-body"><b class="font-semibold text-ink tabular">${hits.length}</b> ${hits.length === 1 ? 'إجابة' : 'إجابات'} عن «${esc(q.trim())}»</p>
        <div class="card flex flex-col px-5 sm:px-6">${hits.map((h) => faqItem(h, true)).join('')}</div></div>`
    : `<div class="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-white px-6 py-8 text-center">
        <p class="m-0 text-base font-semibold text-ink">لا توجد إجابة عن «${esc(q.trim())}»</p>
        <p class="m-0 text-sm text-ink-body">جرّب كلمة أخرى، أو اكتب لنا ونرد عليك.</p>
        <a href="#contact" class="btn-outline px-6 py-2.5 text-sm">تواصل معنا</a>
      </div>`;
}

/* ---------- events ---------- */

document.addEventListener('input', (event) => {
  if (event.target.id === 'hq') renderSearch(event.target.value);
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'contact-form') return;
  event.preventDefault();
  const phone = $('#c-phone');
  const msg = $('#c-msg');
  const digits = phone.value.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660)).replace(/\D/g, '').replace(/^(00966|966|0)/, '');
  const okPhone = /^5\d{8}$/.test(digits);
  const okMsg = msg.value.trim().length >= 10;
  const mark = (el, ok, text) => {
    el.toggleAttribute('aria-invalid', !ok);
    el.classList.toggle('ring-2', !ok);
    el.classList.toggle('ring-accent-strong', !ok);
    const h = $(`#${el.id}-help`);
    h.textContent = ok ? '' : text;
    h.className = `m-0 text-xs ${ok ? 'text-ink-muted' : 'font-semibold text-accent-ink'}`;
  };
  mark(phone, okPhone, 'اكتب رقم جوال سعودي يبدأ بـ 5 لنرد عليك.');
  mark(msg, okMsg, 'اكتب رسالتك (10 أحرف على الأقل).');
  if (!okPhone) { phone.focus(); return; }
  if (!okMsg) { msg.focus(); return; }
  event.target.innerHTML = `
    <div class="flex flex-col items-center gap-3 py-6 text-center" role="status">
      <span class="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">${check.replace('h-4 w-4', 'h-6 w-6')}</span>
      <b class="text-base font-bold">وصلتنا رسالتك</b>
      <span class="text-sm text-ink-body">رقم المتابعة <b dir="ltr" class="font-semibold text-ink tabular">HC-${String(Date.now()).slice(-5)}</b>. نرد عليك على <span dir="ltr" class="tabular">+966 ${digits.slice(0, 2)} ••• ${digits.slice(5)}</span> خلال ساعات العمل.</span>
    </div>`;
});

document.addEventListener('click', (event) => {
  const cat = event.target.closest('#cat-nav [data-cat]');
  if (cat) location.href = catHref(cat.dataset.cat);
});

/* Highlight the section in view in the side nav. */
function watchSections() {
  const links = new Map([...document.querySelectorAll('[data-nav]')].map((a) => [a.dataset.nav, a]));
  const setActive = (id) => links.forEach((a, key) => {
    const on = key === id;
    a.classList.toggle('bg-primary-soft', on);
    a.classList.toggle('text-primary', on);
    a.classList.toggle('font-semibold', on);
    if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
  });
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (visible) setActive(visible.target.id);
  }, { rootMargin: '-160px 0px -55% 0px' });
  SECTIONS.forEach(([id]) => observer.observe(document.getElementById(id)));
}

/* ---------- start ---------- */

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
$('#help-head').innerHTML = head();
$('#help-nav').innerHTML = sideNav();
$('#help-body').innerHTML = body();
watchSections();
if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
