import { api } from '../api.js';
import { listPage } from '../list.js';
import { ago, chip, esc, statCards, toast } from '../ui.js';

export const meta = { title: 'بيانات المستخدمين', sub: 'الفلاتر المحفوظة وسجل البحث.' };

export default function userdata(root) {
  let tab = 'filters';
  root.innerHTML = `<div class="flex flex-col gap-4">
    <div role="tablist" aria-label="النوع" class="flex gap-1 border-b border-line">${[['filters', 'الفلاتر المحفوظة'], ['history', 'سجل البحث']].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" class="border-b-2 px-5 py-3 text-[13px] font-semibold"></button>`).join('')}</div>
    <div id="ud"></div></div>`;
  const tabs = [...root.querySelectorAll('[data-tab]')];

  function show() {
    tabs.forEach((b) => {
      const on = b.dataset.tab === tab;
      b.textContent = b.dataset.tab === 'filters' ? 'الفلاتر المحفوظة' : 'سجل البحث';
      b.setAttribute('aria-selected', String(on));
      b.className = `border-b-2 px-5 py-3 text-[13px] font-semibold ${on ? 'border-primary text-primary' : 'border-transparent text-ink-body'}`;
    });
    const host = document.createElement('div');
    root.querySelector('#ud').replaceChildren(host);
    if (tab === 'filters') {
      listPage(host, {
        top: () => statCards([{ label: 'فلاتر محفوظة', value: api.rows('savedFilters').length, tone: 'gold', sub: 'لدى المستخدمين' }, { label: 'حسابات تحفظ فلاتر', value: new Set(api.rows('savedFilters').map((f) => f.account)).size, tone: 'primary', sub: 'حساباً' }], 'sm:grid-cols-2'),
        table: 'savedFilters', label: 'الفلاتر المحفوظة', placeholder: 'بحث بالاسم', searchText: (f) => `${f.name} ${f.account}`, minW: 720,
        columns: [
          { h: 'الاسم', cell: (f) => `<span class="font-semibold">${esc(f.name)}</span>` }, { h: 'النوع', cell: (f) => chip(f.type) }, { h: 'الحساب', cell: (f) => esc(f.account) },
          { h: 'البيانات', cell: (f) => `<code class="rounded-lg bg-mist px-2 py-0.5 text-xs" dir="ltr">${esc(f.data)}</code>` },
          { h: '', cell: (f) => `<button type="button" data-write data-act="del" data-id="${f.id}" class="ad-btn">حذف</button>` },
        ],
        note: 'العرض والحذف فقط، والحذف لدور «مدير» فقط. لا إنشاء ولا تعديل من اللوحة.',
        async onAction(act, id, reload) { try { await api.remove('savedFilters', id); toast('حُذف الفلتر.'); } catch (e) { toast(e.message, 'bad'); } reload(); },
      });
    } else {
      listPage(host, {
        top: () => statCards([{ label: 'عمليات بحث', value: api.rows('searchHistory').length, tone: 'navy', sub: 'في السجل' }, { label: 'كلمات مختلفة', value: new Set(api.rows('searchHistory').map((s) => s.searchKey)).size, tone: 'accent', sub: 'كلمة بحث' }], 'sm:grid-cols-2'),
        table: 'searchHistory', label: 'سجل البحث', placeholder: 'بحث بالكلمة', searchText: (s) => `${s.searchKey} ${s.account}`, minW: 640,
        columns: [
          { h: 'كلمة البحث', cell: (s) => `<span class="font-semibold">${esc(s.searchKey)}</span>` }, { h: 'النوع', cell: (s) => chip(s.type) }, { h: 'الحساب', cell: (s) => esc(s.account) },
          { h: 'الوقت', cell: (s) => `<span class="text-xs text-ink-muted">${ago(s.createdAt)}</span>` },
        ],
      });
    }
    import('../ui.js').then((m) => m.applyRole(root));
  }
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; show(); } });
  show();
}
