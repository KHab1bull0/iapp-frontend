import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { X, Search, ChevronDown } from 'lucide-react'
import type { Category } from '@/modules/finance/api/categories'
import { PeriodFilter } from './PeriodFilter'
import { DEFAULT_FILTERS, type TransactionFilterState } from './period'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import s from './FilterDrawer.module.scss'

interface Props {
  open: boolean
  onClose: () => void
  filters: TransactionFilterState
  onApply: (f: TransactionFilterState) => void
  categories: Category[]
}

const TYPE_OPTIONS = [{ value: '' as const }, { value: 'income' as const }, { value: 'expense' as const }]

export function FilterDrawer({ open, onClose, filters, onApply, categories }: Props) {
  const t = useFinanceT()
  const catName = useCategoryName()
  const [draft, setDraft] = useState<TransactionFilterState>(filters)

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
    setDraft(DEFAULT_FILTERS)
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
        aria-label={t.filters.title}
        inert={!open}
      >
        <div className={s.drawerHandle} />
        <div className={s.drawerHead}>
          <span className={s.drawerTitle}>{t.filters.title}</span>
          <button className={s.iconBtn} onClick={onClose} aria-label={t.filters.close}>
            <X size={18} />
          </button>
        </div>

        <div className={s.drawerBody}>
          <div className={s.field}>
            <span className={s.fieldLabel}>{t.filters.type}</span>
            <div className={s.tabs}>
              {TYPE_OPTIONS.map(({ value }) => (
                <button
                  key={value}
                  className={clsx(s.tab, (draft.type ?? '') === value && s.active)}
                  onClick={() => setDraft((d) => ({ ...d, type: value || undefined }))}
                >
                  {value ? t[value] : t.all}
                </button>
              ))}
            </div>
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>{t.filters.period}</span>
            <PeriodFilter filters={draft} onChange={setDraft} />
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>{t.filters.search}</span>
            <div className={s.filterSearch}>
              <Search size={15} />
              <input
                className={s.filterInput}
                placeholder={t.filters.searchPlaceholder}
                value={draft.search ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value || undefined }))}
              />
            </div>
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>{t.category}</span>
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
                <option value="all">{t.allCategories}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {catName(c.name)}
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
            {t.filters.reset}
          </button>
          <button className={s.btnPrimary} onClick={handleApply}>
            <Search size={15} /> {t.filters.apply}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
