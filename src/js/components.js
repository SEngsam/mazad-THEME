const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => escapeMap[ch]);

export const formatNumber = (n) => n.toLocaleString('en-US');
export const formatPrice = (n) => `${formatNumber(n)} ر.س`;

export function formatCountdown(seconds) {
  const t = Math.max(0, seconds);
  const days = Math.floor(t / 86400);
  const hours = Math.floor((t % 86400) / 3600);
  const mins = Math.floor((t % 3600) / 60);
  const secs = t % 60;
  const pad = (v) => String(v).padStart(2, '0');
  if (days) return `${days} يوم`;
  if (hours) return `${hours}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

export const icons = {
  heart: (filled) =>
    `<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.6 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.6 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"/></svg>`,
  clock: `<svg aria-hidden="true" viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/></svg>`,
};

/** Image frame with a branded placeholder that shimmers while loading and stays if the photo can't load. */
export function Media({ src, className = '', alt = '', eager = false }) {
  const img = src
    ? `<img src="${esc(src)}" alt="${esc(alt)}" ${eager ? '' : 'loading="lazy"'} decoding="async" data-media>`
    : '';
  return `<div class="media ${className}">${img}</div>`;
}

export function FeaturedCard(item) {
  const tagTone = item.tone === 'accent' ? 'bg-accent-strong' : 'bg-primary';
  return `
    <a href="#live" class="group relative flex min-h-[220px] overflow-hidden rounded-[20px] bg-mist text-white hover:text-white sm:min-h-[300px] ${item.large ? 'md:flex-[2_1_0%]' : 'md:flex-[1_1_0%]'}">
      ${Media({ src: item.img, eager: item.large, className: 'absolute inset-0 transition-transform duration-500 group-hover:scale-[1.02]' })}
      <span class="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-[rgba(10,12,15,.72)] to-transparent p-5 pt-16 sm:p-[22px] sm:pt-20">
        <span class="self-start rounded-full ${tagTone} px-2.5 py-1 text-xs font-semibold">${esc(item.tag)}</span>
        <span class="font-bold leading-[1.35] ${item.large ? 'text-xl sm:text-2xl' : 'text-lg'}">${esc(item.title)}</span>
        <span class="text-[13px] opacity-90">${esc(item.meta)}</span>
      </span>
    </a>`;
}

export function CategoryTile({ cat, label, count, img, active }) {
  return `
    <button type="button" data-cat="${cat}" aria-pressed="${active}" class="group flex min-w-0 flex-col items-center gap-2 text-center sm:gap-2.5">
      <span class="block w-full rounded-[18px] outline outline-[2.5px] outline-offset-2 ${active ? 'outline-primary' : 'outline-transparent group-hover:outline-line'}">
        ${Media({ src: img, className: 'aspect-square rounded-[14px] bg-primary-soft sm:rounded-[18px]' })}
      </span>
      <span class="flex flex-col gap-0.5">
        <span class="text-xs font-semibold leading-snug text-ink sm:text-sm">${esc(label)}</span>
        <span class="text-[11px] text-ink-muted sm:text-xs">${count} مزاد</span>
      </span>
    </button>`;
}

export function SortTab({ index, label, active }) {
  const tone = active ? 'border-primary bg-primary text-white' : 'border-[#E5E7EB] bg-white text-ink hover:border-ink/40';
  return `<button type="button" data-tab="${index}" aria-pressed="${active}" class="shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${tone}">${esc(label)}</button>`;
}

export function LotCard(lot, { remaining, watched }) {
  const timerTone = remaining < 3600 ? 'text-timer' : 'text-white';
  return `
    <article class="card flex flex-col gap-3 p-2.5 pb-4">
      <div class="relative">
        ${Media({ src: lot.img, alt: lot.name, className: 'aspect-[4/3] rounded-[14px]' })}
        <button type="button" data-watch="${lot.id}" aria-pressed="${watched}" aria-label="${watched ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}: ${esc(lot.name)}"
          class="absolute end-2.5 top-2.5 grid h-10 w-10 place-items-center rounded-full bg-white shadow-float transition-transform hover:scale-105 ${watched ? 'text-accent' : 'text-ink'}">
          ${icons.heart(watched)}
        </button>
        <div class="pointer-events-none absolute bottom-2.5 start-2.5 flex items-center gap-2.5 whitespace-nowrap rounded-[10px] bg-forest/[.93] px-3 py-[7px] text-[13px] text-white">
          <span class="tabular flex items-center gap-1.5 font-semibold ${timerTone}" data-timer="${lot.id}">${icons.clock}<span>${formatCountdown(remaining)}</span></span>
          <span class="h-3.5 w-px bg-white/25" aria-hidden="true"></span>
          <span class="flex items-baseline gap-1.5"><span class="text-[11px] opacity-75">المزايدة</span><span class="tabular font-semibold">${formatPrice(lot.bid)}</span></span>
        </div>
      </div>
      <div class="flex flex-col gap-1 px-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <a href="#lot-${lot.id}" class="text-base font-semibold leading-normal text-ink hover:text-primary">${esc(lot.name)}</a>
          ${lot.noReserve ? '<span class="whitespace-nowrap rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">بدون حد أدنى</span>' : ''}
        </div>
        <p class="m-0 text-[13px] leading-relaxed text-ink-body">${esc(lot.sub)}</p>
        <p class="m-0 text-xs text-ink-muted">${esc(lot.city)}</p>
      </div>
    </article>`;
}

export function SponsoredCard(ad) {
  return `
    <article class="card flex flex-col gap-3 p-2.5 pb-4" aria-label="إعلان ممول">
      <div class="relative">
        ${Media({ src: ad.img, className: 'aspect-[4/3] rounded-[14px]' })}
        <span class="chip-ad absolute start-2.5 top-2.5 px-[9px] py-[3px]">إعلان ممول</span>
      </div>
      <div class="flex flex-col gap-1 px-1.5">
        <a href="#" class="text-base font-semibold leading-normal text-ink hover:text-primary">${esc(ad.name)}</a>
        <p class="m-0 text-[13px] leading-relaxed text-ink-body">${esc(ad.sub)}</p>
        <p class="m-0 text-xs text-ink-muted">إعلان</p>
      </div>
    </article>`;
}

export function PickCard(pick) {
  return `
    <article class="flex w-[46%] shrink-0 snap-start flex-col gap-2.5 sm:w-[30%] lg:w-auto lg:min-w-0 lg:flex-1">
      ${Media({ src: pick.img, alt: pick.name, className: 'aspect-square rounded-[14px]' })}
      <div class="flex flex-col gap-[3px]">
        <span class="text-xs text-ink-muted">${esc(pick.cat)}</span>
        <span class="text-[15px] font-semibold">${esc(pick.name)}</span>
        <span class="text-[13px] text-ink-body">المزايدة الحالية <b class="tabular whitespace-nowrap text-ink">${formatPrice(pick.bid)}</b></span>
      </div>
    </article>`;
}

export function TrustItem(item) {
  return `
    <div class="flex flex-col gap-1.5 bg-white p-5 sm:p-[22px]">
      <h3 class="m-0 text-[15px] font-semibold">${esc(item.title)}</h3>
      <p class="m-0 text-[13px] leading-[1.7] text-ink-body">${esc(item.text)}</p>
    </div>`;
}

export function AdBanner({ src, label = 'إعلان', className = '' }) {
  return `
    <div class="relative ${className}">
      ${Media({ src, className: 'h-full w-full rounded-[inherit]' })}
      <span class="chip-ad absolute end-2.5 top-2 text-[10px]">${esc(label)}</span>
    </div>`;
}
