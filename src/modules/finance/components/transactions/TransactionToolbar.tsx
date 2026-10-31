import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import type { Category } from '@/modules/finance/api/categories'
import { advancedFilterCount } from './filterCount'
import { PeriodFilter } from './PeriodFilter'
import type { TransactionFilterState } from './period'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionToolbar.module.scss'

interface Props {
  filters: TransactionFilterState
  onChange: (f: TransactionFilterState) => void
  categories: Category[]
  onOpenFilters: () => void
}

/**
 * The phone's filters at the top of Transactions: search, category and period
 * inline, the type behind the Filters button.
 */
export function TransactionToolbar({ filters, onChange, categories, onOpenFilters }: Props) {
  const t = useFinanceT()
  const catName = useCategoryName()
  const more = advancedFilterCount(filters)

  return (
    <div className={s.toolbar}>
      <div className={s.search}>
        <Search size={15} />
        <input
          type="search"
          className={s.searchInput}
          placeholder={t.filters.searchNotes}
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          aria-label={t.filters.searchLabel}
        />
      </div>

      <div className={s.row}>
        <div className={s.category}>
          <select
            className={s.select}
            value={filters.categoryId ?? 'all'}
            onChange={(e) =>
              onChange({ ...filters, categoryId: e.target.value === 'all' ? undefined : e.target.value })
            }
            aria-label={t.category}
          >
            <option value="all">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {catName(c.name)}
              </option>
            ))}
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

      <PeriodFilter filters={filters} onChange={onChange} />
    </div>
  )
}
