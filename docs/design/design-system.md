# IAPP dizayn tizimi

Nima uchun shunday: [redesign-research.md](redesign-research.md). Yangi ekran yoki komponent yozishdan oldin shu
hujjatni o'qing. Qoidadan chetga chiqilsa, sababi kodda izoh bilan yoziladi.

## Tamoyillar
1. **Bitta ekran — bitta asosiy savol.** Bugun ekrani "bugun nima qilaman?", Moliya "shu oy qancha ketdi?"
   degan savolga javob beradi. Eng muhim raqam yoki ro'yxat tepada, eng kattasi bo'ladi.
2. **Qo'shish har doim bir joyda.** Pastki menyu markazidagi "+" (desktopda ⌘K yoki `N`). Sahifalar o'z "+"
   tugmasini chizmaydi.
3. **Bosh barmoq zonasi.** Asosiy amal (Saqlash, Esladim/Unutdim, +) ekranning pastki qismida turadi.
4. **Bo'sh holat — taklif.** "Hali yo'q" deyilsa, yonida qo'shish tugmasi ham bo'ladi (`EmptyState.action`).
5. **Rang yolg'iz ma'no tashimaydi.** Kirim/chiqim belgisi `+`/`−` bilan, grafik seriyalari yorliq bilan beriladi.
6. **Kechirimli.** Undo toast, streak muzlatish, swipe uchun ⋯ menyu muqobili.

## Tokenlar — `src/core/styles/index.css`
| Guruh | Tokenlar | Qoida |
|---|---|---|
| Matn | `--fg-strong`, `--fg`, `--fg-muted`, `--fg-subtle` | O'qiladigan matn uchun `--fg-muted` ikkala mavzuda ≥ 4.5:1. `--fg-subtle` faqat dekor uchun |
| Sirt | `--bg`, `--bg-elev`, `--bg-elev-2`, `--border`, `--border-strong` | Kartalar `--bg-elev` + `--border` |
| Brend | `--primary`, `--primary-hover`, `--primary-fg`, `--primary-soft` | Tugma matni doim `--primary-fg`, hech qachon `white` emas (qorong'i mavzuda to'q matn) |
| Holat | `--success`/`--danger`/`--warning` (matn), `--*-soft` (fon), `--success-fill`/`--danger-fill` (matnsiz to'ldirish) | Matn uchun oddiy, ikonka foni/nuqta/progress uchun `-fill` |
| Tipografiya | `--fs-display` 32, `--fs-h1` 24, `--fs-h2` 20, `--fs-h3` 16, `--fs-body` 16 (mobil) / 15, `--fs-small` 13, `--fs-caption` 12 | O'qiladigan matn ≥ 12px; 11px faqat pastki menyu yorliqlari |
| Radius | `--radius-sm` 8, `--radius-md` 12, `--radius-lg` 16, `--radius-xl` 24, `--radius-pill` | Kartalar `lg`, sheet `xl` |
| Harakat | `--t-fast` 150, `--t-base` 200, `--t-slow` 250, `--ease-house`, `--ease-spring` | `prefers-reduced-motion` global o'chiradi |

Kontrastni `src/core/styles/contrast.test.ts` tekshiradi: yangi rang tokeni qo'shilsa, juftligini testga yozing.

**Grafik ranglari** — `src/core/lib/chartColors.ts` (`CHART`, `SERIES`, `CATEGORY_SWATCHES`). Recharts SVG
atributlari `var()` ni tushunmaydi, shuning uchun bu yerda literal hex ishlatiladi. Boshqa joyda hex yozilmaydi.

## Komponentlar — `src/core/components/ui/`
| Komponent | Qachon |
|---|---|
| `PageHeader` | Har bir sahifa sarlavhasi. Katta title; skrollda mobilda ixcham bar paydo bo'ladi. `children` — tablar/filtrlar |
| `SegmentedControl` | 2–4 ta o'zaro istisno tanlov (davr, rejim). O'zingizning radiogroup'ingizni yozmang |
| `Sheet` | Formalar va tanlovlar. Mobilda pastdan chiquvchi oyna, desktopda dialog yoki yon panel. Saqlash `footer` ga qo'yiladi |
| `ConfirmDialog` | Qaytarib bo'lmaydigan amal oldidan so'rash (o'chirish, chiqish). Telefonda pastdan chiqadi, tugmalar ustma-ust (fe'l tepada); desktopda markazda, tugmalar yonma-yon (fe'l o'ngda). Tugma matni — fe'lning o'zi, "OK" emas |
| `ListGroup` + `ListRow` | Sozlamalar, kategoriyalar va har qanday "ikonka + nom + qiymat + ›" ro'yxati |
| `EmptyState` | Har bir bo'sh ro'yxat yoki sahifa. `action` majburiy, agar foydalanuvchi biror narsa qo'sha olsa |
| `Skeleton` | Yuklanishda kontent shaklida joy egallaydi |
| `StatTile`, `StatGrid` | Bosh raqamlar qatori |
| `ProgressBar`, `ProgressRing` | Byudjet, kunlik reja, sessiya progressi |
| `DateField`, `Calendar` | Har qanday sana. `input[type=date]` ishlatilmaydi (brauzer formati UZ tilini bilmaydi) |
| `Button` / `btn-*` mixinlari | Balandlik: sm 32, md 44, lg 52. Bosiladigan joy ≥ 44px |

## Navigatsiya
- **Mobil:** pastki menyu — Bugun · modullar · markazda "+". Ko'pi bilan 5 ta joy. 4 tadan ortiq modul bo'lsa,
  "Ko'proq" qo'shiladi. Sozlamalar Bugun sarlavhasidagi avatar orqali ochiladi.
- **Modul sahifalari:** `PageHeader` ostida `SegmentedControl` tablar.
- **Desktop:** chap sidebar (modul guruhlari), pastda Sozlamalar va profil; ⌘K buyruq palitrasi.
- **Qo'shish:** modul manifestidagi `quickAdd` amallari ("+" va ⌘K ikkalasi shuni o'qiydi).

## Matn
- Interfeys tili — UZ (asosiy) va EN. Har bir matn modulning `i18n.ts` ida.
- Sana: `useDayLabel()` ("Bugun", "Ertaga", "Ch, 3-iyn"); summa: `formatAmount`; oy: `formatMonthLong`.

## Harakat va o'tishlar
- Sahifalar orasida 180ms cross-fade (View Transitions API). Navigatsiya havolalari `viewTransition` propi
  bilan yoqiladi. Pastki menyu va sidebar o'z `view-transition-name` lariga ega, shuning uchun qimirlamaydi.
- Vazifa belgilanganda checkbox "pop" bo'ladi va telefonda qisqa tebranadi (`navigator.vibrate(10)`).
- Swipe: `useSwipe` (`src/core/hooks/useSwipe.ts`), faqat touch. Har bir swipe amalining tugma bilan
  qilinadigan muqobili ham bor.

## Sifat tekshiruvlari
- `src/core/styles/contrast.test.ts` — rang tokenlari juftliklari ≥ 4.5:1.
- `src/core/a11y.test.tsx` — asosiy ekranlarni axe-core bilan tekshiradi: nomlar, rollar, landmarklar.
  Yangi ekran qo'shilsa, shu yerga ham qo'shing.
- `npm run lint` toza bo'lishi shart. `react-refresh` uchun ataylab ruxsat berilgan istisnolar
  `eslint.config.js` da sanab o'tilgan.

## Spec v2 — o'lchamlar va komponentlar bir-biriga mos (2026-11-06)

Asos: uchta eng mos ilovaning umumiy jihati.
- **Things 3** (vazifalar): hammasi bir xil ritmda; ierarxiya o'lcham emas, qalinlik bilan beriladi; ko'p bo'sh joy.
- **Copilot Money** (moliya): bitta katta raqam, kartalar bir xil radius va paddingda, soya yo'q.
- **Linear** (desktop): zich, 4px panjara, bir xil balandlikdagi boshqaruvlar, faqat ingichka chegaralar.

Ranglar o'zgarmaydi. Quyidagilar `index.css`, `_mixins.scss` da; kodda **faqat shu qiymatlar** ishlatiladi.

| Narsa | Qoida |
|---|---|
| Shrift (8 ta) | `--fs-caption` 12 · `--fs-meta` 13 · `--fs-ui` 15 · `--fs-body` 16/15 · `--fs-title` 17 · `--fs-h2` 20 · `--fs-h1` 24 · `--fs-display` 32 · `--fs-hero` 40. Boshqa px yo'q (istisno: pastki menyu yorlig'i 11). 14px → asosiy matn bo'lsa `--fs-ui`, ikkinchi qator bo'lsa `--fs-meta`. 18/22px → `--fs-title`/`--fs-h1` |
| Qalinlik | 400 matn · 500 qator nomi, tugma · 600 sarlavha, label · 700 raqam, sahifa sarlavhasi · 800 faqat `--fs-hero`/`--fs-display` |
| Bo'shliq | Faqat 4, 8, 12, 16, 20, 24, 32, 40, 48. 2/6/10/14 yo'q (istisno: segmented ichidagi 2-3px) |
| Ritm | `--page-pad` 16/32 · `--section-gap` 20/24 · `--card-pad` 16/20 · `--stack-gap` 12 · label→kontent 8 |
| Radius | `--radius-sm` 8: ikonka plitkasi, kichik chip, kbd · `--radius-md` 12: input, tugma, select, segmented, menyu qatori · `--radius-lg` 16: **barcha** karta, ro'yxat, plitka, panel kartasi · `--radius-xl` 24: faqat ustida suzuvchi narsalar (sheet, yon panel, dialog) · pill: badge, chip, avatar |
| Balandlik | `--control-sm` 32 · `--control-md` 40 (touch'da 44) · `--control-lg` 52 · qator `--row-h` 56 / `--row-h-sm` 48 · ikonka plitkasi `--tile-sm` 28 / `--tile-md` 36 / `--tile-lg` 44 |
| Soya | Sahifadagi sirtlar soyasiz (faqat chegara). Soya faqat suzuvchilarga: sheet/dialog/popover `--shadow-lg`, "+" va yopishqoq panellar `--shadow-md` |

**Mixinlar** (`@use '@/core/styles/mixins' as *;`):
- `page` — sahifa ustuni (kenglik, chetlar, bo'limlar orasi). Har bir sahifaning `.page` klassi shu.
- `surface` — sirt (fon, chegara, `--radius-lg`); `card` — sirt va standart padding/gap.
- `card-title` — karta sarlavhasi; `section-label` — kichik bosh harfli guruh nomi.
- `row` — ro'yxat qatori; `icon-tile($size)` — ikonka plitkasi.
- `btn-primary|secondary` + `btn-size-sm|md|lg` — tugmalar; `input-wrap-base` + `field-focus` — maydonlar.

**Komponentlar:** yangi narsa yozishdan oldin `src/core/components/ui/` dagilar ishlatiladi: `StatTile`/`StatGrid`, `ListGroup`/`ListRow`, `EmptyState`, `SegmentedControl`, `Skeleton`, `ProgressBar/Ring`, `Sheet`, `DateField`, `MonthStepper`, `PageHeader`; bosh sahifa kartasi — `core/components/HomeCard`.

## Qo'shish/tahrirlash formalarining tugmalari (2026-11-07)
- Tugmalar qatori `data-form-actions` bilan belgilanadi. Sahifada u ekranning pastiga **fixed** bo'ladi (forma
  qisqa bo'lsa ham, tepasida karta bo'lsa ham). Sahifa pastida `--form-actions-space` bo'sh joy qoldiriladi.
  Sheet, yon panel va dialog ichida qator shu oynaning pastiga yopishadi (sticky).
- Hamma tugmalar bir xil o'lchamda (`--control-lg`, teng kenglik) va faqat rangi bilan farqlanadi:
  `btn-action-primary` (Saqlash, yashil), `btn-action-secondary` (Bekor qilish, kulrang chiziq),
  `btn-action-danger` (O'chirish, qizil chiziq). Tartib: O'chirish · Bekor qilish · Saqlash.
- Rangli segment: `SegmentedControl` variantiga `tone: 'success' | 'danger'` beriladi (masalan, Kirim/Chiqim).
