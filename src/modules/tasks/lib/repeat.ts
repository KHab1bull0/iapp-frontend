import type { Lang } from '@/core/i18n'
import type { Task } from '@/modules/tasks/api/tasks'
import type { TasksMessages } from '@/modules/tasks/i18n'

const DAY_MS = 86_400_000

/** Whole days from `from` to `to`, both YYYY-MM-DD. */
export function daysBetween(from: string, to: string): number {
  const t = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((t(to) - t(from)) / DAY_MS)
}

/** "Every 3 days", "Mon · Wed · Fri", "10 days after done" … or '' for a one-off. */
export function describeRepeat(task: Task, t: TasksMessages): string {
  const { repeatMode, repeatUnit, repeatEvery } = task
  if (repeatMode === 'none' || !repeatUnit || !repeatEvery) return ''

  if (repeatMode === 'after_done') return t.repeat.afterDone(repeatEvery, repeatUnit)

  if (repeatUnit === 'week') {
    const days = (task.repeatWeekdays ?? []).map((d) => t.repeat.weekdays[d]).join(' · ')
    return repeatEvery === 1 ? days : t.repeat.everyNWeeks(repeatEvery, days)
  }

  const monthDay = task.repeatMonthDay ?? (task.dueDate ? Number(task.dueDate.slice(8, 10)) : null)
  if (repeatUnit === 'month' && monthDay) return t.repeat.monthly(repeatEvery, monthDay)
  return repeatEvery === 1 ? t.repeat.everyOne(repeatUnit) : t.repeat.everyN(repeatEvery, repeatUnit)
}

/** "Today", "Tomorrow", "3 days overdue", a weekday this week, or the date. */
export function dueLabel(dueDate: string | null, today: string, t: TasksMessages, lang: Lang): string {
  if (!dueDate) return t.due.noDate
  const diff = daysBetween(today, dueDate)
  if (diff === 0) return t.due.today
  if (diff === 1) return t.due.tomorrow
  if (diff < 0) return t.due.overdue(-diff)
  const [y, m, d] = dueDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (diff < 7) return t.repeat.weekdays[date.getDay()]
  return date.toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'en-GB', { day: 'numeric', month: 'short' })
}

export interface TaskGroup {
  key: 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'none'
  label: string
  tasks: Task[]
}

const GROUPS: TaskGroup['key'][] = ['overdue', 'today', 'tomorrow', 'week', 'later', 'none']

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
export function groupByDue(tasks: Task[], today: string, t: TasksMessages): TaskGroup[] {
  return GROUPS.map((key) => ({
    key,
    label: t.groups[key],
    tasks: tasks.filter((task) => groupOf(task, today) === key),
  })).filter((g) => g.tasks.length > 0)
}

/** Tasks with a time first, earliest at the top; untimed ones after, in their order. */
export function byTime(tasks: Task[]): Task[] {
  const timed = tasks.filter((t) => t.dueTime).sort((a, b) => a.dueTime!.localeCompare(b.dueTime!))
  return [...timed, ...tasks.filter((t) => !t.dueTime)]
}
