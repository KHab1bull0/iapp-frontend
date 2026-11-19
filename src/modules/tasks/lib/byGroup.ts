import type { TaskGroup } from '@/modules/tasks/api/groups'
import type { Task } from '@/modules/tasks/api/tasks'

export interface GroupPart {
  key: string
  label: string
  tasks: Task[]
}

/**
 * Tasks by the group each is put in: the groups in their own order, then the
 * rest ("No group"), each keeping the list's order. Null when none of them is
 * in a known group, so the page can show its plain list instead.
 *
 * With `keepEmpty`, every group is there even without tasks (those last,
 * after "No group"), and it is null only when there are no groups at all.
 */
export function byGroup(
  tasks: Task[],
  groups: TaskGroup[],
  noGroup: string,
  { keepEmpty = false }: { keepEmpty?: boolean } = {},
): GroupPart[] | null {
  const known = new Set(groups.map((g) => g.id))
  const all: GroupPart[] = groups.map((g) => ({
    key: g.id,
    label: g.name,
    tasks: tasks.filter((t) => t.groupId === g.id),
  }))
  const parts = all.filter((p) => p.tasks.length > 0)
  const empty = keepEmpty ? all.filter((p) => p.tasks.length === 0) : []
  if (parts.length === 0 && empty.length === 0) return null
  const rest = tasks.filter((t) => !t.groupId || !known.has(t.groupId))
  if (rest.length > 0) parts.push({ key: 'none', label: noGroup, tasks: rest })
  return [...parts, ...empty]
}

/**
 * The same items, a group's ones side by side: groups in their own order, the
 * rest last, each keeping the list's order. No labels, so on the page the
 * colour stripes alone mark where one group ends and the next begins.
 */
export function clusterByGroup<T>(items: T[], groups: TaskGroup[], taskOf: (item: T) => Task): T[] {
  const rank = new Map(groups.map((g, i) => [g.id, i]))
  const rankOf = (item: T) => rank.get(taskOf(item).groupId ?? '') ?? groups.length
  return [...items].sort((a, b) => rankOf(a) - rankOf(b))
}
