import { formatDay, formatMonthLong, formatMonthShort, formatShortDay } from '@/core/lib/format'
import type { StatsPoint } from '@/modules/tasks/api/tasks'
import type { ChartPoint } from './ProgressChart'

export type Period = 'daily' | 'monthly'

type Series<P> = { daily: (P & { day: string })[]; monthly: (P & { month: string })[] }

/** The chosen period's points, labelled for the axis and the tooltip. */
export function toChartPoints<P extends StatsPoint>(stats: Series<P>, period: Period): ChartPoint[] {
  if (period === 'daily') {
    return stats.daily.map((p) => ({ ...p, label: formatShortDay(p.day), title: formatDay(p.day) }))
  }
  return stats.monthly.map((p) => ({ ...p, label: formatMonthShort(p.month), title: formatMonthLong(p.month) }))
}
