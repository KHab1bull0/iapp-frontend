import { parseApiDate } from '@/core/lib/format'

/** A day as the heatmap takes it. */
export interface HeatDay {
  day: string
  count: number
}

export interface HeatCell {
  day: string
  count: number
  /** 0 (none) … 4 (most), relative to the busiest day shown. */
  level: 0 | 1 | 2 | 3 | 4
}

/**
 * Days (oldest first, ending today) into week columns, Monday at the top.
 * The first column is padded with nulls before its first day.
 */
export function heatWeeks(days: HeatDay[]): (HeatCell | null)[][] {
  const max = Math.max(1, ...days.map((d) => d.count))
  const lead = days.length ? (parseApiDate(days[0].day).getDay() + 6) % 7 : 0
  const cells: (HeatCell | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...days.map((d) => ({
      day: d.day,
      count: d.count,
      level: (d.count === 0 ? 0 : Math.max(1, Math.ceil((d.count / max) * 4))) as HeatCell['level'],
    })),
  ]
  const weeks: (HeatCell | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
