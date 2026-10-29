/**
 * Single source of truth for money + date formatting.
 *
 * Previously six components each built their own `Intl.NumberFormat('en-US', {
 * minimumFractionDigits: 2 })`, which forced a trailing ".00" onto every UZS
 * amount even though so'm has no sub-unit in practice. Centralising it also
 * means the pending uz/en/ru work is a change to this one file rather than a
 * hunt through the component tree.
 */

export const CURRENCY = 'UZS'

/** Locale used for grouping separators. Will become language-driven with i18n. */
const LOCALE = 'uz-UZ'

const amountFmt = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Compact form for chart axes, where horizontal space is scarce. */
const axisFmt = new Intl.NumberFormat(LOCALE, {
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

const dayFmt = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

const shortDayFmt = new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric' })
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: 'short' })
const monthYearFmt = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })
const fullDayFmt = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

/** Parses a "YYYY-MM-DD" API date without letting the runtime shift the timezone. */
export function parseApiDate(dateStr: string): Date {
  return new Date(`${dateStr.slice(0, 10)}T00:00:00`)
}

export function formatDay(dateStr: string): string {
  return dayFmt.format(parseApiDate(dateStr))
}

export function formatShortDay(dateStr: string): string {
  return shortDayFmt.format(parseApiDate(dateStr))
}

export function formatFullDate(d: Date): string {
  return fullDayFmt.format(d)
}

// No year — this one goes in the cramped mobile header.
const headerDayFmt = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

export function formatHeaderDate(d: Date): string {
  return headerDayFmt.format(d)
}

/** "2026-07" -> "iyul" */
export function formatMonthShort(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  return monthFmt.format(new Date(+y, +m - 1))
}

/** "2026-07" -> "iyul 2026" */
export function formatMonthLong(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  return monthYearFmt.format(new Date(+y, +m - 1))
}

/** Current month as "YYYY-MM". */
export function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
