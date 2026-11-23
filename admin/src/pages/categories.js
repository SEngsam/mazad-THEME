import { prependStats as _ps, statCards as _sc } from '../ui.js';
import { api } from '../api.js';
import { askReason, esc, toast } from '../ui.js';

export const meta = { title: 'الفئات', sub: 'الفئات الرئيسية والفرعية.' };

export default function categories(root) {
  let editing = 'c-cars';
  const cats = () => api.rows('categories');
  const count = (id) => api.rows('auctions').filter((a) => a.mainCategoryId === id || a.subCategoryId === id).length;

  function draw() {
    const all = cats();
    const mains = all.filter((c) => !c.parentCategoryId);
    const cur = all.find((c) => c.id === editing) || null;
    const isNew = editing === 'new';
    root.innerHTML = `
      <div class="flex flex-wrap items-start gap-5">
        <section class="ad-card min-w-0 flex-[1.5_1_520px]" aria-labelledby="c-h">
          <div class="mb-1.5 flex items-center justify-between"><h2 id="c-h" class="ad-h2">شجرة الفئات</h2><button type="button" data-new data-write class="ad-btn-primary ad-btn-lg">إضافة فئة</button></div>
          ${mains.map((m) => `
            <div class="flex items-center gap-3 border-b border-line-soft py-3.5"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft font-bold text-primary">${esc([...m.name.ar][0])}</span>
              <strong>${esc(m.name.ar)}</strong><span class="ms-auto text-xs text-ink-muted tabular">${count(m.id)} مزاداً</span><button type="button" data-edit="${m.id}" class="ad-btn">تعديل</button></div>
            ${all.filter((c) => c.parentCategoryId === m.id).map((s) => `<div class="ms-[52px] flex items-center gap-3 border-b border-line-soft py-2.5 text-[13px]"><span>${esc(s.name.ar)}</span><span class="ms-auto text-xs text-ink-muted tabular">${count(s.id)}</span><button type="button" data-edit="${s.id}" class="ad-btn">تعديل</button></div>`).join('')}`).join('')}
        </section>
        <section class="ad-card flex min-w-0 flex-[1_1_340px] flex-col gap-4" aria-labelledby="e-h">
          <h2 id="e-h" class="ad-h2">${isNew ? 'فئة جديدة' : cur ? `تعديل فئة · ${esc(cur.name.ar)}` : 'تعديل فئة'}</h2>
          ${cur || isNew ? `
            <form id="cat-form" novalidate class="flex flex-col gap-4">
              <div><label class="ad-label" for="ar">الاسم بالعربية</label><input id="ar" class="ad-input" value="${esc(cur?.name.ar || '')}" aria-describedby="ar-e"><p id="ar-e" class="m-0 mt-1 hidden text-xs text-accent-ink">الاسم مطلوب.</p></div>
              <div><label class="ad-label" for="en">الاسم بالإنجليزية</label><input id="en" dir="ltr" class="ad-input text-end" value="${esc(cur?.name.en || '')}"></div>
              <div><label class="ad-label" for="par">الفئة الأم</label><select id="par" class="ad-input"><option value="">فئة رئيسية</option>${mains.filter((m) => m.id !== cur?.id).map((m) => `<option value="${m.id}" ${cur?.parentCategoryId === m.id ? 'selected' : ''}>${esc(m.name.ar)}</option>`).join('')}</select></div>
              <div class="flex gap-2.5"><button type="submit" data-write class="ad-btn-primary ad-btn-lg">حفظ</button><button type="button" data-cancel class="ad-btn ad-btn-lg">إلغاء</button></div>
            </form>
            ${cur ? `<div class="rounded-2xl bg-accent-soft p-3.5 text-xs leading-7 text-accent-ink"><strong>تنبيه:</strong> حذف فئة يحذف جميع مزاداتها نهائياً. المقترح: استبدال الحذف بالأرشفة.<br><button type="button" data-del data-write class="ad-btn-danger mt-2">حذف الفئة</button></div>` : ''}` : '<p class="m-0 text-[13px] text-ink-muted">اختر فئة من القائمة لتعديلها.</p>'}
        </section>
      </div>`;
    _ps(root, _sc([{ label: 'فئات رئيسية', value: mains.length, tone: 'lime', sub: 'في الشجرة' }, { label: 'فئات فرعية', value: all.length - mains.length, tone: 'primary', sub: 'تحت الرئيسية' }, { label: 'مزادات مرتبطة', value: api.rows('auctions').length, tone: 'forest', sub: 'بفئات المنصة' }], 'sm:grid-cols-3'));
    import('../ui.js').then((m) => m.applyRole(root));
  }

  root.addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-edit]');
    if (ed) { editing = ed.dataset.edit; draw(); return; }
    if (e.target.closest('[data-new]')) { editing = 'new'; draw(); return; }
    if (e.target.closest('[data-cancel]')) { editing = null; draw(); return; }
    if (e.target.closest('[data-del]')) {
      const cat = cats().find((c) => c.id === editing);
      const n = count(cat.id);
      const ok = await askReason({ title: `حذف «${cat.name.ar}»`, text: n ? `سيُحذف ${n} مزاداً مرتبطاً بهذه الفئة نهائياً.` : 'لا توجد مزادات مرتبطة بهذه الفئة.', confirm: 'حذف نهائي', danger: true, noField: true });
      if (ok === null) return;
      try { await api.remove('categories', cat.id); toast('حُذفت الفئة.'); editing = null; } catch (err) { toast(err.message, 'bad'); }
      draw();
    }
  });
  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ar = root.querySelector('#ar');
    if (!ar.value.trim()) { ar.setAttribute('aria-invalid', 'true'); root.querySelector('#ar-e').classList.remove('hidden'); ar.focus(); return; }
    const name = { ar: ar.value.trim(), en: root.querySelector('#en').value.trim() };
    const parentCategoryId = root.querySelector('#par').value || null;
    try {
      if (editing === 'new') { const c = await api.create('categories', { name, parentCategoryId }); editing = c.id; } else await api.update('categories', editing, { name, parentCategoryId });
      toast('حُفظت الفئة.');
    } catch (err) { toast(err.message, 'bad'); }
    draw();
  });
  draw();
}
