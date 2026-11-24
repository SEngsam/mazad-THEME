import { api } from '../api.js';
import { ago, askReason, chip, esc, fmt, fmtDate, fmtDay, heroStrip, mask, money, money2, runCounts, statCards, statusChip, toast } from '../ui.js';
import { avatar } from './accounts.js';

export const meta = { title: 'تفاصيل الحساب', sub: '' };

export default async function accountDetail(root, { params, ctx }) {
  let acc;
  try { acc = await api.get('accounts', params.id); } catch { root.innerHTML = (await import('./states.js')).notFound(); return; }
  ctx.setHeader('تفاصيل الحساب', acc.name);
  let tab = 'auctions';

  const auctions = () => api.rows('auctions').filter((a) => a.accountId === acc.id);
  const bids = () => api.rows('bids').filter((b) => b.bidderId === acc.id);
  const pays = () => api.rows('payments').filter((p) => p.accountId === acc.id);
  const revs = () => api.rows('reviews').filter((r) => r.toId === acc.id);
  const row = (k, v) => `<div class="ad-row"><span>${k}</span><span class="font-semibold">${v}</span></div>`;
  const empty = (t) => `<p class="m-0 py-8 text-center text-[13px] text-ink-muted">${t}</p>`;

  const tabs = {
    auctions: () => auctions().length ? `<table class="ad-table min-w-[520px]"><thead><tr><th scope="col">المزاد</th><th scope="col">آخر سعر</th><th scope="col">الحالة</th><th scope="col">أُنشئ</th></tr></thead><tbody>${auctions().slice(0, 8).map((a) => `<tr><td class="font-semibold"><a href="#/auctions/${a.id}">${esc(a.title)}</a></td><td class="tabular">${a.lastPrice ? money(a.lastPrice) : '—'}</td><td>${statusChip(a.status)}</td><td class="text-xs text-ink-muted">${ago(a.createdAt)}</td></tr>`).join('')}</tbody></table>` : empty('لا توجد مزادات لهذا الحساب.'),
    bids: () => bids().length ? `<table class="ad-table min-w-[520px]"><thead><tr><th scope="col">المزاد</th><th scope="col">السعر</th><th scope="col">الحالة</th><th scope="col">الوقت</th></tr></thead><tbody>${bids().slice(0, 8).map((b) => `<tr><td class="font-semibold"><a href="#/auctions/${b.auctionId}">${esc(b.auctionTitle)}</a></td><td class="tabular">${money(b.price)}</td><td>${chip({ open: 'مفتوحة', accepted: 'مقبولة', rejected: 'مرفوضة' }[b.status], b.status === 'accepted' ? 'good' : b.status === 'rejected' ? 'bad' : 'info')}</td><td class="text-xs text-ink-muted">${ago(b.createdAt)}</td></tr>`).join('')}</tbody></table>` : empty('لا توجد مزايدات لهذا الحساب.'),
    payments: () => pays().length ? `<table class="ad-table min-w-[520px]"><thead><tr><th scope="col">الرقم</th><th scope="col">الباقة</th><th scope="col">الإجمالي</th><th scope="col">المتجر</th></tr></thead><tbody>${pays().map((p) => `<tr><td class="tabular"><a href="#/payments/${p.id}">${p.number}</a></td><td>${esc(p.boughtPackage)}</td><td class="tabular">${money2(p.totalAmount)}</td><td>${chip(p.store)}</td></tr>`).join('')}</tbody></table>` : empty('لا توجد عمليات شراء.'),
    reviews: () => revs().length ? revs().map((r) => `<div class="ad-row"><span class="text-primary">${'★'.repeat(r.stars)}<span class="text-[#C9D3E0]">${'★'.repeat(5 - r.stars)}</span></span><span class="max-w-[70%] text-ink">${esc(r.description)}</span></div>`).join('') : empty('لا توجد تقييمات.'),
  };
  const TABS = [['auctions', 'المزادات'], ['bids', 'المزايدات'], ['payments', 'المدفوعات'], ['reviews', 'التقييمات']];

  let animated = false;
  function draw() {
    root.innerHTML = `
      <div class="flex flex-col gap-5">
        <nav aria-label="مسار التصفح" class="text-[13px] text-ink-muted"><a href="#/accounts">الحسابات</a> ‹ <span class="text-ink">${esc(acc.name)}</span></nav>
        ${heroStrip(`<div class="flex flex-wrap items-center justify-between gap-4"><div class="flex flex-wrap items-center gap-4"><span class="grid h-16 w-16 place-items-center rounded-full bg-gold text-2xl font-bold text-navy">${esc([...acc.name][0])}</span>
            <div><h2 class="m-0 text-2xl font-bold">${esc(acc.name)}</h2><p class="m-0 mt-1 text-[13px] text-white/70">${esc(acc.locationPretty)} · مسجّل منذ ${fmtDate(acc.createdAt)}</p></div>${acc.verified ? chip('موثّق', 'good') : chip('غير موثّق', 'info')}</div>
          <div class="flex flex-wrap gap-2.5"><button type="button" data-notify data-write class="rounded-full bg-gold px-6 py-2.5 text-[13px] font-bold text-navy">إرسال إشعار</button>
            <button type="button" data-verify data-write class="rounded-full border-[1.5px] border-white/60 px-6 py-2.5 text-[13px] font-semibold text-white">${acc.verified ? 'إلغاء التوثيق' : 'توثيق الحساب'}</button></div></div>`)}
        ${statCards([{ label: 'رصيد العملات', value: acc.coins, tone: 'gold', sub: 'عملة' }, { label: 'المزادات', value: auctions().length, tone: 'primary', sub: 'أنشأها الحساب' }, { label: 'المزايدات', value: bids().length, tone: 'accent', sub: 'قدّمها الحساب' }, { label: 'التقييم', value: acc.rating, decimals: 1, suffix: ' ★', tone: 'navy', sub: `${revs().length} تقييماً` }])}
        <div class="flex flex-wrap items-start gap-5">
          <section class="ad-card min-w-0 flex-[1.7_1_560px]" aria-label="نشاط الحساب">
            <div role="tablist" aria-label="النشاط" class="mb-2 flex gap-1 overflow-x-auto border-b border-line-soft">${TABS.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === tab}" class="whitespace-nowrap border-b-2 px-4 py-2.5 text-[13px] font-semibold ${k === tab ? 'border-primary text-primary' : 'border-transparent text-ink-body'}">${l}</button>`).join('')}</div>
            <div class="overflow-x-auto">${tabs[tab]()}</div>
          </section>
          <div class="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            <section class="ad-card"><h2 class="ad-h2 mb-1">بيانات الحساب</h2>
              ${row('الجوال', `<span class="tabular">${esc(mask(acc.isAnonymous ? '—' : `${acc.phone.slice(0, 2)}•• ••• ${acc.phone.slice(-3)}`))}</span>`)}${row('البريد', '•••••••')}${row('العملة المفضلة', 'ريال سعودي')}${row('قبول الشروط', chip('نعم', 'good'))}</section>
            <section class="ad-card"><h2 class="ad-h2 mb-1">التوثيق</h2>
              ${row('الحالة', acc.verified ? chip('موثّق', 'good') : acc.verificationRequestedAt ? chip('طلب توثيق', 'warn') : chip('غير موثّق', 'info'))}${row('تاريخ الطلب', fmtDay(acc.verificationRequestedAt || (acc.verified ? acc.createdAt : null)))}</section>
          </div>
        </div>
      </div>`;
    import('../ui.js').then((m) => m.applyRole(root));
    runCounts(root, !animated);
    animated = true;
  }

  root.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tab]');
    if (t) { tab = t.dataset.tab; draw(); return; }
    if (e.target.closest('[data-verify]')) {
      try { await api.verifyAccount(acc.id, !acc.verified); toast(acc.verified ? 'تم توثيق الحساب وإشعار المستخدم.' : 'أُلغي التوثيق.'); } catch (err) { toast(err.message, 'bad'); }
      draw();
    }
    if (e.target.closest('[data-notify]')) {
      const title = await askReason({ title: 'إرسال إشعار', text: `إلى: ${acc.name}`, label: 'نص الإشعار', confirm: 'إرسال' });
      if (title === null) return;
      try { await api.sendNotification({ to: 'one', accountId: acc.id, title }); toast('أُرسل الإشعار.'); } catch (err) { toast(err.message, 'bad'); }
    }
  });
  draw();
}

export { avatar };
