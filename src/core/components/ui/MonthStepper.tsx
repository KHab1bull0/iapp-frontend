import clsx from 'clsx'
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
  size = 'md',
}: {
  /** "YYYY-MM" */
  value: string
  onChange: (month: string) => void
  max?: string
  label: string
  /** 'sm' sits in a card's header beside its title (32px controls). */
  size?: 'md' | 'sm'
}) {
  const t = useCoreT()
  const next = addMonths(value, 1)
  return (
    <div className={clsx(s.stepper, size === 'sm' && s.sm)} role="group" aria-label={label}>
      <button type="button" className={s.btn} onClick={() => onChange(addMonths(value, -1))} aria-label={t.date.prevMonth}>
        <ChevronLeft size={size === 'sm' ? 16 : 18} />
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
        <ChevronRight size={size === 'sm' ? 16 : 18} />
      </button>
    </div>
  )
}
