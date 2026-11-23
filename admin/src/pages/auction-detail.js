import { api } from '../api.js';
import { accName, ago, askReason, catPath, chip, errorBox, esc, fmt, fmtDateTime, money, statusChip, toast } from '../ui.js';

export const meta = { title: 'تفاصيل المزاد', sub: '' };

export default async function auctionDetail(root, { params, ctx }) {
  let a;
  try { a = await api.get('auctions', params.id); } catch { root.innerHTML = (await import('./states.js')).notFound(); return; }
  ctx.setHeader('تفاصيل المزاد', `${a.id} · ${a.title}`);

  const bidsOf = () => api.rows('bids').filter((b) => b.auctionId === a.id).sort((x, y) => y.price - x.price);
  const row = (k, v) => `<div class="ad-row"><span>${k}</span><span class="font-semibold">${v}</span></div>`;
  const seller = api.rows('accounts').find((x) => x.id === a.accountId);

  function draw() {
    const bids = bidsOf();
    const cancellable = ['APPROVED', 'SCHEDULED', 'LIVE'].includes(a.status);
    root.innerHTML = `
      <div class="flex flex-col gap-5">
        <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted"><a href="#/auctions">المزادات</a> ‹ <span class="text-ink">${esc(a.title)}</span></nav>
        <div class="flex flex-wrap items-start gap-5">
          <div class="flex min-w-0 flex-[1.7_1_560px] flex-col gap-5">
            <section class="ad-card flex flex-col gap-4" aria-labelledby="t-h">
              <div class="flex flex-wrap justify-between gap-3"><h2 id="t-h" class="m-0 text-xl font-bold">${esc(a.title)}</h2>${statusChip(a.status)}</div>
              <div class="grid grid-cols-4 gap-2.5">${['صورة 1', 'صورة 2', 'صورة 3', '+ 6'].map((t) => `<div class="ad-ph aspect-[4/3]">${t}</div>`).join('')}</div>
              <p class="m-0 text-[13px] leading-8 text-ink-body">${esc(a.description)}</p>
              ${a.statusReason ? `<p class="m-0 rounded-2xl bg-accent-soft px-4 py-3 text-[13px] text-accent-ink"><strong>السبب:</strong> ${esc(a.statusReason)}</p>` : ''}
            </section>
            <section class="ad-card" aria-labelledby="b-h"><h2 id="b-h" class="ad-h2 mb-2">المزايدات ${chip(String(bids.length), 'info')}</h2>
              ${bids.length ? `<div class="overflow-x-auto"><table class="ad-table min-w-[560px]"><thead><tr><th scope="col">المزايد</th><th scope="col">السعر</th><th scope="col">الموقع</th><th scope="col">الحالة</th><th scope="col">الوقت</th></tr></thead><tbody>
                ${bids.slice(0, 8).map((b) => `<tr><td>${esc(b.bidderName)}</td><td class="tabular font-semibold">${money(b.price)}</td><td>${esc(b.locationPretty)}</td><td>${b.status === 'rejected' ? `${chip('مرفوضة', 'bad')}<div class="mt-0.5 text-[11px] text-ink-muted">${esc(b.rejectionReason)}</div>` : b.status === 'accepted' ? chip('مقبولة', 'good') : chip('مفتوحة', 'info')}</td><td class="text-xs text-ink-muted">${ago(b.createdAt)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="m-0 py-6 text-center text-[13px] text-ink-muted">لا توجد مزايدات على هذا المزاد.</p>'}
              <p class="ad-muted mb-0 mt-2">الرفض يظهر مع سببه. قبول العرض من صلاحية البائع فقط.</p></section>
            <section class="ad-card" aria-labelledby="h-h"><h2 id="h-h" class="ad-h2 mb-3.5">سجل الأحداث</h2>
              <ol class="m-0 list-none p-0">${[...a.history].reverse().map((h, i) => `<li class="flex gap-3 pb-4 last:pb-0"><span class="mt-1 h-3 w-3 shrink-0 rounded-full ${i ? 'bg-[#9AA5A0]' : 'bg-primary'}"></span><span class="text-[13px]"><strong>${esc(h.text)}</strong><br><span class="text-xs text-ink-muted">${fmtDateTime(h.at)} · ${esc(h.by)}</span></span></li>`).join('')}</ol></section>
          </div>
          <div class="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            <section class="ad-card" aria-labelledby="p-h"><h2 id="p-h" class="ad-h2 mb-1">الأسعار والمواعيد</h2>
              ${row('سعر البدء', `<span class="tabular">${money(a.startingPrice)}</span>`)}${row('آخر سعر', `<span class="tabular text-primary">${money(a.lastPrice)}</span>`)}${row('أقل زيادة', `<span class="tabular">${money(a.minBidIncrement)}</span>`)}${row('ينتهي في', `<span class="tabular">${fmtDateTime(a.expiresAt)}</span>`)}${row('المشاهدات', `<span class="tabular">${fmt(a.views)}</span>`)}</section>
            <section class="ad-card" aria-labelledby="d-h"><h2 id="d-h" class="ad-h2 mb-1">البيانات</h2>
              ${row('الفئة', esc(catPath(a)))}${row('الموقع', esc(a.locationPretty))}${row('الحالة', a.isNewItem ? 'جديد' : 'مستعمل')}${a.carModel ? row('الموديل', a.carModel) + row('المسافة', `<span class="tabular">${fmt(a.mileage)} كم</span>`) : ''}</section>
            <section class="ad-card" aria-labelledby="s-h"><h2 id="s-h" class="ad-h2 mb-1">البائع</h2>
              ${row('الحساب', `<a href="#/accounts/${a.accountId}">${esc(accName(a.accountId))} ‹</a>`)}${row('التوثيق', seller?.verified ? chip('موثّق', 'good') : chip('غير موثّق', 'info'))}</section>
            <section class="ad-card" aria-labelledby="r-h"><h2 id="r-h" class="ad-h2 mb-1">المراجعة</h2>
              ${row('قُدّم', `<span class="tabular">${a.submittedAt ? ago(a.submittedAt) : '—'}</span>`)}${row('روجع', `<span class="tabular">${a.reviewedAt ? ago(a.reviewedAt) : '—'}</span>`)}${row('المراجع', esc(a.reviewedBy || '—'))}
              <div class="mt-3 flex flex-wrap gap-2.5">${a.status === 'PENDING_REVIEW' ? '<a href="#/review" class="ad-btn-primary ad-btn-lg">فتح المراجعة</a>' : ''}${cancellable ? '<button type="button" data-cancel data-write class="ad-btn ad-btn-lg">إلغاء المزاد</button>' : ''}</div>
              ${cancellable ? '<p class="ad-muted mb-0 mt-2.5">الإلغاء يتطلب سبباً ويُسجَّل في السجل.</p>' : ''}</section>
          </div>
        </div>
      </div>`;
    import('../ui.js').then((m) => m.applyRole(root));
  }

  root.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-cancel]')) return;
    const reason = await askReason({ title: 'إلغاء المزاد', text: 'سيُشعَر البائع والمزايدون بالإلغاء.', confirm: 'تأكيد الإلغاء', danger: true });
    if (reason === null) return;
    try { await api.cancelAuction(a.id, reason); toast('أُلغي المزاد.'); } catch (err) { toast(err.message, 'bad'); }
    draw();
  });
  draw();
}

export { errorBox };
