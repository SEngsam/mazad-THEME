import * as data from './data.js';
import { Media, esc } from './components.js';
import { catHref, catNavHTML, renderShell } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);

const STATS = [
  ['48,000+', 'مزايد موثّق'],
  ['3,200+', 'صفقة مكتملة'],
  ['18', 'مدينة'],
  ['4.8', 'تقييم المشترين'],
];

const PILLARS = [
  ['id', 'هوية موثّقة', 'يُتحقق من كل مزايد وبائع عبر نفاذ قبل أول مزايدة.'],
  ['check', 'فحص قبل المزاد', 'تقرير فحص معتمد لكل سيارة، وشهادة أصالة للساعات والمجوهرات.'],
  ['lock', 'مبلغ محفوظ', 'يبقى المبلغ لدينا حتى يؤكد المشتري الاستلام، ثم يُحوَّل إلى البائع.'],
  ['key', 'تسليم بحضور مندوب', 'نقل الملكية عبر أبشر وتسليم السيارات بحضور مندوب مزادي.'],
];

const STEPS = [
  ['2023', 'الانطلاق في الرياض بمزادات السيارات الحضورية.'],
  ['2024', 'إطلاق المزايدة الإلكترونية وإضافة الساعات والمجوهرات.'],
  ['2025', 'التوسع إلى جدة والدمام، وإضافة اللوحات المميزة والعقارات.'],
  ['2026', 'غرفة المزاد المباشر.'],
];

const icons = {
  id: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M14.5 10h4M14.5 13.5h3"/>',
  check: '<path d="M9 3.5h6l.8 2H19a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1h3.2Z"/><path d="m8.5 13.5 2.5 2.5 4.5-5"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2"/>',
};
const icon = (k) => `<span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><svg aria-hidden="true" viewBox="0 0 24 24" class="h-[22px] w-[22px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[k]}</svg></span>`;

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
$('#main').innerHTML = `
  <div class="flex flex-col gap-5">
    <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted">
      <ol class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li><a href="index.html" class="text-ink-body hover:text-primary">الرئيسية</a></li><li aria-hidden="true">‹</li>
        <li aria-current="page" class="text-ink">من نحن</li>
      </ol>
    </nav>
    <section class="on-dark grid grid-cols-1 overflow-hidden rounded-[22px] bg-navy text-white sm:rounded-hero lg:grid-cols-2">
      <div class="flex flex-col justify-center gap-4 p-6 sm:p-10">
        <span class="self-start rounded-md bg-gold px-2 py-0.5 text-xs font-bold text-navy">من نحن</span>
        <h1 class="m-0 text-[26px] font-bold leading-[1.35] sm:text-[34px]">سوق مزادات موثوق، من المعاينة حتى التسليم</h1>
        <p class="m-0 max-w-lg text-[15px] leading-[1.9] opacity-90">مزادي منصة سعودية للمزادات الحضورية والإلكترونية: سيارات، وساعات، ومجوهرات، ولوحات مميزة، وعقارات. نجمع المشتري والبائع في مزاد شفاف، ونتولى الفحص والدفع والتسليم.</p>
        <div class="flex flex-wrap gap-2.5 pt-1">
          <a href="auctions.html" class="btn-gold px-6 py-3 text-sm">المزادات القادمة</a>
          <a href="sell.html" class="btn-ghost-dark px-6 py-3 text-sm">بِع معنا</a>
        </div>
      </div>
      ${Media({ src: data.ads.sell, eager: true, className: 'min-h-[220px] lg:min-h-[380px]' })}
    </section>
  </div>

  <section aria-label="مزادي بالأرقام" class="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line lg:grid-cols-4">
    ${STATS.map(([n, l]) => `<div class="flex flex-col gap-1 bg-white px-5 py-6 text-center"><b class="text-[28px] font-bold leading-tight text-primary tabular" dir="ltr">${n}</b><span class="text-sm text-ink-body">${l}</span></div>`).join('')}
  </section>

  <section aria-labelledby="trust-title" class="flex flex-col gap-4">
    <h2 id="trust-title" class="section-title">كيف نحمي كل صفقة</h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      ${PILLARS.map(([k, t, x]) => `<div class="card flex flex-col gap-3 p-5">${icon(k)}<h3 class="m-0 text-base font-semibold">${t}</h3><p class="m-0 text-sm leading-relaxed text-ink-body">${x}</p></div>`).join('')}
    </div>
  </section>

  <section aria-labelledby="story-title" class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10">
    <div class="flex flex-col gap-3">
      <h2 id="story-title" class="section-title">قصتنا</h2>
      <p class="m-0 text-[15px] leading-[1.9] text-ink-body">بدأت مزادي في ساحة سيارات بالرياض، بهدف واحد: أن يزايد الناس وهم مطمئنون إلى ما يشترون وإلى من يبيع. واليوم تُعقد مزاداتنا في الساحات وعلى المنصة معاً، ويتابعها المزايدون من مدن المملكة كلها.</p>
      <p class="m-0 text-[15px] leading-[1.9] text-ink-body">نحن شركة سعودية مسجّلة، موثّقة في المركز السعودي للأعمال، ونعمل وفق الأنظمة المنظمة للمزادات والتجارة الإلكترونية في المملكة.</p>
    </div>
    <ol class="card m-0 flex list-none flex-col p-5 sm:p-6" aria-label="مراحل مزادي">
      ${STEPS.map(([y, t], i) => `
        <li class="relative flex gap-4 ${i < STEPS.length - 1 ? 'pb-5' : ''}">
          ${i < STEPS.length - 1 ? '<span aria-hidden="true" class="absolute start-[27px] top-8 bottom-0 w-0.5 bg-line"></span>' : ''}
          <b class="relative w-14 shrink-0 self-start rounded-full bg-primary-soft py-1 text-center text-sm font-bold text-primary tabular">${y}</b>
          <span class="pt-0.5 text-sm leading-relaxed text-ink-body">${esc(t)}</span>
        </li>`).join('')}
    </ol>
  </section>

  <section aria-labelledby="contact-title" class="card grid grid-cols-1 gap-5 p-6 sm:grid-cols-3 sm:p-8">
    <div class="flex flex-col gap-1.5 sm:col-span-3"><h2 id="contact-title" class="section-title">تواصل معنا</h2></div>
    <div class="flex flex-col gap-1"><span class="text-xs text-ink-muted">خدمة العملاء</span><a href="tel:920012345" class="text-base font-semibold tabular">920012345</a><span class="text-[13px] text-ink-body">يومياً من 9 صباحاً إلى 11 مساءً</span></div>
    <div class="flex flex-col gap-1"><span class="text-xs text-ink-muted">المقر الرئيسي</span><span class="text-base font-semibold">طريق الملك فهد، الرياض</span><span class="text-[13px] text-ink-body">سجل تجاري 1010XXXXXX</span></div>
    <div class="flex flex-col gap-1"><span class="text-xs text-ink-muted">الشركات والمعارض</span><a href="help.html#contact" class="text-base font-semibold">راسلنا</a><span class="text-[13px] text-ink-body">للبيع بالجملة والإعلان على المنصة</span></div>
  </section>`;

document.addEventListener('click', (event) => {
  const cat = event.target.closest('#cat-nav [data-cat]');
  if (cat) location.href = catHref(cat.dataset.cat);
});
