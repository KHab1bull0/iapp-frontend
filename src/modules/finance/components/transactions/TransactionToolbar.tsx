import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import type { Category } from '@/modules/finance/api/categories'
import { advancedFilterCount } from './filterCount'
import { PeriodFilter } from './PeriodFilter'
import type { TransactionFilterState } from './period'
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
  const more = advancedFilterCount(filters)

  return (
    <div className={s.toolbar}>
      <div className={s.search}>
        <Search size={15} />
        <input
          type="search"
          className={s.searchInput}
          placeholder="Search notes"
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          aria-label="Search transactions"
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
            aria-label="Category"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className={s.chevron} />
        </div>

        <button
          className={s.filtersBtn}
          onClick={onOpenFilters}
          aria-label={more ? `More filters (${more} active)` : 'More filters'}
        >
          <SlidersHorizontal size={16} />
          Filters
          {more > 0 && <span className={s.badge}>{more}</span>}
        </button>
      </div>

      <PeriodFilter filters={filters} onChange={onChange} />
    </div>
  )
}
