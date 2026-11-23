import { prependStats as _ps, statCards as _sc } from '../ui.js';
import { api } from '../api.js';
import { esc, toast } from '../ui.js';
import { adPlacements } from '../mock.js';

export const meta = { title: 'الإعلانات', sub: 'لافتات الموقع حسب موضع العرض.' };

export default function ads(root) {
  let editing = 'ad-1';
  const list = () => api.rows('ads');

  function draw() {
    const cur = list().find((a) => a.id === editing);
    const isNew = editing === 'new';
    root.innerHTML = `
      <div class="flex flex-wrap items-start gap-5">
        <section class="ad-card min-w-0 flex-[1.6_1_560px]" aria-labelledby="a1">
          <div class="mb-2 flex items-center justify-between"><h2 id="a1" class="ad-h2">اللافتات</h2><button type="button" data-new data-write class="ad-btn-primary ad-btn-lg">إضافة لافتة</button></div>
          <div class="overflow-x-auto"><table class="ad-table min-w-[620px]"><thead><tr><th scope="col">العنوان</th><th scope="col">الموضع</th><th scope="col">الترتيب</th><th scope="col">الفترة</th><th scope="col">مفعّل</th><th scope="col"></th></tr></thead>
            <tbody>${list().map((a) => `<tr><td class="font-semibold">${esc(a.title)}</td><td>${esc(a.placement)}</td><td class="tabular">${a.sortOrder}</td><td class="tabular text-xs">${a.startsAt ? `${a.startsAt} ← ${a.endsAt}` : 'دائم'}</td>
              <td><button type="button" role="switch" data-write data-toggle="${a.id}" aria-checked="${a.enabled}" aria-label="تفعيل ${esc(a.title)}" class="ad-switch"></button></td><td><button type="button" data-edit="${a.id}" class="ad-btn">تعديل</button></td></tr>`).join('')}</tbody></table></div>
        </section>
        <section class="ad-card flex min-w-0 flex-[1_1_340px] flex-col gap-4" aria-labelledby="a2"><h2 id="a2" class="ad-h2">${isNew ? 'لافتة جديدة' : 'تعديل لافتة'}</h2>
          ${cur || isNew ? `<form id="af" novalidate class="flex flex-col gap-4">
            <div class="ad-ph aspect-[16/6]">رفع صورة</div>
            <div><label class="ad-label" for="at">العنوان</label><input id="at" class="ad-input" value="${esc(cur?.title || '')}" aria-describedby="at-e"><p id="at-e" class="m-0 mt-1 hidden text-xs text-accent-ink">العنوان مطلوب.</p></div>
            <div><label class="ad-label" for="al">الرابط</label><input id="al" dir="ltr" class="ad-input text-end" value="${esc(cur?.linkUrl || '')}"></div>
            <div><label class="ad-label" for="ap">الموضع</label><select id="ap" class="ad-input">${adPlacements.map((p) => `<option ${cur?.placement === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
            <div class="flex gap-2.5"><div class="flex-1"><label class="ad-label" for="as">من</label><input id="as" type="date" class="ad-input tabular" value="${cur?.startsAt || ''}"></div><div class="flex-1"><label class="ad-label" for="ae">إلى</label><input id="ae" type="date" class="ad-input tabular" value="${cur?.endsAt || ''}"></div></div>
            <div class="flex gap-2.5"><button type="submit" data-write class="ad-btn-primary ad-btn-lg">حفظ</button><button type="button" data-cancel class="ad-btn ad-btn-lg">إلغاء</button></div></form>` : '<p class="m-0 text-[13px] text-ink-muted">اختر لافتة لتعديلها.</p>'}
        </section>
      </div>`;
    _ps(root, _sc([{ label: 'إجمالي اللافتات', value: list().length, tone: 'lime', sub: 'في كل المواضع' }, { label: 'مفعّلة', value: list().filter((a) => a.enabled).length, tone: 'primary', sub: 'تظهر الآن' }, { label: 'معطّلة', value: list().filter((a) => !a.enabled).length, tone: 'outline', sub: 'لا تظهر' }], 'sm:grid-cols-3'));
    import('../ui.js').then((m) => m.applyRole(root));
  }

  root.addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-edit]');
    if (ed) { editing = ed.dataset.edit; draw(); }
    if (e.target.closest('[data-new]')) { editing = 'new'; draw(); }
    if (e.target.closest('[data-cancel]')) { editing = null; draw(); }
    const tg = e.target.closest('[data-toggle]');
    if (tg && !tg.disabled) {
      const a = list().find((x) => x.id === tg.dataset.toggle);
      try { await api.update('ads', a.id, { enabled: !a.enabled }); toast(a.enabled ? 'فُعّلت اللافتة.' : 'عُطّلت اللافتة.'); } catch (err) { toast(err.message, 'bad'); }
      draw();
    }
  });
  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = root.querySelector('#at').value.trim();
    if (!title) { root.querySelector('#at').setAttribute('aria-invalid', 'true'); root.querySelector('#at-e').classList.remove('hidden'); root.querySelector('#at').focus(); return; }
    const patch = { title, linkUrl: root.querySelector('#al').value, placement: root.querySelector('#ap').value, startsAt: root.querySelector('#as').value, endsAt: root.querySelector('#ae').value };
    try {
      if (editing === 'new') { const a = await api.create('ads', { ...patch, enabled: false, sortOrder: list().length + 1 }); editing = a.id; } else await api.update('ads', editing, patch);
      toast('حُفظت اللافتة.');
    } catch (err) { toast(err.message, 'bad'); }
    draw();
  });
  draw();
}
