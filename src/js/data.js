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
  { tag: 'الليلة 8:00م', tone: 'accent', title: 'مزاد سيارات ساحة الشمال · 42 سيارة', meta: 'معاينة من 4 لـ 7 مساءً · الرياض', img: unsplash('1638835373951-3a67da7aaf8d', 1400), large: true },
  { tag: 'ينتهي الخميس', tone: 'primary', title: 'ساعات فاخرة', meta: '53 قطعة موثّقة', img: unsplash('1639006570490-79c0c53f1080', 900), large: false },
];

/** endsIn: seconds remaining when the page loads. order: listing order for «المضاف حديثاً». */
export const lots = [
  { id: 0, cat: 1, name: 'تويوتا لاندكروزر GXR 2021', sub: 'V6، فل كامل، صيانة وكالة، بدون حوادث', city: 'الرياض', bid: 92000, endsIn: 4 * 3600 + 272, noReserve: false, img: unsplash('1650530579355-7ad9d4766043') },
  { id: 1, cat: 2, name: 'رولكس صبمارينر 2022', sub: 'كامل المرفقات والضمان، حالة ممتازة', city: 'جدة', bid: 41500, endsIn: 1260, noReserve: false, img: unsplash('1547996160-81dfa63595aa') },
  { id: 2, cat: 1, name: 'هيونداي سوناتا 2022', sub: '41 ألف كم، لون أبيض، سعودي', city: 'الدمام', bid: 58500, endsIn: 2 * 86400, noReserve: true, img: unsplash('1523394397008-7c076b65a890') },
  { id: 3, cat: 3, name: 'آيفون 16 برو ماكس 1TB', sub: 'جديد مختوم، ضمان سنة', city: 'الرياض', bid: 4250, endsIn: 3400, noReserve: true, img: unsplash('1523206489230-c012c64b2b48') },
  { id: 4, cat: 1, name: 'فورد برونكو 2023 بادلاندز', sub: '18 ألف كم، تعديلات مصنع', city: 'الخبر', bid: 189000, endsIn: 86400 + 7200, noReserve: false, img: unsplash('1610064094665-57e727e29f8b') },
  { id: 5, cat: 4, name: 'طقم ذهب عيار 21', sub: '86 غرام مع الفاتورة', city: 'جدة', bid: 12800, endsIn: 640, noReserve: true, img: unsplash('1631982690223-8aa4be0a2497') },
  { id: 6, cat: 8, name: 'لوحة مميزة ر س ع 7', sub: 'رقم ثلاثي، نقل فوري عبر أبشر', city: 'الرياض', bid: 26000, endsIn: 5 * 3600, noReserve: false, img: unsplash('1654688554491-69d21d38fb91') },
  { id: 7, cat: 6, name: 'رافعة شوكية تويوتا 3 طن', sub: '2018، 4,200 ساعة تشغيل', city: 'الدمام', bid: 36000, endsIn: 3 * 86400, noReserve: true, img: unsplash('1740914994657-f1cdffdc418e') },
  { id: 8, cat: 2, name: 'أوميغا سبيدماستر مون ووتش', sub: '2021، كامل المرفقات', city: 'الرياض', bid: 17200, endsIn: 9000, noReserve: false, img: unsplash('1662384197911-e82189f4dc60') },
  { id: 9, cat: 5, name: 'أرض سكنية 600م² حي النرجس', sub: 'صك إلكتروني، شارعين', city: 'الرياض', bid: 820000, endsIn: 4 * 86400, noReserve: false, img: unsplash('1586724237569-f3d0c1dee8c6') },
];

export const sponsoredLot = {
  name: 'تمويل سيارتك من بنك شريك',
  sub: 'قسّط مشترياتك من المزاد حتى 60 شهر',
  img: unsplash('1603094543704-64cdce2d2532'),
};

export const sortTabs = ['ينتهي قريباً', 'المضاف حديثاً', 'الأقل سعراً', 'بدون حد أدنى'];

export const picks = [
  { cat: 'ساعات', name: 'كارتييه سانتوس 2020', bid: 14200, img: unsplash('1670404160620-a3a86428560e', 600) },
  { cat: 'تحف ومقتنيات', name: 'دلة نحاسية قديمة', bid: 3400, img: unsplash('1564624171349-46ed471bf4e3', 600) },
  { cat: 'سيارات', name: 'شفروليه كابريس 1990', bid: 48000, img: unsplash('1491422433900-4e19887b7b21', 600) },
  { cat: 'مجوهرات', name: 'خاتم ألماس 1.2 قيراط', bid: 26900, img: unsplash('1617038220319-276d3cfab638', 600) },
  { cat: 'لوحات مميزة', name: 'لوحة أ أ أ 1', bid: 155000, img: unsplash('1663900108404-a05e8bf82cda', 600) },
];

export const trust = [
  { title: 'هوية موثّقة بنفاذ', text: 'كل مزايد وبائع متحقق منه قبل أول مزايدة.' },
  { title: 'فحص قبل المزاد', text: 'تقرير فحص معتمد لكل سيارة وشهادة أصالة للساعات والمجوهرات.' },
  { title: 'أموالك محمية', text: 'المبلغ بيضل عندنا لحين استلامك المنتج.' },
  { title: 'ادفع بالطريقة اللي تناسبك', text: 'مدى، Apple Pay، أو قسّط مع تابي وتمارا.' },
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
        { part: 'الهيكل والشاصي', ok: true, note: 'بدون حوادث أو صبغ' },
        { part: 'المكيف', ok: true, note: 'يعمل بكفاءة' },
        { part: 'الإطارات', ok: false, note: 'تحتاج تغيير خلال 5,000 كم' },
        { part: 'الصدام الأمامي', ok: false, note: 'خدوش سطحية' },
      ],
    },
    description: 'لاندكروزر GXR موديل 2021 فل كامل، صيانة دورية في الوكالة وسجل الصيانة متوفر. السيارة نظيفة من الداخل والخارج، بدون حوادث. تُسلَّم مع مفتاحين واستمارة سارية وتأمين حتى مارس 2027.',
    viewing: { place: 'ساحة الشمال، طريق الملك فهد، الرياض', times: 'يومياً من 4 لـ 7 مساءً حتى انتهاء المزاد' },
    seller: { name: 'معرض الوفاء للسيارات', since: 2022, deals: 214, rating: '4.8' },
  },
};
