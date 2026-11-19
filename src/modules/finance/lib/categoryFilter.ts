import type { TransactionFilters } from '@/modules/finance/api/transactions'

/** A category select's value for the filters: a parent is `p:<id>`. */
export function categoryFilterValue(f: TransactionFilters): string {
  return f.parentId ? `p:${f.parentId}` : (f.categoryId ?? 'all')
}

/** The filters with a category select's value applied: a parent or a category, never both. */
export function withCategoryFilter<T extends TransactionFilters>(f: T, value: string): T {
  if (value === 'all') return { ...f, categoryId: undefined, parentId: undefined }
  if (value.startsWith('p:')) return { ...f, categoryId: undefined, parentId: value.slice(2) }
  return { ...f, categoryId: value, parentId: undefined }
}
