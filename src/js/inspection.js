import * as data from './data.js';
import { Media, esc, formatNumber, formatPrice } from './components.js';
import { catHref, catNavHTML, renderShell } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const lot = data.lots.find((l) => String(l.id) === params.get('id')) ?? data.lots[0];
const report = data.inspectionReports[lot.id];
const TREAD_LOW = 4;

const check = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const warn = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/></svg>';

function grade(score) {
  if (score >= 90) return 'ممتاز';
  if (score >= 75) return 'جيد جداً';
  if (score >= 60) return 'جيد';
  return 'يحتاج إصلاحات';
}

function breadcrumb() {
  return `
    <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted">
      <ol class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li><a href="index.html" class="text-ink-body hover:text-primary">الرئيسية</a></li><li aria-hidden="true">‹</li>
        <li><a href="${catHref(lot.cat)}" class="text-ink-body hover:text-primary">${esc(data.categories[lot.cat])}</a></li><li aria-hidden="true">‹</li>
        <li><a href="lot.html?id=${lot.id}" class="text-ink-body hover:text-primary">${esc(lot.name)}</a></li><li aria-hidden="true">‹</li>
        <li aria-current="page" class="text-ink">تقرير الفحص</li>
      </ol>
    </nav>`;
}

function row([name, status, note]) {
  const ok = status === 'ok';
  return `
    <li class="flex items-start gap-3 border-b border-line-soft py-3 last:border-0">
      <span class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${ok ? 'bg-primary-soft text-primary' : 'bg-accent-soft text-accent-ink'}">${ok ? check : warn}</span>
      <span class="flex min-w-0 flex-1 flex-col gap-0.5"><b class="text-sm font-semibold">${esc(name)}</b><span class="text-[13px] text-ink-body">${esc(note)}</span></span>
      <span class="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${ok ? 'bg-primary-soft text-primary' : 'bg-accent-soft text-accent-ink'}">${ok ? 'سليم' : 'ملاحظة'}</span>
    </li>`;
}

function render() {
  if (!report) {
    $('#main').innerHTML = `${breadcrumb()}
      <div class="card mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 py-12 text-center">
        <h1 class="m-0 text-2xl font-bold">لا يتوفر تقرير فحص لهذا المزاد</h1>
        <p class="m-0 text-[15px] text-ink-body">التقارير المعتمدة متاحة للسيارات المفحوصة قبل النشر.</p>
        <a href="lot.html?id=${lot.id}" class="btn-primary px-7 py-3 text-sm">العودة إلى المزاد</a>
      </div>`;
    return;
  }
  const all = report.sections.flatMap((s) => s.items);
  const notes = all.filter((i) => i[1] !== 'ok').length;
  document.title = `تقرير الفحص · ${lot.name} · مزادي`;
  $('#main').innerHTML = `
    ${breadcrumb()}
    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      <div class="flex min-w-0 flex-col gap-5">
        <header class="card flex flex-col gap-5 p-5 sm:p-6">
          <div class="flex flex-wrap items-center gap-5">
            <div class="grid h-24 w-24 shrink-0 place-items-center rounded-full border-[6px] border-primary bg-primary-soft text-center" aria-label="درجة الفحص ${report.score} من 100">
              <span class="flex flex-col leading-none"><b class="text-[28px] font-bold text-primary tabular">${report.score}</b><span class="text-[11px] text-ink-body">من 100</span></span>
            </div>
            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
              <h1 class="m-0 text-2xl font-bold leading-tight sm:text-[28px]">تقرير الفحص</h1>
              <p class="m-0 text-[15px] text-ink-body">${esc(lot.name)} · التقييم العام <b class="font-semibold text-primary">${grade(report.score)}</b></p>
              <div class="flex flex-wrap gap-2 text-[13px]">
                <span class="rounded-full bg-primary-soft px-3 py-1 font-semibold text-primary"><span class="tabular">${all.length - notes}</span> سليم</span>
                <span class="rounded-full bg-accent-soft px-3 py-1 font-semibold text-accent-ink"><span class="tabular">${notes}</span> ملاحظة</span>
              </div>
            </div>
          </div>
          <dl class="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line-soft sm:grid-cols-4">
            ${[['رقم التقرير', report.no, true], ['جهة الفحص', report.center], ['تاريخ الفحص', report.date], ['الممشى عند الفحص', `${formatNumber(report.km)} كم`]]
              .map(([k, v, ltr]) => `<div class="flex flex-col gap-1 bg-white px-4 py-3"><dt class="text-xs text-ink-muted">${k}</dt><dd class="m-0 text-sm font-semibold text-ink tabular" ${ltr ? 'dir="ltr" style="text-align:right"' : ''}>${esc(v)}</dd></div>`).join('')}
          </dl>
        </header>

        <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
          ${report.sections.map((s) => `
            <section class="card flex flex-col px-5 pt-4 sm:px-6" aria-label="${esc(s.title)}">
              <h2 class="m-0 text-base font-bold">${esc(s.title)}</h2>
              <ul class="m-0 list-none p-0">${s.items.map(row).join('')}</ul>
            </section>`).join('')}
        </div>

        <section class="card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="tires-title">
          <h2 id="tires-title" class="m-0 text-base font-bold">عمق نقشة الإطارات</h2>
          <ul class="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
            ${report.tires.map(([pos, mm, year]) => `
              <li class="flex flex-col gap-1 rounded-[14px] ${mm < TREAD_LOW ? 'bg-accent-soft' : 'bg-sand'} px-4 py-3">
                <span class="text-xs text-ink-muted">${esc(pos)}</span>
                <b class="text-lg font-bold tabular ${mm < TREAD_LOW ? 'text-accent-ink' : 'text-ink'}">${mm.toFixed(1)} ملم</b>
                <span class="text-xs text-ink-body">صنع <span class="tabular">${year}</span></span>
              </li>`).join('')}
          </ul>
          <p class="m-0 text-xs text-ink-muted">الحد الأدنى الموصى به 4 ملم.</p>
        </section>

        <p class="m-0 text-xs leading-relaxed text-ink-muted">يعكس التقرير حالة السيارة في تاريخ الفحص.</p>
      </div>

      <aside class="flex flex-col gap-4 lg:sticky lg:top-[136px]" aria-label="المزاد">
        <div class="card flex flex-col gap-4 p-4">
          <a href="lot.html?id=${lot.id}" class="block">${Media({ src: lot.img, alt: lot.name, className: 'aspect-[4/3] rounded-[14px]' })}</a>
          <div class="flex flex-col gap-1">
            <a href="lot.html?id=${lot.id}" class="text-[15px] font-semibold text-ink hover:text-primary">${esc(lot.name)}</a>
            <span class="text-xs text-ink-muted">${esc(lot.city)} · <span class="tabular">لوت ${esc(data.lotNumber(lot))}</span></span>
          </div>
          <div class="flex items-baseline justify-between gap-3 border-t border-line-soft pt-3 text-[13px] text-ink-body">
            <span>المزايدة الحالية</span><b class="text-lg font-bold text-ink tabular">${formatPrice(lot.bid)}</b>
          </div>
          <a href="lot.html?id=${lot.id}#bid-panel" class="btn-primary w-full py-3 text-sm">زايد الآن</a>
        </div>
      </aside>
    </div>`;
}

document.addEventListener('click', (event) => {
  const cat = event.target.closest('#cat-nav [data-cat]');
  if (cat) location.href = catHref(cat.dataset.cat);
});

$('#cat-nav').innerHTML = catNavHTML(data.categories, lot.cat);
render();
