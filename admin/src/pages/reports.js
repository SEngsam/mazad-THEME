import { prependStats as _ps, statCards as _sc } from '../ui.js';
import { api } from '../api.js';
import { ago, chip, esc, fmtDateTime } from '../ui.js';

export const meta = { title: 'البلاغات', sub: 'بلاغات المستخدمين عن المزادات والحسابات.' };

const KIND = { auction: 'مزاد', account: 'حساب', comment: 'تعليق' };

export default function reports(root) {
  const list = api.rows('reports');
  let sel = list[0]?.id;

  function draw() {
    const r = list.find((x) => x.id === sel);
    root.innerHTML = `
      <div class="flex flex-wrap items-start gap-5">
        <section class="ad-card flex min-w-0 flex-[1_1_340px] flex-col gap-2.5" aria-labelledby="l-h"><h2 id="l-h" class="ad-h2 mb-1">الأحدث</h2>
          ${list.map((x) => `<button type="button" data-r="${x.id}" aria-pressed="${x.id === sel}" class="flex flex-col gap-1 rounded-2xl border p-3.5 text-start ${x.id === sel ? 'border-primary bg-primary-soft' : 'border-line bg-white hover:bg-sand'}"><span class="flex justify-between gap-2"><strong class="text-[13px]">${esc(x.reason)}</strong>${chip(KIND[x.entityName])}</span><span class="text-xs text-ink-muted">${esc(x.target)}</span><span class="text-xs text-ink-muted">${ago(x.createdAt)}</span></button>`).join('')}
        </section>
        <section class="ad-card flex min-w-0 flex-[1.6_1_520px] flex-col gap-4" aria-labelledby="d-h">
          <div class="flex flex-wrap justify-between gap-3"><h2 id="d-h" class="m-0 text-xl font-bold">${esc(r.reason)}</h2>${chip(KIND[r.entityName])}</div>
          <div><div class="ad-row"><span>المُبلَّغ عنه</span><span class="font-semibold">${r.entityName === 'auction' ? `<a href="#/auctions?q=${encodeURIComponent(r.target)}">${esc(r.target)} ‹</a>` : esc(r.target)}</span></div>
            <div class="ad-row"><span>مقدّم البلاغ</span><span class="font-semibold">${esc(r.reportedBy)}</span></div><div class="ad-row"><span>التاريخ</span><span class="tabular font-semibold">${fmtDateTime(r.createdAt)}</span></div></div>
          <div><h3 class="m-0 mb-1.5 text-sm font-bold">الوصف</h3><p class="m-0 rounded-2xl bg-mist p-3.5 text-[13px] leading-8 text-ink-body">${esc(r.description)}</p></div>
          <div class="flex flex-wrap gap-2.5">${r.entityName === 'auction' ? `<a class="ad-btn-primary ad-btn-lg" href="#/auctions?q=${encodeURIComponent(r.target)}">فتح المزاد</a>` : ''}<a href="#/accounts" class="ad-btn ad-btn-lg">فتح الحسابات</a><a href="#/notifications" class="ad-btn ad-btn-lg">إرسال إشعار</a></div>
          <p class="ad-muted m-0">البلاغ في النظام الحالي بلا حالة ولا ردّ؛ لذلك لا توجد أزرار إغلاق أو معالجة.</p>
        </section>
      </div>`;
    _ps(root, _sc([{ label: 'إجمالي البلاغات', value: list.length, tone: 'lime', sub: 'بلا حالة بعد' }, { label: 'على مزادات', value: list.filter((x) => x.entityName === 'auction').length, tone: 'primary', sub: 'محتوى ومنتجات' }, { label: 'على حسابات وتعليقات', value: list.filter((x) => x.entityName !== 'auction').length, tone: 'forest', sub: 'سلوك المستخدمين' }], 'sm:grid-cols-3'));
  }
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) { sel = b.dataset.r; draw(); } });
  draw();
}
