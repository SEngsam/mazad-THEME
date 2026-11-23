import { api } from '../api.js';
import { esc, icon, toast } from '../ui.js';

export const meta = { title: 'الإعدادات', sub: 'إعدادات المنصة العامة. تُطبَّق على التطبيق والموقع.' };

const SECTIONS = [
  ['المزادات', [
    ['auctionActiveTimeInHours', 'مدة المزاد الافتراضية', 'num', 'بالساعات'], ['maxProductPrice', 'أعلى سعر للمنتج', 'num', 'ر.س'],
    ['maxAllowedDistanceBetweenUsersInKM', 'أقصى مسافة بين المستخدمين', 'num', 'كم'], ['automaticallyAcceptBidOnAuctionClose', 'قبول أعلى عرض تلقائياً عند الإغلاق', 'bool'],
  ]],
  ['العملات والتكلفة', [
    ['freeAuctionsCount', 'مزادات مجانية لكل حساب', 'num'], ['freeBidsCount', 'مزايدات مجانية لكل حساب', 'num'], ['auctionsCoinsCost', 'تكلفة إضافة مزاد', 'num', 'عملة'],
    ['bidsCoinsCost', 'تكلفة المزايدة', 'num', 'عملة'], ['promotionCoinsCost', 'تكلفة ترويج المزاد', 'num', 'عملة'], ['rewardCoinsForWatchingAd', 'مكافأة مشاهدة إعلان', 'num', 'عملة'],
  ]],
  ['الصلاحيات', [
    ['allowUnvalidatedUsersToCreateAuctions', 'السماح لغير الموثّقين بإنشاء مزاد', 'bool'], ['allowUnvalidatedUsersToCreateBids', 'السماح لغير الموثّقين بالمزايدة', 'bool'],
    ['allowAnonymousUsersToCreateAuctions', 'السماح لمجهولي الهوية بإنشاء مزاد', 'bool'], ['allowAnonymousUsersToCreateBids', 'السماح لمجهولي الهوية بالمزايدة', 'bool'],
    ['allowValidationRequest', 'السماح بطلب التوثيق', 'bool'], ['emailValidationEnabled', 'التحقق من البريد الإلكتروني', 'bool'],
  ]],
  ['عام', [
    ['appName', 'اسم التطبيق', 'text'], ['webAppUrl', 'رابط الموقع', 'url'], ['defaultCurrency', 'العملة الافتراضية', 'static'],
    ['allowMultipleCurrencies', 'تعدد العملات', 'bool'], ['adsEnabledOnAndroid', 'الإعلانات في تطبيق أندرويد', 'bool'], ['adsEnabledOnIOS', 'الإعلانات في تطبيق iOS', 'bool'],
    ['_keys', 'مفاتيح الخدمات', 'note', 'الدفع والتخزين والذكاء الاصطناعي'],
  ]],
];

export default async function settings(root) {
  const s = await api.getSettings();
  const draft = { ...s };

  const field = ([key, label, type, hint]) => {
    const l = `<span>${label}${hint && type !== 'note' ? `<small class="mt-0.5 block text-xs text-ink-muted">${hint}</small>` : ''}</span>`;
    let ctl;
    if (type === 'bool') ctl = `<button type="button" role="switch" data-write data-k="${key}" aria-checked="${draft[key]}" aria-label="${esc(label)}" class="ad-switch"></button>`;
    else if (type === 'num') ctl = `<input data-write data-k="${key}" data-num inputmode="numeric" aria-label="${esc(label)}" value="${Number(draft[key]).toLocaleString('en-US')}" class="ad-input !h-[38px] !w-32 text-center tabular">`;
    else if (type === 'text' || type === 'url') ctl = `<input data-write data-k="${key}" aria-label="${esc(label)}" ${type === 'url' ? 'dir="ltr"' : ''} value="${esc(draft[key])}" class="ad-input !h-[38px] !w-56 ${type === 'url' ? 'text-end' : ''}">`;
    else if (type === 'static') ctl = `<span class="font-semibold">${esc(draft[key])}</span>`;
    else ctl = `<span class="text-xs text-ink-muted">مخفية · للمدير فقط</span>`;
    return `<div class="ad-row items-center !text-ink">${l.replace('<span>', '<span class="!text-ink">')}${ctl}</div>`;
  };

  root.innerHTML = `
    <form id="sf" novalidate class="flex flex-col gap-5">
      <div class="grid items-start gap-5 xl:grid-cols-2">
        ${SECTIONS.map(([t, fs], i) => `<section class="ad-card ad-rise" aria-labelledby="s${i}"><h2 id="s${i}" class="ad-h2 mb-1.5 flex items-center gap-3"><span class="grid h-9 w-9 place-items-center rounded-xl ${['bg-primary text-white', 'bg-lime text-forest', 'bg-forest text-lime', 'bg-accent text-white'][i]}">${icon(['gavel', 'coin', 'lock', 'gear'][i], 18)}</span>${t}</h2>${fs.map(field).join('')}</section>`).join('')}
      </div>
      <div class="flex flex-wrap items-center gap-3"><button type="submit" data-write class="ad-btn-primary ad-btn-lg">حفظ الإعدادات</button><span class="ad-muted">دور «للقراءة فقط» يعرض هذه الصفحة دون حفظ.</span></div>
    </form>`;

  root.addEventListener('click', (e) => {
    const sw = e.target.closest('[role=switch]');
    if (sw && !sw.disabled) { draft[sw.dataset.k] = !draft[sw.dataset.k]; sw.setAttribute('aria-checked', String(draft[sw.dataset.k])); }
  });
  root.addEventListener('input', (e) => {
    const el = e.target.closest('[data-k]');
    if (!el || el.matches('[role=switch]')) return;
    draft[el.dataset.k] = el.hasAttribute('data-num') ? Number(el.value.replace(/[,٬\s]/g, '')) || 0 : el.value;
  });
  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api.saveSettings(draft); toast('حُفظت الإعدادات.'); } catch (err) { toast(err.message, 'bad'); }
  });
}
