/**
 * Single source of truth for money + date formatting.
 *
 * Previously six components each built their own `Intl.NumberFormat('en-US', {
 * minimumFractionDigits: 2 })`, which forced a trailing ".00" onto every UZS
 * amount even though so'm has no sub-unit in practice. Centralising it also
 * means the language switch (core/i18n) is handled in this one file rather
 * than across the component tree.
 */

import { storedLang, type Lang } from '@/core/i18n/lang'

export const CURRENCY = 'UZS'

/** Amounts are so'm, so they keep the Uzbek grouping ("1 234 567") in either language. */
const AMOUNT_LOCALE = 'uz-UZ'

/** Dates follow the app's language; LanguageProvider calls setFormatLang on a switch. */
const DATE_LOCALE: Record<Lang, string> = { uz: 'uz-UZ', en: 'en-GB' }
let lang: Lang = storedLang()

export function setFormatLang(next: Lang): void {
  lang = next
}

const dateFormats = new Map<string, Intl.DateTimeFormat>()
function dateFmt(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = lang + JSON.stringify(options)
  let f = dateFormats.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(DATE_LOCALE[lang], options)
    dateFormats.set(key, f)
  }
  return f
}

const amountFmt = new Intl.NumberFormat(AMOUNT_LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Compact form for chart axes, where horizontal space is scarce. */
const axisFmt = new Intl.NumberFormat(AMOUNT_LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** "1 234 567" / "1 234,5" — no forced decimals, no currency suffix. */
export function formatAmount(value: number): string {
  return amountFmt.format(value)
}

/** Same as formatAmount but prefixed with the transaction's direction. */
export function formatSigned(value: number, type: 'income' | 'expense'): string {
  return `${type === 'income' ? '+' : '−'}${amountFmt.format(Math.abs(value))}`
}

/** "1,2 mln" — keeps large so'm values inside a narrow Y axis. */
export function formatAxis(value: number): string {
  return axisFmt.format(value)
}

const dayFmt = () => dateFmt({ weekday: 'short', month: 'short', day: 'numeric' })
const shortDayFmt = () => dateFmt({ month: 'short', day: 'numeric' })
const monthYearFmt = () => dateFmt({ month: 'long', year: 'numeric' })
const fullDayFmt = () => dateFmt({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
const weekdayFmt = () => dateFmt({ weekday: 'short' })
const dateYearFmt = () => dateFmt({ day: 'numeric', month: 'short', year: 'numeric' })

// Uzbek names are spelled out here: many browsers ship little or no uz-UZ
// data and print "M06" for a month. English keeps Intl (en-GB).
const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
]
// Three letters in both languages (en-GB would print "Sept").
const EN_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const UZ_MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const UZ_WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba']
const UZ_WEEKDAYS_SHORT = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']
const capitalise = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)
/** "3-noy" */
const uzDayMonth = (d: Date) => `${d.getDate()}-${UZ_MONTHS_SHORT[d.getMonth()].toLowerCase()}`

/** Parses a "YYYY-MM-DD" API date without letting the runtime shift the timezone. */
export function parseApiDate(dateStr: string): Date {
  return new Date(`${dateStr.slice(0, 10)}T00:00:00`)
}

/** "Wed 3 Jun" / "Ch, 3-iyn" */
export function formatDay(dateStr: string): string {
  const d = parseApiDate(dateStr)
  if (lang === 'uz') return `${UZ_WEEKDAYS_SHORT[d.getDay()]}, ${uzDayMonth(d)}`
  return dayFmt().format(d)
}

/** "3 Jun" / "3-iyn" */
export function formatShortDay(dateStr: string): string {
  const d = parseApiDate(dateStr)
  return lang === 'uz' ? uzDayMonth(d) : shortDayFmt().format(d)
}

/** "Wednesday, 3 June 2026" / "Chorshanba, 3-iyun, 2026" */
export function formatFullDate(d: Date): string {
  if (lang === 'uz') {
    return `${capitalise(UZ_WEEKDAYS[d.getDay()])}, ${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${d.getFullYear()}`
  }
  return fullDayFmt().format(d)
}

/** "Mon" / "Du" */
export function formatWeekday(dateStr: string): string {
  const d = parseApiDate(dateStr)
  return lang === 'uz' ? UZ_WEEKDAYS_SHORT[d.getDay()] : weekdayFmt().format(d)
}

/** "3 Oct 2026" / "3-okt, 2026" */
export function formatDate(d: Date): string {
  return lang === 'uz' ? `${uzDayMonth(d)}, ${d.getFullYear()}` : dateYearFmt().format(d)
}

/** "2026-07" -> "Jul" / "Iyl" */
export function formatMonthShort(yyyyMM: string): string {
  const m = yyyyMM.split('-')[1]
  return (lang === 'uz' ? UZ_MONTHS_SHORT : EN_MONTHS_SHORT)[+m - 1]
}

/** "2026-07" -> "July 2026" / "Iyul 2026" */
export function formatMonthLong(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  return lang === 'uz' ? `${capitalise(UZ_MONTHS[+m - 1])} ${y}` : monthYearFmt().format(new Date(+y, +m - 1))
}

/** Local calendar date as YYYY-MM-DD (not UTC, which runs a day behind in the morning here). */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Today on this device, as YYYY-MM-DD. */
export function todayYmd(): string {
  return ymd(new Date())
}

/** Current month as "YYYY-MM". */
export function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
