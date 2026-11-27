import { DEFAULT_FILTERS, type TransactionFilterState } from './period'

/** What the Filters sheet holds that differs from the start: the search and the period. */
export function advancedFilterCount(filters: TransactionFilterState): number {
  return (filters.search ? 1 : 0) + (filters.period !== DEFAULT_FILTERS.period ? 1 : 0)
}
