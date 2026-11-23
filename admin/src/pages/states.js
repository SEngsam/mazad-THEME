import { icon } from '../ui.js';

export const meta = { title: 'حالات خاصة', sub: 'صفحات الخطأ ورسائل الحالة.' };

const box = (tone, glyph, title, text, action) => `
  <div class="ad-card flex flex-col items-center gap-3 !p-9 text-center">
    <span class="grid h-[60px] w-[60px] place-items-center rounded-full ${tone} text-lg font-bold">${glyph}</span>
    <h2 class="ad-h2 !text-lg">${title}</h2><p class="m-0 max-w-xs text-[13px] leading-7 text-ink-body">${text}</p>${action}
  </div>`;

export const notFound = () => box('bg-primary-soft text-primary', '404', 'الصفحة غير موجودة', 'الرابط غير صحيح أو حُذف العنصر.', '<a href="#/" class="ad-btn-primary ad-btn-lg">الرئيسية</a>');
export const forbidden = () => box('bg-accent-soft text-accent-ink', icon('lock', 28), 'ليست لديك صلاحية', 'هذه الصفحة لدور «مدير» فقط.', '<a href="#/" class="ad-btn ad-btn-lg">العودة</a>');

export default function states(root) {
  root.innerHTML = `<div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
    ${forbidden()}${notFound()}
    ${box('bg-mist text-ink-body', icon('warn', 28), 'انتهت الجلسة', 'سجّل الدخول مرة أخرى للمتابعة.', '<a href="#/login" class="ad-btn-primary ad-btn-lg">تسجيل الدخول</a>')}
    ${box('bg-accent-soft text-accent-ink', icon('warn', 28), 'تغيّر المزاد', 'عُدّل المزاد أثناء المراجعة. حدّث الصفحة وأعد المحاولة.', '<button type="button" class="ad-btn-primary ad-btn-lg" onclick="location.reload()">تحديث</button>')}
  </div>`;
}
