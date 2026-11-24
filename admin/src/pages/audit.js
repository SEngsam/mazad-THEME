import { api } from '../api.js';
import { listPage } from '../list.js';
import { chip, esc, fmtDateTime, statCards } from '../ui.js';

export const meta = { title: 'سجل التدقيق', sub: 'أفعال المشرفين على المنصة.' };
export const adminOnly = true;

const BANNER = '<div class="rounded-2xl bg-accent-soft px-4 py-3 text-[13px] leading-8 text-accent-ink"><strong>صفحة مقترحة.</strong> لا يوجد سجل تدقيق لأفعال المشرفين في الكود الحالي (ذُكر في التدقيق الأمني كنقص). المرحلة 5 من خطة المشروع. البيانات هنا تتغيّر مع أفعالك داخل النموذج.</div>';

export default function audit(root) {
  const top = () => {
    const r = api.rows('auditLog');
    const c = (re) => r.filter((a) => re.test(a.action)).length;
    return `<div class="flex flex-col gap-4">${BANNER}${statCards([
      { label: 'إجمالي الأفعال', value: r.length, tone: 'navy', sub: 'في السجل' },
      { label: 'اعتماد وتوثيق', value: c(/اعتماد|توثيق/), tone: 'primary', sub: 'قرارات إيجابية' },
      { label: 'رفض وإلغاء وحذف', value: c(/رفض|إلغاء|حذف/), tone: 'outline', sub: 'تحتاج مراجعة' },
    ], 'sm:grid-cols-3')}</div>`;
  };
  listPage(root, {
    top,
    table: 'auditLog', label: 'سجل التدقيق', minW: 780,
    pills: [
      { id: 'all', label: 'الكل' }, { id: 'review', label: 'المراجعة', test: (a) => /مزاد|تعديل$/.test(a.action) && !/إعدادات/.test(a.action) },
      { id: 'acc', label: 'الحسابات', test: (a) => /حساب|توثيق/.test(a.action) }, { id: 'set', label: 'الإعدادات', test: (a) => /إعدادات/.test(a.action) }, { id: 'del', label: 'الحذف', test: (a) => a.action === 'حذف' },
    ],
    sort: (a, b) => b.at - a.at,
    columns: [
      { h: 'الوقت', cell: (a) => `<span class="tabular text-xs">${fmtDateTime(a.at)}</span>` }, { h: 'المشرف', cell: (a) => esc(a.admin) },
      { h: 'الإجراء', cell: (a) => chip(a.action, a.tone) }, { h: 'العنصر', cell: (a) => esc(a.target) }, { h: 'التفاصيل', cell: (a) => `<span class="text-ink-muted">${esc(a.details)}</span>` },
    ],
  });
}
