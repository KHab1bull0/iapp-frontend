import { Link } from 'react-router-dom'
import { ListGroup, ListRow } from '@/core/components/ui/List'
import type { RecentTransaction } from '@/modules/finance/api/stats'
import { formatShortDay, formatSignedMoney } from '@/core/lib/format'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { TextSkeleton } from '@/modules/finance/components/loading/Loading'
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
              <span className={tx.type === 'income' ? s.amtIn : undefined}>{formatSignedMoney(tx.amount, tx.type, tx.currency)}</span>
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

/** The latest entries before they arrive: the heading and three rows of the real rows' shape. */
export function RecentTransactionsSkeleton() {
  const t = useFinanceT()
  return (
    <div className={s.recent}>
      <div className={s.head}>
        <h2 className={s.title}>{t.stats.recent}</h2>
        <Link to="/finance/transactions" className={s.link}>
          {t.stats.viewAll}
        </Link>
      </div>
      <ListGroup>
        {[60, 45, 52].map((w) => (
          <ListRow
            key={w}
            title={<TextSkeleton width={`${w}%`} />}
            subtitle={<TextSkeleton width="35%" />}
            value={<TextSkeleton width={72} />}
            leading={<Skeleton width="var(--tile-md)" height="var(--tile-md)" radius="var(--radius-pill)" />}
          />
        ))}
      </ListGroup>
    </div>
  )
}
