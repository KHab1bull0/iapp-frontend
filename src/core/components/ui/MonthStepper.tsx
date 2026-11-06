import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, formatMonthLong } from '@/core/lib/format'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './MonthStepper.module.scss'

/**
 * ‹ November 2026 › — steps a month at a time. Replaces input[type=month],
 * which prints the browser's language ("November") in an Uzbek interface.
 */
export function MonthStepper({
  value,
  onChange,
  max,
  label,
}: {
  /** "YYYY-MM" */
  value: string
  onChange: (month: string) => void
  max?: string
  label: string
}) {
  const t = useCoreT()
  const next = addMonths(value, 1)
  return (
    <div className={s.stepper} role="group" aria-label={label}>
      <button type="button" className={s.btn} onClick={() => onChange(addMonths(value, -1))} aria-label={t.date.prevMonth}>
        <ChevronLeft size={18} />
      </button>
      <span className={s.value} aria-live="polite">
        {formatMonthLong(value)}
      </span>
      <button
        type="button"
        className={s.btn}
        onClick={() => onChange(next)}
        disabled={max !== undefined && next > max}
        aria-label={t.date.nextMonth}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
