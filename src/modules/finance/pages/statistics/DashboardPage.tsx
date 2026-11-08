import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, RefreshCw, Wallet } from 'lucide-react'
import { fetchDashboard } from '@/modules/finance/api/stats'
import { currentMonth } from '@/core/lib/format'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { MonthStepper } from '@/core/components/ui/MonthStepper'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useQuickAdd } from '@/core/quickAdd/context'
import { BalanceHero } from '@/modules/finance/components/dashboard/BalanceHero'
import { SpendHero } from '@/modules/finance/components/dashboard/SpendHero'
import { CategoryBars } from '@/modules/finance/components/dashboard/CategoryBars'
import { MonthlyBarChart } from '@/modules/finance/components/dashboard/MonthlyBarChart'
import { RecentTransactions } from '@/modules/finance/components/dashboard/RecentTransactions'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './DashboardPage.module.scss'

/**
 * Finance → Statistics. The month's balance first, then what it is made of
 * (income, expenses), whether spending runs faster than last month, where it
 * went, the last six months and the latest entries.
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
        <Skeleton height={260} radius={16} />
        <div className={s.row2}>
          <Skeleton height={96} radius={16} />
          <Skeleton height={96} radius={16} />
        </div>
        <Skeleton height={220} radius={16} />
      </div>
    )
  }

  const empty = data.totalIncome === 0 && data.totalExpense === 0

  return (
    <div className={s.page}>
      {/* With figures to show, the month switcher sits in the balance card. */}
      {empty && <div className={s.toolbar}>{stepper}</div>}

      {empty ? (
        <EmptyState
          icon={Wallet}
          title={t.stats.emptyMonth}
          description={t.stats.emptyMonthSub}
          action={{ label: t.tx.add, icon: Plus, onClick: () => quickAdd.open('finance.transaction') }}
        />
      ) : (
        <>
          <BalanceHero
            balance={data.totalBalance}
            income={data.totalIncome}
            expense={data.totalExpense}
            accessory={<MonthStepper value={month} onChange={setMonth} max={currentMonth()} label={t.stats.selectMonth} size="sm" />}
          />

          {(data.dailySpend ?? []).length > 0 && (
            <SpendHero spent={data.totalExpense} daily={data.dailySpend ?? []} title={t.stats.spendTrend} showAmount={false} />
          )}

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
