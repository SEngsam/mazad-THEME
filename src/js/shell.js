/**
 * Site shell shared by every page: announcement bar, sticky header (logo, search, account, category nav) and footer.
 * Pages hold <div id="site-top" class="contents"></div> and <div id="site-footer" class="contents mt-auto"></div>.
 */

const heartIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[22px] w-[22px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.6 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.6 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"/></svg>';
const userIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[22px] w-[22px] sm:hidden" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/></svg>';

const topHTML = `
    <div class="on-dark bg-forest text-[13px] text-white">
      <div class="container-page flex items-center justify-between gap-3 py-[9px]">
        <p class="m-0 min-w-0 truncate">
          <b class="me-2 rounded-md bg-lime px-2 py-0.5 font-bold text-forest">● مباشر</b>مزاد سيارات ساحة الشمال الليلة 8:00م · 42 سيارة
        </p>
        <div class="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <span class="hidden opacity-85 sm:inline">قسّط مع</span>
          <span class="brand-pill">
            <img data-logo src="https://www.google.com/s2/favicons?domain=tabby.ai&amp;sz=64" alt="" width="16" height="16">تابي
          </span>
          <span class="brand-pill">
            <img data-logo src="https://www.google.com/s2/favicons?domain=tamara.co&amp;sz=64" alt="" width="16" height="16">تمارا
          </span>
        </div>
      </div>
    </div>

    <header class="sticky top-0 z-20 border-b border-line bg-white shadow-header">
      <div class="container-page flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-3 py-3 lg:flex-nowrap lg:gap-6 lg:py-3.5">
        <a href="index.html" class="shrink-0" aria-label="مزاد — الرئيسية">
          <img src="public/assets/mazad-logo.png" alt="مزاد" width="480" height="149" class="block h-7 w-auto min-[360px]:h-8 sm:h-10">
        </a>

        <form id="search-form" role="search" action="index.html" class="order-last flex w-full items-center rounded-full bg-mist p-1 focus-within:ring-2 focus-within:ring-primary lg:order-none lg:w-auto lg:min-w-[260px] lg:flex-1">
          <label for="q" class="sr-only">ابحث في المزادات</label>
          <input id="q" name="q" type="search" autocomplete="off" placeholder="ابحث عن سيارة، ساعة، جوال، أو رقم لوت"
            class="min-w-0 flex-1 border-0 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted rounded-full focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:px-[18px]">
          <button type="submit" class="btn-primary px-5 py-2.5 text-sm sm:px-[22px]">بحث</button>
        </form>

        <nav aria-label="الحساب" class="ms-auto flex shrink-0 items-center gap-0.5 text-sm sm:gap-1.5">
          <a id="watch-link" href="#" class="flex items-center gap-1 rounded-full px-2 py-2.5 font-medium text-ink hover:text-primary sm:gap-1.5 sm:px-3.5">
            <span class="sm:hidden">${heartIcon}</span>
            <span class="hidden whitespace-nowrap sm:inline">المفضلة</span>
            <span data-watch-count class="tabular rounded-full bg-accent-soft px-[7px] py-0.5 text-[11px] font-semibold text-accent-ink">2</span>
          </a>
          <a href="#" class="flex items-center rounded-full px-2 py-2.5 font-medium text-ink hover:text-primary sm:px-3.5" aria-label="تسجيل الدخول">
            ${userIcon}
            <span class="hidden whitespace-nowrap sm:inline">تسجيل الدخول</span>
          </a>
          <a href="index.html#sell" class="btn-outline px-3 py-2 text-[13px] sm:px-[18px] sm:py-2.5 sm:text-sm">بِع معنا</a>
        </nav>
      </div>

      <nav aria-label="الفئات" class="container-page">
        <div id="cat-nav" class="scroll-row -mx-1 gap-0.5 px-1"></div>
      </nav>
    </header>`;

const footerHTML = `
    <footer class="mt-auto border-t border-line-soft bg-primary-soft">
      <div class="container-page grid grid-cols-2 gap-7 pb-6 pt-10 text-sm sm:grid-cols-3 lg:grid-cols-4">
        <div class="col-span-2 flex flex-col gap-2.5 sm:col-span-3 lg:col-span-1">
          <img src="public/assets/mazad-logo.png" alt="مزاد" width="480" height="149" class="block h-11 w-auto self-start">
          <p class="m-0 text-[13px] leading-[1.8] text-ink-muted">سجل تجاري 1010XXXXXX<br>موثّق في المركز السعودي للأعمال</p>
          <div class="flex flex-wrap gap-2">
            <a href="#" class="whitespace-nowrap rounded-[10px] bg-ink px-3.5 py-2 text-xs text-white hover:bg-black hover:text-white">App Store</a>
            <a href="#" class="whitespace-nowrap rounded-[10px] bg-ink px-3.5 py-2 text-xs text-white hover:bg-black hover:text-white">Google Play</a>
          </div>
        </div>
        <nav aria-labelledby="f-bidders" class="flex flex-col gap-2.5">
          <h2 id="f-bidders" class="m-0 text-sm font-semibold">المزايدون</h2>
          <a href="#" class="text-ink-body">كيف أزايد</a>
          <a href="#" class="text-ink-body">الرسوم</a>
          <a href="#" class="text-ink-body">حماية المشتري</a>
        </nav>
        <nav aria-labelledby="f-sellers" class="flex flex-col gap-2.5">
          <h2 id="f-sellers" class="m-0 text-sm font-semibold">البائعون</h2>
          <a href="index.html#sell" class="text-ink-body">ابدأ البيع</a>
          <a href="#" class="text-ink-body">لوحة البائع</a>
          <a href="#" class="text-ink-body">أعلن معنا</a>
        </nav>
        <div class="flex flex-col gap-2.5">
          <h2 class="m-0 text-sm font-semibold">تواصل</h2>
          <a href="tel:920012345" class="tabular text-ink-body">920012345</a>
          <a href="#" class="text-ink-body">مركز المساعدة</a>
        </div>
      </div>
      <div class="container-page flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pb-7 pt-4 text-xs text-ink-muted">
        <span>© 2026 مَزاد · جميع الحقوق محفوظة</span>
        <ul class="m-0 flex list-none flex-wrap items-center gap-2 p-0" aria-label="وسائل الدفع">
          <li class="pay-badge">مدى<img data-logo src="https://commons.wikimedia.org/wiki/Special:FilePath/Mada_Logo.svg" alt="مدى"></li>
          <li class="pay-badge">Apple Pay<img data-logo src="https://commons.wikimedia.org/wiki/Special:FilePath/Apple_Pay_logo.svg" alt="Apple Pay"></li>
          <li class="pay-badge">فيزا<img data-logo src="https://commons.wikimedia.org/wiki/Special:FilePath/Visa_Inc._logo.svg" alt="فيزا"></li>
          <li class="pay-badge">تابي<img data-logo src="https://www.google.com/s2/favicons?domain=tabby.ai&amp;sz=128" alt="تابي"></li>
          <li class="pay-badge">تمارا<img data-logo src="https://www.google.com/s2/favicons?domain=tamara.co&amp;sz=128" alt="تمارا"></li>
        </ul>
      </div>
    </footer>`;

/** Category nav buttons. `active` is the selected category index, or -1 for none. */
export function catNavHTML(categories, active) {
  return categories
    .map((label, i) => {
      const on = i === active;
      return `<button type="button" data-cat="${i}" aria-pressed="${on}" class="shrink-0 whitespace-nowrap border-b-[2.5px] px-3.5 pb-3 pt-2.5 text-sm transition-colors ${on ? 'border-primary font-semibold text-ink' : 'border-transparent text-ink-body hover:text-ink'}">${label}</button>`;
    })
    .join('');
}

/** Hide partner/payment logos that fail to load so their text label shows instead. */
function wireLogoFallbacks() {
  document.addEventListener('error', (event) => {
    if (event.target.matches?.('img[data-media], img[data-logo]')) event.target.remove();
  }, true);
  document.addEventListener('load', (event) => {
    if (event.target.matches?.('img[data-media]')) event.target.classList.add('is-loaded');
  }, true);
  document.querySelectorAll('img[data-logo]').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) img.remove();
  });
}

export function renderShell() {
  document.getElementById('site-top').innerHTML = topHTML;
  document.getElementById('site-footer').innerHTML = footerHTML;
  wireLogoFallbacks();
}
