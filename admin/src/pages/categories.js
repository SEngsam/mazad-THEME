import { prependStats as _ps, statCards as _sc } from '../ui.js';
import { api, canWrite } from '../api.js';
import { askReason, esc, toast } from '../ui.js';

export const meta = { title: 'الفئات', sub: 'الفئات الرئيسية والفرعية.' };

const GRIP = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>';

export default function categories(root, { ctx }) {
  let editing = 'c-cars';
  let dirty = 0;
  let failed = false;     // the last automatic save failed
  let lastSaved = null;   // { prev, at } for the undo strip
  let timer = null;
  let groups = [];        // working copy: [{ id, subs: [id…] }]
  let base = [];          // what is saved
  const dragOn = () => canWrite();
  let dragged = null;     // { id, kind }
  let target = null;
  let picked = null;      // keyboard pick-up
  let pickSnapshot = null;

  const cats = () => api.rows('categories');
  const byId = (id) => cats().find((c) => c.id === id);
  const nameOf = (id) => byId(id)?.name.ar || '—';
  const count = (id) => api.rows('auctions').filter((a) => a.mainCategoryId === id || a.subCategoryId === id).length;
  const clone = (g) => g.map((x) => ({ id: x.id, subs: [...x.subs] }));
  const readGroups = () => {
    const all = cats();
    return all.filter((c) => !c.parentCategoryId).map((m) => ({ id: m.id, subs: all.filter((c) => c.parentCategoryId === m.id).map((c) => c.id) }));
  };

  /* ----- pending changes (draft vs saved) ----- */
  function changes() {
    const out = [];
    const parentIn = (gs) => { const p = {}; gs.forEach((g) => g.subs.forEach((s) => { p[s] = g.id; })); return p; };
    const p0 = parentIn(base), p1 = parentIn(groups);
    Object.keys(p1).forEach((s) => { if (p0[s] !== p1[s]) out.push(`نقل <b>${esc(nameOf(s))}</b> من «${esc(nameOf(p0[s]))}» إلى «${esc(nameOf(p1[s]))}»`); });
    if (base.map((g) => g.id).join() !== groups.map((g) => g.id).join()) out.push('إعادة ترتيب <b>الفئات الرئيسية</b>');
    groups.forEach((g) => {
      const before = (base.find((x) => x.id === g.id)?.subs || []).filter((s) => g.subs.includes(s));
      const after = g.subs.filter((s) => before.includes(s));
      if (before.join() !== after.join()) out.push(`إعادة ترتيب فئات <b>${esc(nameOf(g.id))}</b> الفرعية`);
    });
    return out;
  }

  /* ----- operations on the working copy ----- */
  const find = (id) => groups.find((g) => g.id === id);
  const groupOfSub = (id) => groups.find((g) => g.subs.includes(id));
  function moveMain(id, targetId, pos) {
    if (id === targetId) return;
    const [g] = groups.splice(groups.findIndex((x) => x.id === id), 1);
    const i = groups.findIndex((x) => x.id === targetId);
    groups.splice(pos === 'before' ? i : i + 1, 0, g);
  }
  function moveSub(id, to) {
    groupOfSub(id).subs = groupOfSub(id).subs.filter((s) => s !== id);
    if (to.type === 'into') find(to.id).subs.push(id);
    else {
      const g = groupOfSub(to.id);
      const i = g.subs.indexOf(to.id);
      g.subs.splice(to.pos === 'before' ? i : i + 1, 0, id);
    }
  }
  /** Keyboard step: -1 up, +1 down. Subs jump into the neighbouring main at the edges. */
  function step(id, dir) {
    const mi = groups.findIndex((g) => g.id === id);
    if (mi >= 0) {
      const j = mi + dir;
      if (j < 0 || j >= groups.length) return false;
      [groups[mi], groups[j]] = [groups[j], groups[mi]];
      return true;
    }
    const g = groupOfSub(id);
    const i = g.subs.indexOf(id);
    const j = i + dir;
    if (j >= 0 && j < g.subs.length) { [g.subs[i], g.subs[j]] = [g.subs[j], g.subs[i]]; return true; }
    const gi = groups.indexOf(g) + dir;
    if (gi < 0 || gi >= groups.length) return false;
    g.subs.splice(i, 1);
    if (dir < 0) groups[gi].subs.push(id); else groups[gi].subs.unshift(id);
    return true;
  }

  /* ----- rendering ----- */
  const row = (id, kind, parent) => {
    const c = byId(id);
    const grip = `<button type="button" data-grip="${id}" aria-pressed="${picked === id}" aria-label="اسحب «${esc(c.name.ar)}» لإعادة الترتيب" class="ad-grip">${GRIP}</button>`;
    if (kind === 'main') {
      return `<div data-row="${id}" data-kind="main" draggable="${dragOn()}" class="ad-row-drag flex items-center gap-3 rounded-2xl border-b border-line-soft px-2 py-3"><span class="contents">${dragOn() ? grip : ''}</span>
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft font-bold text-primary">${esc([...c.name.ar][0])}</span><strong>${esc(c.name.ar)}</strong>
        <span class="ms-auto text-xs text-ink-muted tabular">${count(id)} مزاداً</span><button type="button" data-edit="${id}" ${dirty ? 'disabled title="احفظ ترتيب الفئات أو تراجع أولاً"' : ''} class="ad-btn">تعديل</button></div>`;
    }
    return `<div data-row="${id}" data-kind="sub" data-parent="${parent}" draggable="${dragOn()}" class="ad-row-drag ms-11 flex items-center gap-3 rounded-xl border-b border-line-soft px-2 py-2.5 text-[13px]">${dragOn() ? grip : ''}<span>${esc(c.name.ar)}</span><span class="ms-auto text-xs text-ink-muted tabular">${count(id)}</span><button type="button" data-edit="${id}" ${dirty ? 'disabled title="احفظ ترتيب الفئات أو تراجع أولاً"' : ''} class="ad-btn">تعديل</button></div>`;
  };

  function draw() {
    const all = cats();
    const mains = all.filter((c) => !c.parentCategoryId);
    if (!changes().length) { base = readGroups(); groups = clone(base); }  // pick up edits made elsewhere when nothing is pending
    const list = groups;
    const cur = all.find((c) => c.id === editing) || null;
    const isNew = editing === 'new';
    const pend = changes();
    dirty = pend.length;

    const pendingCard = `
          <section class="ad-card" aria-labelledby="p-h"><h2 id="p-h" class="ad-h2 mb-2.5">قيد الحفظ <span class="ad-chip ad-chip-warn tabular">${pend.length}</span></h2>
            <ul class="m-0 list-none p-0 text-[13px]">${pend.map((t) => `<li class="border-b border-line-soft py-2.5 last:border-0">${t}</li>`).join('')}</ul></section>`;
    const side = `<div class="flex min-w-0 flex-[1_1_340px] flex-col gap-5">${pend.length ? pendingCard : ''}
        <section class="ad-card flex min-w-0 flex-[1_1_340px] flex-col gap-4" aria-labelledby="e-h">
          <h2 id="e-h" class="ad-h2">${isNew ? 'فئة جديدة' : cur ? `تعديل فئة · ${esc(cur.name.ar)}` : 'تعديل فئة'}</h2>
          ${cur || isNew ? `
            <form id="cat-form" novalidate class="flex flex-col gap-4">
              <div><label class="ad-label" for="ar">الاسم بالعربية</label><input id="ar" class="ad-input" value="${esc(cur?.name.ar || '')}" aria-describedby="ar-e"><p id="ar-e" class="m-0 mt-1 hidden text-xs text-accent-ink">الاسم مطلوب.</p></div>
              <div><label class="ad-label" for="en">الاسم بالإنجليزية</label><input id="en" dir="ltr" class="ad-input text-end" value="${esc(cur?.name.en || '')}"></div>
              <div><label class="ad-label" for="par">الفئة الأم</label><select id="par" class="ad-input"><option value="">فئة رئيسية</option>${mains.filter((m) => m.id !== cur?.id).map((m) => `<option value="${m.id}" ${cur?.parentCategoryId === m.id ? 'selected' : ''}>${esc(m.name.ar)}</option>`).join('')}</select></div>
              <div class="flex gap-2.5"><button type="submit" data-write class="ad-btn-primary ad-btn-lg">حفظ</button><button type="button" data-cancel class="ad-btn ad-btn-lg">إلغاء</button></div>
            </form>
            ${cur ? `<div class="rounded-2xl bg-accent-soft p-3.5 text-xs leading-7 text-accent-ink"><strong>تنبيه:</strong> حذف فئة يحذف جميع مزاداتها نهائياً. المقترح: استبدال الحذف بالأرشفة.<br><button type="button" data-del data-write class="ad-btn-danger mt-2">حذف الفئة</button></div>` : ''}` : '<p class="m-0 text-[13px] text-ink-muted">اختر فئة من القائمة لتعديلها.</p>'}
        </section></div>`;

    root.innerHTML = `
      <div id="dd-live" class="sr-only" aria-live="polite"></div>
      <div class="flex flex-wrap items-start gap-5">
        <section class="ad-card min-w-0 flex-[1.5_1_520px]" aria-labelledby="c-h">
          <div class="mb-2.5 flex flex-wrap items-center justify-between gap-3"><h2 id="c-h" class="ad-h2">شجرة الفئات</h2>
            <button type="button" data-new data-write ${dirty ? 'disabled' : ''} class="ad-btn-primary ad-btn-lg">إضافة فئة</button></div>
          ${dragOn() ? '<p class="ad-muted mb-2.5 mt-0 leading-7">اسحب المقبض <b>⋮⋮</b> لإعادة الترتيب، أو أفلت فئة فرعية فوق فئة رئيسية لنقلها إليها. تُحفظ التغييرات تلقائياً عند الإفلات.</p>' : ''}
          ${lastSaved && !pend.length ? '<div class="mb-2.5 flex items-center justify-between gap-3 rounded-2xl bg-primary-soft px-3.5 py-2 text-[12.5px] text-primary"><span>تم حفظ الترتيب.</span><button type="button" data-undo-last data-write class="font-bold underline">تراجع</button></div>' : ''}
          ${list.map((g) => `<div data-group="${g.id}" class="rounded-2xl">${row(g.id, 'main')}${g.subs.map((s) => row(s, 'sub', g.id)).join('')}</div>`).join('')}
        </section>
        ${side}
      </div>
      ${failed && pend.length ? `<div role="region" aria-label="تعذّر حفظ الترتيب" class="fixed bottom-24 inset-x-3 z-30 flex items-center gap-3.5 rounded-full bg-forest py-3 pe-3.5 ps-[22px] text-white shadow-[0_20px_40px_-16px_rgba(6,46,34,.7)] lg:bottom-6 lg:left-8 lg:right-[288px]">
        <span class="flex-1 text-[13px]">تعذّر حفظ الترتيب</span>
        <button type="button" data-undo class="rounded-full border-[1.5px] border-white/50 bg-transparent px-5 py-2 text-[13px] font-semibold text-white">تراجع</button>
        <button type="button" data-save data-write class="rounded-full bg-lime px-6 py-2.5 text-[13px] font-bold text-forest">إعادة المحاولة</button></div>` : ''}`;

    _ps(root, _sc([{ label: 'فئات رئيسية', value: mains.length, tone: 'lime', sub: 'في الشجرة' }, { label: 'فئات فرعية', value: all.length - mains.length, tone: 'primary', sub: 'تحت الرئيسية' }, { label: 'مزادات مرتبطة', value: api.rows('auctions').length, tone: 'forest', sub: 'بفئات المنصة' }], 'sm:grid-cols-3'));
    import('../ui.js').then((m) => m.applyRole(root));
  }

  const say = (t) => { const l = root.querySelector('#dd-live'); if (l) l.textContent = t; };
  const clearMarks = () => root.querySelectorAll('.ad-drop-before,.ad-drop-after,.ad-drop-into,.ad-dragging').forEach((el) => el.classList.remove('ad-drop-before', 'ad-drop-after', 'ad-drop-into', 'ad-dragging'));

  /** Save the working order right away (called after every drop). */
  async function commit(focusId, isUndo = false) {
    if (!changes().length) return;
    const prev = clone(base);
    try {
      const order = groups.flatMap((g) => [{ id: g.id, parentCategoryId: null }, ...g.subs.map((s) => ({ id: s, parentCategoryId: g.id }))]);
      await api.saveCategoryOrder(order);
      base = clone(groups);
      failed = false;
      lastSaved = isUndo ? null : { prev, at: Date.now() };
      toast(isUndo ? 'تم التراجع عن الترتيب.' : 'حُفظ الترتيب تلقائياً.');
      clearTimeout(timer);
      if (!isUndo) timer = setTimeout(() => { lastSaved = null; if (!changes().length && !picked) draw(); }, 10000);
    } catch (err) {
      failed = true;
      toast(err.message, 'bad');
    }
    draw();
    if (focusId) root.querySelector(`[data-grip="${focusId}"]`)?.focus();
  }

  /* ----- events ----- */
  root.addEventListener('click', async (e) => {
    if (e.target.closest('[data-undo]')) { groups = clone(base); picked = null; failed = false; draw(); return; }
    if (e.target.closest('[data-save]')) { await commit(); return; }
    if (e.target.closest('[data-undo-last]') && lastSaved) { groups = clone(lastSaved.prev); lastSaved = null; await commit(null, true); return; }
    const ed = e.target.closest('[data-edit]');
    if (ed) { editing = ed.dataset.edit; draw(); return; }
    if (e.target.closest('[data-new]')) { editing = 'new'; draw(); return; }
    if (e.target.closest('[data-cancel]')) { editing = null; draw(); return; }
    if (e.target.closest('[data-del]')) {
      const cat = byId(editing);
      const n = count(cat.id);
      const ok = await askReason({ title: `حذف «${cat.name.ar}»`, text: n ? `سيُحذف ${n} مزاداً مرتبطاً بهذه الفئة نهائياً.` : 'لا توجد مزادات مرتبطة بهذه الفئة.', confirm: 'حذف نهائي', danger: true, noField: true });
      if (ok === null) return;
      try { await api.remove('categories', cat.id); toast('حُذفت الفئة.'); editing = null; } catch (err) { toast(err.message, 'bad'); }
      draw();
    }
  });

  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ar = root.querySelector('#ar');
    if (!ar.value.trim()) { ar.setAttribute('aria-invalid', 'true'); root.querySelector('#ar-e').classList.remove('hidden'); ar.focus(); return; }
    const name = { ar: ar.value.trim(), en: root.querySelector('#en').value.trim() };
    const parentCategoryId = root.querySelector('#par').value || null;
    try {
      if (editing === 'new') { const c = await api.create('categories', { name, parentCategoryId }); editing = c.id; } else await api.update('categories', editing, { name, parentCategoryId });
      toast('حُفظت الفئة.');
    } catch (err) { toast(err.message, 'bad'); }
    draw();
  });

  /* mouse / touch-pad drag and drop */
  root.addEventListener('dragstart', (e) => {
    const r = e.target.closest?.('[data-row]');
    if (!dragOn() || !r) { e.preventDefault(); return; }
    dragged = { id: r.dataset.row, kind: r.dataset.kind };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragged.id);
    requestAnimationFrame(() => r.classList.add('ad-dragging'));
  });
  root.addEventListener('dragover', (e) => {
    if (!dragged) return;
    const r = e.target.closest('[data-row]');
    let t = null;
    if (dragged.kind === 'main') {
      const g = e.target.closest('[data-group]');
      if (g && g.dataset.group !== dragged.id) {
        const rc = g.getBoundingClientRect();
        t = { type: 'main', id: g.dataset.group, pos: e.clientY < rc.top + rc.height / 2 ? 'before' : 'after', el: g };
      }
    } else if (r && r.dataset.row !== dragged.id) {
      if (r.dataset.kind === 'main') t = { type: 'into', id: r.dataset.row, el: r };
      else {
        const rc = r.getBoundingClientRect();
        t = { type: 'sub', id: r.dataset.row, pos: e.clientY < rc.top + rc.height / 2 ? 'before' : 'after', el: r };
      }
    }
    clearMarks();
    root.querySelector(`[data-row="${dragged.id}"]`)?.classList.add('ad-dragging');
    target = t;
    if (!t) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    t.el.classList.add(t.type === 'into' ? 'ad-drop-into' : t.pos === 'before' ? 'ad-drop-before' : 'ad-drop-after');
  });
  root.addEventListener('drop', (e) => {
    if (!dragged || !target) return;
    e.preventDefault();
    if (dragged.kind === 'main') moveMain(dragged.id, target.id, target.pos);
    else moveSub(dragged.id, target);
    const name = nameOf(dragged.id);
    dragged = null; target = null;
    draw();
    say(`أُفلتت «${name}».`);
    commit();
  });
  root.addEventListener('dragend', () => { dragged = null; target = null; clearMarks(); });

  /* keyboard: Space picks up / drops, arrows move, Esc cancels */
  root.addEventListener('keydown', (e) => {
    const grip = e.target.closest?.('[data-grip]');
    if (!grip) return;
    const id = grip.dataset.grip;
    const focus = () => root.querySelector(`[data-grip="${id}"]`)?.focus();
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (picked === id) { picked = null; draw(); focus(); say(`أُفلتت «${nameOf(id)}».`); commit(id); }
      else { picked = id; pickSnapshot = clone(groups); draw(); focus(); say(`التقطتَ «${nameOf(id)}». استخدم الأسهم للتحريك، وSpace للإفلات، وEsc للتراجع.`); }
    } else if (e.key === 'Escape' && picked === id) {
      e.preventDefault();
      groups = pickSnapshot; picked = null; draw(); focus(); say('أُلغي التحريك.');
    } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && picked === id) {
      e.preventDefault();
      if (step(id, e.key === 'ArrowUp' ? -1 : 1)) { draw(); focus(); say(`«${nameOf(id)}» في موضعها الجديد.`); }
    }
  });
  document.addEventListener('ad-route', () => { dragged = null; clearTimeout(timer); }, { once: true });

  draw();
}
