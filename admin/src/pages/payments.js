import { api } from '../api.js';
import { listPage } from '../list.js';
import { chip, esc, fmt, fmtDateTime, money2 } from '../ui.js';

export const meta = { title: 'المدفوعات', sub: 'عمليات شراء العملات داخل المنصة.' };

export default function payments(root) {
  const rows = api.rows('payments');
  const sum = (k) => rows.reduce((t, p) => t + p[k], 0);
  const kpi = (l, v) => `<div class="ad-card flex flex-col gap-1.5"><span class="text-[13px] text-ink-body">${l}</span><span class="tabular text-[28px] font-bold">${v}</span></div>`;
  const store = (...s) => (p) => s.includes(p.store);
  listPage(root, {
    table: 'payments', label: 'جدول المدفوعات', minW: 900, sort: (a, b) => b.purchasedAt - a.purchasedAt,
    top: `<div class="grid gap-4 sm:grid-cols-3">${kpi('عمليات الشراء', fmt(rows.length))}${kpi('إجمالي المبالغ', money2(sum('totalAmount')))}${kpi('الضريبة المحصّلة', money2(sum('vatAmount')))}</div>`,
    pills: [
      { id: 'all', label: 'الكل' }, { id: 'apple', label: 'App Store / Google Play', test: store('App Store', 'Google Play') },
      { id: 'stripe', label: 'Stripe', test: store('Stripe') }, { id: 'paypal', label: 'PayPal', test: store('PayPal') }, { id: 'razor', label: 'Razorpay', test: store('Razorpay') },
    ],
    searchText: (p) => `${p.name} ${p.number}`, placeholder: 'بحث بالاسم أو الرقم',
    columns: [
      { h: 'الرقم', cell: (p) => `<span class="tabular font-semibold">${p.number}</span>` },
      { h: 'الحساب', cell: (p) => `<a href="#/accounts/${p.accountId}">${esc(p.name)}</a>` },
      { h: 'الباقة', cell: (p) => esc(p.boughtPackage) },
      { h: 'المبلغ', cell: (p) => `<span class="tabular">${money2(p.amount)}</span>` },
      { h: 'الضريبة', cell: (p) => `<span class="tabular">${p.vatRate}% · ${p.vatAmount.toFixed(2)}</span>` },
      { h: 'الإجمالي', cell: (p) => `<span class="tabular font-semibold">${money2(p.totalAmount)}</span>` },
      { h: 'المتجر', cell: (p) => chip(p.store) },
      { h: 'معرّف العملية', cell: (p) => `<span class="tabular text-ink-muted" dir="ltr">${esc(p.transactionId)}</span>` },
      { h: 'التاريخ', cell: (p) => `<span class="tabular text-xs">${fmtDateTime(p.purchasedAt)}</span>` },
    ],
    rowHref: (p) => `#/payments/${p.id}`,
    note: 'العمليات للعرض فقط. لا يوجد في النظام الحالي سجل مالي للتأمين أو العمولة أو التسوية (المرحلة 4 من خطة المشروع).',
  });
}
