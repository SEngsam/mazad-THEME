import { listPage } from '../list.js';
import { accName, ago, catName, chip, esc, fmt, money, STATUS, statCards, statusChip } from '../ui.js';
import { api } from '../api.js';

export const meta = { title: 'المزادات', sub: 'جميع المزادات وحالاتها.' };

const is = (...s) => (a) => s.includes(a.status);

export default function auctions(root, { query, ctx }) {
  const mains = api.rows('categories').filter((c) => !c.parentCategoryId);
  const top = () => {
    const r = api.rows('auctions');
    const n = (s) => r.filter((a) => a.status === s).length;
    return statCards([
      { label: 'جارية الآن', value: n('LIVE'), tone: 'primary', sub: `${n('SCHEDULED')} مجدولة` },
      { label: 'بانتظار المراجعة', value: n('PENDING_REVIEW'), tone: 'outline', href: '#/review', sub: 'تحتاج قراراً' },
      { label: 'تعديلات مطلوبة', value: n('CHANGES_REQUESTED'), tone: 'accent', sub: 'عند البائعين' },
      { label: 'مغلقة', value: n('CLOSED'), tone: 'forest', sub: 'منتهية' },
    ]);
  };
  listPage(root, {
    ctx, top, live: (e) => e.type === 'submit' || e.type === 'bid',
    table: 'auctions', label: 'جدول المزادات', placeholder: 'بحث بالعنوان أو الرقم', initialQ: query.q || '', minW: 940,
    pills: [
      { id: 'all', label: 'الكل' },
      { id: 'pending', label: 'بانتظار المراجعة', test: is('PENDING_REVIEW') },
      { id: 'changes', label: 'تعديلات مطلوبة', test: is('CHANGES_REQUESTED') },
      { id: 'ready', label: 'معتمد / مجدول', test: is('APPROVED', 'SCHEDULED') },
      { id: 'live', label: 'جارٍ', test: is('LIVE') },
      { id: 'closed', label: 'مغلق', test: is('CLOSED') },
      { id: 'dead', label: 'مرفوض / ملغى', test: is('REJECTED', 'CANCELLED') },
      { id: 'draft', label: 'مسودة', test: is('DRAFT') },
    ],
    selects: [{ id: 'cat', label: 'الفئة', options: [['', 'كل الفئات'], ...mains.map((c) => [c.id, c.name.ar])], test: (a, v) => a.mainCategoryId === v }],
    searchText: (a) => `${a.title} ${a.id}`,
    columns: [
      { h: 'الرقم', cell: (a) => `<span class="tabular text-ink-muted">${esc(a.id)}</span>` },
      { h: 'العنوان', cell: (a) => `<span class="font-semibold">${esc(a.title)}</span>` },
      { h: 'الحساب', cell: (a) => esc(accName(a.accountId)) },
      { h: 'الفئة', cell: (a) => esc(catName(a.mainCategoryId)) },
      { h: 'الموقع', cell: (a) => esc(a.locationPretty) },
      { h: 'آخر سعر', cell: (a) => `<span class="tabular">${a.lastPrice ? money(a.lastPrice) : '—'}</span>` },
      { h: 'المشاهدات', cell: (a) => `<span class="tabular">${fmt(a.views)}</span>` },
      { h: 'الحالة', cell: (a) => statusChip(a.status) },
      { h: 'أُنشئ', cell: (a) => `<span class="text-xs text-ink-muted">${ago(a.createdAt)}</span>` },
      { h: '', cell: (a) => `<a class="ad-btn" href="${a.status === 'PENDING_REVIEW' ? '#/review' : `#/auctions/${a.id}`}">${a.status === 'PENDING_REVIEW' ? 'مراجعة' : 'عرض'}</a>` },
    ],
    rowHref: (a) => `#/auctions/${a.id}`,
    note: 'السعر والحالة لا يُعدَّلان من هذه الصفحة؛ تتغيّر الحالة عبر المراجعة فقط.',
  });
}

export { STATUS, chip };
