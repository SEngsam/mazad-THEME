import { api } from '../api.js';
import { cityShare, endingSoon, pulse, series, statusGroups, topCategories, topSellers } from '../live.js';
import { ago, chip, countUp, esc, flash, fmt, icon, money, spark, thumb } from '../ui.js';

export const meta = { title: 'نظرة عامة', sub: 'تتحدّث البيانات مباشرة' };

let lastGeom = null;

/** The orange marker follows the pointer along the line; it returns to the peak when the pointer leaves. */
function bindHover(host) {
  const svg = host.querySelector('svg');
  const g = lastGeom;
  if (!svg || !g) return;
  const cur = svg.querySelector('#cur'), dot = svg.querySelector('#cur-d'), ln = svg.querySelector('#cur-l'), pill = svg.querySelector('#cur-p'), txt = svg.querySelector('#cur-t');
  const peak = Number(cur.dataset.peak);
  const goto = (i) => {
    const [px, py] = g.pts[i];
    cur.style.transform = `translate(${px}px,0)`;
    dot.setAttribute('cy', py); dot.style.cy = `${py}px`;
    ln.setAttribute('y1', py); ln.style.y1 = `${py}px`;
    const off = Math.min(g.W - g.pw / 2 - 4, Math.max(g.pw / 2 + 4, px)) - px;
    pill.style.transform = `translate(${off}px,0)`;
    txt.textContent = `${i === g.last ? 'الآن' : g.labels[i]} · ${fmt(g.values[i])}`;
    svg.setAttribute('aria-live', 'off');
  };
  const nearest = (clientX) => {
    const r = svg.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * g.W;
    let best = 0;
    g.pts.forEach((p, i) => { if (Math.abs(p[0] - x) < Math.abs(g.pts[best][0] - x)) best = i; });
    return best;
  };
  svg.addEventListener('pointermove', (e) => goto(nearest(e.clientX)));
  svg.addEventListener('pointerdown', (e) => goto(nearest(e.clientX)));
  svg.addEventListener('pointerleave', () => goto(peak));
  svg.style.touchAction = 'pan-y';
  svg.style.cursor = 'crosshair';
}

function chart(s, animate) {
  const W = 680, H = 250, L = 38, R = 22, T = 30, B = 40;
  const { values, labels } = s;
  const max = Math.max(...values);
  const top = Math.ceil(max / 25) * 25 || 25;
  const x = (i) => W - R - (i * (W - L - R)) / (values.length - 1);
  const y = (v) => T + (1 - v / top) * (H - T - B);
  const pts = values.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts.at(-1)[0].toFixed(1)} ${H - B} L${pts[0][0].toFixed(1)} ${H - B} Z`;
  const peak = values.indexOf(max);
  const ticks = [0, 1, 2, 3, 4].map((t) => (top * t) / 4);
  const step = Math.ceil(values.length / 6);
  const last = values.length - 1;
  const pw = 96;
  lastGeom = { pts, W, H, B, pw, labels, values, last };
  const off = Math.min(W - pw / 2 - 4, Math.max(pw / 2 + 4, pts[peak][0])) - pts[peak][0];
  return `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="المزايدات: الذروة ${fmt(max)} عند ${labels[peak]}، والآن ${fmt(values[last])}" class="block h-auto w-full">
      <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#006C35" stop-opacity=".28"/><stop offset="1" stop-color="#006C35" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="${t ? '#ECEEF1' : '#DDE3E0'}"/><text x="${L - 8}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="#5E6B64">${fmt(Math.round(t))}</text>`).join('')}
      <path d="${area}" fill="url(#ga)" ${animate ? 'class="ad-fade"' : ''}/>
      <path d="${line}" pathLength="1" fill="none" stroke="#006C35" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" ${animate ? 'class="ad-draw"' : ''}/>
      <g id="cur" data-peak="${peak}" style="transform:translate(${pts[peak][0]}px,0);transition:transform .16s ease-out">
        <line id="cur-l" x1="0" x2="0" y1="${pts[peak][1]}" y2="${H - B}" stroke="#FF5A36" stroke-width="1.5" stroke-dasharray="4 4" style="transition:y1 .16s ease-out"/>
        <circle id="cur-d" cx="0" cy="${pts[peak][1]}" r="6" fill="#FF5A36" stroke="#fff" stroke-width="2.5" style="transition:cy .16s ease-out"/>
        <g id="cur-p" style="transform:translate(${off}px,0);transition:transform .16s ease-out"><rect x="${-pw / 2}" y="2" width="${pw}" height="22" rx="11" fill="#062E22"/>
          <text id="cur-t" x="0" y="17" font-size="11.5" font-weight="700" fill="#C6F432" text-anchor="middle">${labels[peak]} · ${fmt(max)}</text></g>
      </g>
      <circle cx="${pts[last][0]}" cy="${pts[last][1]}" r="5" fill="#006C35" stroke="#fff" stroke-width="2.5"/>
      <circle cx="${pts[last][0]}" cy="${pts[last][1]}" r="11" fill="none" stroke="#006C35" stroke-opacity=".35"><animate attributeName="r" values="6;16" dur="1.6s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".5;0" dur="1.6s" repeatCount="indefinite"/></circle>
      ${pts.map((p, i) => (i % step === 0 || i === last ? `<text x="${p[0]}" y="${H - 14}" text-anchor="middle" font-size="10.5" fill="#5E6B64">${i === last ? 'الآن' : labels[i]}</text>` : '')).join('')}
    </svg>`;
}

function donut(groups) {
  const total = groups.reduce((t, g) => t + g[1], 0) || 1;
  const C = 2 * Math.PI * 52;
  let off = 0;
  const segs = groups.map(([, n, color]) => {
    const len = Math.max(0, (n / total) * C - 3);
    const s = `<circle cx="70" cy="70" r="52" stroke="${color}" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}"/>`;
    off += (n / total) * C;
    return s;
  }).join('');
  return `<svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="توزيع ${total} مزاداً حسب الحالة" class="shrink-0 -rotate-90"><g fill="none" stroke-width="20"><circle cx="70" cy="70" r="52" stroke="#EFF2F1"/>${segs}</g><g transform="rotate(90 70 70)"><text x="70" y="68" text-anchor="middle" font-size="26" font-weight="700" fill="#121417">${fmt(total)}</text><text x="70" y="86" text-anchor="middle" font-size="10" fill="#5E6B64">مزاد</text></g></svg>`;
}

const IC = { good: ['bg-lime text-forest', '↑'], warn: ['bg-accent-soft text-accent-ink', '!'], info: ['bg-forest text-lime', '◆'] };
const feedItem = (e, isNew) => {
  const [cls, glyph] = IC[e.tone] || IC.info;
  return `<li class="flex items-start gap-3 border-b border-line-soft py-3 last:border-0 ${isNew ? 'ad-feed-new' : ''}">
    <span class="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-xl text-[15px] font-bold ${cls}">${e.icon || glyph}</span>
    <span class="min-w-0 flex-1 text-[13px]"><strong>${esc(e.label)}</strong> · ${esc(e.target)}<br>${e.value ? `<span class="tabular font-bold text-primary">${money(e.value)}</span>` : `<span class="text-ink-muted">${esc(e.text)}</span>`}</span>
    <span data-at="${e.at}" class="shrink-0 text-[11px] text-ink-muted">${ago(e.at)}</span></li>`;
};

const hms = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
};

export default async function overview(root, { ctx }) {
  const stats = await api.stats();
  const p0 = pulse();
  let range = '24';
  const feed = [...stats.events].sort((a, b) => b.at - a.at);
  const timers = [];
  const bars = [55, 80, 40, 95, 60, 75, 35, 88, 50, 70, 100, 45, 65, 85, 38, 72, 58, 92, 48, 78, 62, 90, 42, 68];

  const kpi = (href, bg, label, id, sparkSvg, delta, sub) => `
    <a href="${href}" class="ad-rise flex min-h-[150px] flex-col justify-between gap-2.5 rounded-3xl p-5 ${bg}">
      <span class="text-[13px] font-semibold">${label}</span><span id="${id}" class="tabular text-[34px] font-bold leading-none lg:text-[40px]">0</span>
      <span class="flex items-end justify-between gap-2">${delta}${sparkSvg}</span>${sub || ''}</a>`;
  const d = (v, cls) => `<span class="ad-chip ${cls} !font-bold">${v >= 0 ? '▲' : '▼'} ${Math.abs(v)}%</span>`;

  root.innerHTML = `
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h2 class="m-0 text-[26px] font-bold lg:text-[28px]">${new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير'}، <span class="text-primary">المشرف</span></h2>
        <a id="cta" href="#/review" class="inline-flex h-11 items-center gap-2.5 rounded-full bg-accent-strong px-5 text-[13px] font-bold !text-white hover:bg-accent-ink">
          <span id="cta-n" class="tabular">${p0.pending}</span> مزادات بانتظارك<span class="grid h-[22px] w-[22px] place-items-center rounded-full bg-white text-xs text-accent-strong">‹</span></a>
      </div>

      <div class="grid gap-5 lg:grid-cols-[7fr_5fr]">
        <section aria-label="المزادات الجارية الآن" class="ad-rise relative flex flex-col gap-5 overflow-hidden rounded-[26px] bg-forest p-6 text-white shadow-[0_18px_40px_-22px_rgba(6,46,34,.7)] lg:p-7">
          <svg aria-hidden="true" viewBox="0 0 200 200" class="pointer-events-none absolute -start-12 -top-16 h-64 w-64 opacity-[.07]" fill="#C6F432"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="60" fill="#062E22"/></svg>
          <div class="relative flex items-center justify-between"><span class="ad-live"><span class="ad-dot"></span>مباشر</span><span class="text-xs text-white/65">يتحدّث كل 5 ثوانٍ</span></div>
          <div class="relative"><div class="flex items-baseline gap-3"><span id="hero-live" class="tabular text-[56px] font-bold leading-none text-lime lg:text-[72px]">0</span><span class="text-lg font-semibold lg:text-xl">مزاداً جارياً الآن</span></div>
            <p class="m-0 mt-2.5 text-[13px] text-white/70"><b id="hero-b10" class="tabular text-white">${p0.bids10}</b> مزايدة في آخر 10 دقائق · <b id="hero-e1" class="tabular text-white">${p0.ending1h}</b> مزادات تنتهي خلال ساعة</p></div>
          <div class="ad-eq relative" aria-hidden="true">${bars.map((h, i) => `<b style="height:${h}%;animation-delay:${(-((i * 37) % 120) / 100).toFixed(2)}s"></b>`).join('')}</div>
          <div class="relative flex justify-between text-[11px] text-white/55"><span>قبل 24 دقيقة</span><span>الآن</span></div>
        </section>
        <div class="grid grid-cols-2 gap-4 lg:gap-5">
          ${kpi('#/accounts', 'bg-lime text-forest', 'حسابات جديدة هذا الشهر', 'k-acc', spark(p0.sparkAccounts, '#062E22'), d(p0.accountsDelta, 'bg-forest !text-lime'))}
          ${kpi('#/bids', 'bg-accent text-white', 'مزايدات اليوم', 'k-bids', spark(p0.sparkBids, '#fff'), d(p0.bidsDelta, 'bg-white !text-accent-ink'))}
          ${kpi('#/payments', 'bg-primary text-white', 'مبيعات العملات اليوم', 'k-coins', spark(p0.sparkCoins, '#C6F432'), d(p0.coinsDelta, 'bg-lime !text-forest'))}
          <a href="#/review" class="ad-rise flex min-h-[150px] flex-col justify-between gap-2.5 rounded-3xl border-2 border-accent bg-white p-5 !text-ink"><span class="text-[13px] font-semibold text-accent-ink">بانتظار المراجعة</span><span id="k-pend" class="tabular text-[34px] font-bold leading-none text-accent-strong lg:text-[40px]">0</span><span id="k-pend-sub" class="text-xs text-ink-muted"></span></a>
        </div>
      </div>

      <div class="grid items-start gap-5 xl:grid-cols-[8fr_4fr]">
        <section class="ad-card ad-rise" aria-labelledby="hr-h">
          <div class="mb-1.5 flex flex-wrap items-center justify-between gap-3">
            <div><h2 id="hr-h" class="ad-h2">المزايدات خلال <span id="rng-label">24 ساعة</span></h2><p id="rng-sub" class="m-0 mt-1 text-xs text-ink-muted"></p></div>
            <div id="ranges" role="group" aria-label="الفترة" class="flex gap-1 rounded-full bg-mist p-1">${[['24', '24 ساعة'], ['7', '7 أيام'], ['30', '30 يوماً']].map(([k, l]) => `<button type="button" data-r="${k}" class="rounded-full px-3.5 py-1.5 text-xs ${k === range ? 'bg-forest font-bold text-lime' : 'font-semibold text-ink-body'}">${l}</button>`).join('')}</div>
          </div>
          <div id="chart"></div>
        </section>
        <section class="ad-card ad-rise" aria-labelledby="fd-h">
          <div class="mb-1 flex items-center justify-between"><h2 id="fd-h" class="ad-h2">يحدث الآن</h2><span class="ad-live !bg-primary-soft !text-primary"><span class="ad-dot ad-dot-green"></span>مباشر</span></div>
          <ul id="feed" class="m-0 list-none p-0">${feed.slice(0, 6).map((e) => feedItem(e, false)).join('')}</ul>
        </section>
      </div>

      <div class="grid gap-5 lg:grid-cols-3">
        <section class="ad-card ad-rise" aria-labelledby="dn-h"><h2 id="dn-h" class="ad-h2 mb-4">المزادات حسب الحالة</h2>
          <div class="flex items-center gap-[18px]"><div id="donut"></div><ul id="legend" class="m-0 flex flex-1 list-none flex-col gap-2.5 p-0 text-xs"></ul></div></section>
        <section class="ad-card ad-rise" aria-labelledby="ct-h"><h2 id="ct-h" class="ad-h2 mb-4">المزادات حسب المدينة</h2><div id="cities" class="flex flex-col gap-3.5 text-[13px]"></div></section>
        <section class="ad-card ad-rise" aria-labelledby="cg-h"><h2 id="cg-h" class="ad-h2 mb-4">الأكثر نشاطاً · الفئات</h2><div id="cats" class="flex flex-col gap-3"></div></section>
      </div>

      <div class="grid gap-5 lg:grid-cols-2">
        <section class="ad-card ad-rise" aria-labelledby="en-h"><div class="mb-1.5 flex items-center justify-between"><h2 id="en-h" class="ad-h2">تنتهي قريباً</h2><a href="#/auctions" class="text-xs font-bold">عرض الكل ‹</a></div><ul id="ending" class="m-0 list-none p-0"></ul></section>
        <section class="ad-card ad-rise" aria-labelledby="sl-h"><div class="mb-1.5 flex items-center justify-between"><h2 id="sl-h" class="ad-h2">أفضل البائعين</h2><a href="#/accounts" class="text-xs font-bold">عرض الكل ‹</a></div><ul id="sellers" class="m-0 list-none p-0"></ul></section>
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);

  /* ----- static-ish sections ----- */
  const drawChart = (animate) => {
    const s = series(range);
    $('#chart').innerHTML = chart(s, animate);
    bindHover($('#chart'));
    const max = Math.max(...s.values);
    $('#rng-label').textContent = { 24: '24 ساعة', 7: '7 أيام', 30: '30 يوماً' }[range];
    $('#rng-sub').innerHTML = `الذروة عند <strong class="text-ink">${s.labels[s.values.indexOf(max)]}</strong> بـ ${fmt(max)} مزايدة`;
  };
  const drawDonut = () => {
    const g = statusGroups();
    $('#donut').innerHTML = donut(g);
    $('#legend').innerHTML = g.map(([l, n, c]) => `<li class="flex items-center gap-2"><i class="h-2.5 w-2.5 rounded-[3px] ${c === '#C6F432' ? 'border border-[#9BC21F]' : ''}" style="background:${c}"></i>${l}<b class="tabular ms-auto">${n}</b></li>`).join('');
  };
  const drawLists = () => {
    $('#cities').innerHTML = cityShare().map((c, i, a) => `<div class="grid grid-cols-[72px_1fr_40px] items-center gap-2.5"><span>${esc(c.name)}</span><span class="h-[9px] overflow-hidden rounded-full bg-mist"><span class="block h-full rounded-full ${c.name === 'أخرى' ? 'bg-[#9AA5A0]' : 'bg-primary'}" style="width:${(c.n / a[0].n) * 100}%"></span></span><b class="tabular">${c.pct}%</b></div>`).join('');
    const tone = ['bg-forest text-lime', 'bg-primary text-white', 'bg-lime text-forest', 'bg-sand text-ink-body', 'bg-sand text-ink-body'];
    $('#cats').innerHTML = topCategories().map((c, i) => `<div class="flex items-center gap-3"><span class="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-xl text-[13px] font-bold ${tone[i]}">${i + 1}</span><span class="flex-1 font-semibold">${esc(c.name)}</span><span class="tabular text-xs text-ink-muted">${fmt(c.n)} مزايدة</span></div>`).join('');
    $('#sellers').innerHTML = topSellers(3).map((s, i) => `<li class="flex items-center gap-3 border-b border-line-soft py-3 last:border-0"><span class="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-sm font-bold ${['bg-forest text-lime', 'bg-primary text-white', 'bg-lime text-forest'][i]}">${esc([...s.name][0])}</span><span class="flex-1 text-[13px]"><a href="#/accounts/${s.id}" class="font-bold !text-ink">${esc(s.name)}</a><br><span class="text-ink-muted">${s.deals} مزاداً</span></span>${chip(`★ ${s.rating.toFixed(1)}`, 'good')}</li>`).join('');
  };
  const drawEnding = () => {
    const list = endingSoon(3);
    $('#ending').innerHTML = list.length ? list.map((a) => `<li class="flex items-center gap-3 border-b border-line-soft py-3 last:border-0">${thumb(a.img, 'h-[38px] w-12 rounded-[10px]', a.title)}<span class="min-w-0 flex-1 text-[13px]"><a href="#/auctions/${a.id}" class="font-bold !text-ink">${esc(a.title)}</a><br><span class="tabular font-bold text-primary">${money(a.lastPrice)}</span></span><span data-end="${a.expiresAt}" class="ad-timer"></span></li>`).join('') : '<li class="py-8 text-center text-[13px] text-ink-muted">لا توجد مزادات تنتهي قريباً.</li>';
    tickTimers();
  };
  const tickTimers = () => {
    root.querySelectorAll('[data-end]').forEach((el) => {
      const left = Number(el.dataset.end) - Date.now();
      el.textContent = hms(left);
      el.classList.toggle('ad-timer-calm', left > 3600000);
    });
    root.querySelectorAll('[data-at]').forEach((el) => { el.textContent = ago(Number(el.dataset.at)); });
  };

  const setPending = (n, oldest) => {
    $('#cta-n').textContent = n;
    $('#k-pend').textContent = n;
    $('#k-pend-sub').textContent = n ? `أقدمها ${ago(oldest)}` : 'لا شيء بانتظارك';
    $('#cta').classList.toggle('hidden', !n);
  };

  countUp($('#hero-live'), p0.live, { ms: 1100 });
  countUp($('#k-acc'), p0.accountsMonth, { prefix: '+' });
  countUp($('#k-bids'), p0.bidsDay);
  countUp($('#k-coins'), p0.coinsDay, { suffix: ' ر.س' });
  countUp($('#k-pend'), p0.pending, { ms: 600 });
  $('#k-pend-sub').textContent = p0.pending ? `أقدمها ${ago(p0.oldestPending)}` : 'لا شيء بانتظارك';
  drawChart(true); drawDonut(); drawLists(); drawEnding();

  $('#ranges').addEventListener('click', (e) => {
    const b = e.target.closest('[data-r]');
    if (!b) return;
    range = b.dataset.r;
    $('#ranges').querySelectorAll('[data-r]').forEach((x) => { x.className = `rounded-full px-3.5 py-1.5 text-xs ${x === b ? 'bg-forest font-bold text-lime' : 'font-semibold text-ink-body'}`; });
    drawChart(true);
  });

  /* ----- live updates ----- */
  ctx.onLive((e) => {
    const p = pulse();
    feed.unshift(e);
    $('#feed').innerHTML = feed.slice(0, 6).map((x, i) => feedItem(x, i === 0)).join('');
    $('#hero-live').textContent = fmt(p.live);
    $('#hero-b10').textContent = p.bids10;
    $('#hero-e1').textContent = p.ending1h;
    if (e.type === 'bid') { $('#k-bids').textContent = fmt(p.bidsDay); flash($('#k-bids').parentElement); if (!$('#chart').matches(':hover')) drawChart(false); drawLists(); drawEnding(); }
    if (e.type === 'payment') { $('#k-coins').textContent = `${fmt(p.coinsDay)} ر.س`; flash($('#k-coins').parentElement); }
    if (e.type === 'submit') { setPending(p.pending, p.oldestPending); flash($('#k-pend').parentElement); drawDonut(); }
  });
  timers.push(setInterval(tickTimers, 1000));
  document.addEventListener('ad-route', () => timers.forEach(clearInterval), { once: true });
}

export { icon };
