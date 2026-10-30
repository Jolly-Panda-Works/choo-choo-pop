# Choo Choo Pop

بازی پازل ریل‌چینی آفلاین با React Three Fiber + Capacitor (اندروید) و بیلد خودکار با GitHub Actions.

## قوانین بازی
- جدول یک نقطه‌ی ورود (فلش سبز) و یک نقطه‌ی خروج (فلش قرمز) دارد.
- با کشیدن انگشت روی خانه‌ها یک مسیر پیوسته از ورود تا خروج بچین، بدون انشعاب و بدون فاصله.
- عدد کنار هر سطر و بالای هر ستون تعداد دقیق ریل آن خط است.
- خانه‌های ستاره‌دار حتماً باید جزو مسیر باشند.
- هر مرحله فقط **یک** جواب دارد (با solver تست می‌شود).
- برای پاک کردن، انگشت را روی مسیر به عقب بکش یا Undo بزن.

## اجرا
```bash
npm install
npm run dev            # اجرا در مرورگر
npm run test:levels    # بررسی حل‌پذیری و یکتا بودن جواب همه‌ی مرحله‌ها
npm run build
```

## بیلد اندروید (GitHub Actions)
1. پروژه را در ریپو push کن (شاخه‌ی main).
2. تب Actions ← Build Android ← در بخش Artifacts فایل `choo-choo-pop-debug-apk` را دانلود کن.
3. برای APK/AAB امضاشده، این چهار Secret را در تنظیمات ریپو بساز:
   `KEYSTORE_BASE64`، `KEYSTORE_PASSWORD`، `KEY_ALIAS`، `KEY_PASSWORD`
   (برای ساخت base64: `base64 -w0 release.keystore`).

شناسه‌ی اپ: `com.catchybit.choochoopop` (در `capacitor.config.json` و `android/app/build.gradle` قابل تغییر؛ بعد از تغییر دوباره `npx cap sync android` بزن).

## چک کردن نسخه‌ی آنلاین
بازی کاملاً آفلاین کار می‌کند. اگر اینترنت باشد، فایل `public/version.json` ریپو را می‌خواند و در صورت جدیدتر بودن نسخه، بنر «به‌روزرسانی» نشان می‌دهد.
در `src/config.js` مقدار `OWNER/REPO` را در `VERSION_URL` و `UPDATE_URL` با آدرس ریپوی خودت عوض کن. برای انتشار نسخه‌ی جدید: عدد `version` را در `package.json` و `public/version.json` بالا ببر.

## افزودن مرحله
```bash
# تعداد و اندازه‌ی مرحله‌ها در scripts/build-levels.mjs (آرایه‌ی PLAN)
node scripts/build-levels.mjs   # خروجی: src/game/levelData.js
# عدد TOTAL_LEVELS در src/config.js را هم هماهنگ کن
npm run test:levels
```

## ساختار
- `src/game/` منطق بازی، solver، تولیدکننده‌ی مرحله و داده‌ی ۱۰ مرحله
- `src/three/` صحنه‌ی سه‌بعدی (برد، ریل، قطار، ورودی لمسی)
- `src/screens/` صفحه‌ها (خانه، مراحل، بازی، تنظیمات)
- `docs/ART_ASSETS.md` لیست آرت‌های مورد نیاز
