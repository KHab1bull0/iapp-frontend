import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { X, Search } from 'lucide-react'
import { PeriodFilter } from './PeriodFilter'
import { DEFAULT_FILTERS, type TransactionFilterState } from './period'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './FilterDrawer.module.scss'

interface Props {
  open: boolean
  onClose: () => void
  filters: TransactionFilterState
  onApply: (f: TransactionFilterState) => void
}

export function FilterDrawer({ open, onClose, filters, onApply }: Props) {
  const t = useFinanceT()
  const [draft, setDraft] = useState<TransactionFilterState>(filters)

  // Start from the current filters each time the drawer opens. Done while
  // rendering (React's pattern for state that follows a prop), not in an
  // effect, which would paint the stale draft first.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setDraft(filters)
  }

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

  // Only what the sheet holds; the type and category on the page stay.
  function handleReset() {
    setDraft((d) => ({ ...d, search: undefined, period: DEFAULT_FILTERS.period, startDate: undefined, endDate: undefined }))
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

        {/* The search first, then the period; type and category are on the page itself. */}
        <div className={s.drawerBody}>
          <div className={s.field}>
            <span className={s.fieldLabel}>{t.filters.search}</span>
            <div className={s.filterSearch}>
              <Search size={15} />
              <input
                type="search"
                className={s.filterInput}
                placeholder={t.filters.searchPlaceholder}
                aria-label={t.filters.searchLabel}
                value={draft.search ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value || undefined }))}
              />
            </div>
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>{t.filters.period}</span>
            <PeriodFilter filters={draft} onChange={setDraft} />
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
