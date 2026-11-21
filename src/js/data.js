const unsplash = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop`;

export const categories = ['الكل', 'سيارات', 'ساعات', 'جوالات وإلكترونيات', 'مجوهرات', 'عقارات', 'معدات', 'تحف ومقتنيات', 'لوحات مميزة'];

export const categoryTiles = [
  { cat: 1, count: 64, img: unsplash('1674829300996-1ca6f9977fd7', 400) },
  { cat: 2, count: 31, img: unsplash('1730757679771-b53e798846cf', 400) },
  { cat: 3, count: 38, img: unsplash('1592750475338-74b7b21085ab', 400) },
  { cat: 4, count: 22, img: unsplash('1650455221359-3aebf920bcc5', 400) },
  { cat: 5, count: 12, img: unsplash('1694018359679-49465b4c0d61', 400) },
  { cat: 6, count: 19, img: unsplash('1740914994657-f1cdffdc418e', 400) },
  { cat: 7, count: 28, img: unsplash('1564624171349-46ed471bf4e3', 400) },
  { cat: 8, count: 15, img: unsplash('1758798219572-512a03a60ce0', 400) },
];

export const featured = [
  { event: 'north-yard', tag: 'الليلة 8:00م', tone: 'accent', title: 'مزاد سيارات ساحة الشمال · 42 سيارة', meta: 'معاينة من 4 إلى 7 مساءً · الرياض', img: unsplash('1638835373951-3a67da7aaf8d', 1400), large: true },
  { event: 'luxury-watches', tag: 'ينتهي الخميس', tone: 'primary', title: 'ساعات فاخرة', meta: '53 قطعة موثّقة', img: unsplash('1639006570490-79c0c53f1080', 900), large: false },
];

/** endsIn: seconds remaining when the page loads. order: listing order for «المضاف حديثاً». */
export const lots = [
  { id: 0, cat: 1, name: 'تويوتا لاندكروزر GXR 2021', sub: 'V6، كامل المواصفات، صيانة لدى الوكيل، دون حوادث', city: 'الرياض', bid: 92000, endsIn: 4 * 3600 + 272, noReserve: false, img: unsplash('1650530579355-7ad9d4766043') },
  { id: 1, cat: 2, name: 'رولكس صبمارينر 2022', sub: 'كامل المرفقات والضمان، حالة ممتازة', city: 'جدة', bid: 41500, endsIn: 1260, noReserve: false, img: unsplash('1547996160-81dfa63595aa') },
  { id: 2, cat: 1, name: 'هيونداي سوناتا 2022', sub: '41 ألف كم، لون أبيض، سعودي', city: 'الدمام', bid: 58500, endsIn: 2 * 86400, noReserve: true, img: unsplash('1523394397008-7c076b65a890') },
  { id: 3, cat: 3, name: 'آيفون 16 برو ماكس 1TB', sub: 'جديد مختوم، ضمان سنة', city: 'الرياض', bid: 4250, endsIn: 3400, noReserve: true, img: unsplash('1523206489230-c012c64b2b48') },
  { id: 4, cat: 1, name: 'فورد برونكو 2023 بادلاندز', sub: '18 ألف كم، تعديلات مصنع', city: 'الخبر', bid: 189000, endsIn: 86400 + 7200, noReserve: false, img: unsplash('1610064094665-57e727e29f8b') },
  { id: 5, cat: 4, name: 'طقم ذهب عيار 21', sub: '86 غرام مع الفاتورة', city: 'جدة', bid: 12800, endsIn: 640, noReserve: true, img: unsplash('1631982690223-8aa4be0a2497') },
  { id: 6, cat: 8, name: 'لوحة مميزة ر س ع 7', sub: 'رقم ثلاثي، نقل فوري عبر أبشر', city: 'الرياض', bid: 26000, endsIn: 5 * 3600, noReserve: false, img: unsplash('1654688554491-69d21d38fb91') },
  { id: 7, cat: 6, name: 'رافعة شوكية تويوتا 3 طن', sub: '2018، 4,200 ساعة تشغيل', city: 'الدمام', bid: 36000, endsIn: 3 * 86400, noReserve: true, img: unsplash('1740914994657-f1cdffdc418e') },
  { id: 8, cat: 2, name: 'أوميغا سبيدماستر مون ووتش', sub: '2021، كامل المرفقات', city: 'الرياض', bid: 17200, endsIn: 9000, noReserve: false, img: unsplash('1662384197911-e82189f4dc60') },
  { id: 9, cat: 5, name: 'أرض سكنية 600م² حي النرجس', sub: 'صك إلكتروني، على شارعين', city: 'الرياض', bid: 820000, endsIn: 4 * 86400, noReserve: false, img: unsplash('1586724237569-f3d0c1dee8c6') },
  { id: 10, cat: 2, name: 'كارتييه سانتوس 2020', sub: 'مقاس كبير، كامل المرفقات', city: 'جدة', bid: 14200, endsIn: 3 * 86400 + 5400, noReserve: false, img: unsplash('1670404160620-a3a86428560e', 1200) },
  { id: 11, cat: 7, name: 'دلة نحاسية قديمة', sub: 'صناعة يدوية، حالة جيدة', city: 'الأحساء', bid: 3400, endsIn: 2 * 86400 + 3600, noReserve: true, img: unsplash('1564624171349-46ed471bf4e3', 1200) },
  { id: 12, cat: 1, name: 'شفروليه كابريس 1990', sub: 'كلاسيك، 210 ألف كم، محرك أصلي', city: 'الرياض', bid: 48000, endsIn: 6 * 3600, noReserve: false, img: unsplash('1491422433900-4e19887b7b21', 1200) },
  { id: 13, cat: 4, name: 'خاتم ألماس 1.2 قيراط', sub: 'ذهب أبيض عيار 18، شهادة GIA', city: 'جدة', bid: 26900, endsIn: 86400 + 1800, noReserve: false, img: unsplash('1617038220319-276d3cfab638', 1200) },
  { id: 14, cat: 8, name: 'لوحة أ أ أ 1', sub: 'رقم أحادي، نقل فوري عبر أبشر', city: 'الرياض', bid: 155000, endsIn: 5 * 86400, noReserve: false, img: unsplash('1663900108404-a05e8bf82cda', 1200) },
];

/** One-line intro shown on each category page. */
export const categoryIntros = {
  1: 'سيارات مستعملة وكلاسيكية من معارض وأفراد موثّقين، مع تقرير فحص قبل المزاد.',
  2: 'ساعات فاخرة بشهادات أصالة، من رولكس وأوميغا وكارتييه.',
  3: 'جوالات وأجهزة إلكترونية جديدة ومستعملة مع الضمان.',
  4: 'ذهب وألماس بفواتير وشهادات معتمدة.',
  5: 'أراضٍ وعقارات بصكوك إلكترونية في مدن المملكة.',
  6: 'معدات ثقيلة وآليات بساعات تشغيل موثّقة.',
  7: 'تحف ومقتنيات تراثية ونادرة.',
  8: 'لوحات سيارات مميزة تُنقل فوراً عبر أبشر.',
};

/** Extra words people type for each category (singular forms, common brands), used by search. */
export const categoryKeywords = {
  1: 'سيارة سيارات مركبة',
  2: 'ساعة ساعات',
  3: 'جوال جوالات هاتف موبايل ايفون الكترونيات',
  4: 'ذهب مجوهرات الماس خاتم',
  5: 'ارض اراضي عقار عقارات',
  6: 'معدات معدة رافعة',
  7: 'تحف تحفة مقتنيات تراث',
  8: 'لوحة لوحات رقم مميز',
};

/** Lot number shown on the lot page and searchable from the header. */
export const lotNumber = (lot) => lotDetails[lot.id]?.lotNo ?? `MZ-${10500 + lot.id}`;

export const sponsoredLot = {
  name: 'تمويل سيارتك من بنك شريك',
  sub: 'قسّط مشترياتك من المزاد حتى 60 شهر',
  img: unsplash('1603094543704-64cdce2d2532'),
};

export const sortTabs = ['ينتهي قريباً', 'المضاف حديثاً', 'الأقل سعراً', 'بدون حد أدنى'];

export const picks = [
  { id: 10, cat: 'ساعات', name: 'كارتييه سانتوس 2020', bid: 14200, img: unsplash('1670404160620-a3a86428560e', 600) },
  { id: 11, cat: 'تحف ومقتنيات', name: 'دلة نحاسية قديمة', bid: 3400, img: unsplash('1564624171349-46ed471bf4e3', 600) },
  { id: 12, cat: 'سيارات', name: 'شفروليه كابريس 1990', bid: 48000, img: unsplash('1491422433900-4e19887b7b21', 600) },
  { id: 13, cat: 'مجوهرات', name: 'خاتم ألماس 1.2 قيراط', bid: 26900, img: unsplash('1617038220319-276d3cfab638', 600) },
  { id: 14, cat: 'لوحات مميزة', name: 'لوحة أ أ أ 1', bid: 155000, img: unsplash('1663900108404-a05e8bf82cda', 600) },
];

export const trust = [
  { title: 'هوية موثّقة بنفاذ', text: 'كل مزايد وبائع متحقق منه قبل أول مزايدة.' },
  { title: 'فحص قبل المزاد', text: 'تقرير فحص معتمد لكل سيارة وشهادة أصالة للساعات والمجوهرات.' },
  { title: 'أموالك محمية', text: 'يبقى المبلغ لدينا حتى تستلم المنتج.' },
  { title: 'ادفع بالطريقة التي تناسبك', text: 'مدى، Apple Pay، أو قسّط مع تابي وتمارا.' },
];

export const ads = {
  leaderboard: unsplash('1784637729389-f24e1d2a8b22', 1600),
  mid: [unsplash('1757774698963-b23f4b273adc', 1600), unsplash('1511707171634-5f897ff02aa9', 1600)],
  sell: unsplash('1554841649-de947c4b954a', 1400),
};

export const initialWatchlist = [1, 4];

/** Extra detail for the lot page. Lots without an entry get generic details built in lot.js. */
export const lotDetails = {
  0: {
    lotNo: 'MZ-10482',
    bids: 18,
    startBid: 60000,
    reserveMet: true,
    watchers: 126,
    gallery: 6,
    specs: [
      ['سنة الصنع', '2021'],
      ['الممشى', '64,000 كم'],
      ['المحرك', 'V6 سعة 4.0 لتر'],
      ['ناقل الحركة', 'أوتوماتيك'],
      ['الوقود', 'بنزين'],
      ['اللون', 'أبيض لؤلؤي'],
      ['الوارد', 'سعودي · عبداللطيف جميل'],
      ['عدد الملاك', 'مالك واحد'],
      ['رقم الهيكل', 'JTMHV05J•••••4821'],
    ],
    inspection: {
      by: 'مركز فحص معتمد',
      date: '18 نوفمبر 2026',
      items: [
        { part: 'المحرك', ok: true, note: 'سليم، بدون تسريبات' },
        { part: 'ناقل الحركة', ok: true, note: 'تبديل سلس' },
        { part: 'الهيكل', ok: true, note: 'خالٍ من الحوادث وإعادة الطلاء' },
        { part: 'المكيف', ok: true, note: 'يعمل بكفاءة' },
        { part: 'الإطارات', ok: false, note: 'تحتاج تغيير خلال 5,000 كم' },
        { part: 'المصد الأمامي', ok: false, note: 'خدوش سطحية' },
      ],
    },
    description: 'لاندكروزر GXR موديل 2021 كامل المواصفات، صيانة دورية لدى الوكيل وسجل الصيانة متوفر. السيارة نظيفة من الداخل والخارج، بدون حوادث. تُسلَّم مع مفتاحين واستمارة سارية وتأمين حتى مارس 2027.',
    viewing: { place: 'ساحة الشمال، طريق الملك فهد، الرياض', times: 'يومياً من 4 إلى 7 مساءً حتى انتهاء المزاد' },
  },
};

/** Lots the signed-in visitor has won (prototype examples). dueIn: seconds left to pay when the page loads. */
export const wonLots = [
  { id: 13, price: 26900, deposit: 1300, dueIn: 2 * 86400 + 5 * 3600 },
  { id: 11, price: 3400, deposit: 500, deliveredOn: '12 نوفمبر 2026' },
];

/** Categories that can be shipped; the rest are picked up or transferred (cars, land, equipment, plates). */
export const shippableCats = [2, 3, 4, 7];

/** Scheduled auction events shown on the home page's featured cards. startsAt: hour of day (live yard auction) or endsInDays (online). */
export const events = {
  'north-yard': {
    title: 'مزاد سيارات ساحة الشمال',
    type: 'حضوري وإلكتروني',
    city: 'الرياض',
    count: 42,
    unit: 'سيارة',
    cat: 1,
    startHour: 20,
    place: 'ساحة الشمال، طريق الملك فهد، الرياض',
    mapQuery: 'طريق الملك فهد الرياض',
    viewing: 'اليوم من 4 إلى 7 مساءً',
    deposit: 5000,
    lots: [0, 12, 4, 2],
    img: 'https://images.unsplash.com/photo-1638835373951-3a67da7aaf8d?w=1400&q=70&auto=format&fit=crop',
  },
  'luxury-watches': {
    title: 'مزاد الساعات الفاخرة',
    type: 'إلكتروني',
    city: 'جدة',
    count: 53,
    unit: 'قطعة',
    cat: 2,
    endsInDays: 4,
    place: 'مستودع مزادي، حي الروضة، جدة',
    mapQuery: 'حي الروضة جدة',
    viewing: 'بموعد مسبق من الأحد إلى الأربعاء',
    deposit: 1000,
    lots: [1, 8, 10],
    img: 'https://images.unsplash.com/photo-1639006570490-79c0c53f1080?w=1400&q=70&auto=format&fit=crop',
  },
  'premium-plates': {
    title: 'مزاد اللوحات المميزة', type: 'إلكتروني', city: 'الرياض', count: 15, unit: 'لوحة', cat: 8,
    startDay: 1, startHour: 21, place: 'إلكتروني عبر مزادي', mapQuery: 'الرياض', viewing: 'لا تتطلب معاينة',
    deposit: 2000, lots: [6, 14], img: unsplash('1758798219572-512a03a60ce0', 1400),
  },
  'dammam-equipment': {
    title: 'مزاد المعدات الثقيلة', type: 'حضوري وإلكتروني', city: 'الدمام', count: 28, unit: 'معدة', cat: 6,
    startDay: 2, startHour: 17, place: 'ساحة المعدات، المنطقة الصناعية الثانية، الدمام', mapQuery: 'المنطقة الصناعية الثانية الدمام',
    viewing: 'يومياً من 8 صباحاً إلى 4 عصراً', deposit: 5000, lots: [7], img: unsplash('1740914994657-f1cdffdc418e', 1400),
  },
  heritage: {
    title: 'مزاد التحف والمقتنيات', type: 'إلكتروني', city: 'جدة', count: 28, unit: 'قطعة', cat: 7,
    startDay: 3, startHour: 20, place: 'مستودع مزادي، حي الروضة، جدة', mapQuery: 'حي الروضة جدة',
    viewing: 'بموعد مسبق', deposit: 500, lots: [11], img: unsplash('1564624171349-46ed471bf4e3', 1400),
  },
  'riyadh-land': {
    title: 'مزاد أراضي شمال الرياض', type: 'حضوري', city: 'الرياض', count: 12, unit: 'أرض', cat: 5,
    startDay: 5, startHour: 19, place: 'قاعة المزادات، طريق أنس بن مالك، الرياض', mapQuery: 'طريق أنس بن مالك الرياض',
    viewing: 'زيارة المواقع بالتنسيق مع فريق مزادي', deposit: 10000, lots: [9], img: unsplash('1694018359679-49465b4c0d61', 1400),
  },
};

/** Hours a yard auction stays live after it starts. */
const LIVE_HOURS = 3;

/**
 * When an event happens relative to `now`: { start, end, live, label }.
 * Online events with `endsInDays` are running already; scheduled ones start on `startDay` (0 = today) at `startHour`.
 */
export function eventTiming(ev, now = new Date(), loadedAt = now.getTime()) {
  if (ev.endsInDays) {
    const end = loadedAt + ev.endsInDays * 86400000;
    return { start: loadedAt, end, live: true, label: 'ينتهي خلال', target: end };
  }
  const start = new Date(now);
  start.setDate(start.getDate() + (ev.startDay ?? 0));
  start.setHours(ev.startHour, 0, 0, 0);
  if (!ev.startDay && now - start > LIVE_HOURS * 3600000) start.setDate(start.getDate() + 1);
  const live = now >= start;
  return { start: start.getTime(), end: start.getTime() + LIVE_HOURS * 3600000, live, label: live ? 'مباشر الآن' : 'يبدأ خلال', target: start.getTime() };
}

/** Seller profiles. Each lot belongs to the seller whose `lots` lists it; others belong to `mazad-verified`. */
export const sellers = {
  alwafa: {
    name: 'معرض الوفاء للسيارات', city: 'الرياض', since: 2022, deals: 214, rating: 4.8, match: 98, reply: 'خلال ساعة',
    lots: [0, 2, 4, 12],
    sold: [
      { name: 'نيسان باترول 2020', price: 118000, date: '2 نوفمبر 2026' },
      { name: 'لكزس LX570 2019', price: 205000, date: '24 أكتوبر 2026' },
      { name: 'تويوتا كامري 2022', price: 71500, date: '15 أكتوبر 2026' },
    ],
    stars: [104, 20, 5, 2, 1],
    reviews: [
      { stars: 5, text: 'السيارة مطابقة للوصف تماماً، والتسليم ونقل الملكية تمّا في اليوم نفسه.', who: 'مشترٍ من الرياض', item: 'نيسان باترول 2020', date: '5 نوفمبر 2026' },
      { stars: 5, text: 'تعامل واضح وسرعة في الرد على الاستفسارات قبل المزاد.', who: 'مشترٍ من الدمام', item: 'لكزس LX570 2019', date: '27 أكتوبر 2026' },
      { stars: 4, text: 'حالة السيارة ممتازة، وتأخر موعد الاستلام يوماً واحداً.', who: 'مشترٍ من القصيم', item: 'تويوتا كامري 2022', date: '18 أكتوبر 2026' },
    ],
  },
  'watch-house': {
    name: 'دار الساعات', city: 'جدة', since: 2021, deals: 96, rating: 4.9, match: 99, reply: 'خلال ساعتين',
    lots: [1, 8, 10, 13, 5],
    sold: [
      { name: 'رولكس داي جست 2019', price: 38500, date: '30 أكتوبر 2026' },
      { name: 'تاغ هوير كاريرا 2021', price: 9800, date: '19 أكتوبر 2026' },
    ],
    stars: [71, 6, 1, 0, 0],
    reviews: [
      { stars: 5, text: 'الساعة أصلية مع شهادتها، ووصلت مغلفة بعناية.', who: 'مشترٍ من جدة', item: 'رولكس داي جست 2019', date: '2 نوفمبر 2026' },
      { stars: 5, text: 'الوصف دقيق والصور واضحة.', who: 'مشترٍ من الرياض', item: 'تاغ هوير كاريرا 2021', date: '22 أكتوبر 2026' },
    ],
  },
  'mazad-verified': {
    name: 'بائع موثّق', city: 'الرياض', since: 2023, deals: 37, rating: 4.6, match: 96, reply: 'خلال يوم',
    lots: [],
    sold: [{ name: 'جالكسي S24 ألترا', price: 3100, date: '8 نوفمبر 2026' }],
    stars: [20, 6, 2, 1, 0],
    reviews: [
      { stars: 5, text: 'الجهاز كما في الوصف، والتوصيل سريع.', who: 'مشترٍ من الخبر', item: 'جالكسي S24 ألترا', date: '11 نوفمبر 2026' },
    ],
  },
};

/** Id of the seller of a lot. */
export const sellerIdOf = (lot) => Object.keys(sellers).find((k) => sellers[k].lots.includes(lot.id)) ?? 'mazad-verified';

/** Full inspection reports by lot id (the lot page shows the short version from lotDetails). */
export const inspectionReports = {
  0: {
    no: 'IR-58213',
    center: 'مركز فحص معتمد',
    date: '18 نوفمبر 2026',
    km: 64000,
    score: 92,
    sections: [
      { title: 'المحرك وناقل الحركة', items: [
        ['المحرك', 'ok', 'يعمل بسلاسة، دون تسريبات أو أصوات غير طبيعية'],
        ['ناقل الحركة', 'ok', 'تبديل سلس في جميع السرعات'],
        ['نظام التبريد', 'ok', 'مستوى السائل سليم'],
        ['العادم', 'ok', 'دون دخان أو تسريب'],
      ] },
      { title: 'الهيكل والطلاء', items: [
        ['الهيكل الأساسي', 'ok', 'سليم، دون آثار حوادث'],
        ['الطلاء', 'ok', 'أصلي في جميع الأجزاء'],
        ['المصد الأمامي', 'note', 'خدوش سطحية لا تؤثر على السلامة'],
        ['الزجاج والمرايا', 'ok', 'سليمة'],
      ] },
      { title: 'الإطارات والمكابح', items: [
        ['المكابح', 'ok', 'سماكة الأقراص والوسادات ضمن الحد المسموح'],
        ['الإطارات', 'note', 'يُنصح بتغييرها خلال 5,000 كم'],
        ['نظام التعليق', 'ok', 'دون أصوات أو ارتخاء'],
      ] },
      { title: 'الكهرباء والداخلية', items: [
        ['التكييف', 'ok', 'يبرد بكفاءة'],
        ['الشاشة والكاميرات', 'ok', 'تعمل'],
        ['المقاعد والفرش', 'ok', 'نظيفة، دون تمزق'],
        ['نظام التشخيص الإلكتروني', 'ok', 'لا توجد رموز أعطال'],
      ] },
    ],
    tires: [['الأمامي الأيمن', 4.2, 2022], ['الأمامي الأيسر', 4.0, 2022], ['الخلفي الأيمن', 3.6, 2022], ['الخلفي الأيسر', 3.8, 2022]],
  },
};
