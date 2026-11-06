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
| `Sheet` | Formalar va tanlovlar. Mobilda pastdan chiquvchi oyna, desktopda dialog. Saqlash `footer` ga qo'yiladi |
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
