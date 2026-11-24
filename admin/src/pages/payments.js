import { api } from '../api.js';
import { listPage } from '../list.js';
import { chip, esc, fmtDateTime, money2, statCards } from '../ui.js';

export const meta = { title: 'المدفوعات', sub: 'عمليات شراء العملات داخل المنصة.' };

export default function payments(root, { ctx }) {
  const top = () => {
    const rows = api.rows('payments');
    const sum = (k) => rows.reduce((t, p) => t + p[k], 0);
    const day = rows.filter((p) => Date.now() - p.purchasedAt < 86400000);
    return statCards([
      { label: 'عمليات الشراء', value: rows.length, tone: 'gold', sub: `${day.length} خلال 24 ساعة` },
      { label: 'إجمالي المبالغ', value: Math.round(sum('totalAmount')), suffix: ' ر.س', tone: 'primary', sub: 'شاملة الضريبة' },
      { label: 'الضريبة المحصّلة', value: Math.round(sum('vatAmount')), suffix: ' ر.س', tone: 'navy', sub: '15%' },
    ], 'sm:grid-cols-3');
  };
  const store = (...s) => (p) => s.includes(p.store);
  listPage(root, {
    ctx, top, live: (e) => e.type === 'payment',
    table: 'payments', label: 'جدول المدفوعات', minW: 900, sort: (a, b) => b.purchasedAt - a.purchasedAt,
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
