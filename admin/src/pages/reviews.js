import { listPage } from '../list.js';
import { esc, fmtDay } from '../ui.js';

export const meta = { title: 'التقييمات', sub: 'تقييمات المستخدمين بعضهم لبعض بعد المزاد.' };

const stars = (n) => `<span class="whitespace-nowrap tracking-widest text-primary" role="img" aria-label="${n} من 5">${'★'.repeat(n)}<span class="text-[#C9D1CD]">${'★'.repeat(5 - n)}</span></span>`;

export default function reviews(root) {
  listPage(root, {
    table: 'reviews', label: 'جدول التقييمات', placeholder: 'بحث بالنص', minW: 860,
    pills: [
      { id: 'all', label: 'الكل' }, { id: '5', label: '5 نجوم', test: (r) => r.stars === 5 }, { id: '4', label: '4', test: (r) => r.stars === 4 },
      { id: '3', label: '3', test: (r) => r.stars === 3 }, { id: 'low', label: '2 فأقل', test: (r) => r.stars <= 2 },
    ],
    searchText: (r) => `${r.description} ${r.to} ${r.auctionTitle}`,
    columns: [
      { h: 'التقييم', cell: (r) => stars(r.stars) },
      { h: 'النص', cell: (r) => `<span class="block max-w-[300px]">${esc(r.description)}</span>` },
      { h: 'من', cell: (r) => esc(r.from) },
      { h: 'إلى', cell: (r) => `<a href="#/accounts/${r.toId}">${esc(r.to)}</a>` },
      { h: 'المزاد', cell: (r) => esc(r.auctionTitle) },
      { h: 'التاريخ', cell: (r) => `<span class="tabular text-xs">${fmtDay(r.createdAt)}</span>` },
    ],
    note: 'العرض فقط في النظام الحالي.',
  });
}
