import { api } from './api.js';
import { REDUCED, applyRole, emptyBox, errorBox, esc, pager, runCounts, skeleton } from './ui.js';

/**
 * Generic list page: filter pills with counts, search, select filters, table, pager,
 * and the loading / empty / error states.
 *
 * cfg: { table, label, pills:[{id,label,test?}], match?(row,state), searchText?(row), selects?:[{id,label,options:[[v,l]],test(row,v)}],
 *        columns:[{h,cell(row),cls?}], rowHref?(row), onAction?(act,id,reload), top?, note?, minW?, size?, sort? }
 */
export function listPage(root, cfg) {
  const state = { pill: cfg.pills?.[0]?.id, q: cfg.initialQ || '', sel: {}, page: 1, size: cfg.size || 20 };
  const pillTest = (row) => !cfg.pills || !state.pill || (cfg.pills.find((p) => p.id === state.pill)?.test?.(row) ?? true);
  const filter = (row) => {
    if (!pillTest(row)) return false;
    if (state.q && !(cfg.searchText?.(row) ?? '').toLowerCase().includes(state.q.toLowerCase())) return false;
    return (cfg.selects || []).every((s) => !state.sel[s.id] || s.test(row, state.sel[s.id]));
  };

  root.innerHTML = `
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div id="l-pills" role="group" aria-label="التصفية" class="flex flex-wrap gap-2"></div>
        <div class="flex flex-wrap gap-2">
          ${(cfg.selects || []).map((s) => `<label><span class="sr-only">${esc(s.label)}</span><select data-sel="${s.id}" class="ad-input !w-auto">${s.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>`).join('')}
          ${cfg.searchText ? `<label><span class="sr-only">بحث</span><input type="search" data-q value="${esc(state.q)}" placeholder="${esc(cfg.placeholder || 'بحث')}" class="ad-input !w-56"></label>` : ''}
        </div>
      </div>
      <div id="l-top"></div>
      <section class="ad-card !py-3" aria-label="${esc(cfg.label)}"><div id="l-body"></div></section>
      ${cfg.note ? `<p class="ad-muted m-0">${cfg.note}</p>` : ''}
    </div>`;
  const body = root.querySelector('#l-body');
  const pillsEl = root.querySelector('#l-pills');
  const topEl = root.querySelector('#l-top');
  const drawTop = (animate) => {
    if (!cfg.top) return;
    topEl.innerHTML = typeof cfg.top === 'function' ? cfg.top() : cfg.top;
    runCounts(topEl, animate);
  };

  const drawPills = () => {
    if (!cfg.pills) return;
    const rows = api.rows(cfg.table);
    pillsEl.innerHTML = cfg.pills.map((p) => `<button type="button" data-pill="${p.id}" class="ad-pill" aria-pressed="${state.pill === p.id}">${esc(p.label)}${p.test || p.id === cfg.pills[0].id ? ` <span class="tabular">(${(p.test ? rows.filter(p.test) : rows).length.toLocaleString('en-US')})</span>` : ''}</button>`).join('');
  };

  let seq = 0;
  async function reload(silent = false) {
    const mine = ++seq;
    drawPills();
    drawTop(!silent && !topEl.firstChild);
    if (!silent) body.innerHTML = skeleton(6, cfg.columns.length > 4 ? 5 : cfg.columns.length);
    let result;
    try {
      result = await api.list(cfg.table, { filter, sort: cfg.sort, page: state.page, size: state.size });
    } catch (e) {
      if (mine === seq) body.innerHTML = errorBox(e.message);
      return;
    }
    if (mine !== seq) return;
    if (!result.total) {
      body.innerHTML = emptyBox(cfg.emptyTitle || 'لا توجد عناصر', cfg.emptyText || 'لا توجد نتائج مطابقة.');
      return;
    }
    body.innerHTML = `
      <div class="overflow-x-auto"><table class="ad-table" style="min-width:${cfg.minW || 760}px">
        <thead><tr>${cfg.columns.map((c) => `<th scope="col">${esc(c.h)}</th>`).join('')}</tr></thead>
        <tbody>${result.rows.map((r) => `<tr ${cfg.rowHref ? `data-href="${esc(cfg.rowHref(r))}"` : ''}>${cfg.columns.map((c) => `<td class="${c.cls || ''}">${c.cell(r)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <div class="mt-1">${pager({ page: state.page, size: state.size, total: result.total })}</div>`;
    applyRole(body);
    if (silent && !REDUCED) body.querySelector('tbody tr')?.classList.add('ad-flash');
  }

  root.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-pill]');
    if (pill) { state.pill = pill.dataset.pill; state.page = 1; reload(); return; }
    const pg = e.target.closest('[data-page]');
    if (pg && !pg.disabled) { state.page = Number(pg.dataset.page); reload(); return; }
    if (e.target.closest('[data-retry]')) { reload(); return; }
    const act = e.target.closest('[data-act]');
    if (act && cfg.onAction) { e.stopPropagation(); cfg.onAction(act.dataset.act, act.dataset.id, reload); return; }
    const tr = e.target.closest('tr[data-href]');
    if (tr && !e.target.closest('a,button,input,select')) location.hash = tr.dataset.href;
  });
  root.addEventListener('change', (e) => {
    if (e.target.matches('[data-size]')) { state.size = Number(e.target.value); state.page = 1; reload(); }
    if (e.target.matches('[data-sel]')) { state.sel[e.target.dataset.sel] = e.target.value; state.page = 1; reload(); }
  });
  let timer;
  root.addEventListener('input', (e) => {
    if (!e.target.matches('[data-q]')) return;
    clearTimeout(timer);
    timer = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; reload(); }, 220);
  });

  reload();
  if (cfg.ctx && cfg.live) cfg.ctx.onLive((e) => { if (cfg.live(e)) reload(true); });
  return { reload, state };
}
