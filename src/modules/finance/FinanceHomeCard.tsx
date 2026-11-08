import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Wallet } from 'lucide-react'
import { HomeCard } from '@/core/components/HomeCard'
import { Skeleton } from '@/core/components/ui/Skeleton'
import clsx from 'clsx'
import { CURRENCY, currentMonth, formatAmount, formatMonthLong, formatSigned } from '@/core/lib/format'
import { fetchFinanceSummary, financeSummaryKey } from './api/summary'
import { useFinanceT } from './i18n'
import s from './FinanceHomeCard.module.scss'

/** Home: this month's balance, and the income and expenses it is made of. Adding goes through the shell's "+". */
export function FinanceHomeCard() {
  const t = useFinanceT()
  const month = currentMonth()
  const { data, isError, refetch } = useQuery({
    queryKey: financeSummaryKey(month),
    queryFn: () => fetchFinanceSummary(month),
  })

  return (
    <HomeCard
      icon={Wallet}
      title={t.title}
      to="/finance"
      linkLabel={t.home.open}
      accessory={<span className={s.period}>{formatMonthLong(month)}</span>}
    >
      {isError ? (
        <div className={s.error}>
          {t.home.failed}
          <button className={s.retry} onClick={() => void refetch()}>
            <RefreshCw size={14} /> {t.retry}
          </button>
        </div>
      ) : (
        <>
          <div>
            <div className={s.label}>{t.home.balance}</div>
            <div className={clsx(s.headline, data && data.totalBalance < 0 && s.negative)}>
              {data ? (
                data.totalBalance === 0 ? (
                  formatAmount(0)
                ) : (
                  formatSigned(data.totalBalance, data.totalBalance > 0 ? 'income' : 'expense')
                )
              ) : (
                <Skeleton width={140} height={32} />
              )}
              <span className={s.currency}>{CURRENCY}</span>
            </div>
          </div>
          <div className={s.flows}>
            <div>
              <div className={s.label}>{t.income}</div>
              <div className={s.income}>{data ? `+${formatAmount(data.totalIncome)}` : <Skeleton width={80} />}</div>
            </div>
            <div>
              <div className={s.label}>{t.expense}</div>
              <div className={s.expense}>{data ? `−${formatAmount(data.totalExpense)}` : <Skeleton width={80} />}</div>
            </div>
          </div>
        </>
      )}
    </HomeCard>
  )
}
