# پرامپت تصاویر شخصی‌سازی

**۲۴ تصویر اختصاصی** آماده شده است: ۱۲ تصویر قطار و ۱۲ تصویر ریل. نسخه‌ی کلاسیک از همان تصاویر قبلی استفاده می‌کند. مسیرهای این سند نسبت به `public/choo-choo-pop-assets/` هستند.

تصاویر با ابزار داخلی `image_gen` و مرجع‌های کلاسیک تولید شده‌اند. متن دقیق پرامپت‌ها در `customize-imagegen-prompts.json` ثبت شده است. اندازه و شفافیت هر ۲۴ PNG بررسی شده است.

## روش تولید

1. برای هر تصویر، همان فایل کلاسیک را به‌عنوان مرجع به ابزار بدهید تا زاویه، شکل و اندازه تغییر نکند.
2. **«متن پایه»** همان بخش را با پرامپت آیتم پشت سر هم بدهید.
3. خروجی باید PNG با پس‌زمینه‌ی شفاف باشد. اگر ابزار شفافیت ندارد، پس‌زمینه را کاملاً سیاه بگیرید تا جدا شود.
4. اندازه را دقیق کنید و فایل را با نام جدول در مسیر گفته‌شده بگذارید.

## قطارها

مرجع‌ها: `art/train/engine.png`، `wagon-blue.png`، `wagon-yellow.png`، `wagon-green.png`

| شخصی‌سازی | قیمت | پوشه | فایل‌ها | اندازه |
|---|---|---|---|---|
| آلبالویی | ۱۵ ستاره | `art/train/cherry/` | `engine.png`، `wagon-1.png`، `wagon-2.png`، `wagon-3.png` | ۵۱۲×۵۱۲ |
| بنفش | ۲۰ ستاره | `art/train/violet/` | همان چهار فایل | ۵۱۲×۵۱۲ |
| نعنایی | ۳۰ ستاره | `art/train/mint/` | همان چهار فایل | ۵۱۲×۵۱۲ |

### متن پایه‌ی قطار

```text
Game sprite for a mobile puzzle game, seen exactly from above. Glossy candy-like cartoon style with a thick soft dark-navy outline and gold trim. Copy the shape, proportions, position and size of the reference image exactly, and change only the colours. The train points right, centred on a fully transparent background. No shadow on the ground, no background, no text, no numbers, no logo.
```

### لوکوموتیو (`engine.png`)

```text
cherry: Top-down steam locomotive. The body and cab are glossy cherry red, with deep crimson shading and polished gold trim.
```

```text
violet: Top-down steam locomotive. The body and cab are glossy royal violet, with deep purple shading and polished gold trim.
```

```text
mint: Top-down steam locomotive. The body and cab are glossy fresh mint green, with deep teal shading and polished gold trim.
```

### واگن‌ها

مرجع واگن‌ها به ترتیب `wagon-blue.png`، `wagon-yellow.png` و `wagon-green.png` است.

```text
cherry wagon-1: Top-down train wagon. Glossy bright red body, gold bands and a gold plate.
cherry wagon-2: Top-down train wagon. Glossy rose pink body, gold bands and a gold plate.
cherry wagon-3: Top-down train wagon. Glossy warm cream body, gold bands and a gold plate.
```

```text
violet wagon-1: Top-down train wagon. Glossy violet body, gold bands and a gold plate.
violet wagon-2: Top-down train wagon. Glossy lilac body, gold bands and a gold plate.
violet wagon-3: Top-down train wagon. Glossy soft sky blue body, gold bands and a gold plate.
```

```text
mint wagon-1: Top-down train wagon. Glossy mint green body, gold bands and a gold plate.
mint wagon-2: Top-down train wagon. Glossy turquoise body, gold bands and a gold plate.
mint wagon-3: Top-down train wagon. Glossy lemon yellow body, gold bands and a gold plate.
```

## ریل‌ها

مرجع‌ها: `art/track/straight.png`، `curve.png`، `stub.png`

| شخصی‌سازی | قیمت | پوشه | فایل‌ها | اندازه |
|---|---|---|---|---|
| آبی آسمانی | ۱۰ ستاره | `art/track/sky/` | `straight.png`، `curve.png`، `stub.png` | ۲۵۶×۲۵۶ |
| گلی | ۱۵ ستاره | `art/track/rose/` | همان سه فایل | ۲۵۶×۲۵۶ |
| لیمویی | ۲۰ ستاره | `art/track/lime/` | همان سه فایل | ۲۵۶×۲۵۶ |
| انگوری | ۲۵ ستاره | `art/track/grape/` | همان سه فایل | ۲۵۶×۲۵۶ |

**مهم:** ریل‌ها باید لبه‌به‌لبه به هم وصل شوند. اگر جای میله‌ها حتی کمی عوض شود، بین خانه‌ها شکاف می‌افتد. پس ساده‌ترین راه این است که فقط رنگ مرجع را عوض کنید و دوباره نکشید.

### متن پایه‌ی ریل

```text
Game tile for a mobile puzzle game, seen exactly from above. Glossy cartoon railway track. Keep the shape, position, spacing and edges of the reference image exactly, pixel for pixel, so tiles connect seamlessly, and change only the colours of the rails and the sleepers. Fully transparent background. No shadow on the ground, no text, no logo.
```

### رنگ هر ریل

برای هر رنگ، این متن را سه بار با مرجع `straight`، `curve` و `stub` بدهید.

```text
sky: Light sky blue metal rails with white highlights, on soft blue-grey sleepers.
```

```text
rose: Pink rose-gold metal rails with white highlights, on warm dusty pink sleepers.
```

```text
lime: Bright lime green metal rails with white highlights, on warm olive sleepers.
```

```text
grape: Purple metal rails with white highlights, on deep plum sleepers.
```

## بعد از تولید

بازی مجموعه‌های کامل را از فایل‌های اختصاصی بارگذاری می‌کند؛ در صورت بارگذاری نشدن یک مجموعه، تغییر رنگ خودکار جایگزین می‌شود. برای جلوگیری از شکاف بین خانه‌ها، منحنی و انتهای ریل در زمان اجرا از تصویر مستقیم همان رنگ ساخته می‌شوند، همان روشی که نسخه‌ی کلاسیک استفاده می‌کند. فایل‌های `curve.png` و `stub.png` نیز برای هر چهار رنگ موجودند.
