import type { ReactNode } from 'react'
import clsx from 'clsx'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { CURRENCY, formatAmount, formatSigned } from '@/core/lib/format'
import { useFinanceT } from '@/modules/finance/i18n'
import { TextSkeleton } from '@/modules/finance/components/loading/Loading'
import { staleClass } from '@/modules/finance/components/loading/stale'
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
  stale = false,
}: {
  balance: number
  income: number
  expense: number
  /** On the right of the title, e.g. the month switcher. */
  accessory?: ReactNode
  /** Another month's figures, kept while this one's load: dimmed (the accessory is not). */
  stale?: boolean
}) {
  const t = useFinanceT()
  const dim = staleClass(stale)
  return (
    <section className={s.hero} aria-label={t.balance}>
      <div className={s.head}>
        <span className={s.headIcon} aria-hidden>
          <Wallet size={18} />
        </span>
        <span className={s.headTitle}>{t.balance}</span>
        {accessory && <div className={s.headAccessory}>{accessory}</div>}
      </div>
      <div className={clsx(s.amount, dim)}>
        {balance === 0 ? formatAmount(0) : formatSigned(balance, balance > 0 ? 'income' : 'expense')}
        <span className={s.currency}>{CURRENCY}</span>
      </div>
      <div className={clsx(s.flows, dim)}>
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

/**
 * The balance card before its figures arrive: the same head (with the month
 * switcher, so it can be used meanwhile), the labels, and a bar where each
 * number goes.
 */
export function BalanceHeroSkeleton({ accessory }: { accessory?: ReactNode }) {
  const t = useFinanceT()
  return (
    <div className={s.hero}>
      <div className={s.head}>
        <span className={s.headIcon} aria-hidden>
          <Wallet size={18} />
        </span>
        <span className={s.headTitle}>{t.balance}</span>
        {accessory && <div className={s.headAccessory}>{accessory}</div>}
      </div>
      <div className={s.amount}>
        <TextSkeleton width={180} />
      </div>
      <div className={s.flows}>
        <div className={s.flow}>
          <span className={clsx(s.flowIcon, s.flowIn)} aria-hidden>
            <TrendingUp size={16} />
          </span>
          <div>
            <div className={s.flowLabel}>{t.income}</div>
            <div className={s.flowValue}>
              <TextSkeleton width={96} />
            </div>
          </div>
        </div>
        <div className={s.flow}>
          <span className={clsx(s.flowIcon, s.flowOut)} aria-hidden>
            <TrendingDown size={16} />
          </span>
          <div>
            <div className={s.flowLabel}>{t.expense}</div>
            <div className={s.flowValue}>
              <TextSkeleton width={96} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
