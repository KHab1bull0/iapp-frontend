import type { RepeatUnit, Task } from '@/modules/tasks/api/tasks'

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DAY_MS = 86_400_000

/** Whole days from `from` to `to`, both YYYY-MM-DD. */
export function daysBetween(from: string, to: string): number {
  const t = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((t(to) - t(from)) / DAY_MS)
}

function plural(n: number, unit: RepeatUnit): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`
}

function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/** "Every 3 days", "Mon · Wed · Fri", "10 days after done" … or '' for a one-off. */
export function describeRepeat(task: Task): string {
  const { repeatMode, repeatUnit, repeatEvery } = task
  if (repeatMode === 'none' || !repeatUnit || !repeatEvery) return ''

  if (repeatMode === 'after_done') return `${plural(repeatEvery, repeatUnit)} after done`

  if (repeatUnit === 'week') {
    const days = (task.repeatWeekdays ?? []).map((d) => WEEKDAY_SHORT[d]).join(' · ')
    return repeatEvery === 1 ? days : `Every ${repeatEvery} weeks: ${days}`
  }

  const every = repeatEvery === 1 ? `Every ${repeatUnit}` : `Every ${plural(repeatEvery, repeatUnit)}`
  const monthDay = task.repeatMonthDay ?? (task.dueDate ? Number(task.dueDate.slice(8, 10)) : null)
  if (repeatUnit === 'month' && monthDay) return `${every} on the ${ordinal(monthDay)}`
  return every
}

/** "Today", "Tomorrow", "3 days overdue", a weekday this week, or the date. */
export function dueLabel(dueDate: string | null, today: string): string {
  if (!dueDate) return 'No date'
  const diff = daysBetween(today, dueDate)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return `${-diff} day${diff === -1 ? '' : 's'} overdue`
  const [y, m, d] = dueDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (diff < 7) return WEEKDAY_SHORT[date.getDay()]
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export interface TaskGroup {
  key: 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'none'
  label: string
  tasks: Task[]
}

const GROUPS: Omit<TaskGroup, 'tasks'>[] = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This week' },
  { key: 'later', label: 'Later' },
  { key: 'none', label: 'No date' },
]

function groupOf(task: Task, today: string): TaskGroup['key'] {
  if (!task.dueDate) return 'none'
  const diff = daysBetween(today, task.dueDate)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff < 7) return 'week'
  return 'later'
}

/** The All tasks page's sections, in order, without empty ones. Keeps the input order inside each. */
export function groupByDue(tasks: Task[], today: string): TaskGroup[] {
  return GROUPS.map((g) => ({ ...g, tasks: tasks.filter((t) => groupOf(t, today) === g.key) })).filter(
    (g) => g.tasks.length > 0,
  )
}
