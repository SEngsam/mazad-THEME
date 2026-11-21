import * as data from './data.js';
import { LotCard, formatCountdown } from './components.js';
import { catHref, catNavHTML, loadWatch, renderShell, saveWatch } from './shell.js';

renderShell();

const $ = (sel) => document.querySelector(sel);
const startedAt = Date.now();
const state = { watch: loadWatch() };

function render() {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const soon = [...data.lots].filter((l) => l.endsIn - elapsed > 0).sort((a, b) => a.endsIn - b.endsIn).slice(0, 4);
  $('#main').innerHTML = `
    <section class="card flex flex-col items-center gap-6 px-6 py-12 text-center sm:py-16">
      <div class="media h-28 w-44 rounded-[18px]" aria-hidden="true"></div>
      <div class="flex flex-col gap-2">
        <h1 class="m-0 text-2xl font-bold sm:text-[30px]">الصفحة غير موجودة</h1>
        <p class="m-0 text-[15px] text-ink-body">ربما تغيّر الرابط أو انتهى المزاد.</p>
      </div>
      <form action="search.html" role="search" class="flex w-full max-w-lg items-center rounded-full bg-mist p-1 focus-within:ring-2 focus-within:ring-primary">
        <label for="nf-q" class="sr-only">ابحث في المزادات</label>
        <input id="nf-q" name="q" type="search" autocomplete="off" placeholder="ابحث عن سيارة، ساعة، جوال، أو رقم لوت"
          class="min-w-0 flex-1 rounded-full border-0 bg-transparent px-5 py-3 text-[15px] text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
        <button type="submit" class="btn-primary px-6 py-3 text-sm">بحث</button>
      </form>
      <div class="flex flex-wrap justify-center gap-2.5">
        <a href="index.html" class="btn-outline px-6 py-2.5 text-sm">الصفحة الرئيسية</a>
        <a href="auctions.html" class="btn-outline px-6 py-2.5 text-sm">المزادات القادمة</a>
        <a href="help.html" class="btn-outline px-6 py-2.5 text-sm">مركز المساعدة</a>
      </div>
    </section>
    <section aria-labelledby="soon-title" class="flex flex-col gap-4">
      <div class="section-head">
        <h2 id="soon-title" class="section-title">تنتهي قريباً</h2>
        <a href="search.html" class="text-sm font-semibold">كل المزادات</a>
      </div>
      <div id="nf-lots" class="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        ${soon.map((l) => LotCard(l, { remaining: l.endsIn - elapsed, watched: state.watch.has(l.id) })).join('')}
      </div>
    </section>`;
}

document.addEventListener('click', (event) => {
  const t = event.target;
  const cat = t.closest('#cat-nav [data-cat]');
  if (cat) { location.href = catHref(cat.dataset.cat); return; }
  const watch = t.closest('#nf-lots [data-watch]');
  if (watch) {
    const id = Number(watch.dataset.watch);
    state.watch.has(id) ? state.watch.delete(id) : state.watch.add(id);
    saveWatch(state.watch);
    render();
    document.querySelector(`#nf-lots [data-watch="${id}"]`)?.focus();
  }
});

$('#cat-nav').innerHTML = catNavHTML(data.categories, -1);
render();
setInterval(() => {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const byId = new Map(data.lots.map((l) => [String(l.id), l]));
  document.querySelectorAll('#nf-lots [data-timer]').forEach((node) => {
    const left = byId.get(node.dataset.timer).endsIn - elapsed;
    node.lastElementChild.textContent = formatCountdown(left);
    node.classList.toggle('text-timer', left < 3600);
    node.classList.toggle('text-white', left >= 3600);
  });
}, 1000);
