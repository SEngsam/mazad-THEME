/**
 * Live layer (prototype): simulates the server pushing events every few seconds.
 * To connect the real server, keep `subscribe`/`series`/`inbox` and feed them from socket.io
 * (the server already has socket.io with Firebase auth) or from polling.
 */
import * as db from './mock.js';

const listeners = new Set();
let timer = null;
let tick = 0;

/** Hourly bids, index 0 = 24 hours ago, last = the current hour. */
const hourly = [12, 9, 7, 5, 4, 6, 11, 18, 26, 34, 41, 47, 52, 58, 55, 61, 66, 72, 80, 91, 96, 88, 74, 63];
const daily = [412, 388, 455, 501, 476, 598, 534];
const monthlyDays = Array.from({ length: 30 }, (_, i) => 380 + ((i * 53) % 190) + i * 6);

const SPARE_TITLES = ['أوميغا سبيدماستر مون ووتش', 'هيونداي سوناتا 2022', 'آيفون 16 برو ماكس 1TB', 'لوحة مميزة ر س ع 7', 'رافعة شوكية تويوتا 3 طن', 'شفروليه كابريس 1990'];

const rand = (n) => Math.floor(Math.random() * n);
const emit = (e) => listeners.forEach((fn) => fn(e));

function step() {
  tick += 1;
  const live = db.auctions.filter((a) => a.status === 'LIVE');
  if (!live.length) return;

  // Every step: a new bid on a live auction.
  const a = live[rand(live.length)];
  const price = (a.lastPrice || a.startingPrice) + a.minBidIncrement * (1 + rand(3));
  a.lastPrice = price;
  a.views += 1 + rand(4);
  const bid = {
    id: `b-${Date.now()}`, auctionId: a.id, auctionTitle: a.title, bidderId: `a-${1 + rand(db.accounts.length)}`,
    bidderName: `مزايد #${1000 + rand(8999)}`, price, locationPretty: db.CITIES[rand(db.CITIES.length)], status: 'open',
    rejectionReason: null, paidCoins: 5, coinsPaidBack: false, createdAt: Date.now(),
  };
  db.bids.unshift(bid);
  hourly[23] += 1;
  daily[6] += 1;
  emit({ type: 'bid', label: 'مزايدة جديدة', tone: 'good', icon: '↑', target: a.title, text: 'مزايدة جديدة', value: price, at: Date.now(), bid });

  // Every 4th step: a seller submits an auction for review (the queue badge updates).
  if (tick % 4 === 0 && db.auctions.filter((x) => x.status === 'PENDING_REVIEW').length < 9) {
    const title = SPARE_TITLES[(tick / 4) % SPARE_TITLES.length | 0];
    const src = db.auctions.find((x) => x.title === title) || a;
    const n = {
      ...src, id: `MZ-${11000 + tick}`, status: 'PENDING_REVIEW', statusReason: null, lastPrice: null, views: 0, submittedAt: Date.now(), reviewedAt: null, reviewedBy: null,
      createdAt: Date.now(), resubmitted: false, history: [{ type: 'STATUS_CHANGE', text: 'قُدّم للمراجعة', by: 'البائع', at: Date.now() }],
    };
    db.auctions.unshift(n);
    emit({ type: 'submit', label: 'مزاد للمراجعة', tone: 'warn', icon: '!', target: n.title, text: 'مزاد جديد بانتظار المراجعة', at: Date.now() });
  }
  // Every 7th step: a coin purchase.
  if (tick % 7 === 0) {
    const acc = db.accounts[rand(db.accounts.length)];
    const amount = [115, 402.5, 920][rand(3)];
    db.payments.unshift({ id: `p-${Date.now()}`, number: db.payments[0].number + 1, accountId: acc.id, name: acc.name, boughtPackage: '500 عملة', coins: 500, currency: 'SAR', amount: amount / 1.15, vatRate: 15, vatAmount: amount - amount / 1.15, totalAmount: amount, store: 'Stripe', transactionId: `pi_3Q•••${rand(9999)}`, purchasedAt: Date.now() });
    emit({ type: 'payment', label: 'شراء عملات', tone: 'info', icon: '◆', target: acc.name, text: `شراء عملات ${amount.toFixed(2)} ر.س`, at: Date.now() });
  }
}

/** Subscribe to live events. Returns the unsubscribe function. */
export function subscribe(fn, every = 5000) {
  listeners.add(fn);
  if (!timer) timer = setInterval(step, every);
  return () => {
    listeners.delete(fn);
    if (!listeners.size && timer) { clearInterval(timer); timer = null; }
  };
}

export const HOURS = ['12 ص', '1 ص', '2 ص', '3 ص', '4 ص', '5 ص', '6 ص', '7 ص', '8 ص', '9 ص', '10 ص', '11 ص', '12 م', '1 م', '2 م', '3 م', '4 م', '5 م', '6 م', '7 م', '8 م', '9 م', '10 م', '11 م'];

/** Bids series for the chart. Values are oldest -> newest. */
export function series(range) {
  if (range === '7') return { values: [...daily], labels: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'], unit: 'يوم' };
  if (range === '30') return { values: [...monthlyDays], labels: monthlyDays.map((_, i) => String(i + 1)), unit: 'يوم' };
  const h = new Date().getHours();
  return { values: [...hourly], labels: hourly.map((_, i) => HOURS[(h - 23 + i + 48) % 24]), unit: 'ساعة' };
}

/** Live numbers for the hero and the KPI cards. */
export function pulse() {
  const now = Date.now();
  const last = (arr, ms) => arr.filter((x) => now - (x.createdAt ?? x.purchasedAt) <= ms);
  const liveAuctions = db.auctions.filter((a) => a.status === 'LIVE');
  const dayBids = last(db.bids, 86400000).length;
  const prevDay = db.bids.filter((b) => now - b.createdAt > 86400000 && now - b.createdAt <= 172800000).length || 1;
  const dayPay = db.payments.filter((p) => now - p.purchasedAt <= 86400000);
  const prevPay = db.payments.filter((p) => now - p.purchasedAt > 86400000 && now - p.purchasedAt <= 172800000);
  const sum = (rows) => rows.reduce((t, p) => t + p.totalAmount, 0);
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : 0);
  const m = db.monthly.accounts;
  return {
    live: liveAuctions.length,
    bids10: last(db.bids, 600000).length,
    ending1h: liveAuctions.filter((a) => a.expiresAt - now > 0 && a.expiresAt - now < 3600000).length,
    pending: db.auctions.filter((a) => a.status === 'PENDING_REVIEW').length,
    oldestPending: db.auctions.filter((a) => a.status === 'PENDING_REVIEW').reduce((t, a) => Math.min(t, a.submittedAt), now),
    accountsMonth: m.at(-1), accountsDelta: pct(m.at(-1), m.at(-2)),
    bidsDay: dayBids, bidsDelta: pct(dayBids, prevDay),
    coinsDay: Math.round(sum(dayPay)), coinsDelta: pct(sum(dayPay), sum(prevPay)),
    sparkAccounts: m.slice(-7), sparkBids: hourly.slice(-8), sparkCoins: db.monthly.payments.slice(-7),
  };
}

export function statusGroups() {
  const c = {};
  db.auctions.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
  const g = (...k) => k.reduce((t, s) => t + (c[s] || 0), 0);
  return [
    ['جارٍ', g('LIVE'), '#076091'], ['مغلق', g('CLOSED'), '#0F172A'], ['معتمد / مجدول', g('APPROVED', 'SCHEDULED'), '#F59E0B'],
    ['بانتظار المراجعة', g('PENDING_REVIEW', 'CHANGES_REQUESTED'), '#FF5A36'], ['أخرى', g('REJECTED', 'CANCELLED', 'DRAFT'), '#C9D3E0'],
  ];
}

export function cityShare() {
  const c = {};
  db.auctions.forEach((a) => { c[a.locationPretty] = (c[a.locationPretty] || 0) + 1; });
  const total = db.auctions.length;
  const top = Object.entries(c).sort((a, b) => b[1] - a[1]);
  const head = top.slice(0, 5);
  const rest = top.slice(5).reduce((t, [, n]) => t + n, 0);
  return [...head, ...(rest ? [['أخرى', rest]] : [])].map(([name, n]) => ({ name, n, pct: Math.round((n / total) * 100) }));
}

export function topCategories() {
  const byCat = {};
  db.bids.forEach((b) => {
    const a = db.auctions.find((x) => x.id === b.auctionId);
    if (a) byCat[a.mainCategoryId] = (byCat[a.mainCategoryId] || 0) + 1;
  });
  return Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, n]) => ({ name: db.categories.find((c) => c.id === id)?.name.ar || '—', n }));
}

export function endingSoon(limit = 3) {
  const now = Date.now();
  return db.auctions.filter((a) => a.status === 'LIVE' && a.expiresAt > now).sort((a, b) => a.expiresAt - b.expiresAt).slice(0, limit);
}

export function topSellers(limit = 3) {
  const stats = new Map();
  db.auctions.forEach((a) => {
    if (!['LIVE', 'CLOSED'].includes(a.status)) return;
    stats.set(a.accountId, (stats.get(a.accountId) || 0) + 1);
  });
  return [...stats].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id, n]) => {
    const acc = db.accounts.find((x) => x.id === id);
    return { id, name: acc.name, deals: n, rating: acc.rating };
  });
}

const READ_KEY = 'ad-inbox-read';
export const markInboxRead = () => localStorage.setItem(READ_KEY, String(Date.now()));

/** What needs the admin's attention: new auctions, verification requests, support messages, reports. */
export function inbox() {
  const readAt = Number(localStorage.getItem(READ_KEY) || 0);
  const items = [];
  db.auctions.filter((a) => a.status === 'PENDING_REVIEW').forEach((a) => items.push({ tone: 'warn', icon: '!', title: 'مزاد جديد للمراجعة', text: a.title, at: a.submittedAt, href: '#/review' }));
  db.accounts.filter((a) => a.verificationRequestedAt).forEach((a) => items.push({ tone: 'good', icon: '✓', title: 'طلب توثيق حساب', text: a.name, at: a.verificationRequestedAt, href: `#/accounts/${a.id}` }));
  db.reports.slice(0, 3).forEach((r) => items.push({ tone: 'warn', icon: '⚑', title: 'بلاغ جديد', text: `${r.reason} · ${r.target}`, at: r.createdAt, href: '#/reports' }));
  db.messages.filter((m) => !m.solved).forEach((m) => items.push({ tone: 'info', icon: '✉', title: 'رسالة دعم جديدة', text: m.message, at: m.createdAt, href: '#/messages' }));
  items.sort((a, b) => b.at - a.at);
  items.forEach((i) => { i.unread = i.at > readAt; });
  return items;
}
