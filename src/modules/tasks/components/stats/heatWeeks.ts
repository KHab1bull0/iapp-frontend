import { parseApiDate } from '@/core/lib/format'

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
export function heatWeeks(days: { day: string; count: number }[]): (HeatCell | null)[][] {
  const max = Math.max(1, ...days.map((d) => d.count))
  const lead = days.length ? (parseApiDate(days[0].day).getDay() + 6) % 7 : 0
  const cells: (HeatCell | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...days.map(({ day, count }) => ({
      day,
      count,
      level: (count === 0 ? 0 : Math.max(1, Math.ceil((count / max) * 4))) as HeatCell['level'],
    })),
  ]
  const weeks: (HeatCell | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
