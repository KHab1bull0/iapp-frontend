import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, RefreshCw, Scale, TrendingUp, Wallet } from 'lucide-react'
import { fetchDashboard } from '@/modules/finance/api/stats'
import { CURRENCY, currentMonth, formatAmount, formatSigned } from '@/core/lib/format'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { MonthStepper } from '@/core/components/ui/MonthStepper'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { StatGrid, StatTile } from '@/core/components/ui/StatTile'
import { useQuickAdd } from '@/core/quickAdd/context'
import { SpendHero } from '@/modules/finance/components/dashboard/SpendHero'
import { CategoryBars } from '@/modules/finance/components/dashboard/CategoryBars'
import { MonthlyBarChart } from '@/modules/finance/components/dashboard/MonthlyBarChart'
import { RecentTransactions } from '@/modules/finance/components/dashboard/RecentTransactions'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './DashboardPage.module.scss'

/**
 * Finance → Statistics. One question first: what has this month cost so far,
 * and is that faster than last month? Then income and balance, where it went,
 * the last six months and the latest entries.
 */
export function DashboardPage() {
  const t = useFinanceT()
  const quickAdd = useQuickAdd()
  const [month, setMonth] = useState<string>(currentMonth)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => fetchDashboard(month),
  })

  const stepper = <MonthStepper value={month} onChange={setMonth} max={currentMonth()} label={t.stats.selectMonth} />

  if (isError) {
    return (
      <div className={s.page}>
        <div className={s.toolbar}>{stepper}</div>
        <EmptyState
          title={t.stats.failed}
          description={t.stats.failedSub}
          action={{ label: t.retry, icon: RefreshCw, onClick: () => void refetch() }}
        />
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className={s.page}>
        <div className={s.toolbar}>{stepper}</div>
        <Skeleton height={260} radius={24} />
        <div className={s.row2}>
          <Skeleton height={96} radius={16} />
          <Skeleton height={96} radius={16} />
        </div>
        <Skeleton height={220} radius={24} />
      </div>
    )
  }

  const empty = data.totalIncome === 0 && data.totalExpense === 0

  return (
    <div className={s.page}>
      <div className={s.toolbar}>{stepper}</div>

      {empty ? (
        <EmptyState
          icon={Wallet}
          title={t.stats.emptyMonth}
          description={t.stats.emptyMonthSub}
          action={{ label: t.tx.add, icon: Plus, onClick: () => quickAdd.open('finance.transaction') }}
        />
      ) : (
        <>
          <SpendHero spent={data.totalExpense} daily={data.dailySpend ?? []} />

          <StatGrid columns={2}>
            <StatTile
              label={t.income}
              value={`+${formatAmount(data.totalIncome)}`}
              sub={CURRENCY}
              tone="success"
              icon={TrendingUp}
            />
            <StatTile
              label={t.balance}
              value={formatSigned(data.totalBalance, data.totalBalance >= 0 ? 'income' : 'expense')}
              sub={CURRENCY}
              icon={Scale}
            />
          </StatGrid>

          <div className={s.chartGrid}>
            <CategoryBars data={data.categoryBreakdown} />
            <MonthlyBarChart data={data.monthlyChart} />
          </div>

          <RecentTransactions transactions={data.recentTransactions} />
        </>
      )}
    </div>
  )
}
