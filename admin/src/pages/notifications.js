import { api } from '../api.js';
import { chip, esc, toast } from '../ui.js';

export const meta = { title: 'الإشعارات', sub: 'نصوص الإشعارات حسب النوع، وإرسال إشعار يدوي.' };

export default async function notifications(root) {
  const types = await api.notificationTypes();
  let sel = types[0].type;

  function draw() {
    const t = types.find((x) => x.type === sel);
    const accs = api.rows('accounts');
    root.innerHTML = `
      <div class="flex flex-wrap items-start gap-5">
        <section class="ad-card flex min-w-0 flex-[1_1_320px] flex-col gap-2.5" aria-labelledby="n1">
          <div class="mb-1 flex items-center justify-between"><h2 id="n1" class="ad-h2">أنواع الإشعارات</h2>${chip(String(types.length))}</div>
          ${types.map((x) => `<button type="button" data-type="${x.type}" aria-pressed="${x.type === sel}" class="flex flex-col gap-0.5 rounded-2xl border px-3.5 py-3 text-start ${x.type === sel ? 'border-primary bg-primary-soft' : 'border-line bg-white hover:bg-sand'}"><strong class="text-[13px]">${esc(x.label)}</strong><span dir="ltr" class="text-end text-[11px] text-ink-muted">${x.type}</span></button>`).join('')}
          <a href="#/notifications/log" class="mt-1 text-center text-[13px] font-semibold">سجل الإشعارات المرسلة ‹</a>
        </section>
        <section class="ad-card flex min-w-0 flex-[1.2_1_420px] flex-col gap-4" aria-labelledby="n2">
          <h2 id="n2" class="ad-h2">تعديل النص · ${esc(t.label)}</h2>
          <form id="nt" novalidate class="flex flex-col gap-4">
            <div><label class="ad-label" for="t1">العنوان · العربية</label><input id="t1" class="ad-input" value="${esc(t.title)}"></div>
            <div><label class="ad-label" for="t2">الوصف · العربية</label><textarea id="t2" rows="3" class="ad-input">${esc(t.description)}</textarea></div>
            <div><label class="ad-label" for="t3">العنوان · English</label><input id="t3" dir="ltr" class="ad-input text-end" value="${esc(t.titleEn)}"></div>
            <p class="ad-muted m-0">النصوص متوفرة بـ16 لغة. المتغيرات بين أقواس مثل {auction} لا تُحذف.</p>
            <div class="flex gap-2.5"><button type="submit" data-write class="ad-btn-primary ad-btn-lg">حفظ</button></div>
          </form>
        </section>
        <section class="ad-card flex min-w-0 flex-[1_1_340px] flex-col gap-4" aria-labelledby="n3">
          <h2 id="n3" class="ad-h2">إرسال إشعار</h2>
          <form id="ns" novalidate class="flex flex-col gap-4">
            <div><label class="ad-label" for="s1">إلى</label><select id="s1" class="ad-input"><option value="one">حساب محدد</option><option value="all">جميع الحسابات</option></select></div>
            <div id="acc-wrap"><label class="ad-label" for="s2">الحساب</label><select id="s2" class="ad-input">${accs.slice(0, 12).map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></div>
            <div><label class="ad-label" for="s3">العنوان</label><input id="s3" class="ad-input" aria-describedby="s3e"><p id="s3e" class="m-0 mt-1 hidden text-xs text-accent-ink">العنوان مطلوب.</p></div>
            <div><label class="ad-label" for="s4">النص</label><textarea id="s4" rows="3" class="ad-input"></textarea></div>
            <button type="submit" data-write class="ad-btn-primary ad-btn-lg self-start">إرسال</button>
            <p class="ad-muted m-0">يصل عبر FCM وإشعارات المتصفح.</p>
          </form>
        </section>
      </div>`;
    import('../ui.js').then((m) => m.applyRole(root));
  }

  root.addEventListener('click', (e) => { const b = e.target.closest('[data-type]'); if (b) { sel = b.dataset.type; draw(); } });
  root.addEventListener('change', (e) => { if (e.target.id === 's1') root.querySelector('#acc-wrap').classList.toggle('hidden', e.target.value === 'all'); });
  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      if (e.target.id === 'nt') {
        await api.saveNotificationType(sel, { title: root.querySelector('#t1').value, description: root.querySelector('#t2').value, titleEn: root.querySelector('#t3').value });
        toast('حُفظ النص.');
      } else {
        const title = root.querySelector('#s3').value;
        if (!title.trim()) { root.querySelector('#s3').setAttribute('aria-invalid', 'true'); root.querySelector('#s3e').classList.remove('hidden'); root.querySelector('#s3').focus(); return; }
        await api.sendNotification({ to: root.querySelector('#s1').value, accountId: root.querySelector('#s2').value, title });
        toast('أُرسل الإشعار.');
        root.querySelector('#s3').value = '';
        root.querySelector('#s4').value = '';
      }
    } catch (err) { toast(err.message, 'bad'); }
  });
  draw();
}
