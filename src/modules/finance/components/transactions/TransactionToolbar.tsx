import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import type { Category } from '@/modules/finance/api/categories'
import type { TransactionFilters } from '@/modules/finance/api/transactions'
import { advancedFilterCount } from './filterCount'
import s from './TransactionToolbar.module.scss'

interface Props {
  filters: TransactionFilters
  onChange: (f: TransactionFilters) => void
  categories: Category[]
  onOpenFilters: () => void
}

/**
 * The phone's filter row at the top of Transactions: the two filters used most
 * (search and category) inline, everything else behind the Filters button.
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
    </div>
  )
}
