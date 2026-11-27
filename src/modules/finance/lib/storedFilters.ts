import { DEFAULT_FILTERS, type TransactionFilterState } from '@/modules/finance/components/transactions/period'

const KEY = 'iapp-finance-tx-filters'

/**
 * Transactions' filters for this tab's session: kept across going into a
 * transaction and back, dropped when the app is closed.
 */
export function loadFilters(): TransactionFilterState {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
    return v && typeof v === 'object' && 'period' in v ? (v as TransactionFilterState) : DEFAULT_FILTERS
  } catch {
    return DEFAULT_FILTERS
  }
}

export function saveFilters(filters: TransactionFilterState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(filters))
  } catch {
    // Private mode or full storage: the filters still work on this visit.
  }
}
