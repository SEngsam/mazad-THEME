import { listPage } from '../list.js';
import { api } from '../api.js';
import { ago, chip, esc, statCards } from '../ui.js';

export const meta = { title: 'سجل الإشعارات', sub: 'الإشعارات المرسلة إلى المستخدمين.' };

export default function notificationsLog(root) {
  const top = () => {
    const r = api.rows('notificationLog');
    return statCards([
      { label: 'غير مقروءة', value: r.filter((n) => !n.read).length, tone: 'outline', sub: 'لم يفتحها المستخدم' },
      { label: 'خلال 24 ساعة', value: r.filter((n) => Date.now() - n.createdAt < 86400000).length, tone: 'primary', sub: 'أُرسلت' },
      { label: 'الإجمالي', value: r.length, tone: 'navy', sub: 'في السجل' },
    ], 'sm:grid-cols-3');
  };
  listPage(root, {
    top,
    table: 'notificationLog', label: 'سجل الإشعارات', minW: 780,
    pills: [
      { id: 'all', label: 'الكل' }, { id: 'unread', label: 'غير مقروءة', test: (n) => !n.read },
      { id: 'system', label: 'النظام', test: (n) => n.type === 'SYSTEM' }, { id: 'bids', label: 'المزايدات', test: (n) => n.type.includes('BID') },
    ],
    columns: [
      { h: 'النوع', cell: (n) => `<span dir="ltr" class="ad-chip ad-chip-info">${n.type}</span>` },
      { h: 'العنوان', cell: (n) => `<span class="font-semibold">${esc(n.title)}</span>` },
      { h: 'الحساب', cell: (n) => (n.accountId && n.account !== 'جميع الحسابات' ? `<a href="#/accounts/${n.accountId}">${esc(n.account)}</a>` : esc(n.account)) },
      { h: 'الحالة', cell: (n) => (n.read ? chip('مقروء', 'good') : chip('غير مقروء')) },
      { h: 'الوقت', cell: (n) => `<span class="text-xs text-ink-muted">${ago(n.createdAt)}</span>` },
    ],
  });
}
