import type { TransactionFilters } from '@/modules/finance/api/transactions'

/** Filters set in the full sheet that the toolbar doesn't show: type and dates. */
export function advancedFilterCount(filters: TransactionFilters): number {
  return [filters.type, filters.startDate, filters.endDate].filter(Boolean).length
}
