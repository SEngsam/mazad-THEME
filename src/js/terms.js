import * as data from './data.js';
import { catHref, catNavHTML, renderShell } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);

/* ---------- content ---------- */

const TERMS = [
  ['t-about', 'التعريف', [
    'مزادي منصة إلكترونية تتيح للأفراد والمنشآت عرض منتجاتهم للبيع بالمزاد العلني، وتتيح للمستخدمين المزايدة عليها.',
    'يُقصد بـ«المنصة» موقع مزادي وتطبيقاته، وبـ«المستخدم» كل من يسجّل فيها، مزايداً كان أو بائعاً.',
  ]],
  ['t-account', 'التسجيل والحساب', [
    'يُشترط للتسجيل أن يكون عمر المستخدم 18 عاماً فأكثر، وأن يوثّق هويته عبر نفاذ قبل أول مزايدة أو عرض.',
    'المستخدم مسؤول عن سرية رمز الدخول وعن كل ما يتم عبر حسابه، وعليه إبلاغنا فوراً عن أي استخدام غير مصرح به.',
    'يحق لمزادي إيقاف أي حساب يخالف هذه الشروط أو يقدّم بيانات غير صحيحة.',
  ]],
  ['t-bidding', 'المزايدة', [
    'كل مزايدة ملزمة لصاحبها، ولا يجوز سحبها بعد تأكيدها.',
    'يُحجز تأمين قدره 5% من أول مزايدة على المزاد، بحد أدنى 500 ر.س وأقصى 5,000 ر.س، ويُسترد كاملاً إذا لم يفز المزايد.',
    'أي مزايدة في آخر دقيقتين تمدد المزاد دقيقتين.',
    'يُحظر المزايدة الصورية أو الاتفاق بين المستخدمين على التأثير في السعر.',
  ]],
  ['t-selling', 'التزامات البائع', [
    'يلتزم البائع بأن يكون المنتج مملوكاً له، وأن يكون وصفه وصوره مطابقة لحالته الفعلية.',
    'لا يجوز للبائع المزايدة على منتجاته، ولا إلغاء المزاد بعد أول مزايدة.',
    'يلتزم البائع بتسليم المنتج للفائز خلال المدة المحددة، ونقل ملكيته عند الحاجة.',
  ]],
  ['t-payment', 'الدفع والرسوم', [
    'يدفع الفائز المبلغ خلال 48 ساعة من انتهاء المزاد عبر وسائل الدفع المتاحة في المنصة فقط.',
    'عمولة المشتري 2.5% من سعر الفوز، وعمولة البائع 5% من سعر البيع بحد أدنى 100 ر.س.',
    'تحتفظ مزادي بالمبلغ حتى يؤكد المشتري الاستلام، ثم تحوّله للبائع خلال 3 أيام عمل.',
    'إذا لم يدفع الفائز في الموعد يُخصم التأمين، ويحق لمزادي إيقاف حسابه.',
  ]],
  ['t-delivery', 'الاستلام والاسترداد', [
    'يختار الفائز التوصيل المؤمَّن أو الاستلام من البائع حسب ما يتيحه المزاد.',
    'إذا وصل المنتج مخالفاً لوصفه، يبلّغ المشتري خلال 48 ساعة من الاستلام، وتعيد مزادي المبلغ بعد التحقق.',
  ]],
  ['t-prohibited', 'المنتجات والمحتوى المحظور', [
    'يُحظر عرض أي منتج تمنع الأنظمة في المملكة العربية السعودية بيعه أو تداوله، أو منتج مقلّد، أو مجهول المصدر.',
    'يُحظر نشر بيانات التواصل الشخصية أو طلب الدفع خارج المنصة في الوصف أو الأسئلة أو الرسائل.',
  ]],
  ['t-liability', 'المسؤولية', [
    'مزادي وسيط بين البائع والمشتري، ولا تتحمل مسؤولية العيوب الخفية التي لم يظهرها تقرير الفحص أو الوصف.',
    'تبذل مزادي جهدها لاستمرار الخدمة، ولا تضمن خلوها من الانقطاع.',
  ]],
  ['t-law', 'النظام المطبّق', [
    'تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وتختص محاكم مدينة الرياض بالنظر في أي نزاع ينشأ عنها.',
    'يحق لمزادي تعديل هذه الشروط، وتُشعر المستخدمين بأي تعديل جوهري قبل سريانه بسبعة أيام.',
  ]],
];

const PRIVACY = [
  ['p-collect', 'البيانات التي نجمعها', [
    'الاسم ورقم الجوال وبيانات الهوية الموثّقة عبر نفاذ.',
    'سجل المزايدات والمشتريات والمبيعات والرسائل داخل المنصة.',
    'بيانات الجهاز والموقع التقريبي لتحسين الخدمة وحماية الحسابات.',
  ]],
  ['p-use', 'كيف نستخدمها', [
    'لتنفيذ المزايدات والمدفوعات والتسليم، وإرسال التنبيهات التي تختارها.',
    'للتحقق من الهوية ومنع الاحتيال وحل النزاعات بين المستخدمين.',
  ]],
  ['p-share', 'مشاركة البيانات', [
    'لا نبيع بياناتك. نشارك ما يلزم فقط مع شركاء الدفع والشحن والفحص لتنفيذ طلبك، أو مع الجهات الرسمية عند الطلب النظامي.',
    'لا يظهر رقم جوالك للبائع أو المزايدين، وفي سجل المزايدات يظهر «مزايد #رقم» بدلاً من اسمك.',
  ]],
  ['p-rights', 'حقوقك', [
    'يحق لك الاطلاع على بياناتك وتصحيحها، وطلب حذف حسابك من صفحة الإعدادات، ما لم تكن لديك عمليات قائمة.',
    'نحتفظ بسجلات العمليات المالية المدة التي تفرضها الأنظمة.',
  ]],
];

const UPDATED = '1 نوفمبر 2026';

/* ---------- render ---------- */

const section = ([id, title, items], n) => `
  <section id="${id}" aria-labelledby="${id}-h" class="flex scroll-mt-48 flex-col gap-3 border-b border-line-soft pb-6 last:border-0 last:pb-0 lg:scroll-mt-40">
    <h3 id="${id}-h" class="m-0 flex items-baseline gap-2.5 text-base font-bold"><span class="tabular text-primary">${n}.</span>${title}</h3>
    <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
      ${items.map((t) => `<li class="relative ps-4 text-[15px] leading-[1.8] text-ink-body before:absolute before:start-0 before:top-[0.8em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary/40">${t}</li>`).join('')}
    </ul>
  </section>`;

const tocLinks = (list) => list.map(([id, title]) => `<li><a href="#${id}" data-toc="${id}" class="block rounded-lg px-3 py-1.5 text-[13px] text-ink-body hover:bg-sand hover:text-ink">${title}</a></li>`).join('');

$('#terms-root').innerHTML = `
  <header class="flex flex-col gap-2">
    <h1 class="m-0 text-2xl font-bold sm:text-[28px]">الشروط والأحكام وسياسة الخصوصية</h1>
    <p class="m-0 text-[13px] text-ink-muted">آخر تحديث: ${UPDATED}</p>
  </header>
  <div class="mt-5 grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
    <nav aria-label="محتويات الصفحة" class="card hidden p-3 lg:sticky lg:top-[136px] lg:block">
      <p class="m-0 px-3 pb-1 pt-1 text-xs font-semibold text-ink-muted">الشروط والأحكام</p>
      <ul class="m-0 list-none p-0">${tocLinks(TERMS)}</ul>
      <p class="m-0 mt-2 border-t border-line-soft px-3 pb-1 pt-3 text-xs font-semibold text-ink-muted">سياسة الخصوصية</p>
      <ul class="m-0 list-none p-0">${tocLinks(PRIVACY)}</ul>
    </nav>
    <div class="flex min-w-0 flex-col gap-6">
      <div class="scroll-row -m-0.5 gap-2 p-0.5 lg:hidden" role="group" aria-label="انتقل إلى">
        <a href="#terms" class="shrink-0 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-ink hover:text-ink">الشروط والأحكام</a>
        <a href="#privacy" class="shrink-0 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-ink hover:text-ink">سياسة الخصوصية</a>
      </div>
      <article id="terms" aria-labelledby="terms-title" class="card flex scroll-mt-48 flex-col gap-6 p-5 sm:p-8 lg:scroll-mt-40">
        <h2 id="terms-title" class="m-0 text-xl font-bold">الشروط والأحكام</h2>
        <p class="m-0 text-[15px] leading-[1.8] text-ink-body">باستخدامك مزادي فإنك توافق على هذه الشروط. يرجى قراءتها قبل المزايدة أو البيع.</p>
        ${TERMS.map((s, i) => section(s, i + 1)).join('')}
      </article>
      <article id="privacy" aria-labelledby="privacy-title" class="card flex scroll-mt-48 flex-col gap-6 p-5 sm:p-8 lg:scroll-mt-40">
        <h2 id="privacy-title" class="m-0 text-xl font-bold">سياسة الخصوصية</h2>
        ${PRIVACY.map((s, i) => section(s, i + 1)).join('')}
      </article>
      <div class="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <p class="m-0 text-[15px] text-ink-body">لديك سؤال عن هذه الشروط؟</p>
        <div class="flex flex-wrap gap-2">
          <a href="messages.html#c=support" class="btn-primary px-6 py-2.5 text-sm">راسل الدعم</a>
          <a href="help.html#contact" class="btn-outline px-6 py-2.5 text-sm">تواصل معنا</a>
        </div>
      </div>
    </div>
  </div>`;

/* Highlight the section being read in the side contents. */
const links = new Map([...document.querySelectorAll('[data-toc]')].map((a) => [a.dataset.toc, a]));
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a, id) => {
      const on = id === e.target.id;
      a.classList.toggle('bg-primary-soft', on);
      a.classList.toggle('font-semibold', on);
      a.classList.toggle('text-primary', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-160px 0px -60% 0px' });
links.forEach((_, id) => observer.observe(document.getElementById(id)));

document.addEventListener('click', (event) => {
  const cat = event.target.closest('#cat-nav [data-cat]');
  if (cat) location.href = catHref(cat.dataset.cat);
});

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
