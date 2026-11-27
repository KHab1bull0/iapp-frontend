import { useState } from 'react'
import clsx from 'clsx'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus, RefreshCw, Wallet } from 'lucide-react'
import { fetchDashboard } from '@/modules/finance/api/stats'
import { currentMonth } from '@/core/lib/format'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { MonthStepper } from '@/core/components/ui/MonthStepper'
import { useQuickAdd } from '@/core/quickAdd/context'
import { BalanceHero, BalanceHeroSkeleton } from '@/modules/finance/components/dashboard/BalanceHero'
import { SpendHero, SpendHeroSkeleton } from '@/modules/finance/components/dashboard/SpendHero'
import { CategoryBars, CategoryBarsSkeleton } from '@/modules/finance/components/dashboard/CategoryBars'
import { MonthlyBarChart, MonthlyBarChartSkeleton } from '@/modules/finance/components/dashboard/MonthlyBarChart'
import { RecentTransactions, RecentTransactionsSkeleton } from '@/modules/finance/components/dashboard/RecentTransactions'
import { LoadingBlock } from '@/modules/finance/components/loading/Loading'
import { staleClass } from '@/modules/finance/components/loading/stale'
import { useFinanceT } from '@/modules/finance/i18n'
import { RateBadge } from '@/modules/finance/components/rates/RateBadge'
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

  const { data, isLoading, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => fetchDashboard(month),
    // Stepping to another month keeps this one on screen (dimmed) until the
    // new figures arrive, rather than dropping back to the skeleton.
    placeholderData: keepPreviousData,
  })

  const stepper = <MonthStepper value={month} onChange={setMonth} max={currentMonth()} label={t.stats.selectMonth} />
  const heroStepper = (
    <MonthStepper value={month} onChange={setMonth} max={currentMonth()} label={t.stats.selectMonth} size="sm" />
  )

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

  // First load only: the page's own cards in outline, the month switcher
  // already where it will be (in the balance card).
  if (isLoading || !data) {
    return (
      <LoadingBlock label={t.stats.loading} className={s.page}>
        <BalanceHeroSkeleton accessory={heroStepper} />
        <SpendHeroSkeleton title={t.stats.spendTrend} />
        <div className={s.chartGrid}>
          <CategoryBarsSkeleton />
          <MonthlyBarChartSkeleton />
        </div>
        <RecentTransactionsSkeleton />
      </LoadingBlock>
    )
  }

  const empty = data.totalIncome === 0 && data.totalExpense === 0
  // Another month's figures, shown until this one's arrive: dimmed, but the
  // month switcher stays at full strength and in reach.
  const dim = staleClass(isPlaceholderData)

  return (
    <div className={s.page} aria-busy={isPlaceholderData || undefined}>
      {isPlaceholderData && <span className="sr-only">{t.stats.loading}</span>}
      <RateBadge className={s.rate} />
      {/* With figures to show, the month switcher sits in the balance card. */}
      {empty && <div className={s.toolbar}>{stepper}</div>}

      {empty ? (
        <div className={dim}>
          <EmptyState
            icon={Wallet}
            title={t.stats.emptyMonth}
            description={t.stats.emptyMonthSub}
            action={{ label: t.tx.add, icon: Plus, onClick: () => quickAdd.open('finance.transaction') }}
          />
        </div>
      ) : (
        <>
          <BalanceHero
            balance={data.totalBalance}
            income={data.totalIncome}
            expense={data.totalExpense}
            accessory={heroStepper}
            stale={isPlaceholderData}
          />

          <div className={clsx(s.stack, dim)}>
            {(data.dailySpend ?? []).length > 0 && (
              <SpendHero spent={data.totalExpense} daily={data.dailySpend ?? []} title={t.stats.spendTrend} showAmount={false} />
            )}

            <div className={s.chartGrid}>
              <CategoryBars data={data.categoryBreakdown} />
              <MonthlyBarChart data={data.monthlyChart} />
            </div>

            <RecentTransactions transactions={data.recentTransactions} />
          </div>
        </>
      )}
    </div>
  )
}
