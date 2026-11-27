import clsx from 'clsx'
import { ArrowDownLeft, ArrowUpRight, ChevronDown, SlidersHorizontal } from 'lucide-react'
import type { Category } from '@/modules/finance/api/categories'
import type { TransactionTotals } from '@/modules/finance/api/transactions'
import { CURRENCY, formatAmount } from '@/core/lib/format'
import { advancedFilterCount } from './filterCount'
import type { TransactionFilterState } from './period'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionToolbar.module.scss'
import { CategoryOptions } from './CategoryOptions'
import { categoryFilterValue, withCategoryFilter } from '@/modules/finance/lib/categoryFilter'

interface Props {
  filters: TransactionFilterState
  onChange: (f: TransactionFilterState) => void
  categories: Category[]
  /** How many incomes and expenses the other filters find, and their sums; unknown while loading. */
  totals?: TransactionTotals
  onOpenFilters: () => void
}

/**
 * The top of Transactions: Income and Expense (each with its count; tap to
 * show only that type, tap again for both), the category, and the Filters
 * button for the search and the period.
 */
export function TransactionToolbar({ filters, onChange, categories, totals, onOpenFilters }: Props) {
  const t = useFinanceT()
  const more = advancedFilterCount(filters)
  // The name and count on top, the period's total under it.
  const typeButton = (type: 'income' | 'expense') => {
    const on = filters.type === type
    const sum = totals?.[type]
    const Icon = type === 'income' ? ArrowDownLeft : ArrowUpRight
    return (
      <button
        type="button"
        className={clsx(s.typeBtn, s[type], on && s.on)}
        aria-pressed={on}
        aria-label={sum ? `${t[type]}: ${sum.count}, ${formatAmount(sum.total)} ${CURRENCY}` : t[type]}
        onClick={() => onChange({ ...filters, type: on ? undefined : type })}
      >
        <span className={s.typeHead}>
          <Icon size={16} aria-hidden />
          <span className={s.typeName}>{t[type]}</span>
          <span className={s.typeCount}>{sum?.count ?? '–'}</span>
        </span>
        <span className={s.typeTotal}>
          {sum ? formatAmount(sum.total) : '–'} <span className={s.typeCur}>{CURRENCY}</span>
        </span>
      </button>
    )
  }

  return (
    <div className={s.toolbar}>
      <div className={s.types}>
        {typeButton('income')}
        {typeButton('expense')}
      </div>

      <div className={s.row}>
        <div className={s.category}>
          <select
            className={s.select}
            value={categoryFilterValue(filters)}
            onChange={(e) => onChange(withCategoryFilter(filters, e.target.value))}
            aria-label={t.category}
          >
            <CategoryOptions categories={categories} />
          </select>
          <ChevronDown size={15} className={s.chevron} />
        </div>

        <button
          className={s.filtersBtn}
          onClick={onOpenFilters}
          aria-label={more ? t.filters.moreActive(more) : t.filters.more}
        >
          <SlidersHorizontal size={16} />
          {t.filters.button}
          {more > 0 && <span className={s.badge}>{more}</span>}
        </button>
      </div>
    </div>
  )
}
