import clsx from 'clsx'
import { Search, ChevronDown } from 'lucide-react'
import type { Category } from '@/modules/finance/api/categories'
import type { TransactionFilters } from '@/modules/finance/api/transactions'
import s from './TransactionFilters.module.scss'

interface Props {
  filters: TransactionFilters
  onChange: (f: TransactionFilters) => void
  categories: Category[]
}

const TYPE_OPTIONS = [
  { value: '' as const,        label: 'All'    },
  { value: 'income' as const,  label: 'Income'  },
  { value: 'expense' as const, label: 'Expense' },
]

export function TransactionFilters({ filters, onChange, categories }: Props) {
  return (
    <div className={s.filterBar}>
      <div className={s.tabs}>
        {TYPE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            className={clsx(s.tab, (filters.type ?? '') === value && s.active)}
            onClick={() => onChange({ ...filters, type: value || undefined })}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={s.filterGrow}>
        <div className={s.filterSearch}>
          <Search size={15} />
          <input
            className={s.filterInput}
            placeholder="Search by note or category"
            value={filters.search ?? ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          />
        </div>
      </div>

      <div className={s.filterCat}>
        <select
          className={s.input}
          value={filters.categoryId ?? 'all'}
          onChange={(e) => onChange({ ...filters, categoryId: e.target.value === 'all' ? undefined : e.target.value })}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <span className={s.selectChev}><ChevronDown size={15} /></span>
      </div>
    </div>
  )
}
