import { api } from '../api.js';
import { fmt, toast } from '../ui.js';

export const meta = { title: 'باقات العملات', sub: 'الباقات المعروضة للشراء على الموقع.' };

export default function packages(root) {
  let editing = 'k-2';
  const list = () => api.rows('packages');

  function draw() {
    const cur = list().find((k) => k.id === editing);
    const isNew = editing === 'new';
    root.innerHTML = `
      <div class="flex flex-wrap items-start gap-5">
        <section class="ad-card min-w-0 flex-[1.6_1_520px]" aria-labelledby="k1">
          <div class="mb-3.5 flex items-center justify-between"><h2 id="k1" class="ad-h2">الباقات</h2><button type="button" data-new data-write class="ad-btn-primary ad-btn-lg">إضافة باقة</button></div>
          <div class="grid gap-3.5 sm:grid-cols-3">${list().map((k, i) => `
            <div class="flex flex-col gap-1.5 rounded-card border p-5 ${k.id === editing ? 'border-primary bg-primary-soft' : 'border-line bg-white'}"><span class="text-[13px] text-ink-muted">باقة ${i + 1}</span><span class="tabular text-[26px] font-bold">${fmt(k.coinsNo)} عملة</span><span class="tabular font-semibold text-primary">$ ${k.priceInUSD.toFixed(2)}</span><button type="button" data-edit="${k.id}" class="ad-btn mt-2 self-start">تعديل</button></div>`).join('')}</div>
          <p class="ad-muted mb-0 mt-3.5">السعر في النظام بالدولار فقط، ويُحوَّل للريال عند العرض.</p>
        </section>
        <section class="ad-card flex min-w-0 flex-[1_1_320px] flex-col gap-4" aria-labelledby="k2">
          <h2 id="k2" class="ad-h2">${isNew ? 'باقة جديدة' : cur ? 'تعديل الباقة' : 'تعديل الباقة'}</h2>
          ${cur || isNew ? `<form id="pk" novalidate class="flex flex-col gap-4">
            <div><label class="ad-label" for="coins">عدد العملات</label><input id="coins" inputmode="numeric" class="ad-input tabular" value="${cur?.coinsNo ?? ''}" aria-describedby="pk-e"></div>
            <div><label class="ad-label" for="usd">السعر بالدولار</label><input id="usd" inputmode="decimal" class="ad-input tabular" value="${cur ? cur.priceInUSD.toFixed(2) : ''}"></div>
            <p id="pk-e" class="m-0 hidden text-xs text-accent-ink">أدخل أرقاماً صحيحة أكبر من صفر.</p>
            <div class="flex flex-wrap gap-2.5"><button type="submit" data-write class="ad-btn-primary ad-btn-lg">حفظ</button><button type="button" data-cancel class="ad-btn ad-btn-lg">إلغاء</button>${cur ? '<button type="button" data-del data-write class="ad-btn-danger ad-btn-lg">حذف</button>' : ''}</div></form>` : '<p class="m-0 text-[13px] text-ink-muted">اختر باقة لتعديلها.</p>'}
        </section>
      </div>`;
    import('../ui.js').then((m) => m.applyRole(root));
  }

  root.addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-edit]');
    if (ed) { editing = ed.dataset.edit; draw(); }
    if (e.target.closest('[data-new]')) { editing = 'new'; draw(); }
    if (e.target.closest('[data-cancel]')) { editing = null; draw(); }
    if (e.target.closest('[data-del]')) { try { await api.remove('packages', editing); toast('حُذفت الباقة.'); editing = null; } catch (err) { toast(err.message, 'bad'); } draw(); }
  });
  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    const coinsNo = Number(root.querySelector('#coins').value.replace(/,/g, ''));
    const priceInUSD = Number(root.querySelector('#usd').value);
    if (!(coinsNo > 0) || !(priceInUSD > 0)) { root.querySelector('#pk-e').classList.remove('hidden'); root.querySelector('#coins').setAttribute('aria-invalid', 'true'); return; }
    try {
      if (editing === 'new') { const k = await api.create('packages', { coinsNo, priceInUSD }); editing = k.id; } else await api.update('packages', editing, { coinsNo, priceInUSD });
      toast('حُفظت الباقة.');
    } catch (err) { toast(err.message, 'bad'); }
    draw();
  });
  draw();
}
