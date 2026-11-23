import { api } from '../api.js';
import { chip, esc, fmtDateTime, money2 } from '../ui.js';

export const meta = { title: 'عملية دفع', sub: '' };

export default async function paymentDetail(root, { params, ctx }) {
  let p;
  try { p = await api.get('payments', params.id); } catch { root.innerHTML = (await import('./states.js')).notFound(); return; }
  ctx.setHeader(`عملية دفع #${p.number}`, `شراء ${p.boughtPackage}`);
  const row = (k, v) => `<div class="ad-row"><span>${k}</span><span class="font-semibold">${v}</span></div>`;
  root.innerHTML = `
    <div class="flex flex-col gap-5">
      <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted"><a href="#/payments">المدفوعات</a> ‹ <span class="text-ink tabular">#${p.number}</span></nav>
      <div class="flex flex-wrap items-start gap-5">
        <section class="ad-card min-w-0 flex-[1.4_1_480px]" aria-labelledby="p1"><h2 id="p1" class="ad-h2 mb-1.5">تفاصيل العملية</h2>
          ${row('رقم العملية', `<span class="tabular">${p.number}</span>`)}${row('الباقة', esc(p.boughtPackage))}${row('المتجر', chip(p.store))}${row('معرّف العملية', `<span class="tabular" dir="ltr">${esc(p.transactionId)}</span>`)}${row('تاريخ الشراء', `<span class="tabular">${fmtDateTime(p.purchasedAt)}</span>`)}${row('العملة', p.currency)}</section>
        <div class="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <section class="ad-card" aria-labelledby="p2"><h2 id="p2" class="ad-h2 mb-1.5">المبالغ</h2>
            ${row('المبلغ', `<span class="tabular">${money2(p.amount)}</span>`)}${row('نسبة الضريبة', `<span class="tabular">${p.vatRate}%</span>`)}${row('قيمة الضريبة', `<span class="tabular">${money2(p.vatAmount)}</span>`)}${row('الإجمالي', `<span class="tabular text-primary">${money2(p.totalAmount)}</span>`)}</section>
          <section class="ad-card" aria-labelledby="p3"><h2 id="p3" class="ad-h2 mb-1.5">الحساب</h2>
            ${row('الاسم', `<a href="#/accounts/${p.accountId}">${esc(p.name)} ‹</a>`)}${row('البريد', '•••••••')}</section>
        </div>
      </div>
      <p class="ad-muted m-0">العملية للعرض فقط ولا تُعدَّل من اللوحة.</p>
    </div>`;
}
