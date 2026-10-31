import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import type { RecentTransaction } from '@/modules/finance/api/stats'
import { formatSigned, formatShortDay } from '@/core/lib/format'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import s from './RecentTransactions.module.scss'

interface Props {
  transactions: RecentTransaction[]
}

export function RecentTransactions({ transactions }: Props) {
  const navigate = useNavigate()
  const t = useFinanceT()
  const catName = useCategoryName()

  return (
    <section className={s.recent}>
      <div className={s.cardHead}>
        <h2 className={s.h3}>{t.stats.recent}</h2>
        <button className={s.link} onClick={() => navigate('/finance/transactions')}>{t.stats.viewAll}</button>
      </div>
      <div className={clsx(s.card, s.recentList)}>
        {transactions.length === 0 ? (
          <div className={s.empty} style={{ padding: '32px 20px' }}>
            <div className={s.emptyGlyph}>
              <span style={{ fontSize: 24 }}>💸</span>
            </div>
            <div className={s.emptyTitle}>{t.stats.noTransactions}</div>
            <div className={s.emptySub}>{t.stats.noTransactionsSub}</div>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className={s.txRow}>
              <div
                className={s.txCat}
                style={{ background: tx.category.color + '22', color: tx.category.color }}
              >
                {tx.category.icon}
              </div>
              <div className={s.txMeta}>
                <div className={s.txTitle}>{tx.note ?? catName(tx.category.name)}</div>
                <div className={s.txSub}>
                  {catName(tx.category.name)} · {formatShortDay(tx.date)}
                </div>
              </div>
              <div className={clsx(s.txAmt, tx.type === 'income' ? s.amtIn : s.amtOut)}>
                {formatSigned(tx.amount, tx.type)}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export function RecentTransactionsSkeleton() {
  return (
    <section className={s.recent}>
      <div className={s.cardHead}>
        <div style={{ height: 16, width: 160, background: 'var(--border)', borderRadius: 4 }} />
      </div>
      <div className={clsx(s.card, s.recentList)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={s.txRow} style={{ opacity: 0.5 + i * 0.1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 14, width: 120, background: 'var(--border)', borderRadius: 4 }} />
              <div style={{ height: 12, width: 80, background: 'var(--border)', borderRadius: 4 }} />
            </div>
            <div style={{ height: 14, width: 60, background: 'var(--border)', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </section>
  )
}
