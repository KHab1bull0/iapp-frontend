import { addDaysYmd, parseApiDate } from '@/core/lib/format'
import type { RepeatUnit } from '@/modules/tasks/api/tasks'

export interface ParsedQuickAdd {
  title: string
  /** null when the text names no day. */
  dueDate: string | null
  dueTime: string | null
  repeat: { unit: RepeatUnit; weekdays: number[] | null } | null
}

// 0 = Sunday … 6 = Saturday, as Date#getDay and the API count them.
const WEEKDAYS: [RegExp, number][] = [
  [/yakshanba|sunday|sun/, 0],
  [/dushanba|monday|mon/, 1],
  [/seshanba|tuesday|tue/, 2],
  [/chorshanba|wednesday|wed/, 3],
  [/payshanba|thursday|thu/, 4],
  [/juma|friday|fri/, 5],
  [/shanba|saturday|sat/, 6],
]
const WEEKDAY_SRC = WEEKDAYS.map(([re]) => re.source).join('|')

function weekdayOf(word: string): number {
  return WEEKDAYS.find(([re]) => new RegExp(`^(?:${re.source})$`).test(word))![1]
}

/** The first `weekday` on or after `from`. */
function nextWeekday(from: string, weekday: number): string {
  const diff = (weekday - parseApiDate(from).getDay() + 7) % 7
  return addDaysYmd(from, diff)
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Reads a day, a time and a repeat out of a quick-add line, in Uzbek or
 * English, and returns what is left as the title:
 *   "ertaga 9:00 bankka qo'ng'iroq"  → tomorrow, 09:00
 *   "run every monday 7am"           → Mondays, 07:00
 *   "har kuni suv ichish"            → daily
 * Words are only taken when they stand alone, so "Jumanazar" stays a name.
 */
export function parseQuickAdd(input: string, today: string): ParsedQuickAdd {
  let text = ` ${input.trim()} `
  let dueDate: string | null = null
  let dueTime: string | null = null
  let repeat: ParsedQuickAdd['repeat'] = null

  const take = (re: RegExp): RegExpMatchArray | null => {
    const m = text.match(re)
    if (m) text = text.replace(m[0], ' ')
    return m
  }
  const word = (src: string) => new RegExp(`(?<=\\s)(?:${src})(?=\\s)`, 'i')

  // Repeats first: "har dushanba" must not leave a bare "dushanba" behind.
  let m = take(word(`(?:har|every)\\s+(${WEEKDAY_SRC})`))
  if (m) {
    const wd = weekdayOf(m[1].toLowerCase())
    repeat = { unit: 'week', weekdays: [wd] }
    dueDate = nextWeekday(today, wd)
  } else if (take(word('har\\s+kuni|every\\s*day|daily'))) {
    repeat = { unit: 'day', weekdays: null }
  } else if (take(word('har\\s+hafta|every\\s+week|weekly'))) {
    repeat = { unit: 'week', weekdays: null }
  } else if (take(word('har\\s+oy|every\\s+month|monthly'))) {
    repeat = { unit: 'month', weekdays: null }
  }

  if (!dueDate) {
    if (take(word('bugun|today'))) dueDate = today
    else if (take(word('indinga|day\\s+after\\s+tomorrow'))) dueDate = addDaysYmd(today, 2)
    else if (take(word('ertaga|tomorrow|tmr'))) dueDate = addDaysYmd(today, 1)
    else if ((m = take(word(WEEKDAY_SRC)))) dueDate = nextWeekday(today, weekdayOf(m[0].toLowerCase()))
  }

  // 9:30, 21.15, "soat 9", "at 7", 7am, 7pm.
  if ((m = take(word('(?:soat\\s+|at\\s+)?([01]?\\d|2[0-3])[:.]([0-5]\\d)')))) {
    dueTime = `${pad(Number(m[1]))}:${m[2]}`
  } else if ((m = take(word('([1-9]|1[0-2])\\s?(am|pm)')))) {
    const h = Number(m[1]) % 12 + (m[2].toLowerCase() === 'pm' ? 12 : 0)
    dueTime = `${pad(h)}:00`
  } else if ((m = take(word('(?:soat|at)\\s+([01]?\\d|2[0-3])')))) {
    dueTime = `${pad(Number(m[1]))}:00`
  }

  // A weekly repeat with no day named runs on the day it starts.
  if (repeat?.unit === 'week' && !repeat.weekdays) {
    repeat.weekdays = [parseApiDate(dueDate ?? today).getDay()]
  }

  return { title: text.replace(/\s+/g, ' ').trim(), dueDate, dueTime, repeat }
}
