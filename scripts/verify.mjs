// Renders the page at the target viewports and checks layout + interactions.
// Usage: npm run build && npm run check   (SHOTS=<dir> to save screenshots)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '') || 'index.html';
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const widths = [320, 390, 768, 1024, 1440];
const shots = process.env.SHOTS;
const failures = [];
const fail = (msg) => failures.push(msg);

const browser = await chromium.launch();
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const report = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = { pageScroll: document.documentElement.scrollWidth - vw, offenders: [], clipped: [] };
    const inScroller = (el) => el.closest('.scroll-row');
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (!r.width || inScroller(el) || el.closest('.sr-only')) continue;
      if (r.right > vw + 1 || r.left < -1) out.offenders.push(`${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join('.')} [${Math.round(r.left)}, ${Math.round(r.right)}]`);
      const cs = getComputedStyle(el);
      if (el.children.length === 0 && el.textContent.trim() && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== 'visible') {
        out.clipped.push(el.textContent.trim().slice(0, 40));
      }
    }
    return out;
  });
  if (report.pageScroll > 0) fail(`${width}px: page scrolls horizontally by ${report.pageScroll}px`);
  report.offenders.slice(0, 5).forEach((o) => fail(`${width}px: outside viewport → ${o}`));
  report.clipped.slice(0, 5).forEach((t) => fail(`${width}px: clipped text → ${t}`));
  errors.forEach((e) => fail(`${width}px: script error → ${e}`));

  if (shots) await page.screenshot({ path: `${shots}/home-${width}.png`, fullPage: true });
  await page.close();
}

// Interactions (desktop + phone)
for (const width of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  await page.goto(url, { waitUntil: 'networkidle' });
  const count = () => page.locator('#lot-grid > article').count();
  const text = (sel) => page.locator(sel).first().textContent();

  if ((await count()) !== 9) fail(`${width}px: expected 8 lots + 1 sponsored, got ${await count()}`);

  await page.locator('#cat-nav [data-cat="2"]').click();
  if (!(await text('#live-title')).includes('ساعات')) fail(`${width}px: nav category filter`);
  if ((await count()) !== 2) fail(`${width}px: watches filter count ${await count()}`);

  await page.locator('#category-grid [data-cat="1"]').click();
  if ((await page.locator('#category-grid [data-cat="1"]').getAttribute('aria-pressed')) !== 'true') fail(`${width}px: category tile state`);
  await page.locator('#cat-nav [data-cat="0"]').click();

  await page.locator('#sort-tabs [data-tab="3"]').click();
  const noReserve = await page.locator('#lot-grid article:not([aria-label])').count();
  if (noReserve !== 4) fail(`${width}px: no-reserve tab shows ${noReserve}`);
  await page.locator('#sort-tabs [data-tab="2"]').click();
  const first = await page.locator('#lot-grid article:not([aria-label]) a').first().textContent();
  if (!first.includes('آيفون')) fail(`${width}px: lowest-price sort starts with ${first}`);

  const before = Number(await text('[data-watch-count]'));
  await page.locator('[data-watch]').first().click();
  const after = Number(await text('[data-watch-count]'));
  if (Math.abs(after - before) !== 1) fail(`${width}px: watch toggle ${before} → ${after}`);

  await page.locator('#show-more').click();
  if ((await count()) !== 11) fail(`${width}px: show more → ${await count()}`);

  await page.fill('#q', 'رولكس');
  await page.press('#q', 'Enter');
  if ((await count()) !== 1) fail(`${width}px: search → ${await count()}`);

  const t1 = await page.locator('[data-timer] span').first().textContent();
  await page.waitForTimeout(1200);
  const t2 = await page.locator('[data-timer] span').first().textContent();
  if (t1 === t2) fail(`${width}px: countdown not ticking`);

  await page.keyboard.press('Tab');
  await page.close();
}

await browser.close();
server.close();

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`OK — ${widths.join(', ')} px: no page scroll, overflow or clipped text; interactions pass.`);
