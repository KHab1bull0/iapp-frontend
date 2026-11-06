import { Link } from 'react-router-dom'
import { ListGroup, ListRow } from '@/core/components/ui/List'
import type { RecentTransaction } from '@/modules/finance/api/stats'
import { formatSigned, formatShortDay } from '@/core/lib/format'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import s from './RecentTransactions.module.scss'

/** The month's latest entries, with a way through to all of them. */
export function RecentTransactions({ transactions }: { transactions: RecentTransaction[] }) {
  const t = useFinanceT()
  const catName = useCategoryName()
  if (transactions.length === 0) return null

  return (
    <div className={s.recent}>
      <div className={s.head}>
        <h2 className={s.title}>{t.stats.recent}</h2>
        <Link to="/finance/transactions" className={s.link}>
          {t.stats.viewAll}
        </Link>
      </div>
      <ListGroup>
        {transactions.map((tx) => (
          <ListRow
            key={tx.id}
            title={tx.note ?? catName(tx.category.name)}
            subtitle={`${catName(tx.category.name)} · ${formatShortDay(tx.date)}`}
            value={
              <span className={tx.type === 'income' ? s.amtIn : undefined}>{formatSigned(tx.amount, tx.type)}</span>
            }
            leading={
              <span className={s.emoji} style={{ background: `${tx.category.color}22` }} aria-hidden>
                {tx.category.icon}
              </span>
            }
          />
        ))}
      </ListGroup>
    </div>
  )
}
