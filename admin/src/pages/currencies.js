import { prependStats as _ps, statCards as _sc } from '../ui.js';
import { api } from '../api.js';
import { chip, esc, fmtDateTime } from '../ui.js';

export const meta = { title: 'العملات وأسعار الصرف', sub: 'العملات المدعومة وآخر أسعار الصرف.' };

export default async function currencies(root) {
  const { currencies: list, rates } = await api.currencies();
  root.innerHTML = `
    <div class="flex flex-wrap items-start gap-5">
      <section class="ad-card min-w-0 flex-[1_1_440px]" aria-labelledby="c1"><h2 id="c1" class="ad-h2 mb-2">العملات</h2>
        <table class="ad-table"><thead><tr><th scope="col">الرمز</th><th scope="col">العلامة</th><th scope="col">الاسم</th><th scope="col">الحالة</th></tr></thead>
          <tbody>${list.map((c) => `<tr><td class="tabular font-semibold">${c.code}</td><td>${esc(c.symbol)}</td><td>${esc(c.name)}</td><td>${c.isDefault ? chip('الافتراضية', 'good') : chip('مدعومة')}</td></tr>`).join('')}</tbody></table>
        <p class="ad-muted mb-0 mt-3">تعدد العملات يُفعَّل من الإعدادات.</p></section>
      <section class="ad-card min-w-0 flex-[1_1_440px]" aria-labelledby="c2"><div class="mb-2 flex items-baseline justify-between"><h2 id="c2" class="ad-h2">أسعار الصرف</h2><span class="ad-muted">آخر تحديث: ${fmtDateTime(rates.ratesDate)}</span></div>
        <table class="ad-table"><thead><tr><th scope="col">من</th><th scope="col">إلى</th><th scope="col">السعر</th></tr></thead>
          <tbody>${rates.rows.map(([a, b, r]) => `<tr><td class="tabular">${a}</td><td>${b}</td><td class="tabular font-semibold">${r.toFixed(4)}</td></tr>`).join('')}</tbody></table>
        <p class="ad-muted mb-0 mt-3">تُجلب الأسعار تلقائياً بمهمة مجدولة. العرض فقط.</p></section>
    </div>`;
  _ps(root, _sc([{ label: 'العملات المدعومة', value: list.length, tone: 'lime', sub: 'منها واحدة افتراضية' }, { label: 'أسعار الصرف', value: rates.rows.length, tone: 'primary', sub: 'تُجلب تلقائياً' }, { label: 'عملات إضافية', value: list.length - 1, tone: 'outline', sub: 'تُفعَّل من الإعدادات' }], 'sm:grid-cols-3'));
}
