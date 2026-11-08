import type { ReactNode } from 'react'
import clsx from 'clsx'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { CURRENCY, formatAmount, formatSigned } from '@/core/lib/format'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './SpendHero.module.scss'

/**
 * The Statistics page's headline card: the month's balance, big, with the
 * sign written out, and under it, in the same
 * card, the income and expenses it is made of (in the same currency).
 */
export function BalanceHero({
  balance,
  income,
  expense,
  accessory,
}: {
  balance: number
  income: number
  expense: number
  /** On the right of the title, e.g. the month switcher. */
  accessory?: ReactNode
}) {
  const t = useFinanceT()
  return (
    <section className={s.hero} aria-label={t.balance}>
      <div className={s.head}>
        <span className={s.headIcon} aria-hidden>
          <Wallet size={18} />
        </span>
        <span className={s.headTitle}>{t.balance}</span>
        {accessory && <div className={s.headAccessory}>{accessory}</div>}
      </div>
      <div className={s.amount}>
        {balance === 0 ? formatAmount(0) : formatSigned(balance, balance > 0 ? 'income' : 'expense')}
        <span className={s.currency}>{CURRENCY}</span>
      </div>
      <div className={s.flows}>
        <div className={s.flow}>
          <span className={clsx(s.flowIcon, s.flowIn)} aria-hidden>
            <TrendingUp size={16} />
          </span>
          <div>
            <div className={s.flowLabel}>{t.income}</div>
            <div className={clsx(s.flowValue, s.flowValueIn)}>+{formatAmount(income)}</div>
          </div>
        </div>
        <div className={s.flow}>
          <span className={clsx(s.flowIcon, s.flowOut)} aria-hidden>
            <TrendingDown size={16} />
          </span>
          <div>
            <div className={s.flowLabel}>{t.expense}</div>
            <div className={clsx(s.flowValue, s.flowValueOut)}>−{formatAmount(expense)}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
