import type { TransactionFilterState } from './period'

/** Filters set in the full sheet that the toolbar doesn't show: the type. */
export function advancedFilterCount(filters: TransactionFilterState): number {
  return filters.type ? 1 : 0
}
