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

export async function completeTask(id: string, today: string): Promise<{ task: Task; completionId: string }> {
  const { data } = await api.post<{ task: Task; completionId: string }>(`/tasks/items/${id}/complete`, { today })
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
