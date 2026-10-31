import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Wallet } from 'lucide-react'
import { CURRENCY, currentMonth, formatAmount, formatMonthLong } from '@/core/lib/format'
import { fetchFinanceSummary, financeSummaryKey } from './api/summary'
import { useFinanceT } from './i18n'
import s from './FinanceHomeCard.module.scss'

/** This month's balance, income and expense on the home page. */
export function FinanceHomeCard() {
  const t = useFinanceT()
  const month = currentMonth()
  const { data, isError, refetch } = useQuery({
    queryKey: financeSummaryKey(month),
    queryFn: () => fetchFinanceSummary(month),
  })

  return (
    <Link to="/finance" className={s.card}>
      <div className={s.head}>
        <span className={s.icon}><Wallet size={16} /></span>
        <span className={s.title}>{t.title}</span>
        <span className={s.period}>{formatMonthLong(month)}</span>
      </div>

      {isError ? (
        <div className={s.error}>
          {t.home.failed}
          <button
            className={s.retry}
            onClick={(e) => {
              // The whole card is a link; retrying must not navigate.
              e.preventDefault()
              void refetch()
            }}
          >
            <RefreshCw size={13} /> {t.retry}
          </button>
        </div>
      ) : (
        // Skeletons until data arrives, including a query paused while offline.
        <>
          <div className={s.balanceLabel}>{t.balance}</div>
          <div className={s.balance}>
            {data ? <span>{formatAmount(data.totalBalance)}</span> : <span className={s.skeleton} />}
            <span className={s.currency}>{CURRENCY}</span>
          </div>
          <div className={s.flows}>
            <div>
              <div className={s.flowLabel}>{t.income}</div>
              <div className={s.income}>
                {data ? `+${formatAmount(data.totalIncome)}` : <span className={s.skeletonSm} />}
              </div>
            </div>
            <div>
              <div className={s.flowLabel}>{t.expense}</div>
              <div className={s.expense}>
                {data ? `−${formatAmount(data.totalExpense)}` : <span className={s.skeletonSm} />}
              </div>
            </div>
          </div>
        </>
      )}
    </Link>
  )
}
