import { formatNumber } from './components.js';

/**
 * Filter in the home hero: a bar on tablets and up, a bottom sheet on phones.
 * The button opens the search page with the chosen filters in the address.
 */
export function initHomeFilter({ data, remainingFor }) {
  const $ = (sel) => document.querySelector(sel);
  const hf = { city: '', cat: '', band: -1, status: '' };
  const cities = [...new Set(data.lots.map((l) => l.city))];
  const STATUSES = [['', 'الكل'], ['soon', 'ينتهي قريباً'], ['nr', 'بدون حد أدنى']];
  const options = {
    city: cities.map((c) => [c, c]),
    cat: data.categories.slice(1).map((c, i) => [i + 1, c]),
    band: data.priceBands.map((b, i) => [i, `${b.label} ر.س`]),
    status: STATUSES.slice(1),
  };
  const labels = { city: 'المدينة', cat: 'الفئة', band: 'السعر', status: 'حالة المزاد' };

  function params() {
    const p = new URLSearchParams();
    if (hf.city) p.set('city', hf.city);
    if (hf.cat) p.set('cat', hf.cat);
    if (hf.band >= 0) {
      const { min, max } = data.priceBands[hf.band];
      if (min) p.set('min', min);
      if (max) p.set('max', max);
    }
    if (hf.status === 'soon') p.set('soon', '1');
    if (hf.status === 'nr') p.set('nr', '1');
    return p;
  }

  function count() {
    const band = hf.band >= 0 ? data.priceBands[hf.band] : null;
    return data.lots.filter((lot) => {
      const left = remainingFor(lot);
      return left > 0
        && (!hf.city || lot.city === hf.city)
        && (!hf.cat || lot.cat === Number(hf.cat))
        && (!band || (lot.bid >= band.min && (!band.max || lot.bid <= band.max)))
        && (hf.status !== 'soon' || left <= 86400)
        && (hf.status !== 'nr' || lot.noReserve);
    }).length;
  }

  function selectHTML(key, cls, id) {
    const value = key === 'band' && hf.band < 0 ? '' : String(hf[key]);
    return `
      <select id="${id}" data-hf="${key}" aria-label="${labels[key]}" class="select-pill w-full appearance-none ${cls}">
        <option value="">${labels[key]}</option>
        ${options[key].map(([v, t]) => `<option value="${v}"${String(v) === value ? ' selected' : ''}>${t}</option>`).join('')}
      </select>`;
  }

  function renderBar() {
    const field = 'rounded-full bg-white/[.12] py-2.5 pe-4 ps-10 text-sm text-white';
    $('#home-filter').innerHTML = `
      <div class="hidden items-center gap-2 rounded-full bg-white/[.08] p-1.5 sm:flex">
        ${['city', 'cat', 'band', 'status'].map((k) => `<div class="min-w-0 flex-1">${selectHTML(k, field, `h-${k}`)}</div>`).join('')}
        <button type="submit" class="btn-lime shrink-0 px-8 py-2.5 text-sm">بحث</button>
      </div>
      <div class="flex items-center gap-2 rounded-full bg-white/[.08] p-1.5 sm:hidden">
        <span class="min-w-0 flex-1 truncate ps-3.5 text-[13px] text-white/85">المدينة · السعر · الحالة</span>
        <button type="button" data-open-sheet aria-haspopup="dialog" class="btn-lime shrink-0 gap-1.5 px-5 py-2.5 text-sm">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>تصفية
        </button>
      </div>`;
  }

  function chips(key, items) {
    return items.map(([v, t]) => {
      const on = key === 'band' ? hf.band === Number(v) : hf[key] === String(v);
      return `<button type="button" data-chip="${key}" data-value="${v}" aria-pressed="${on}" class="rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${on ? 'border-primary bg-primary text-white' : 'border-[#E5E7EB] bg-white text-ink hover:border-ink/40'}">${t}</button>`;
    }).join('');
  }

  function renderSheet() {
    const field = 'rounded-full bg-mist py-3 pe-5 ps-12 text-[15px] text-ink';
    const label = (t) => `<span class="text-sm font-semibold">${t}</span>`;
    $('#filter-sheet').innerHTML = `
      <span class="mx-auto mt-2.5 h-1 w-10 rounded bg-line" aria-hidden="true"></span>
      <div class="flex items-center justify-between px-5 pb-2.5 pt-3.5">
        <h2 id="filter-title" tabindex="-1" class="m-0 text-lg font-bold">تصفية المزادات</h2>
        <button type="button" data-close-sheet aria-label="إغلاق" class="grid h-10 w-10 place-items-center rounded-full bg-mist text-ink"><svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </div>
      <div class="flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 py-1">
        <div class="flex flex-col gap-2">${label('المدينة')}${selectHTML('city', field, 's-city')}</div>
        <div class="flex flex-col gap-2">${label('الفئة')}${selectHTML('cat', field, 's-cat')}</div>
        <div class="flex flex-col gap-2">${label('السعر')}<div class="flex flex-wrap gap-2">${chips('band', [['-1', 'كل الأسعار'], ...options.band])}</div></div>
        <div class="flex flex-col gap-2">${label('حالة المزاد')}<div class="flex flex-wrap gap-2">${chips('status', STATUSES)}</div></div>
      </div>
      <div class="flex gap-2.5 border-t border-line-soft px-5 pb-5 pt-3.5">
        <button type="button" data-clear-sheet class="btn-outline px-[22px] py-3 text-[15px]">مسح</button>
        <button type="button" data-apply-sheet class="btn-primary flex-1 py-3.5 text-[15px]">عرض ${formatNumber(count())} مزاداً</button>
      </div>`;
  }

  function setSheet(open) {
    const sheet = $('#filter-sheet');
    if (open) renderSheet();
    sheet.classList.toggle('hidden', !open);
    sheet.classList.toggle('flex', open);
    $('#filter-backdrop').classList.toggle('hidden', !open);
    document.body.classList.toggle('overflow-hidden', open);
    if (open) $('#filter-title').focus();
    else $('[data-open-sheet]')?.focus();
  }

  const isOpen = () => !$('#filter-sheet').classList.contains('hidden');

  function go() {
    const qs = params().toString();
    location.href = `search.html${qs ? `?${qs}` : ''}`;
  }

  $('#home-filter').addEventListener('submit', (event) => {
    event.preventDefault();
    go();
  });

  document.addEventListener('change', (event) => {
    const key = event.target.dataset?.hf;
    if (!key) return;
    const v = event.target.value;
    if (key === 'band') hf.band = v === '' ? -1 : Number(v);
    else hf[key] = v;
    if (isOpen()) renderSheet();
  });

  document.addEventListener('click', (event) => {
    const t = event.target;
    if (t.closest('[data-open-sheet]')) return setSheet(true);
    if (t.closest('[data-close-sheet]') || t.closest('#filter-backdrop')) return setSheet(false);
    if (t.closest('[data-apply-sheet]')) return go();
    if (t.closest('[data-clear-sheet]')) {
      Object.assign(hf, { city: '', cat: '', band: -1, status: '' });
      renderSheet();
      return $('#filter-title').focus();
    }
    const chip = t.closest('[data-chip]');
    if (chip) {
      const { chip: key, value } = chip.dataset;
      if (key === 'band') hf.band = Number(value);
      else hf[key] = value;
      renderSheet();
      $(`[data-chip="${key}"][aria-pressed="true"]`)?.focus();
    }
    return undefined;
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) setSheet(false);
  });

  renderBar();
}
