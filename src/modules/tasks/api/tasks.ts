import api from '@/core/api/axios'

export type RepeatMode = 'none' | 'schedule' | 'after_done'
export type RepeatUnit = 'day' | 'week' | 'month'

/** How a habit was checked in: in full, or its two-minute version. */
export type CompletionKind = 'full' | 'min'

/** A habit's milestone: a streak length to reach and the user's own, known reward for it. */
export interface TaskStage {
  id: string
  /** 1-based, in order of `days`. */
  position: number
  /** The streak length that reaches it. */
  days: number
  reward: string | null
  reachedAt: string | null
  claimedAt: string | null
}

/** The next stage to reach, as `progress` names it. */
export type NextStage = Pick<TaskStage, 'position' | 'days' | 'reward'>

/** A habit's standing on the day asked for (the `today` param). */
export interface HabitProgress {
  streak: number
  best: number
  /** The last due occurrence was missed: missing today too ends the streak. */
  atRisk: boolean
  /** The lowest stage not yet reached; null once all are (or there are none). */
  stage: NextStage | null
  /** Every done completion (full + min): the "votes" for who you are becoming. */
  total: number
}

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
  isHabit: boolean
  /** "I am a reader": who doing it makes you. */
  identity: string | null
  /** When/where/after what: "after dinner, in the kitchen". */
  cue: string | null
  /** The two-minute version for a hard day: "read 1 page". */
  minVersion: string | null
  /** Ordered by position. */
  stages: TaskStage[]
  /** Habits only; null for every other task. */
  progress: HabitProgress | null
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
  isHabit?: boolean
  identity?: string | null
  cue?: string | null
  minVersion?: string | null
  /** Replaces the list; at most 10, strictly increasing days (1..1000). */
  stages?: { days: number; reward?: string | null }[]
}

export interface CompleteResult {
  task: Task
  completionId: string
  streak: { current: number; best: number }
  /** Set on the completion that reached a stage: the reward is due. */
  stageReached: Pick<TaskStage, 'id' | 'position' | 'days' | 'reward'> | null
}

export interface TodayTasks {
  overdue: Task[]
  today: Task[]
  doneToday: { completionId: string; task: Task; kind?: CompletionKind }[]
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

/**
 * One task's chart line: up a point on a day done, down a point for each day
 * it was due and not done (can go below zero). A month: as of its last day.
 */
export interface ScorePoint {
  score: number
  /** Days due and not done (one day: 0 or 1). */
  missed: number
}

/** A habit's day: how many of its completions were the two-minute version. */
export interface HabitDayPoint {
  min?: number
}

export interface TaskStats extends StatsTotals {
  daily: (StatsPoint & ScorePoint & HabitDayPoint & { day: string })[]
  monthly: (StatsPoint & ScorePoint & { month: string })[]
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
  // A habit's progress is computed for a day, so the day is part of the key.
  list: (status: 'active' | 'done', day: string) => ['tasks', 'list', status, day] as const,
  /** Every day's copy of one task (to drop them all once it is deleted). */
  item: (id: string) => ['tasks', 'item', id] as const,
  one: (id: string, day: string) => ['tasks', 'item', id, day] as const,
  summary: (day: string) => ['tasks', 'summary', day] as const,
  stats: (id: string, day: string) => ['tasks', 'stats', id, day] as const,
  overallStats: (day: string) => ['tasks', 'stats', 'all', day] as const,
}

export async function fetchToday(today: string): Promise<TodayTasks> {
  const { data } = await api.get<TodayTasks>('/tasks/today', { params: { today } })
  return data
}

export async function fetchTasks(status: 'active' | 'done', today: string): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/tasks/items', { params: { status, today } })
  return data
}

export async function fetchTask(id: string, today: string): Promise<Task> {
  const { data } = await api.get<Task>(`/tasks/items/${id}`, { params: { today } })
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
 * (its due date up to today); left out, today. `kind` is how a habit was
 * checked in; left out, in full.
 */
export async function completeTask(
  id: string,
  today: string,
  expectedDueDate: string | null,
  { doneOn, kind }: { doneOn?: string; kind?: CompletionKind } = {},
): Promise<CompleteResult> {
  const { data } = await api.post<CompleteResult>(`/tasks/items/${id}/complete`, {
    today,
    expectedDueDate,
    ...(doneOn && { doneOn }),
    // Full is the server's default: a plain tick sends the same body as before habits.
    ...(kind && kind !== 'full' && { kind }),
  })
  return data
}

/** "I took my reward": marks a reached stage claimed. */
export async function claimStage(id: string): Promise<TaskStage> {
  const { data } = await api.post<TaskStage>(`/tasks/stages/${id}/claim`)
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
