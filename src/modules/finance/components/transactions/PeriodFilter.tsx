import clsx from 'clsx'
import { ymd } from '@/core/lib/format'
import type { Period, TransactionFilterState } from './period'
import s from './PeriodFilter.module.scss'

const OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'range', label: 'Range' },
  { value: 'all', label: 'All' },
]

interface Props {
  filters: TransactionFilterState
  onChange: (f: TransactionFilterState) => void
}

/** Week / Month / Range / All, with From–To pickers when Range is on. */
export function PeriodFilter({ filters, onChange }: Props) {
  const today = ymd(new Date())

  return (
    <div className={s.period}>
      <div className={s.segments} role="radiogroup" aria-label="Period">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={filters.period === value}
            className={clsx(s.segment, filters.period === value && s.active)}
            onClick={() => onChange({ ...filters, period: value })}
          >
            {label}
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
            aria-label="From"
          />
          <span className={s.dash}>–</span>
          <input
            type="date"
            className={s.date}
            value={filters.endDate ?? ''}
            min={filters.startDate}
            max={today}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value || undefined })}
            aria-label="To"
          />
        </div>
      )}
    </div>
  )
}
