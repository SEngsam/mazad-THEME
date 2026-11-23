import { api } from '../api.js';
import { accName, ago, catPath, chip, emptyBox, esc, fmtDateTime, money, statusChip, toast } from '../ui.js';

export const meta = { title: 'المراجعة', sub: 'المزادات المقدَّمة بانتظار قرار المشرف.' };

export default function review(root, { ctx }) {
  let selected = null;

  const queue = () => api.rows('auctions').filter((a) => a.status === 'PENDING_REVIEW');
  const row = (k, v) => `<div class="ad-row"><span>${k}</span><span class="font-semibold">${v}</span></div>`;

  function draw() {
    const items = queue();
    if (!items.length) {
      root.innerHTML = `<div class="ad-card">${emptyBox('لا توجد مزادات بانتظار المراجعة', 'ستظهر هنا المزادات المقدَّمة من البائعين.', '<a href="#/auctions" class="ad-btn ad-btn-lg mt-2">عرض كل المزادات</a>')}</div>`;
      return;
    }
    if (!items.some((a) => a.id === selected)) selected = items[0].id;
    const a = items.find((x) => x.id === selected);
    const seller = api.rows('accounts').find((x) => x.id === a.accountId);
    const sold = api.rows('auctions').filter((x) => x.accountId === a.accountId && ['LIVE', 'CLOSED'].includes(x.status)).length;

    root.innerHTML = `
      <div class="flex flex-wrap items-start gap-5">
        <section class="ad-card flex min-w-0 flex-[1_1_320px] flex-col gap-2.5" aria-labelledby="q-h">
          <div class="mb-1 flex items-center justify-between"><h2 id="q-h" class="ad-h2">بانتظار المراجعة</h2>${chip(String(items.length), 'warn')}</div>
          ${items.map((x) => `<button type="button" data-pick="${x.id}" aria-pressed="${x.id === selected}" class="flex flex-col gap-1.5 rounded-2xl border p-3.5 text-start ${x.id === selected ? 'border-primary bg-primary-soft' : 'border-line bg-white hover:bg-sand'}">
            <span class="flex items-start justify-between gap-2"><strong class="text-sm">${esc(x.title)}</strong>${chip(x.resubmitted ? 'أُعيد تقديمه' : 'جديد', x.resubmitted ? 'warn' : 'info')}</span>
            <span class="text-xs text-ink-muted">${esc(catPath(x).split(' ‹ ')[0])} · ${esc(x.locationPretty)}</span><span class="text-xs text-ink-muted">قُدّم ${ago(x.submittedAt)}</span></button>`).join('')}
        </section>

        <section class="ad-card flex min-w-0 flex-[1.8_1_520px] flex-col gap-5" aria-labelledby="d-h">
          <div class="flex flex-wrap items-start justify-between gap-3"><div><h2 id="d-h" class="m-0 text-xl font-bold">${esc(a.title)}</h2><p class="m-0 mt-1 text-[13px] text-ink-muted">${esc(catPath(a))} · ${esc(a.locationPretty)}</p></div>${statusChip(a.status)}</div>
          <div class="grid grid-cols-4 gap-2.5">${['صورة 1', 'صورة 2', 'صورة 3', '+ 9'].map((t) => `<div class="ad-ph aspect-[4/3]">${t}</div>`).join('')}</div>
          <p class="m-0 text-[13px] leading-8 text-ink-body">${esc(a.description)}</p>
          <div class="grid gap-x-7 md:grid-cols-2">
            <div><h3 class="m-0 text-sm font-bold">بيانات المزاد</h3>
              ${row('سعر البدء', `<span class="tabular">${money(a.startingPrice)}</span>`)}${row('أقل زيادة للمزايدة', `<span class="tabular">${money(a.minBidIncrement)}</span>`)}${row('تاريخ الانتهاء', `<span class="tabular">${fmtDateTime(a.expiresAt)}</span>`)}${row('الحالة', a.isNewItem ? 'جديد' : 'مستعمل')}
              ${a.carModel ? row('الموديل', a.carModel) + row('المسافة المقطوعة', `<span class="tabular">${a.mileage.toLocaleString('en-US')} كم</span>`) + row('الرقم التسلسلي', `<span class="tabular" dir="ltr">${esc(a.serialNumber)}</span>`) : ''}</div>
            <div><h3 class="m-0 text-sm font-bold">البائع</h3>
              ${row('الاسم', `<a href="#/accounts/${a.accountId}">${esc(accName(a.accountId))}</a>`)}${row('التوثيق', seller.verified ? chip('موثّق', 'good') : chip('غير موثّق', 'info'))}${row('مزادات سابقة', `<span class="tabular">${sold}</span>`)}${row('قُدّم في', `<span class="tabular">${fmtDateTime(a.submittedAt)}</span>`)}
              <h3 class="m-0 mt-4 text-sm font-bold">السجل</h3>${a.history.map((h) => row(esc(h.text), `<span class="tabular">${fmtDateTime(h.at)}</span>`)).join('')}</div>
          </div>
          <div>
            <label for="note" class="ad-label">السبب <span class="font-normal text-ink-muted">(إلزامي للرفض وطلب التعديل، 3 أحرف فأكثر)</span></label>
            <textarea id="note" rows="3" class="ad-input" aria-describedby="note-e"></textarea><p id="note-e" class="m-0 mt-1 hidden text-xs text-accent-ink">اكتب سبباً من 3 أحرف على الأقل.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <button type="button" data-do="APPROVE" data-write class="ad-btn-primary ad-btn-lg">اعتماد</button>
            <button type="button" data-do="REQUEST_CHANGES" data-write class="ad-btn ad-btn-lg">طلب تعديل من البائع</button>
            <button type="button" data-do="REJECT" data-write class="ad-btn-danger ad-btn-lg">رفض</button>
            <span class="ms-auto text-xs text-ink-muted">إن تغيّر المزاد أثناء المراجعة يُطلب تحديث الصفحة.</span>
          </div>
        </section>
      </div>`;
  }

  root.addEventListener('click', async (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { selected = pick.dataset.pick; draw(); return; }
    const btn = e.target.closest('[data-do]');
    if (!btn || btn.disabled) return;
    const note = root.querySelector('#note');
    const action = btn.dataset.do;
    if (action !== 'APPROVE' && note.value.trim().length < 3) {
      note.setAttribute('aria-invalid', 'true');
      root.querySelector('#note-e').classList.remove('hidden');
      note.focus();
      return;
    }
    root.querySelectorAll('[data-do]').forEach((b) => { b.disabled = true; });
    try {
      await api.reviewAuction(selected, action, note.value);
      toast({ APPROVE: 'تم اعتماد المزاد وإشعار البائع.', REJECT: 'تم رفض المزاد.', REQUEST_CHANGES: 'أُرسل طلب التعديل إلى البائع.' }[action]);
      ctx.refreshBadges();
    } catch (err) {
      toast(err.message, 'bad');
    }
    draw();
    import('../ui.js').then((m) => m.applyRole(root));
  });

  draw();
}
