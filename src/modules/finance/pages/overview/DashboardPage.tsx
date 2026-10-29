import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Wallet, RefreshCw } from 'lucide-react'
import { fetchDashboard } from '@/modules/finance/api/stats'
import { currentMonth, formatFullDate, formatMonthLong } from '@/core/lib/format'
import { StatCard, StatCardSkeleton } from '@/modules/finance/components/dashboard/StatCard'
import { MonthlyBarChart, MonthlyBarChartSkeleton } from '@/modules/finance/components/dashboard/MonthlyBarChart'
import { CategoryDonutChart, CategoryDonutChartSkeleton } from '@/modules/finance/components/dashboard/CategoryDonutChart'
import { RecentTransactions, RecentTransactionsSkeleton } from '@/modules/finance/components/dashboard/RecentTransactions'
import s from './DashboardPage.module.scss'

export function DashboardPage() {
  const [month, setMonth] = useState<string>(currentMonth)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => fetchDashboard(month),
  })

  if (isError) {
    return (
      <div className={s.page} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className={s.empty}>
          <div className={s.emptyGlyph}>
            <span style={{ fontSize: 24 }}>⚠️</span>
          </div>
          <div className={s.emptyTitle}>Failed to load dashboard</div>
          <div className={s.emptySub}>Check your connection or try again</div>
          <button className={s.btnSecondary} style={{ marginTop: 8, gap: 6 }} onClick={() => refetch()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  const today = formatFullDate(new Date())
  // Every figure below is scoped to `month` by the backend, so label it as such.
  const periodLabel = formatMonthLong(month)

  return (
    <div className={s.page}>
      <header className={`${s.pageHead} ${s.desktopOnly}`}>
        <div>
          <h1 className={s.h1}>Dashboard</h1>
          <div className={s.pageSub}>{today}</div>
        </div>
        <input
          type="month"
          className={s.monthPicker}
          value={month}
          max={currentMonth()}
          onChange={(e) => setMonth(e.target.value || currentMonth())}
          aria-label="Select month"
        />
      </header>

      <div className={`${s.mobileOnly} ${s.monthBar}`}>
        <input
          type="month"
          className={s.monthPicker}
          value={month}
          max={currentMonth()}
          onChange={(e) => setMonth(e.target.value || currentMonth())}
          aria-label="Select month"
        />
      </div>

      <section className={s.statGrid}>
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard title="Total Balance" value={data!.totalBalance} icon={Wallet}       tone="brand"   period={periodLabel} />
            <StatCard title="Total Income"  value={data!.totalIncome}  icon={TrendingUp}   tone="success" period={periodLabel} />
            <StatCard title="Total Expense" value={data!.totalExpense} icon={TrendingDown} tone="danger"  period={periodLabel} />
          </>
        )}
      </section>

      <section className={s.chartGrid}>
        {isLoading ? (
          <>
            <CategoryDonutChartSkeleton />
            <MonthlyBarChartSkeleton />
          </>
        ) : (
          <>
            <CategoryDonutChart data={data!.categoryBreakdown} />
            <MonthlyBarChart data={data!.monthlyChart} />
          </>
        )}
      </section>

      {isLoading ? (
        <RecentTransactionsSkeleton />
      ) : (
        <RecentTransactions transactions={data!.recentTransactions} />
      )}
    </div>
  )
}
