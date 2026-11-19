import type { Category } from '@/modules/finance/api/categories'
import type { CategoryParent } from '@/modules/finance/api/categoryParents'
import { byRecent, recentCategoryIds } from './recentCategories'

export type TreeNode =
  | { kind: 'parent'; parent: CategoryParent; children: Category[] }
  | { kind: 'category'; category: Category }

/**
 * One type's categories for picking: each parent with its categories (a
 * parent with none is left out), then the unassigned ones. Recently used
 * first, a parent by its most recent category; the rest keep their order.
 */
export function categoryTree(
  categories: Category[],
  parents: CategoryParent[],
  type: 'income' | 'expense',
  recent = recentCategoryIds(),
): TreeNode[] {
  const rank = new Map(recent.map((id, i) => [id, i]))
  const rankOf = (id: string) => rank.get(id) ?? Infinity
  const ofType = categories.filter((c) => c.type === type)
  const known = new Set(parents.filter((p) => p.type === type).map((p) => p.id))

  const grouped: TreeNode[] = parents
    .filter((p) => known.has(p.id))
    .map((parent) => ({ kind: 'parent' as const, parent, children: byRecent(ofType.filter((c) => c.parentId === parent.id), recent) }))
    .filter((n) => n.children.length > 0)
  const loose: TreeNode[] = ofType
    .filter((c) => !c.parentId || !known.has(c.parentId))
    .map((category) => ({ kind: 'category' as const, category }))

  const nodeRank = (n: TreeNode) =>
    n.kind === 'parent' ? Math.min(...n.children.map((c) => rankOf(c.id))) : rankOf(n.category.id)
  return [...grouped, ...loose].sort((a, b) => nodeRank(a) - nodeRank(b))
}

/** The parent a category is in, if any. */
export function parentOf(categoryId: string, categories: Category[]): string | null {
  return categories.find((c) => c.id === categoryId)?.parentId ?? null
}
