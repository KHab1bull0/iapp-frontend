import api from '@/core/api/axios'

/** A name to sort tasks under, with an optional brand colour. */
export interface TaskGroup {
  id: string
  name: string
  color: string | null
  createdAt: string
}

/** 8 muted palette colours a group can carry (Tailwind-300 range). */
export const GROUP_COLORS = [
  '#94a3b8', // slate
  '#86efac', // green
  '#93c5fd', // blue
  '#fca5a5', // red
  '#fdba74', // orange
  '#c4b5fd', // violet
  '#f9a8d4', // pink
  '#67e8f9', // cyan
] as const

/** Oldest first: the order the editor's chips and Today's parts follow. */
export async function fetchGroups(): Promise<TaskGroup[]> {
  const { data } = await api.get<TaskGroup[]>('/tasks/groups')
  return data
}

/** The same name twice (any case) is refused: 409 errors.group_exists. */
export async function createGroup(name: string, color: string | null): Promise<TaskGroup> {
  const { data } = await api.post<TaskGroup>('/tasks/groups', { name, color })
  return data
}

export async function updateGroup(id: string, name: string, color: string | null): Promise<TaskGroup> {
  const { data } = await api.patch<TaskGroup>(`/tasks/groups/${id}`, { name, color })
  return data
}

/** Its tasks stay, ungrouped. */
export async function deleteGroup(id: string): Promise<void> {
  await api.delete(`/tasks/groups/${id}`)
}
