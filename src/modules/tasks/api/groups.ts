import api from '@/core/api/axios'

/** A name to sort tasks under, with an optional brand colour. */
export interface TaskGroup {
  id: string
  name: string
  color: string | null
  createdAt: string
}

/** The 8 ready colours a group can carry; any other #rrggbb can be picked too. */
export const GROUP_COLORS = [
  '#64748b', // slate
  '#10b981', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#f97316', // orange
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
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
