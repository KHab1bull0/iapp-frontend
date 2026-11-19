import api from '@/core/api/axios'

/** A name to sort tasks under (Tasks → Settings); nothing else yet. */
export interface TaskGroup {
  id: string
  name: string
  createdAt: string
}

/** Oldest first: the order the editor's chips and Today's parts follow. */
export async function fetchGroups(): Promise<TaskGroup[]> {
  const { data } = await api.get<TaskGroup[]>('/tasks/groups')
  return data
}

/** The same name twice (any case) is refused: 409 errors.group_exists. */
export async function createGroup(name: string): Promise<TaskGroup> {
  const { data } = await api.post<TaskGroup>('/tasks/groups', { name })
  return data
}

export async function renameGroup(id: string, name: string): Promise<TaskGroup> {
  const { data } = await api.patch<TaskGroup>(`/tasks/groups/${id}`, { name })
  return data
}

/** Its tasks stay, ungrouped. */
export async function deleteGroup(id: string): Promise<void> {
  await api.delete(`/tasks/groups/${id}`)
}
