const KEY = 'iapp-recent-categories'
const MAX = 20

/** Category ids most recently used on this device, newest first. */
export function recentCategoryIds(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function rememberCategory(id: string): void {
  const next = [id, ...recentCategoryIds().filter((x) => x !== id)].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(next))
}

/** Recently used first (newest first), then the rest in their own order. */
export function byRecent<T extends { id: string }>(items: T[], recent = recentCategoryIds()): T[] {
  const rank = new Map(recent.map((id, i) => [id, i]))
  return [...items].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
}
