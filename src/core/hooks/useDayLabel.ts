import { addDaysYmd, formatDay } from '@/core/lib/format'
import { useToday } from '@/core/hooks/useToday'
import { useCoreT } from '@/core/i18n/useCoreT'

/** "Today" / "Tomorrow" / "Yesterday", else "Wed, 3 Jun". */
export function useDayLabel() {
  const t = useCoreT()
  const today = useToday()
  return (day: string | null) => {
    if (!day) return t.date.noDate
    if (day === today) return t.date.today
    if (day === addDaysYmd(today, 1)) return t.date.tomorrow
    if (day === addDaysYmd(today, -1)) return t.date.yesterday
    return formatDay(day)
  }
}
