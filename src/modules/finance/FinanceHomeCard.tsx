import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Wallet } from 'lucide-react'
import { HomeCard } from '@/core/components/HomeCard'
import { CURRENCY, currentMonth, formatAmount, formatMonthLong, formatSigned } from '@/core/lib/format'
import { fetchFinanceSummary, financeSummaryKey } from './api/summary'
import { useFinanceT } from './i18n'
import { TextSkeleton } from './components/loading/Loading'
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
        <div className={s.body} aria-busy={!data || undefined}>
          {!data && <span className="sr-only">{t.home.loading}</span>}
          <div>
            <div className={s.label}>{t.home.balance}</div>
            <div className={s.headline}>
              {data ? (
                data.totalBalance === 0 ? (
                  formatAmount(0)
                ) : (
                  formatSigned(data.totalBalance, data.totalBalance > 0 ? 'income' : 'expense')
                )
              ) : (
                <TextSkeleton width={140} />
              )}
              <span className={s.currency}>{CURRENCY}</span>
            </div>
          </div>
          <div className={s.flows}>
            <div>
              <div className={s.label}>{t.income}</div>
              <div className={s.income}>{data ? `+${formatAmount(data.totalIncome)}` : <TextSkeleton width={80} />}</div>
            </div>
            <div>
              <div className={s.label}>{t.expense}</div>
              <div className={s.expense}>{data ? `−${formatAmount(data.totalExpense)}` : <TextSkeleton width={80} />}</div>
            </div>
          </div>
        </div>
      )}
    </HomeCard>
  )
}
