import type { QueryClient } from '@tanstack/react-query'
import { categoryParentsKey } from '@/modules/finance/api/categoryParents'

/** After a category or parent changes: everything that shows them by parent. */
export function refreshCategories(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['categories'] }),
    qc.invalidateQueries({ queryKey: categoryParentsKey }),
    qc.invalidateQueries({ queryKey: ['dashboard'] }),
    qc.invalidateQueries({ queryKey: ['transactions'] }),
  ])
}
