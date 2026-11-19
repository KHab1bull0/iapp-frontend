import clsx from 'clsx'
import { Search, ChevronDown } from 'lucide-react'
import type { Category } from '@/modules/finance/api/categories'
import { PeriodFilter } from './PeriodFilter'
import type { TransactionFilterState } from './period'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './TransactionFilters.module.scss'
import { CategoryOptions } from './CategoryOptions'
import { categoryFilterValue, withCategoryFilter } from '@/modules/finance/lib/categoryFilter'

interface Props {
  filters: TransactionFilterState
  onChange: (f: TransactionFilterState) => void
  categories: Category[]
}

const TYPE_OPTIONS = [{ value: '' as const }, { value: 'income' as const }, { value: 'expense' as const }]

export function TransactionFilters({ filters, onChange, categories }: Props) {
  const t = useFinanceT()
  return (
    <div className={s.filterBar}>
      <div className={s.tabs}>
        {TYPE_OPTIONS.map(({ value }) => (
          <button
            key={value}
            className={clsx(s.tab, (filters.type ?? '') === value && s.active)}
            onClick={() => onChange({ ...filters, type: value || undefined })}
          >
            {value ? t[value] : t.all}
          </button>
        ))}
      </div>

      <div className={s.filterPeriod}>
        <PeriodFilter filters={filters} onChange={onChange} />
      </div>

      <div className={s.filterGrow}>
        <div className={s.filterSearch}>
          <Search size={15} />
          <input
            className={s.filterInput}
            data-page-search
            aria-label={t.filters.searchLabel}
            placeholder={t.filters.searchPlaceholder}
            value={filters.search ?? ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          />
        </div>
      </div>

      <div className={s.filterCat}>
        <select
          className={s.input}
          value={categoryFilterValue(filters)}
          onChange={(e) => onChange(withCategoryFilter(filters, e.target.value))}
        >
          <CategoryOptions categories={categories} />
        </select>
        <span className={s.selectChev}><ChevronDown size={15} /></span>
      </div>
    </div>
  )
}
