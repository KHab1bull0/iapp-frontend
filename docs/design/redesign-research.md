# IAPP qayta dizayni — izlanish hisoboti

Sana: 2026-11-06. Maqsad: top ilovalarning sinalgan UX naqshlari asosida IAPP'ni to'liq qayta loyihalash.
Biz **naqsh va qulayliklarni** olamiz; boshqa ilovalarning brendi, ranglari yoki ko'rinishi nusxalanmaydi.
Amalga oshirish rejasi va qoidalar: [design-system.md](design-system.md).

## Hisobot

### Benchmark: kim nimasi bilan sevilgan
| Soha | Benchmark | Nimani olamiz |
|---|---|---|
| Vazifalar | **Things 3**: Apple Design Award, ikki marta. UI "ko'rinmas", e'tibor faqat vazifada; yumshoq animatsiyalar; "Magic Plus" bilan istalgan joydan qo'shish | Bugun ekranini markazga qo'yish, katta checkbox, qo'shishni bir harakatga keltirish |
| Vazifalar | **Todoist**: tezkor kiritish. Matn yozib Enter bosiladi, sana/takror yozuvdan tanib olinadi | Pastdagi tezkor qo'shish qatori; sana va takrorlash uchun chiplar |
| Odatlar | **Streaks** (ADA 2016), **Habitify**: aniq statistika. Salbiy sharhlarda streak yo'qolishi og'riqli nuqta sifatida tilga olinadi | Kechirimli streak (bir kunlik o'tkazib yuborishda nolga tushmaydi), kalendar-heatmap |
| Moliya | **Copilot Money**: dizayn bo'yicha konsensus lider, ADA 2024 finalisti. Bosh raqam — "Free to Spend" (oy oxirigacha qolgan) | Dashboardda bitta asosiy raqam va oy davomidagi sarf egri chizig'i |
| Moliya | **YNAB / Monarch**: har kategoriyada progress bar, rang ma'no beradi | Kategoriya bo'yicha byudjet chiziqlari (byudjet backendi — alohida bosqich) |
| Moliya | **Monzo / Revolut**: kunlar bo'yicha guruhlangan tranzaksiyalar, kategoriya rangi/ikonkasi. Foydalanuvchilar UI haddan tashqari bo'lak-bo'lak bo'lib ketishini yoqtirmaydi | Kun sarlavhasi va kunlik jami bilan ro'yxat, kam lekin aniq bloklar |
| So'z yodlash | **Anki**: kuchli, lekin eskirgan UI. **Mochi**: "Anki bugun qayta chizilsa shunday bo'lardi". **Duolingo**: streak va kunlik maqsad | Yodlashda to'liq ekranli fokus rejimi, progress "3/12", sessiya yakuni ekrani, kunlik maqsad |

### Sinalgan qoidalar (manbalar bilan)
- **Pastki menyu:** 3–5 ta manzil, har biri 1–2 so'zli yorliq bilan (Material 3). Yashirin menyu
  topiluvchanlikni deyarli 2 baravar kamaytiradi (NN/g).
- **O'lchamlar:** bosiladigan joy kamida 44×44 pt. Asosiy matn 17 pt (iOS standarti), eng kichik matn 11 pt (Apple HIG).
- **Asosiy amal** pastda, bosh barmoq yetadigan zonada turadi. Bitta aniq asosiy amal uchun FAB to'g'ri keladi.
  Teng og'irlikdagi 3–4 amalni bitta FAB'ga tiqish ierarxiyani buzadi.
- **Swipe:** faqat ikkilamchi yoki xavfli amallar uchun ishlatiladi. Har doim gestsiz muqobili ham bo'ladi
  (uzoq bosish, ⋯ menyu), chunki swipe ko'zga ko'rinmaydi.
- **Streak:** "muzlatish", imtiyozli kun yoki yumshoq qayta tiklash streak tashvishini va ilovani tashlab ketishni
  kamaytiradi. Qoida yo'qotishdan oldin ko'rinib turishi kerak.
- **Kontrast:** WCAG AA talabi — oddiy matn uchun ≥ 4.5:1.

### IAPP'ning hozirgi holati: topilgan muammolar
Ekranlar production'da test akkaunt bilan, mobil (375px) va desktop o'lchamida ko'rildi. Kod ham o'qildi.

**O'qish qulayligi va ranglar**
1. `--fg-muted` (#94A3B8) yorug' fonda **2.45–2.56:1**, ya'ni AA'dan o'tmaydi. Bu rang 119 joyda ishlatilgan.
2. Asosiy tugmada oq matn #16A34A ustida **3.30:1**, qorong'i mavzuda #22C55E ustida esa **2.28:1**.
3. Asosiy matn 14px, mobil uchun kichik. 62 joyda 9–12px, 48 joyda 13px matn bor.
4. 81 ta inline `style={{}}` mavjud. Tokenlardan chetga chiqish dizayn nomuvofiqligiga olib keladi.

**Navigatsiya**
5. Pastki menyuda 5 ta element bor, ulardan biri Sozlamalar. Har yangi modul qo'shilganda modullar "Menyu" ichiga
   yashirinadi ([registry-utils.ts](../../src/core/modules/registry-utils.ts) `bottomNavItems`).
6. Desktop sidebarda uch marta "Statistika" bor. Umumiy "Sozlamalar" Moliya guruhining ostida turgani uchun
   Moliyaga tegishlidek ko'rinadi.
7. **"+" tugmasi beqaror:** u Vazifalar va Tranzaksiyalar sahifalarida bor, lekin Moliya statistikasi, Ingliz tili
   va Bosh sahifada yo'q. Foydalanuvchi qayerdan qo'shishni har safar qidiradi.

**Ekranlar**
8. **Bosh sahifa** — uchta bir xil karta, ierarxiya yo'q. "Bugun nima qilaman?" degan savolga javob bermaydi va
   undan bevosita amal bajarib bo'lmaydi.
9. **Bo'sh holatlar** tugmasiz: "Birinchi kirim yoki chiqimingizni qo'shing" deyiladi, lekin tugma yo'q. Bo'sh
   grafik kartalari esa butun ekranni egallaydi.
10. **Lokalizatsiya:** brauzerning standart sana/oy maydonlari UZ interfeysda "06/11/2026" va "November 2026"
    ko'rinishida chiqadi (AQSh formati, inglizcha).
11. **Formalar:** Saqlash/Bekor qilish tugmalari kontent ichida, ekranning o'rtasida qoladi. Tranzaksiyada summa
    kiritish standart klaviaturada; kategoriya tanlash dropdown orqali (2 bosish va skroll).
12. **Yodlash:** fokus rejimi, sessiya progressi va yakuniy ekran yo'q.
13. **Vazifalar:** tez qo'shish yo'q, har safar to'liq forma ochiladi. Bajarish animatsiyasi va haptika yo'q.

## Manbalar
- NN/g: [Hamburger Menus and Hidden Navigation Hurt UX Metrics](https://www.nngroup.com/articles/hamburger-menus/), [Basic Patterns for Mobile Navigation](https://www.nngroup.com/articles/mobile-navigation-patterns/), [Contextual swipe](https://www.nngroup.com/articles/contextual-swipe/)
- Material 3: [Navigation bar guidelines](https://m3.material.io/components/navigation-bar/guidelines)
- Apple: [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [UI Design Dos and Don'ts](https://developer.apple.com/design/tips/), [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- Things 3: [App Store story](https://apps.apple.com/us/story/id1390028519), [Cultured Code](https://culturedcode.com/things/), [AppAdvice review](https://appadvice.com/post/things-3-from-cultured-code/747542)
- Todoist: [MacStories — Todoist 10](https://www.macstories.net/reviews/todoist-10-brings-intelligent-input-themes-and-new-gestures/), [Cleaner Quick Add](https://www.todoist.com/fr/help/articles/a-cleaner-simpler-quick-add-june-29-PuIpiLmLh)
- Moliya: [Copilot Money review 2026](https://getfinny.app/blog/copilot-money-review-2026), [Copilot dashboard tab](https://intercom.help/copilotmoney/en/articles/6045480-dashboard-tab-overview), [YNAB progress bars](https://www.ynab.com/blog/progress-bars), [Monarch budget](https://help.monarch.com/hc/en-us/articles/360048883631-Understanding-Your-Budget-in-Monarch), [Monzo community feedback](https://community.monzo.com/t/app-evolution-new-look-monzo-app-feedback-megathread/141702?page=83), [Revolut UI overhaul thread](https://community.revolut.com/t/ui-overhaul/147896?page=12)
- Odatlar: [Streaks vs Habitica](https://bodysciencereview.pages.dev/blog/best-habit-tracking-app-review), [Habitify review](https://crm.org/news/habitify-review), [Streak anxiety](https://habitdoom.com/blog/streak-anxiety-habit-trackers)
- So'z yodlash: [Mochi first impressions](https://borretti.me/article/first-impressions-mochi), [Anki alternatives](https://memoryos.com/article/best-anki-alternatives-in-2026-apps-that-beat-anki-for-most-people), [Duolingo growth model](https://marishalakhiani.substack.com/p/breaking-down-duolingos-growth-model)
- Apple Design Awards 2025: [MacRumors](https://www.macrumors.com/2025/06/03/apple-design-award-winners-2025/)

Eslatma: moliya, odat va so'z yodlash bo'yicha manbalarning ko'pi sharh/blog maqolalari. Ular yo'nalish beradi,
lekin qat'iy tadqiqot emas. Qat'iy qoidalar NN/g, Material va Apple HIG'dan olingan.
