import { addDaysYmd, formatShortDay, parseApiDate } from '@/core/lib/format'

const YMD = /^\d{4}-\d{2}-\d{2}$/

/** The Monday of the week `day` falls in (weeks run Monday to Sunday, as the server counts them). */
export function mondayOf(day: string): string {
  const back = (parseApiDate(day).getDay() + 6) % 7
  return addDaysYmd(day, -back)
}

/**
 * The week a `?week=` value asks for: any day of it works, a malformed value
 * or a week still to come gives the current one (there is nothing to review yet).
 */
export function weekFromParam(param: string | null, today: string): string {
  const current = mondayOf(today)
  if (!param || !YMD.test(param) || Number.isNaN(parseApiDate(param).getTime())) return current
  const asked = mondayOf(param)
  return asked > current ? current : asked
}

/** "9 Nov – 15 Nov" / "9-noy – 15-noy" */
export function weekRange(weekStart: string): string {
  return `${formatShortDay(weekStart)} – ${formatShortDay(addDaysYmd(weekStart, 6))}`
}
