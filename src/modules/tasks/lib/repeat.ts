import { formatShortDay } from '@/core/lib/format'
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

/** "Today", "Tomorrow", a weekday this week, or the date (a past one plainly, never "N days late"). */
export function dueLabel(dueDate: string | null, today: string, t: TasksMessages): string {
  if (!dueDate) return t.due.noDate
  const diff = daysBetween(today, dueDate)
  if (diff < 0) return formatShortDay(dueDate)
  if (diff === 0) return t.due.today
  if (diff === 1) return t.due.tomorrow
  const [y, m, d] = dueDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (diff < 7) return t.repeat.weekdays[date.getDay()]
  return formatShortDay(dueDate)
}

export interface TaskGroup {
  key: 'today' | 'tomorrow' | 'week' | 'later' | 'none'
  label: string
  tasks: Task[]
}

const GROUPS: TaskGroup['key'][] = ['today', 'tomorrow', 'week', 'later', 'none']

/** A task whose day has passed is "past": not in any group (see pastTasks). */
function groupOf(task: Task, today: string): TaskGroup['key'] | 'past' {
  if (!task.dueDate) return 'none'
  const diff = daysBetween(today, task.dueDate)
  if (diff < 0) return 'past'
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

/** Tasks whose day has already passed, oldest first: the folded "earlier days" at the end. */
export function pastTasks(tasks: Task[], today: string): Task[] {
  return tasks
    .filter((task) => groupOf(task, today) === 'past')
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
}

/** Tasks with a time first, earliest at the top; untimed ones after, in their order. */
export function byTime(tasks: Task[]): Task[] {
  const timed = tasks.filter((t) => t.dueTime).sort((a, b) => a.dueTime!.localeCompare(b.dueTime!))
  return [...timed, ...tasks.filter((t) => !t.dueTime)]
}

/**
 * Every day, by either schedule: its streak counts days ("5 kun"). Any other
 * repeat's streak counts occurrences ("5 marta"), as the server counts it.
 */
export function isDaily(task: Pick<Task, 'repeatMode' | 'repeatUnit' | 'repeatEvery'>): boolean {
  return task.repeatMode !== 'none' && task.repeatUnit === 'day' && task.repeatEvery === 1
}
