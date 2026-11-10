import { formatDay, formatMonthLong, formatMonthShort } from '@/core/lib/format'
import type { ScorePoint, StatsPoint } from '@/modules/tasks/api/tasks'
import type { ChartPoint } from './ProgressChart'

export type Period = 'daily' | 'monthly'

/** The daily chart shows the last month; the heatmap shows the whole history fetched. */
export const CHART_DAYS = 30

type Series<P> = { daily: (P & { day: string })[]; monthly: (P & { month: string })[] }

/** What the line follows: the running total, or (one task) the score that also drops on missed days. */
export type Line = 'cumulative' | 'score'

const lineOf = (p: StatsPoint & Partial<ScorePoint>, line: Line) => ({
  line: line === 'score' ? (p.score ?? p.cumulative) : p.cumulative,
  missed: line === 'score' ? (p.missed ?? 0) : 0,
})

/**
 * The chosen period's points, labelled for the axis and the tooltip: a day
 * on the axis is just its number ("12"; the tooltip says the date), a month
 * its short name ("Noy").
 */
export function toChartPoints<P extends StatsPoint & Partial<ScorePoint>>(
  stats: Series<P>,
  period: Period,
  line: Line = 'cumulative',
): ChartPoint[] {
  if (period === 'daily') {
    return stats.daily.slice(-CHART_DAYS).map((p) => ({
      ...p,
      ...lineOf(p, line),
      label: String(Number(p.day.slice(8))),
      title: formatDay(p.day),
    }))
  }
  return stats.monthly.map((p) => ({
    ...p,
    ...lineOf(p, line),
    label: formatMonthShort(p.month),
    title: formatMonthLong(p.month),
  }))
}
