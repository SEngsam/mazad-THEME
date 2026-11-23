import { listPage } from '../list.js';
import { api } from '../api.js';
import { ago, chip, esc, money, statCards } from '../ui.js';

export const meta = { title: 'المزايدات', sub: 'جميع المزايدات المقدّمة على المزادات.' };

export default function bids(root, { ctx }) {
  const top = () => {
    const r = api.rows('bids');
    const day = r.filter((b) => Date.now() - b.createdAt < 86400000);
    return statCards([
      { label: 'مزايدات آخر 24 ساعة', value: day.length, tone: 'accent', sub: 'تتحدّث مباشرة' },
      { label: 'أعلى مزايدة اليوم', value: Math.max(0, ...day.map((b) => b.price)), suffix: ' ر.س', tone: 'lime', sub: 'في 24 ساعة' },
      { label: 'مفتوحة', value: r.filter((b) => b.status === 'open').length, tone: 'primary', sub: 'بانتظار القرار' },
      { label: 'مرفوضة', value: r.filter((b) => b.status === 'rejected').length, tone: 'outline', sub: 'أُعيدت عملاتها' },
    ]);
  };
  listPage(root, {
    ctx, top, live: (e) => e.type === 'bid',
    table: 'bids', label: 'جدول المزايدات', placeholder: 'بحث بعنوان المزاد', minW: 860,
    pills: [
      { id: 'all', label: 'الكل' },
      { id: 'open', label: 'مفتوحة', test: (b) => b.status === 'open' },
      { id: 'accepted', label: 'مقبولة', test: (b) => b.status === 'accepted' },
      { id: 'rejected', label: 'مرفوضة', test: (b) => b.status === 'rejected' },
    ],
    searchText: (b) => `${b.auctionTitle} ${b.bidderName}`,
    columns: [
      { h: 'المزاد', cell: (b) => `<a class="font-semibold" href="#/auctions/${b.auctionId}">${esc(b.auctionTitle)}</a>` },
      { h: 'المزايد', cell: (b) => esc(b.bidderName) },
      { h: 'السعر', cell: (b) => `<span class="tabular font-semibold">${money(b.price)}</span>` },
      { h: 'الموقع', cell: (b) => esc(b.locationPretty) },
      { h: 'الحالة', cell: (b) => (b.status === 'rejected' ? `${chip('مرفوضة', 'bad')}<div class="mt-0.5 text-[11px] text-ink-muted">سبب الرفض: ${esc(b.rejectionReason)}</div>` : b.status === 'accepted' ? chip('مقبولة', 'good') : chip('مفتوحة', 'info')) },
      { h: 'العملات المدفوعة', cell: (b) => `<span class="tabular">${b.paidCoins}${b.coinsPaidBack ? ' · أُعيدت' : ''}</span>` },
      { h: 'الوقت', cell: (b) => `<span class="text-xs text-ink-muted">${ago(b.createdAt)}</span>` },
    ],
    note: 'العرض فقط. السعر لا يُعدَّل من اللوحة.',
  });
}
