import { api } from '../api.js';
import { listPage } from '../list.js';
import { ago, chip, esc, fmt, fmtDate, mask, statCards, toast } from '../ui.js';

export const meta = { title: 'الحسابات', sub: 'المستخدمون وطلبات التوثيق ورصيد العملات.' };

export const avatar = (name) => `<span class="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">${esc([...name][0])}</span>`;
export const verifyChip = (a) => (a.verified ? chip('موثّق', 'good') : a.verificationRequestedAt ? chip(`طلب توثيق · ${ago(a.verificationRequestedAt)}`, 'warn') : chip('غير موثّق', 'info'));

export default function accounts(root, { ctx }) {
  const top = () => {
    const r = api.rows('accounts');
    const ver = r.filter((a) => a.verified).length;
    return statCards([
      { label: 'إجمالي الحسابات', value: r.length, tone: 'lime', sub: `${r.filter((a) => a.isSeller).length} بائعاً` },
      { label: 'طلبات توثيق', value: r.filter((a) => a.verificationRequestedAt).length, tone: 'outline', sub: 'بانتظار القرار' },
      { label: 'نسبة الموثّقين', value: Math.round((ver / r.length) * 100), suffix: '%', tone: 'primary', sub: `${ver} حساباً` },
      { label: 'رصيد العملات', value: r.reduce((t, a) => t + a.coins, 0), tone: 'forest', sub: 'عملة لدى المستخدمين' },
    ]);
  };
  listPage(root, {
    ctx, top, live: (e) => e.type === 'payment',
    table: 'accounts', label: 'جدول الحسابات', placeholder: 'بحث بالاسم', minW: 880,
    pills: [
      { id: 'all', label: 'الكل' },
      { id: 'req', label: 'طلبات توثيق', test: (a) => !!a.verificationRequestedAt },
      { id: 'ver', label: 'موثّقون', test: (a) => a.verified },
      { id: 'unver', label: 'غير موثّقين', test: (a) => !a.verified },
      { id: 'anon', label: 'مجهولو الهوية', test: (a) => a.isAnonymous },
    ],
    searchText: (a) => a.name,
    columns: [
      { h: 'الحساب', cell: (a) => `<div class="flex items-center gap-2.5">${avatar(a.name)}<span><strong>${esc(a.name)}</strong><br><span class="text-xs text-ink-muted">${a.isAnonymous ? 'حساب مجهول الهوية' : '•••••••'}</span></span></div>` },
      { h: 'الجوال', cell: (a) => `<span class="tabular">${a.isAnonymous ? '—' : esc(mask(`${a.phone.slice(0, 2)}•• ••• ${a.phone.slice(-3)}`))}</span>` },
      { h: 'الموقع', cell: (a) => esc(a.locationPretty) },
      { h: 'رصيد العملات', cell: (a) => `<span class="tabular">${fmt(a.coins)}</span>` },
      { h: 'التوثيق', cell: (a) => verifyChip(a) },
      { h: 'التسجيل', cell: (a) => `<span class="tabular text-xs">${fmtDate(a.createdAt)}</span>` },
      { h: 'الإجراء', cls: 'whitespace-nowrap', cell: (a) => (!a.verified ? `<button type="button" data-write data-act="verify" data-id="${a.id}" class="ad-btn-primary">توثيق الحساب</button>` : `<a class="ad-btn" href="#/accounts/${a.id}">عرض</a>`) },
    ],
    rowHref: (a) => `#/accounts/${a.id}`,
    note: 'رقم الجوال ومعرّف الدخول يظهران لدور «مدير» فقط. التوثيق يرسل إشعاراً للمستخدم.',
    async onAction(act, id, reload) {
      if (act !== 'verify') return;
      try { await api.verifyAccount(id); toast('تم توثيق الحساب وإشعار المستخدم.'); } catch (e) { toast(e.message, 'bad'); }
      reload();
    },
  });
}
