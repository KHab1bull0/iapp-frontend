import { useState } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, formatFullDate, formatMonthLong, parseApiDate, weekdayHeaders } from '@/core/lib/format'
import { useCoreT } from '@/core/i18n/useCoreT'
import { monthGrid } from '@/core/lib/calendar'
import s from './Calendar.module.scss'

interface Props {
  /** YYYY-MM-DD */
  value: string | null
  onChange: (day: string) => void
  /** Today on this device; ringed. */
  today: string
  min?: string
  max?: string
  /** Several days shown selected at once (a task's done days), besides `value`. */
  selected?: ReadonlySet<string>
  /** Days whose change is being saved: dimmed, and not tappable meanwhile. */
  busy?: ReadonlySet<string>
}

/** A month of days to tap. Follows the app's language; never the browser's date format. */
export function Calendar({ value, onChange, today, min, max, selected, busy }: Props) {
  const t = useCoreT()
  const [month, setMonth] = useState((value ?? today).slice(0, 7))
  const cells = monthGrid(month)

  return (
    <div className={s.calendar}>
      <div className={s.head}>
        <button type="button" className={s.nav} onClick={() => setMonth(addMonths(month, -1))} aria-label={t.date.prevMonth} disabled={min !== undefined && month <= min.slice(0, 7)}>
          <ChevronLeft size={18} />
        </button>
        <span className={s.month} aria-live="polite">
          {formatMonthLong(month)}
        </span>
        <button type="button" className={s.nav} onClick={() => setMonth(addMonths(month, 1))} aria-label={t.date.nextMonth} disabled={max !== undefined && month >= max.slice(0, 7)}>
          <ChevronRight size={18} />
        </button>
      </div>
      <div className={s.grid} role="grid">
        {weekdayHeaders().map((w) => (
          <span key={w} className={s.weekday} role="columnheader">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`pad-${i}`} />
          const on = day === value || Boolean(selected?.has(day))
          const saving = Boolean(busy?.has(day))
          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              aria-selected={on}
              aria-busy={saving || undefined}
              aria-label={formatFullDate(parseApiDate(day))}
              disabled={(min !== undefined && day < min) || (max !== undefined && day > max)}
              className={clsx(s.day, on && s.selected, day === today && s.today, saving && s.busy)}
              onClick={() => !saving && onChange(day)}
            >
              {Number(day.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}
