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
const monthFmt = () => dateFmt({ month: 'short' })
const monthYearFmt = () => dateFmt({ month: 'long', year: 'numeric' })
const fullDayFmt = () => dateFmt({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
const dateYearFmt = () => dateFmt({ day: 'numeric', month: 'short', year: 'numeric' })

/** Parses a "YYYY-MM-DD" API date without letting the runtime shift the timezone. */
export function parseApiDate(dateStr: string): Date {
  return new Date(`${dateStr.slice(0, 10)}T00:00:00`)
}

export function formatDay(dateStr: string): string {
  return dayFmt().format(parseApiDate(dateStr))
}

export function formatShortDay(dateStr: string): string {
  return shortDayFmt().format(parseApiDate(dateStr))
}

export function formatFullDate(d: Date): string {
  return fullDayFmt().format(d)
}

/** "3 Oct 2026" */
export function formatDate(d: Date): string {
  return dateYearFmt().format(d)
}

/** "2026-07" -> "iyul" */
export function formatMonthShort(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  return monthFmt().format(new Date(+y, +m - 1))
}

/** "2026-07" -> "iyul 2026" */
export function formatMonthLong(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  return monthYearFmt().format(new Date(+y, +m - 1))
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
