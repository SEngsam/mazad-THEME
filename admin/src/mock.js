/**
 * Sample data for the admin prototype. Field names follow the server models
 * (auctions, accounts, bids, payments, reports, reviews, settings…), so the api layer
 * can be pointed at the real server without touching the pages.
 */

const NOW = Date.now();
const MIN = 60000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms) => NOW - ms;

export const CITIES = ['الرياض', 'جدة', 'الدمام', 'الخبر', 'الأحساء', 'مكة المكرمة', 'المدينة المنورة'];

export const categories = [
  { id: 'c-cars', parentCategoryId: null, name: { ar: 'سيارات', en: 'Cars' }, icon: 'car' },
  { id: 'c-lexus', parentCategoryId: 'c-cars', name: { ar: 'لكزس', en: 'Lexus' } },
  { id: 'c-toyota', parentCategoryId: 'c-cars', name: { ar: 'تويوتا', en: 'Toyota' } },
  { id: 'c-ford', parentCategoryId: 'c-cars', name: { ar: 'فورد', en: 'Ford' } },
  { id: 'c-watches', parentCategoryId: null, name: { ar: 'ساعات', en: 'Watches' }, icon: 'watch' },
  { id: 'c-rolex', parentCategoryId: 'c-watches', name: { ar: 'رولكس', en: 'Rolex' } },
  { id: 'c-omega', parentCategoryId: 'c-watches', name: { ar: 'أوميغا', en: 'Omega' } },
  { id: 'c-jewelry', parentCategoryId: null, name: { ar: 'مجوهرات', en: 'Jewelry' }, icon: 'gem' },
  { id: 'c-gold', parentCategoryId: 'c-jewelry', name: { ar: 'ذهب', en: 'Gold' } },
  { id: 'c-realestate', parentCategoryId: null, name: { ar: 'عقارات', en: 'Real estate' }, icon: 'home' },
  { id: 'c-land', parentCategoryId: 'c-realestate', name: { ar: 'أراضٍ', en: 'Land' } },
  { id: 'c-electronics', parentCategoryId: null, name: { ar: 'جوالات وإلكترونيات', en: 'Electronics' }, icon: 'phone' },
  { id: 'c-phones', parentCategoryId: 'c-electronics', name: { ar: 'جوالات', en: 'Phones' } },
  { id: 'c-antiques', parentCategoryId: null, name: { ar: 'تحف ومقتنيات', en: 'Antiques' }, icon: 'star' },
  { id: 'c-plates', parentCategoryId: null, name: { ar: 'لوحات مميزة', en: 'Plates' }, icon: 'hash' },
];

const NAMES = ['معرض الوفاء للسيارات', 'دار الساعات', 'مؤسسة النخبة للمعدات', 'متجر التقنية', 'سعود', 'فهد', 'نورة', 'خالد', 'مها', 'عبدالله', 'ريم', 'ماجد', 'هند', 'تركي', 'لينا', 'بدر', 'سارة', 'ناصر', 'جود', 'سلمان'];

export const accounts = NAMES.concat(NAMES.map((n, i) => `${n} ${i + 2}`)).map((name, i) => ({
  id: `a-${i + 1}`,
  name,
  phone: `05${(10000000 + i * 7919311) % 100000000}`.slice(0, 10),
  locationPretty: CITIES[i % CITIES.length],
  coins: [1240, 80, 615, 20, 0, 340, 55, 900][i % 8],
  verified: i % 3 !== 1 && i !== 2,
  verificationRequestedAt: i === 2 || i === 4 || i === 10 ? ago((i + 1) * 3 * HOUR) : null,
  isAnonymous: i % 17 === 16,
  isSeller: i < 4 || i % 5 === 0,
  createdAt: ago((i + 1) * 9 * DAY),
  acceptedTermsAndCondition: true,
  rating: 4 + ((i * 3) % 10) / 10,
}));

const TITLES = [
  ['تويوتا لاندكروزر GXR 2021', 'c-cars', 'c-toyota', 92000],
  ['رولكس صبمارينر 2022', 'c-watches', 'c-rolex', 41500],
  ['هيونداي سوناتا 2022', 'c-cars', 'c-toyota', 58500],
  ['آيفون 16 برو ماكس 1TB', 'c-electronics', 'c-phones', 4250],
  ['فورد برونكو 2023 بادلاندز', 'c-cars', 'c-ford', 189000],
  ['طقم ذهب عيار 21', 'c-jewelry', 'c-gold', 12800],
  ['لوحة مميزة ر س ع 7', 'c-plates', null, 26000],
  ['رافعة شوكية تويوتا 3 طن', 'c-cars', 'c-toyota', 36000],
  ['أوميغا سبيدماستر مون ووتش', 'c-watches', 'c-omega', 17200],
  ['أرض سكنية 600م² حي النرجس', 'c-realestate', 'c-land', 820000],
  ['كارتييه سانتوس 2020', 'c-watches', 'c-omega', 14200],
  ['دلة نحاسية قديمة', 'c-antiques', null, 3400],
  ['شفروليه كابريس 1990', 'c-cars', 'c-ford', 48000],
  ['خاتم ألماس 1.2 قيراط', 'c-jewelry', 'c-gold', 26900],
  ['لكزس LX570 2022', 'c-cars', 'c-lexus', 120000],
];

const STATUS_PLAN = [
  ...Array(4).fill('PENDING_REVIEW'), ...Array(6).fill('CHANGES_REQUESTED'), ...Array(9).fill('APPROVED'),
  ...Array(12).fill('SCHEDULED'), ...Array(60).fill('LIVE'), ...Array(32).fill('CLOSED'),
  ...Array(8).fill('REJECTED'), ...Array(5).fill('CANCELLED'), ...Array(14).fill('DRAFT'),
];

const PENDING_FIRST = [14, 1, 13, 9];

export const auctions = STATUS_PLAN.map((status, i) => {
  const pick = i < 4 ? PENDING_FIRST[i] : (i * 7) % TITLES.length;
  const [title, mainCategoryId, subCategoryId, price] = TITLES[pick];
  const live = status === 'LIVE' || status === 'CLOSED';
  const sellerIdx = pick % 4 === 0 ? 0 : pick % 4;
  return {
    id: `MZ-${10500 + i}`,
    accountId: `a-${sellerIdx + 1}`,
    title,
    description: 'الحالة جيدة، مع كامل المرفقات. المعاينة متاحة قبل المزاد.',
    mainCategoryId,
    subCategoryId,
    locationPretty: CITIES[pick % CITIES.length],
    startingPrice: price,
    lastPrice: live ? Math.round(price * (1 + ((i * 13) % 20) / 100)) : null,
    minBidIncrement: price > 100000 ? 1000 : price > 10000 ? 500 : 100,
    views: status === 'DRAFT' || status === 'PENDING_REVIEW' ? 0 : 120 + ((i * 337) % 3000),
    isNewItem: pick % 3 === 0,
    carModel: mainCategoryId === 'c-cars' ? String(2018 + (pick % 6)) : null,
    mileage: mainCategoryId === 'c-cars' ? 12000 + pick * 3100 : null,
    serialNumber: mainCategoryId === 'c-cars' ? `JTJ${100000 + pick * 4821}` : null,
    status,
    statusReason: status === 'REJECTED' ? 'الصور غير مطابقة للوصف' : status === 'CHANGES_REQUESTED' ? 'يلزم توضيح حالة المنتج' : null,
    submittedAt: status === 'DRAFT' ? null : ago((i + 1) * 40 * MIN),
    reviewedAt: ['APPROVED', 'SCHEDULED', 'LIVE', 'CLOSED', 'REJECTED', 'CHANGES_REQUESTED'].includes(status) ? ago((i + 1) * 30 * MIN) : null,
    reviewedBy: ['APPROVED', 'SCHEDULED', 'LIVE', 'CLOSED', 'REJECTED', 'CHANGES_REQUESTED'].includes(status) ? 'المشرف' : null,
    expiresAt: NOW + ((i % 9) + 1) * 8 * HOUR * (status === 'CLOSED' ? -1 : 1),
    createdAt: ago((i + 1) * 3 * HOUR),
    resubmitted: i === 2,
    history: [],
  };
});

auctions.forEach((a) => {
  a.history.push({ type: 'STATUS_CHANGE', text: 'أُنشئت المسودة', by: 'البائع', at: a.createdAt });
  if (a.submittedAt) a.history.push({ type: 'STATUS_CHANGE', text: 'قُدّم للمراجعة', by: 'البائع', at: a.submittedAt });
  if (a.reviewedAt) a.history.push({ type: 'STATUS_CHANGE', text: a.status === 'REJECTED' ? 'رُفض من المشرف' : a.status === 'CHANGES_REQUESTED' ? 'طُلب تعديل من البائع' : 'اعتماد من المشرف', by: 'المشرف', at: a.reviewedAt });
});

const BID_STATUS = ['open', 'open', 'open', 'accepted', 'rejected'];
export const bids = Array.from({ length: 160 }, (_, i) => {
  const a = auctions.filter((x) => x.lastPrice)[i % 90 % auctions.filter((x) => x.lastPrice).length];
  const status = BID_STATUS[i % BID_STATUS.length];
  return {
    id: `b-${i + 1}`,
    auctionId: a.id,
    auctionTitle: a.title,
    bidderId: `a-${(i * 3) % accounts.length + 1}`,
    bidderName: `مزايد #${4821 - i * 7}`,
    price: Math.round(a.lastPrice * (1 - (i % 6) * 0.01)),
    locationPretty: CITIES[(i * 2) % CITIES.length],
    status,
    rejectionReason: status === 'rejected' ? 'السعر منخفض' : null,
    paidCoins: 5,
    coinsPaidBack: status === 'rejected',
    createdAt: ago((i + 1) * 17 * MIN),
  };
});

const PACKS = [[500, 5, 'App Store'], [2000, 18, 'Stripe'], [5000, 40, 'Google Play'], [500, 5, 'PayPal'], [2000, 18, 'Razorpay']];
export const payments = Array.from({ length: 64 }, (_, i) => {
  const [coins, usd, store] = PACKS[i % PACKS.length];
  const amount = Math.round(usd * 3.75 * 100) / 100;
  const vat = Math.round(amount * 15) / 100;
  return {
    id: `p-${i + 1}`,
    number: 1127 - i,
    accountId: `a-${(i * 5) % accounts.length + 1}`,
    name: accounts[(i * 5) % accounts.length].name,
    boughtPackage: `${coins} عملة`,
    coins,
    currency: 'SAR',
    amount,
    vatRate: 15,
    vatAmount: vat,
    totalAmount: Math.round((amount + vat) * 100) / 100,
    store,
    transactionId: `${['2000', 'pi_3Q', 'GPA.33', '5T', 'pay_'][i % 5]}•••${(41872 - i * 137) % 99999}`,
    purchasedAt: ago((i + 1) * 5 * HOUR + i * 7 * MIN),
  };
});

export const reports = [
  ['محتوى مضلّل', 'auction', 'رولكس صبمارينر 2022', 'الساعة في الصور تختلف عن المذكورة في الوصف، والرقم التسلسلي غير واضح.'],
  ['إساءة', 'comment', 'تعليق على: فورد برونكو 2023', 'عبارات مسيئة في التعليق.'],
  ['احتيال', 'account', 'مزايد #3307', 'يطلب التواصل خارج المنصة قبل نهاية المزاد.'],
  ['منتج محظور', 'auction', 'دلة نحاسية قديمة', 'المنتج غير مسموح ببيعه.'],
  ['محتوى مكرر', 'auction', 'طقم ذهب عيار 21', 'المزاد منشور أكثر من مرة.'],
  ['إساءة', 'account', 'سعود 22', 'رسائل مزعجة متكررة.'],
].map(([reason, entityName, target, description], i) => ({
  id: `RP-${318 - i}`, reason, entityName, target, description,
  reportedBy: `مزايد #${4821 - i * 211}`, createdAt: ago((i + 1) * 5 * HOUR),
}));

export const reviews = Array.from({ length: 36 }, (_, i) => ({
  id: `r-${i + 1}`,
  stars: [5, 5, 4, 5, 3, 4, 2, 5][i % 8],
  description: ['مطابق للوصف تماماً، والتسليم في اليوم نفسه.', 'حالة ممتازة، وتأخر الاستلام يوماً واحداً.', 'التعامل واضح وسرعة في الرد.', 'الجهاز مختلف عن الصور.'][i % 4],
  from: `مزايد #${4821 - i * 13}`,
  to: NAMES[i % 4],
  toId: `a-${(i % 4) + 1}`,
  auctionTitle: TITLES[(i * 3) % TITLES.length][0],
  createdAt: ago((i + 1) * 2 * DAY),
}));

export const messages = [
  ['سعود', 'لم يصلني رمز التحقق عند تسجيل الدخول.', false], ['متجر التقنية', 'أرغب في توثيق حساب تجاري.', false],
  ['مزايد #4821', 'كيف أسترجع عملاتي بعد رفض مزايدتي؟', true], ['نورة', 'لا تظهر صوري في المزاد.', false],
  ['فهد', 'أريد تغيير رقم الجوال.', false], ['خالد', 'تأخر إشعار قبول العرض.', true],
  ['مها', 'كيف أحذف حسابي؟', false], ['ريم', 'شكراً على الدعم.', true],
].map(([name, message, solved], i) => ({ id: `m-${i + 1}`, name, accountId: `a-${i + 5}`, message, solved, createdAt: ago((i + 1) * 3 * HOUR) }));

export const notificationTypes = [
  ['NEW_BID_ON_AUCTION', 'مزايدة جديدة على مزادك', 'مزايدة جديدة', 'تلقّى مزادك «{auction}» مزايدة بقيمة {price}.', 'New bid'],
  ['BID_ACCEPTED_ON_AUCTION', 'قبول مزايدتك', 'تم قبول مزايدتك', 'قبل البائع مزايدتك على «{auction}».', 'Bid accepted'],
  ['BID_REJECTED_ON_AUCTION', 'رفض مزايدتك', 'تم رفض مزايدتك', 'رفض البائع مزايدتك على «{auction}».', 'Bid rejected'],
  ['ACCOUNT_VERIFIED', 'توثيق الحساب', 'تم توثيق حسابك', 'أصبح حسابك موثّقاً ويمكنك المزايدة.', 'Account verified'],
  ['MY_AUCTION_STARTED', 'بدء مزادك', 'بدأ مزادك', 'بدأ مزادك «{auction}» ويستقبل المزايدات.', 'Auction started'],
  ['AUCTION_UPDATED', 'تعديل مزاد', 'تم تعديل المزاد', 'عُدّل المزاد «{auction}».', 'Auction updated'],
  ['REVIEW_RECEIVED', 'تقييم جديد', 'تقييم جديد', 'حصلتَ على تقييم جديد.', 'New review'],
  ['NEW_MESSAGE', 'رسالة جديدة', 'رسالة جديدة', 'وصلتك رسالة جديدة.', 'New message'],
  ['NEW_FOLLOWER', 'متابع جديد', 'متابع جديد', 'بدأ {name} بمتابعتك.', 'New follower'],
  ['SYSTEM', 'إشعار من النظام', 'إشعار من المنصة', '{text}', 'System notice'],
].map(([type, label, title, description, en]) => ({ type, label, title, description, titleEn: en }));

export const notificationLog = Array.from({ length: 45 }, (_, i) => {
  const t = notificationTypes[i % notificationTypes.length];
  return { id: `n-${i + 1}`, type: t.type, title: t.title, account: i % 7 === 6 ? 'جميع الحسابات' : accounts[i % accounts.length].name, accountId: `a-${i % accounts.length + 1}`, read: i % 3 === 0, createdAt: ago((i + 1) * 70 * MIN) };
});

export const ads = [
  { id: 'ad-1', title: 'مزاد ساحة الشمال', placement: 'أعلى الصفحة الرئيسية', linkUrl: '/events/north-yard', enabled: true, sortOrder: 1, startsAt: '2026-11-20', endsAt: '2026-11-30' },
  { id: 'ad-2', title: 'ساعات فاخرة', placement: 'وسط الصفحة الرئيسية', linkUrl: '/events/luxury-watches', enabled: true, sortOrder: 2, startsAt: '', endsAt: '' },
  { id: 'ad-3', title: 'عرض الجمعة البيضاء', placement: 'صفحة البحث', linkUrl: '/search?sale=1', enabled: false, sortOrder: 1, startsAt: '2026-11-25', endsAt: '2026-11-29' },
];
export const adPlacements = ['أعلى الصفحة الرئيسية', 'وسط الصفحة الرئيسية', 'صفحة البحث', 'صفحة المزاد'];

export const packages = [
  { id: 'k-1', coinsNo: 500, priceInUSD: 5 },
  { id: 'k-2', coinsNo: 2000, priceInUSD: 18 },
  { id: 'k-3', coinsNo: 5000, priceInUSD: 40 },
];

export const currencies = [
  { id: 'cur-1', code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', isDefault: true },
  { id: 'cur-2', code: 'USD', symbol: '$', name: 'دولار أمريكي', isDefault: false },
  { id: 'cur-3', code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', isDefault: false },
];
export const exchangeRates = { ratesDate: NOW - 6 * HOUR, rows: [['1 USD', 'SAR', 3.75], ['1 USD', 'AED', 3.6725], ['1 SAR', 'AED', 0.9793]] };

export const savedFilters = Array.from({ length: 14 }, (_, i) => ({ id: `f-${i + 1}`, name: ['سيارات تحت 100 ألف', 'ساعات في جدة', 'ذهب عيار 21', 'جوالات جديدة'][i % 4], type: 'مزادات', account: accounts[i + 4].name, data: JSON.stringify([{ cat: 'cars', max: 100000 }, { cat: 'watches', city: 'jeddah' }, { cat: 'gold' }, { cat: 'phones', isNew: true }][i % 4]) }));
export const searchHistory = Array.from({ length: 24 }, (_, i) => ({ id: `s-${i + 1}`, searchKey: ['لاندكروزر', 'رولكس', 'ذهب', 'آيفون', 'أرض', 'برونكو'][i % 6], type: 'بحث', account: accounts[i % accounts.length].name, createdAt: ago((i + 1) * 95 * MIN) }));

export const media = Array.from({ length: 48 }, (_, i) => ({ id: `as-${i + 1}`, initialName: `${['IMG', 'car', 'watch', 'ring', 'land'][i % 5]}_${4821 + i}.${['jpg', 'png', 'webp'][i % 3]}`, path: `/uploads/2026/11/${4821 + i}.jpg`, size: 180000 + ((i * 91357) % 1900000) }));

export const settings = {
  appName: 'مزادي', webAppUrl: 'https://mazadi.example', defaultCurrency: 'ريال سعودي (SAR)',
  allowMultipleCurrencies: false, adsEnabledOnAndroid: true, adsEnabledOnIOS: true,
  auctionActiveTimeInHours: 168, maxProductPrice: 1000000, maxAllowedDistanceBetweenUsersInKM: 500,
  automaticallyAcceptBidOnAuctionClose: true,
  freeAuctionsCount: 3, freeBidsCount: 10, auctionsCoinsCost: 20, bidsCoinsCost: 5, promotionCoinsCost: 50, rewardCoinsForWatchingAd: 2,
  allowUnvalidatedUsersToCreateAuctions: false, allowUnvalidatedUsersToCreateBids: false,
  allowAnonymousUsersToCreateAuctions: false, allowAnonymousUsersToCreateBids: false,
  allowValidationRequest: true, emailValidationEnabled: true,
};

export const auditLog = [
  ['اعتماد مزاد', 'good', 'فورد برونكو 2023', '—', 20],
  ['طلب تعديل', 'warn', 'خاتم ألماس 1.2 قيراط', 'صور غير واضحة', 90],
  ['توثيق حساب', 'good', 'دار الساعات', '—', 600],
  ['تعديل إعدادات', 'info', 'تكلفة المزايدة', 'من 3 إلى 5', 1300],
  ['حذف', 'bad', 'فلتر محفوظ', '—', 2500],
  ['رفض مزاد', 'bad', 'دلة نحاسية قديمة', 'المنتج غير مسموح', 3000],
].map(([action, tone, target, details, m], i) => ({ id: `au-${i}`, action, tone, target, details, admin: 'المشرف', at: ago(m * MIN) }));

export const events = [
  ['STATUS_CHANGE', 'تغيّر الحالة', 'info', 'لكزس LX570 2022', 'من «مسودة» إلى «بانتظار المراجعة»', 12],
  ['PLACE_BID', 'مزايدة', 'good', 'رولكس صبمارينر 2022', 'مزايدة جديدة بقيمة 41,500 ر.س', 20],
  ['STATUS_CHANGE', 'تغيّر الحالة', 'info', 'فورد برونكو 2023', 'اعتماد من المشرف', 60],
  ['ACCEPT_BID', 'قبول عرض', 'good', 'طقم ذهب عيار 21', 'قبل البائع أعلى عرض', 180],
  ['COINS_REFUNDED', 'استرداد عملات', 'warn', 'أرض سكنية 600م²', 'أُعيدت العملات للبائع', 1500],
].map(([type, label, tone, target, text, m]) => ({ type, label, tone, target, text, at: ago(m * MIN) }));

export const monthly = {
  accounts: [310, 380, 420, 510, 640, 590, 720, 810, 930, 1100, 1260],
  auctions: [22, 30, 41, 48, 63, 59, 77, 90, 118, 140, 168],
  bids: [120, 180, 260, 310, 420, 380, 510, 640, 720, 890, 960],
  payments: [40, 52, 66, 80, 104, 97, 120, 138, 160, 190, 214],
};
export const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر'];

// A few live auctions that end soon, so the countdowns have something to show.
auctions.filter((a) => a.status === 'LIVE').slice(0, 3).forEach((a, i) => {
  a.expiresAt = NOW + [11 * MIN + 2000, 21 * MIN + 14000, 47 * MIN + 30000][i];
});
