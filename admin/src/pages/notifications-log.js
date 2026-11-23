import { listPage } from '../list.js';
import { ago, chip, esc } from '../ui.js';

export const meta = { title: 'سجل الإشعارات', sub: 'الإشعارات المرسلة إلى المستخدمين.' };

export default function notificationsLog(root) {
  listPage(root, {
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
