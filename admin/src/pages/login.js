import { setRole } from '../api.js';

export default function login(app, { go }) {
  app.innerHTML = `
    <div class="flex min-h-screen flex-col lg:flex-row">
      <div class="flex flex-1 flex-col justify-between gap-8 bg-forest p-8 text-white lg:p-12">
        <img src="../public/assets/mazad-logo.png" alt="مزادي" width="900" height="284" class="h-11 w-auto self-start rounded-xl bg-white px-3.5 py-2">
        <div><h1 class="m-0 mb-3 text-3xl font-bold leading-snug">لوحة إدارة مزادي</h1><p class="m-0 max-w-sm text-[15px] leading-8 text-white/75">مراجعة المزادات، وإدارة الحسابات والمدفوعات والبلاغات.</p></div>
        <span class="text-xs text-white/60">للمشرفين المصرّح لهم فقط.</span>
      </div>
      <div class="grid flex-1 place-items-center p-6">
        <form id="login" novalidate class="flex w-full max-w-[400px] flex-col gap-4 rounded-card border border-line bg-white p-8 shadow-card">
          <div><h2 class="m-0 text-xl font-bold">تسجيل الدخول</h2><p class="m-0 mt-1 text-[13px] text-ink-muted">أدخل بيانات حساب الإدارة.</p></div>
          <div><label class="ad-label" for="email">البريد الإلكتروني</label><input id="email" type="email" dir="ltr" class="ad-input !h-11 text-end" autocomplete="username" value="admin@mazadi.example"></div>
          <div><label class="ad-label" for="pw">كلمة المرور</label><input id="pw" type="password" dir="ltr" class="ad-input !h-11" autocomplete="current-password"></div>
          <div id="err" role="alert" class="hidden rounded-2xl bg-accent-soft px-3.5 py-2.5 text-xs text-accent-ink">بيانات الدخول غير صحيحة. حاول مرة أخرى.</div>
          <button type="submit" class="ad-btn-primary ad-btn-lg !h-11 !text-sm">دخول</button>
          <p class="m-0 text-center text-xs text-ink-muted">نموذج تجريبي: أي كلمة مرور من 6 أحرف. بريد يبدأ بـ readonly يدخل بدور «للقراءة فقط».</p>
        </form>
      </div>
    </div>`;
  app.querySelector('#login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = app.querySelector('#email').value.trim();
    const pw = app.querySelector('#pw').value;
    const bad = !email.includes('@') || pw.length < 6;
    app.querySelector('#err').classList.toggle('hidden', !bad);
    app.querySelector('#pw').setAttribute('aria-invalid', String(bad));
    if (bad) return;
    setRole(email.toLowerCase().startsWith('readonly') ? 'readonly' : 'admin');
    go('#/');
  });
  app.querySelector('#pw').focus();
}
