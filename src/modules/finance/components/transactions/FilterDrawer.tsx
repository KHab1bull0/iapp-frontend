import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { X, Search, ChevronDown } from 'lucide-react'
import type { Category } from '@/modules/finance/api/categories'
import type { TransactionFilters } from '@/modules/finance/api/transactions'
import s from './FilterDrawer.module.scss'

interface Props {
  open: boolean
  onClose: () => void
  filters: TransactionFilters
  onApply: (f: TransactionFilters) => void
  categories: Category[]
}

const TYPE_OPTIONS = [
  { value: '' as const,        label: 'All'     },
  { value: 'income' as const,  label: 'Income'  },
  { value: 'expense' as const, label: 'Expense' },
]

export function FilterDrawer({ open, onClose, filters, onApply, categories }: Props) {
  const [draft, setDraft] = useState<TransactionFilters>(filters)

  // Sync draft to current filters each time the drawer opens
  useEffect(() => { if (open) setDraft(filters) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // This is a hand-rolled drawer rather than a Radix primitive, so Escape has to
  // be wired up explicitly — it previously did nothing.
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  function handleApply() {
    onApply(draft)
    onClose()
  }

  function handleReset() {
    setDraft({})
  }

  return createPortal(
    <>
      <div
        className={clsx(s.drawerOverlay, open && s.open)}
        onClick={onClose}
      />
      {/* inert keeps the off-screen drawer out of the tab order — its inputs
          were still focusable while it was closed. */}
      <div
        className={clsx(s.drawer, open && s.open)}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        inert={!open}
      >
        <div className={s.drawerHead}>
          <span className={s.drawerTitle}>Filters</span>
          <button className={s.iconBtn} onClick={onClose} aria-label="Close filters">
            <X size={18} />
          </button>
        </div>

        <div className={s.drawerBody}>
          <div className={s.field}>
            <span className={s.fieldLabel}>Type</span>
            <div className={s.tabs}>
              {TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={clsx(s.tab, (draft.type ?? '') === value && s.active)}
                  onClick={() => setDraft((d) => ({ ...d, type: value || undefined }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>Search</span>
            <div className={s.filterSearch}>
              <Search size={15} />
              <input
                className={s.filterInput}
                placeholder="Search by note or category"
                value={draft.search ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value || undefined }))}
              />
            </div>
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>Category</span>
            <div className={s.inputWrap} style={{ position: 'relative' }}>
              <select
                className={clsx(s.input, s.select)}
                value={draft.categoryId ?? 'all'}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    categoryId: e.target.value === 'all' ? undefined : e.target.value,
                  }))
                }
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              <span className={s.selectChev}>
                <ChevronDown size={15} />
              </span>
            </div>
          </div>
        </div>

        <div className={s.drawerFooter}>
          <button className={s.btnSecondary} onClick={handleReset}>
            Reset
          </button>
          <button className={s.btnPrimary} onClick={handleApply}>
            <Search size={15} /> Search
          </button>
        </div>
        <div className={s.drawerHandle} />
      </div>
    </>,
    document.body,
  )
}
