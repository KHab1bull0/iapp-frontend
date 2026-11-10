import api from '@/core/api/axios'

export type RepeatMode = 'none' | 'schedule' | 'after_done'
export type RepeatUnit = 'day' | 'week' | 'month'

export interface Task {
  id: string
  title: string
  note: string | null
  /** Next day it is due (YYYY-MM-DD); null for an undated task. */
  dueDate: string | null
  /** HH:MM */
  dueTime: string | null
  repeatMode: RepeatMode
  repeatUnit: RepeatUnit | null
  repeatEvery: number | null
  /** 0 = Sunday … 6 = Saturday; schedule + week only. */
  repeatWeekdays: number[] | null
  /** schedule + month only: the day of month it returns to (the due date may be clamped). */
  repeatMonthDay: number | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskInput {
  title: string
  note?: string | null
  dueDate?: string | null
  dueTime?: string | null
  repeatMode: RepeatMode
  repeatUnit?: RepeatUnit | null
  repeatEvery?: number | null
  repeatWeekdays?: number[] | null
}

export interface TodayTasks {
  overdue: Task[]
  today: Task[]
  doneToday: { completionId: string; task: Task }[]
}

export interface TasksSummary {
  today: number
  overdue: number
  doneToday: number
}

/** How a task repeats, as the stats group it. */
export type RepeatKind = 'once' | 'daily' | 'weekly' | 'monthly'
export const REPEAT_KINDS: RepeatKind[] = ['once', 'daily', 'weekly', 'monthly']

export interface StatsTotals {
  total: number
  thisMonth: number
  /** Days in a row with a completion, ending today (or yesterday, before today is done). */
  currentStreak: number
  bestStreak: number
  firstDoneOn: string | null
  lastDoneOn: string | null
}

/** One day or month: how many times it was done then, and the running total so far. */
export interface StatsPoint {
  count: number
  cumulative: number
}

export interface TaskStats extends StatsTotals {
  daily: (StatsPoint & { day: string })[]
  monthly: (StatsPoint & { month: string })[]
}

export interface OverallTaskStats extends StatsTotals {
  byKind: Record<RepeatKind, number>
  daily: (StatsPoint & Record<RepeatKind, number> & { day: string })[]
  monthly: (StatsPoint & Record<RepeatKind, number> & { month: string })[]
}

/**
 * Every key starts with 'tasks', so invalidating ['tasks'] after any change
 * refreshes the lists, Today and the home card together.
 */
export const tasksKeys = {
  all: ['tasks'] as const,
  today: (day: string) => ['tasks', 'today', day] as const,
  list: (status: 'active' | 'done') => ['tasks', 'list', status] as const,
  one: (id: string) => ['tasks', 'item', id] as const,
  summary: (day: string) => ['tasks', 'summary', day] as const,
  stats: (id: string, day: string) => ['tasks', 'stats', id, day] as const,
  overallStats: (day: string) => ['tasks', 'stats', 'all', day] as const,
}

export async function fetchToday(today: string): Promise<TodayTasks> {
  const { data } = await api.get<TodayTasks>('/tasks/today', { params: { today } })
  return data
}

export async function fetchTasks(status: 'active' | 'done' = 'active'): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/tasks/items', { params: { status } })
  return data
}

export async function fetchTask(id: string): Promise<Task> {
  const { data } = await api.get<Task>(`/tasks/items/${id}`)
  return data
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data } = await api.post<Task>('/tasks/items', input)
  return data
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/items/${id}`, input)
  return data
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/items/${id}`)
}

/**
 * `expectedDueDate` is the due date on screen; the server refuses (409) if the
 * task has moved on since, so a repeat tap can't skip an occurrence.
 * `doneOn` is the day it was really done, for a missed day ticked off later
 * (its due date up to today); left out, today.
 */
export async function completeTask(
  id: string,
  today: string,
  expectedDueDate: string | null,
  doneOn?: string,
): Promise<{ task: Task; completionId: string }> {
  const { data } = await api.post<{ task: Task; completionId: string }>(`/tasks/items/${id}/complete`, {
    today,
    expectedDueDate,
    ...(doneOn && { doneOn }),
  })
  return data
}

export async function undoCompletion(completionId: string): Promise<Task> {
  const { data } = await api.post<Task>(`/tasks/completions/${completionId}/undo`)
  return data
}

export async function fetchTasksSummary(today: string): Promise<TasksSummary> {
  const { data } = await api.get<TasksSummary>('/tasks/summary', { params: { today } })
  return data
}

/** Days of daily history the stats screens ask for: 17 weeks of heatmap, the last 30 also charted. */
export const STATS_DAYS = 119

export async function fetchTaskStats(id: string, today: string, days = STATS_DAYS): Promise<TaskStats> {
  const { data } = await api.get<TaskStats>(`/tasks/items/${id}/stats`, { params: { today, days } })
  return data
}

export async function fetchOverallStats(today: string, days = STATS_DAYS): Promise<OverallTaskStats> {
  const { data } = await api.get<OverallTaskStats>('/tasks/stats', { params: { today, days } })
  return data
}
