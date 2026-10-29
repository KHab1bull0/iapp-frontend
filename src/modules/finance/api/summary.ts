import api from '@/core/api/axios'

export interface FinanceSummary {
  month: string     // "2026-10"
  totalBalance: number
  totalIncome: number
  totalExpense: number
}

export async function fetchFinanceSummary(month?: string): Promise<FinanceSummary> {
  const { data } = await api.get<FinanceSummary>('/finance/summary', { params: { month } })
  return data
}

/**
 * Under 'dashboard' on purpose: every transaction and category mutation
 * already invalidates ['dashboard'], so the home card refreshes with them.
 */
export function financeSummaryKey(month: string) {
  return ['dashboard', 'summary', month] as const
}
