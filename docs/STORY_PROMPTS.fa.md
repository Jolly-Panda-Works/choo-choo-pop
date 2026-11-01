# پرامپت تصاویر داستان کمیک

داستان ۶ صفحه و ۱۶ پنل دارد. **هر پنل یک تصویر جداست،** چون پنل‌ها یکی‌یکی ظاهر می‌شوند. متن هیچ‌وقت داخل تصویر نیست؛ بازی آن را بسته به زبان روی جای خالی تصویر می‌گذارد.

## روش تولید

1. برای یکدست شدن شخصیت‌ها، این دو تصویر را به‌عنوان مرجع به ابزار بدهید:
   - `public/choo-choo-pop-assets/art/panda/wave.webp` (پاندا)
   - `public/choo-choo-pop-assets/art/story/temp-arrive.jpg` (قطار و سبک محیط)
2. برای هر پنل، **«متن پایه»** را با پرامپت همان پنل پشت سر هم بدهید.
3. نسبت تصویر را نزدیک به ستون «اندازه» انتخاب کنید و بعد تصویر را دقیقاً به همان اندازه برش دهید. قاب و گوشه‌ی گرد را خود بازی اضافه می‌کند.
4. خروجی را با کیفیت ۸۵ به WebP تبدیل کنید و با نام همان پنل در `public/choo-choo-pop-assets/art/story/` بگذارید.
5. در `src/game/story.js` به همان پنل خط `art: 'story/p1-1.webp'` را اضافه کنید.

حجم مجموع تصاویر را زیر ۲ مگابایت نگه دارید. بعد از اضافه شدن همه‌ی پنل‌ها، فایل موقت `story/temp-arrive.jpg` را حذف کنید.

## متن پایه (جلوی همه‌ی پرامپت‌ها)

```text
Single panel of a cheerful children's comic book for a mobile puzzle game, ages 5 to 9. Polished 2D cartoon illustration with thick soft dark-navy outlines, glossy candy-like shading, rounded friendly shapes, saturated bright colours, soft sky blues and fresh greens, gentle lighting. Main character: a chubby cute panda train driver with big brown eyes and pink cheeks, wearing a navy blue conductor uniform with orange lapels and trim, gold buttons, navy tie and a navy cap with a gold train badge, black gloves. His steam locomotive is navy blue and polished gold with a big round gold front. Keep the character and the train identical to the reference images. Full-bleed scene to all edges, no border, no panel frame, no speech bubbles, no captions, no letters, no numbers, no logo, no watermark. Keep the empty area described below calm and free of detail, because text is placed there later.
```

## صفحه ۱: رسیدن قطار

| فایل | اندازه | جای خالی برای متن |
|---|---|---|
| `p1-1.webp` | ۱۴۴۰×۷۶۶ | پایین سمت چپ، ۶۰٪ عرض |
| `p1-2.webp` | ۶۹۱×۱۲۱۰ | ۳۰٪ بالا |
| `p1-3.webp` | ۶۹۱×۱۲۱۰ | ۲۵٪ بالا |

```text
p1-1: Wide shot. The navy and gold steam train crosses a sunny green valley from left to right on a curving railway, white steam puffing into a blue sky with fluffy clouds, distant stone arch bridge and a waterfall. The panda waves from the cab, small on the right side of the image. Empty area: the lower left 60 percent of the image is smooth green meadow.
```

```text
p1-2: Medium shot. The panda leans out of the locomotive cab, waving happily at the viewer with one gloved hand, big smile, shown from the waist up in the lower part of the image. Empty area: the top 30 percent is plain soft blue sky.
```

```text
p1-3: Establishing shot of a tiny cosy green village on rolling hills: a few rounded cottages with colourful roofs, a small wooden train station, flowers and round trees, morning sun. All of it sits in the lower 70 percent. Empty area: the top 25 percent is plain soft sky.
```

## صفحه ۲: ریل‌های به‌هم‌ریخته

| فایل | اندازه | جای خالی برای متن |
|---|---|---|
| `p2-1.webp` | ۱۴۴۰×۸۴۷ | ۲۵٪ بالا |
| `p2-2.webp` | ۶۹۱×۱۱۲۹ | ۲۵٪ بالا |
| `p2-3.webp` | ۶۹۱×۱۱۲۹ | ۲۵٪ بالا |

```text
p2-1: High angle view of the village railway in chaos. Railway tracks are twisted, disconnected and pointing in every direction across the grass like spilled spaghetti, with loose wooden sleepers scattered around. Funny, not scary. Empty area: the top 25 percent is plain smooth grass.
```

```text
p2-2: Close-up of the panda looking shocked, mouth wide open, eyes huge, both gloves on his cheeks, cap slightly tilted, small comic surprise lines around his head, warm orange background gradient. Empty area: the top 25 percent is the plain orange gradient.
```

```text
p2-3: The locomotive and a yellow wagon stopped at the broken end of a track, tilted slightly, a small puff of steam from the funnel, a sad cute feeling. Empty area: the top 25 percent is plain sky.
```

## صفحه ۳: تونل‌ها

| فایل | اندازه | جای خالی برای متن |
|---|---|---|
| `p3-1.webp` | ۱۴۴۰×۹۸۸ | ۲۲٪ بالا |
| `p3-2.webp` | ۱۴۴۰×۹۸۸ | ۲۵٪ پایین |

```text
p3-1: Side view of a round stone tunnel entrance with a bright green glowing arch on the left, set in a grassy hill. The navy and gold train comes out of it, moving right along a straight track. Empty area: the top 22 percent is plain sky.
```

```text
p3-2: Side view of a round stone tunnel with a bright red glowing arch on the right, set in a grassy hill. The navy and gold train drives into it, moving right along a straight track, with its last wagon in view. Empty area: the bottom 25 percent is plain smooth grass.
```

## صفحه ۴: عددها

| فایل | اندازه | جای خالی برای متن |
|---|---|---|
| `p4-1.webp` | ۸۶۴×۹۲۷ | بالا سمت راست، ۶۰٪ عرض و ۳۰٪ ارتفاع |
| `p4-2.webp` | ۵۴۷×۹۲۷ | ۲۰٪ بالا |
| `p4-3.webp` | ۱۴۴۰×۱۰۴۸ | ۲۰٪ بالا |

```text
p4-1: The panda stands on the left side of the image, pointing with one glove up and to the right, with a clever look, one eyebrow raised. Plain sunny outdoor background. Empty area: the top right is plain sky.
```

```text
p4-2: Close-up of two big round glossy yellow buttons with white rims standing side by side in the grass, blank faces with nothing printed on them, soft sparkles around them. Empty area: the top 20 percent is plain sky.
```

```text
p4-3: Top-down view of a square grass puzzle board made of checkered light and dark green tiles, with a neat curving railway track laid across part of it and a small top-down navy and gold locomotive on it. A few blank round yellow buttons along the edge of the board. Empty area: the top 20 percent is plain grass.
```

## صفحه ۵: درخواست کمک

| فایل | اندازه | جای خالی برای متن |
|---|---|---|
| `p5-1.webp` | ۱۴۴۰×۱۱۶۹ | بالا سمت راست، ۵۰٪ عرض و ۳۵٪ ارتفاع |
| `p5-2.webp` | ۱۴۴۰×۸۰۶ | سمت چپ، ۶۰٪ عرض |

```text
p5-1: The panda stands on the left side at a small station platform, holding a long paper list of stations and looking at it with a worried but brave expression, the village and hills behind him. Empty area: the top right is plain sky.
```

```text
p5-2: Close-up of the panda on the right side of the image, looking straight at the viewer with big hopeful sparkling eyes, offering a gold train ticket towards the viewer with one glove, warm golden sunset gradient behind him. Empty area: the left 60 percent is the plain gradient.
```

## صفحه ۶: حرکت دوباره

| فایل | اندازه | جای خالی برای متن |
|---|---|---|
| `p6-1.webp` | ۶۹۱×۸۸۷ | ۳۰٪ بالا |
| `p6-2.webp` | ۶۹۱×۸۸۷ | ۳۰٪ بالا |
| `p6-3.webp` | ۱۴۴۰×۱۰۸۹ | بالا سمت راست، ۵۰٪ عرض و ۳۰٪ ارتفاع |

```text
p6-1: The panda blows a silver train whistle with his cheeks puffed up and his eyes closed happily, small musical comic lines around it. Empty area: the top 30 percent is plain sky.
```

```text
p6-2: Close-up of gloved panda hands tightening the last rail joint with a big wrench, a neat straight track in the lower part of the image, gold sparkles at the joint. Empty area: the top 30 percent is plain soft grass.
```

```text
p6-3: Celebration wide shot. The panda stands on top of the locomotive, jumping with both arms up, as the train with colourful wagons drives along a perfect railway through the green village, confetti, a big bright sky. The panda and train fill the left and lower part of the image. Empty area: the top right is plain sky.
```
