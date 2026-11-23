import { api } from '../api.js';
import { esc, fmt, pager } from '../ui.js';

export const meta = { title: 'الوسائط', sub: 'الصور والملفات المرفوعة إلى المنصة.' };

const size = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export default function media(root) {
  const st = { view: 'grid', page: 1, size: 20 };
  const rows = api.rows('media');
  const total = rows.reduce((t, m) => t + m.size, 0);

  function draw() {
    const part = rows.slice((st.page - 1) * st.size, st.page * st.size);
    root.innerHTML = `
      <div class="flex flex-col gap-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="العرض" class="flex gap-2"><button type="button" data-v="grid" class="ad-pill" aria-pressed="${st.view === 'grid'}">شبكة</button><button type="button" data-v="list" class="ad-pill" aria-pressed="${st.view === 'list'}">قائمة</button></div>
          <span class="tabular text-[13px] text-ink-muted">${fmt(rows.length)} ملفاً · ${size(total)}</span>
        </div>
        <section class="ad-card" aria-label="الملفات">
          ${st.view === 'grid'
            ? `<div class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">${part.map((m) => `<div class="overflow-hidden rounded-2xl border border-line"><div class="ad-ph aspect-[4/3] !rounded-none">صورة</div><div class="flex flex-col gap-0.5 p-3 text-xs"><strong dir="ltr" class="truncate text-end tabular">${esc(m.initialName)}</strong><span class="tabular text-ink-muted">${size(m.size)}</span></div></div>`).join('')}</div>`
            : `<div class="overflow-x-auto"><table class="ad-table min-w-[560px]"><thead><tr><th scope="col">الاسم الأصلي</th><th scope="col">المسار</th><th scope="col">الحجم</th></tr></thead><tbody>${part.map((m) => `<tr><td dir="ltr" class="text-end font-semibold">${esc(m.initialName)}</td><td dir="ltr" class="text-end text-ink-muted">${esc(m.path)}</td><td class="tabular">${size(m.size)}</td></tr>`).join('')}</tbody></table></div>`}
          <div class="mt-4">${pager({ page: st.page, size: st.size, total: rows.length })}</div>
        </section>
        <p class="ad-muted m-0">المسار والحجم والاسم الأصلي للملف. يُرفع الملف من نماذج المزاد واللافتات فقط.</p>
      </div>`;
  }
  root.addEventListener('click', (e) => {
    const v = e.target.closest('[data-v]'); if (v) { st.view = v.dataset.v; draw(); }
    const p = e.target.closest('[data-page]'); if (p && !p.disabled) { st.page = Number(p.dataset.page); draw(); }
  });
  root.addEventListener('change', (e) => { if (e.target.matches('[data-size]')) { st.size = Number(e.target.value); st.page = 1; draw(); } });
  draw();
  void api;
}
