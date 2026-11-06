import { useState } from 'react'
import clsx from 'clsx'
import { CalendarDays, X } from 'lucide-react'
import { addDaysYmd } from '@/core/lib/format'
import { useToday } from '@/core/hooks/useToday'
import { useCoreT } from '@/core/i18n/useCoreT'
import { useDayLabel } from '@/core/hooks/useDayLabel'
import { Calendar } from './Calendar'
import { Sheet } from './Sheet'
import s from './DateField.module.scss'

interface Props {
  value: string | null
  onChange: (day: string | null) => void
  /** Field label, also the sheet's title. */
  label: string
  /** Offer "no date". */
  clearable?: boolean
  min?: string
  max?: string
  id?: string
}

/**
 * A date as a tappable chip that opens a calendar. Replaces input[type=date],
 * which prints the browser's own format ("06/11/2026") whatever the app's
 * language.
 */
export function DateField({ value, onChange, label, clearable = false, min, max, id }: Props) {
  const t = useCoreT()
  const today = useToday()
  const dayLabel = useDayLabel()
  const [open, setOpen] = useState(false)

  const pick = (day: string | null) => {
    onChange(day)
    setOpen(false)
  }

  const quick = [
    { day: today, label: t.date.today },
    { day: addDaysYmd(today, 1), label: t.date.tomorrow },
  ].filter(({ day }) => (min === undefined || day >= min) && (max === undefined || day <= max))

  return (
    <>
      <button
        id={id}
        type="button"
        className={clsx(s.field, !value && s.empty)}
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${dayLabel(value)}`}
      >
        <CalendarDays size={18} aria-hidden />
        <span className={s.value}>{dayLabel(value)}</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <div className={s.sheet}>
          <div className={s.quick}>
            {quick.map((q) => (
              <button
                key={q.day}
                type="button"
                className={clsx(s.chip, value === q.day && s.chipOn)}
                onClick={() => pick(q.day)}
              >
                {q.label}
              </button>
            ))}
            {clearable && (
              <button type="button" className={clsx(s.chip, !value && s.chipOn)} onClick={() => pick(null)}>
                <X size={14} aria-hidden /> {t.date.noDate}
              </button>
            )}
          </div>
          <Calendar value={value} onChange={pick} today={today} min={min} max={max} />
        </div>
      </Sheet>
    </>
  )
}
