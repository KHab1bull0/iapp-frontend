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
}

/** A month of days to tap. Follows the app's language; never the browser's date format. */
export function Calendar({ value, onChange, today, min, max }: Props) {
  const t = useCoreT()
  const [month, setMonth] = useState((value ?? today).slice(0, 7))
  const cells = monthGrid(month)

  return (
    <div className={s.calendar}>
      <div className={s.head}>
        <button type="button" className={s.nav} onClick={() => setMonth(addMonths(month, -1))} aria-label={t.date.prevMonth}>
          <ChevronLeft size={18} />
        </button>
        <span className={s.month} aria-live="polite">
          {formatMonthLong(month)}
        </span>
        <button type="button" className={s.nav} onClick={() => setMonth(addMonths(month, 1))} aria-label={t.date.nextMonth}>
          <ChevronRight size={18} />
        </button>
      </div>
      <div className={s.grid} role="grid">
        {weekdayHeaders().map((w) => (
          <span key={w} className={s.weekday} role="columnheader">
            {w}
          </span>
        ))}
        {cells.map((day, i) =>
          day === null ? (
            <span key={`pad-${i}`} />
          ) : (
            <button
              key={day}
              type="button"
              role="gridcell"
              aria-selected={day === value}
              aria-label={formatFullDate(parseApiDate(day))}
              disabled={(min !== undefined && day < min) || (max !== undefined && day > max)}
              className={clsx(s.day, day === value && s.selected, day === today && s.today)}
              onClick={() => onChange(day)}
            >
              {Number(day.slice(8))}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
