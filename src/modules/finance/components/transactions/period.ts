import { ymd } from '@/core/lib/format'
import type { TransactionFilters } from '@/modules/finance/api/transactions'

export type Period = 'week' | 'month' | 'all' | 'range'

/** What the filter controls hold: the API filters plus which period is picked. */
export interface TransactionFilterState extends TransactionFilters {
  period: Period
}

/** Transactions opens on the last week. */
export const DEFAULT_FILTERS: TransactionFilterState = { period: 'week' }

function daysBefore(today: Date, n: number): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - n)
}

/** The date bounds a period stands for. Week and Month are rolling and include today. */
export function periodRange(
  period: Period,
  chosen: Pick<TransactionFilters, 'startDate' | 'endDate'>,
  today: Date = new Date(),
): Pick<TransactionFilters, 'startDate' | 'endDate'> {
  switch (period) {
    case 'week':  return { startDate: ymd(daysBefore(today, 6)), endDate: ymd(today) }
    case 'month': return { startDate: ymd(daysBefore(today, 29)), endDate: ymd(today) }
    case 'all':   return {}
    case 'range': return { startDate: chosen.startDate, endDate: chosen.endDate }
  }
}

/** The API query for a filter state: the period becomes start/end dates. */
export function toQuery(state: TransactionFilterState, today: Date = new Date()): TransactionFilters {
  const { period, startDate, endDate, ...rest } = state
  return { ...rest, ...periodRange(period, { startDate, endDate }, today) }
}
