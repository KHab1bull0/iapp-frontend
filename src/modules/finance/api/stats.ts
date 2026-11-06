import api from '@/core/api/axios'

export interface MonthPoint {
  month: string     // "2025-12"
  income: number
  expense: number
}

export interface CategoryBreakdown {
  categoryId: string
  name: string
  color: string
  icon: string
  type: string
  total: number
  percentage: number
}

export interface RecentTransaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  note: string | null
  date: string
  category: { name: string; icon: string; color: string }
}

/** Spending so far by each day of the month, this month against the last. */
export interface DailySpendPoint {
  day: number
  /** null for days still to come. */
  current: number | null
  previous: number
}

export interface DashboardStats {
  totalBalance: number
  totalIncome: number
  totalExpense: number
  categoryBreakdown: CategoryBreakdown[]
  monthlyChart: MonthPoint[]
  dailySpend: DailySpendPoint[]
  recentTransactions: RecentTransaction[]
}

export async function fetchDashboard(month?: string): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/finance/stats/dashboard', {
    params: { month },
  })
  return data
}
