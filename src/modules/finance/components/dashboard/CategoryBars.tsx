import type { CategoryBreakdown } from '@/modules/finance/api/stats'
import { CURRENCY, formatAmount } from '@/core/lib/format'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import s from './CategoryBars.module.scss'

const SHOWN = 6

/**
 * Where the money went, largest first, as bars with the amount and share
 * written out. Bars read more exactly than a donut's slices.
 */
export function CategoryBars({ data }: { data: CategoryBreakdown[] }) {
  const t = useFinanceT()
  const catName = useCategoryName()
  const rows = data.filter((d) => d.type === 'expense').sort((a, b) => b.total - a.total)
  const max = Math.max(1, ...rows.map((r) => r.total))

  return (
    <section className={s.card} aria-label={t.stats.byCategory}>
      <h2 className={s.title}>{t.stats.byCategory}</h2>
      {rows.length === 0 ? (
        <p className={s.empty}>{t.stats.noExpenseSub}</p>
      ) : (
        <ul className={s.rows}>
          {rows.slice(0, SHOWN).map((r) => (
            <li key={r.categoryId} className={s.row} aria-label={t.stats.categoryRow(catName(r.name), r.percentage)}>
              <span className={s.icon} style={{ background: `${r.color}22` }} aria-hidden>
                {r.icon}
              </span>
              <div className={s.main}>
                <div className={s.line}>
                  <span className={s.name}>{catName(r.name)}</span>
                  <span className={s.amount}>
                    {formatAmount(r.total)} <span className={s.cur}>{CURRENCY}</span>
                  </span>
                </div>
                <div className={s.line}>
                  <span className={s.track}>
                    <span className={s.bar} style={{ width: `${(r.total / max) * 100}%`, background: r.color }} />
                  </span>
                  <span className={s.pct}>{r.percentage}%</span>
                </div>
              </div>
            </li>
          ))}
          {rows.length > SHOWN && <li className={s.more}>{t.stats.more(rows.length - SHOWN)}</li>}
        </ul>
      )}
    </section>
  )
}
