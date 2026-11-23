import { prependStats as _ps, statCards as _sc } from '../ui.js';
import { api } from '../api.js';
import { ago, chip, esc, toast } from '../ui.js';

export const meta = { title: 'رسائل المستخدمين', sub: 'رسائل الدعم الواردة من التطبيق والموقع.' };

export default function messages(root, { ctx }) {
  let filter = 'open';
  let sel = null;

  function draw() {
    const all = api.rows('messages');
    const items = all.filter((m) => (filter === 'open' ? !m.solved : filter === 'done' ? m.solved : true));
    if (!items.some((m) => m.id === sel)) sel = items[0]?.id ?? null;
    const m = items.find((x) => x.id === sel);
    const pill = (id, label) => `<button type="button" data-f="${id}" class="ad-pill" aria-pressed="${filter === id}">${label}</button>`;
    root.innerHTML = `
      <div class="flex flex-col gap-5">
        <div role="group" aria-label="الحالة" class="flex gap-2">${pill('open', `غير محلولة (${all.filter((x) => !x.solved).length})`)}${pill('done', 'محلولة')}${pill('all', 'الكل')}</div>
        <div class="flex flex-wrap items-start gap-5">
          <section class="ad-card flex min-w-0 flex-[1_1_340px] flex-col gap-2.5" aria-label="الرسائل">
            ${items.length ? items.map((x) => `<button type="button" data-m="${x.id}" aria-pressed="${x.id === sel}" class="flex flex-col gap-1.5 rounded-2xl border p-3.5 text-start ${x.id === sel ? 'border-primary bg-primary-soft' : 'border-line bg-white hover:bg-sand'}"><span class="flex justify-between gap-2"><strong class="text-[13px]">${esc(x.name)}</strong>${x.solved ? chip('محلولة', 'good') : chip('غير محلولة', 'warn')}</span><span class="text-xs text-ink-body">${esc(x.message)}</span><span class="text-[11px] text-ink-muted">${ago(x.createdAt)}</span></button>`).join('') : '<p class="m-0 py-8 text-center text-[13px] text-ink-muted">لا توجد رسائل.</p>'}
          </section>
          <section class="ad-card flex min-w-0 flex-[1.5_1_480px] flex-col gap-4" aria-labelledby="m-h">
            ${m ? `<div class="flex flex-wrap justify-between gap-2"><h2 id="m-h" class="m-0 text-lg font-bold">${esc(m.name)}</h2><a href="#/accounts/${m.accountId}" class="text-[13px] font-semibold">فتح الحساب ‹</a></div>
              <p class="m-0 rounded-2xl bg-mist p-3.5 text-[13px] leading-8 text-ink-body">${esc(m.message)}</p>
              <div class="flex flex-wrap gap-2.5"><button type="button" data-solve data-write class="ad-btn-primary ad-btn-lg" ${m.solved ? 'disabled' : ''}>تعليم كمحلولة</button><a href="#/notifications" class="ad-btn ad-btn-lg">إرسال إشعار للمستخدم</a></div>
              <p class="ad-muted m-0">الرسالة بلا ردود داخل النظام؛ الرد يكون بإشعار أو خارجياً.</p>` : '<p class="m-0 text-[13px] text-ink-muted">اختر رسالة.</p>'}
          </section>
        </div>
      </div>`;
    _ps(root, _sc([{ label: 'غير محلولة', value: all.filter((x) => !x.solved).length, tone: 'outline', sub: 'تحتاج رداً' }, { label: 'محلولة', value: all.filter((x) => x.solved).length, tone: 'primary', sub: 'أُغلقت' }, { label: 'إجمالي الرسائل', value: all.length, tone: 'forest', sub: 'من التطبيق والموقع' }], 'sm:grid-cols-3'));
    import('../ui.js').then((u) => u.applyRole(root));
  }

  root.addEventListener('click', async (e) => {
    const f = e.target.closest('[data-f]');
    if (f) { filter = f.dataset.f; draw(); return; }
    const mm = e.target.closest('[data-m]');
    if (mm) { sel = mm.dataset.m; draw(); return; }
    if (e.target.closest('[data-solve]') && !e.target.closest('[data-solve]').disabled) {
      try { await api.update('messages', sel, { solved: true }); toast('عُلّمت الرسالة كمحلولة.'); ctx.refreshBadges(); } catch (err) { toast(err.message, 'bad'); }
      draw();
    }
  });
  draw();
}
