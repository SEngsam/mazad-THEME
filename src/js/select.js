/**
 * Site-styled dropdowns. Every <select class="select-pill"> on the page is enhanced into a button plus a
 * listbox panel; the native select stays (hidden) as the source of truth, so forms and existing `change`
 * handlers keep working. Long lists get a search field. New selects are enhanced as pages re-render.
 */

const SEARCH_FROM = 9;
const CHECK = '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ESC[c]);
const normalise = (t) => String(t).replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();

let open = null; // { select, button, panel, items, active }

function options(select) {
  return [...select.options].filter((o) => o.value !== '');
}

function labelFor(select) {
  const chosen = select.selectedOptions[0];
  return chosen && chosen.value !== '' ? { text: chosen.text, empty: false } : { text: select.options[0]?.text ?? '', empty: true };
}

function syncButton(select, button) {
  const { text, empty } = labelFor(select);
  button.querySelector('[data-select-text]').textContent = text;
  button.querySelector('[data-select-text]').classList.toggle('text-ink-muted', empty);
}

function enhance(select) {
  if (select.dataset.enhanced) return;
  select.dataset.enhanced = '1';
  const hadFocus = document.activeElement === select;
  const id = select.id || `sel-${Math.random().toString(36).slice(2, 8)}`;
  const wrap = document.createElement('div');
  wrap.className = 'relative';
  select.parentNode.insertBefore(wrap, select);

  const button = document.createElement('button');
  button.type = 'button';
  button.id = `${id}-btn`;
  button.className = `${select.className} flex items-center text-start`;
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  ['aria-invalid', 'aria-describedby'].forEach((a) => {
    if (select.hasAttribute(a)) { button.setAttribute(a, select.getAttribute(a)); if (a === 'aria-invalid') select.removeAttribute(a); }
  });
  button.innerHTML = '<span data-select-text class="min-w-0 flex-1 truncate"></span>';
  wrap.append(button, select);

  select.classList.add('sr-only');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  document.querySelectorAll(`label[for="${CSS.escape(id)}"]`).forEach((l) => { l.htmlFor = button.id; });
  syncButton(select, button);
  select.addEventListener('change', () => syncButton(select, button));
  if (hadFocus) button.focus();
}

function render(state, query = '') {
  const { select, panel } = state;
  const q = normalise(query.trim());
  state.items = options(select).filter((o) => !q || normalise(o.text).includes(q));
  if (state.active >= state.items.length) state.active = state.items.length - 1;
  const list = panel.querySelector('[role="listbox"]');
  list.innerHTML = state.items.length ? state.items.map((o, i) => {
    const selected = o.value === select.value;
    return `<li role="option" id="${state.listId}-${i}" data-index="${i}" aria-selected="${selected}"
      class="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-[15px] ${i === state.active ? 'bg-sand' : ''} ${selected ? 'font-semibold text-primary' : 'text-ink'}">
      <span class="truncate">${esc(o.text)}</span>${selected ? CHECK : ''}</li>`;
  }).join('') : '<li class="px-3.5 py-3 text-sm text-ink-muted">لا توجد نتائج</li>';
  const activeEl = list.querySelector(`[data-index="${state.active}"]`);
  if (activeEl) {
    list.setAttribute('aria-activedescendant', activeEl.id);
    activeEl.scrollIntoView({ block: 'nearest' });
  } else list.removeAttribute('aria-activedescendant');
}

function openPanel(select, button) {
  close(false);
  const searchable = options(select).length >= SEARCH_FROM;
  const panel = document.createElement('div');
  const listId = `${button.id}-list`;
  panel.className = 'absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-[18px] border border-line bg-white p-1.5 shadow-card';
  panel.innerHTML = `
    ${searchable ? `<div class="p-1 pb-1.5"><input type="search" data-select-search autocomplete="off" placeholder="ابحث" aria-label="ابحث في القائمة" aria-controls="${listId}"
      class="w-full rounded-full border-0 bg-mist px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"></div>` : ''}
    <ul role="listbox" id="${listId}" tabindex="-1" aria-labelledby="${button.id}" class="m-0 max-h-64 list-none overflow-y-auto overscroll-contain p-0 focus:outline-none"></ul>`;
  button.parentNode.append(panel);
  const selectedIndex = options(select).findIndex((o) => o.value === select.value);
  open = { select, button, panel, listId, items: [], active: Math.max(0, selectedIndex) };
  button.setAttribute('aria-expanded', 'true');
  button.setAttribute('aria-controls', listId);
  render(open);
  (panel.querySelector('[data-select-search]') ?? panel.querySelector('[role="listbox"]')).focus();
}

function close(returnFocus = true) {
  if (!open) return;
  const { button, panel } = open;
  panel.remove();
  button.setAttribute('aria-expanded', 'false');
  open = null;
  if (returnFocus) button.focus();
}

function choose(index) {
  if (!open) return;
  const option = open.items[index];
  if (!option) return;
  const { select } = open;
  close();
  if (select.value !== option.value) {
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

let wired = false;
export function initSelects() {
  document.querySelectorAll('select.select-pill').forEach(enhance);
  if (wired) return;
  wired = true;
  // Only re-scan when a select was actually added (the timers rewrite text every second).
  const addedSelect = (n) => n.nodeType === 1 && (n.matches('select.select-pill') || n.querySelector('select.select-pill'));
  new MutationObserver((records) => {
    if (records.some((r) => [...r.addedNodes].some(addedSelect))) {
      document.querySelectorAll('select.select-pill:not([data-enhanced])').forEach(enhance);
    }
  }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', (event) => {
    const t = event.target;
    const option = t.closest('[role="option"][data-index]');
    if (open && option && open.panel.contains(option)) { choose(Number(option.dataset.index)); return; }
    const button = t.closest('button[aria-haspopup="listbox"]');
    if (button) {
      const select = button.parentNode.querySelector('select');
      if (open?.button === button) close(); else openPanel(select, button);
      return;
    }
    if (open && !open.panel.contains(t)) close(false);
  });

  document.addEventListener('input', (event) => {
    if (open && event.target.matches('[data-select-search]')) { open.active = 0; render(open, event.target.value); }
  });

  document.addEventListener('keydown', (event) => {
    const button = event.target.closest?.('button[aria-haspopup="listbox"]');
    if (button && !open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      openPanel(button.parentNode.querySelector('select'), button);
      return;
    }
    if (!open) return;
    const search = open.panel.querySelector('[data-select-search]');
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'Tab') close(false);
    else if (event.key === 'ArrowDown') { event.preventDefault(); open.active = Math.min(open.items.length - 1, open.active + 1); render(open, search?.value ?? ''); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); open.active = Math.max(0, open.active - 1); render(open, search?.value ?? ''); }
    else if (event.key === 'Home' && !search) { event.preventDefault(); open.active = 0; render(open); }
    else if (event.key === 'End' && !search) { event.preventDefault(); open.active = open.items.length - 1; render(open); }
    else if (event.key === 'Enter') { event.preventDefault(); choose(open.active); }
    else if (!search && event.key.length === 1) {
      const i = open.items.findIndex((o) => normalise(o.text).startsWith(normalise(event.key)));
      if (i >= 0) { open.active = i; render(open); }
    }
  });
}
