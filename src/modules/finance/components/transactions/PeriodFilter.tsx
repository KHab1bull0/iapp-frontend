import clsx from 'clsx'
import { ymd } from '@/core/lib/format'
import type { Period, TransactionFilterState } from './period'
import { useFinanceT } from '@/modules/finance/i18n'
import s from './PeriodFilter.module.scss'

const OPTIONS: Period[] = ['week', 'month', 'range', 'all']

interface Props {
  filters: TransactionFilterState
  onChange: (f: TransactionFilterState) => void
}

/** Week / Month / Range / All, with From–To pickers when Range is on. */
export function PeriodFilter({ filters, onChange }: Props) {
  const t = useFinanceT()
  const today = ymd(new Date())

  return (
    <div className={s.period}>
      <div className={s.segments} role="radiogroup" aria-label={t.filters.period}>
        {OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={filters.period === value}
            className={clsx(s.segment, filters.period === value && s.active)}
            onClick={() => onChange({ ...filters, period: value })}
          >
            {value === 'all' ? t.all : t.filters[value]}
          </button>
        ))}
      </div>

      {filters.period === 'range' && (
        <div className={s.range}>
          <input
            type="date"
            className={s.date}
            value={filters.startDate ?? ''}
            max={filters.endDate || today}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value || undefined })}
            aria-label={t.filters.from}
          />
          <span className={s.dash}>–</span>
          <input
            type="date"
            className={s.date}
            value={filters.endDate ?? ''}
            min={filters.startDate}
            max={today}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value || undefined })}
            aria-label={t.filters.to}
          />
        </div>
      )}
    </div>
  )
}
