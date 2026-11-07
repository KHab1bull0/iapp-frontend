import type { Tag, TagGroup } from '@/modules/english/api/english'

export interface TagShelf<T extends Pick<Tag, 'id' | 'groupId'>> {
  /** null: the tags in no group, always last. */
  group: TagGroup | null
  tags: T[]
}

/**
 * Tags shelved by group, groups in the order they were made, the ungrouped
 * ones last. Empty groups are kept only when `keepEmpty` (Settings shows them).
 */
export function shelve<T extends Pick<Tag, 'id' | 'groupId'>>(
  tags: T[],
  groups: TagGroup[],
  keepEmpty = false,
): TagShelf<T>[] {
  const known = new Set(groups.map((g) => g.id))
  const shelves: TagShelf<T>[] = groups.map((g) => ({ group: g, tags: tags.filter((t) => t.groupId === g.id) }))
  shelves.push({ group: null, tags: tags.filter((t) => !t.groupId || !known.has(t.groupId)) })
  return shelves.filter((s) => keepEmpty ? s.group !== null || s.tags.length > 0 : s.tags.length > 0)
}
