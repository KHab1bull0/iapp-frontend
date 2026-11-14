import { parseApiDate } from '@/core/lib/format'

/** A day as the heatmap takes it; a habit's days also say how they were done. */
export interface HeatDay {
  day: string
  count: number
  /** Completions that were the two-minute version. */
  min?: number
  /** A planned rest day: neither done nor missed. */
  rest?: boolean
}

export interface HeatCell {
  day: string
  count: number
  /** 0 (none) … 4 (most), relative to the busiest day shown. */
  level: 0 | 1 | 2 | 3 | 4
  /** Done only in the two-minute version: drawn lighter by its level. */
  min: boolean
  /** A rest day with nothing done: its own neutral mark, not an empty square. */
  rest: boolean
}

/**
 * A two-minute check-in weighs half a full one, so a habit's light days
 * show lighter. `count` is taken to include them; if a server sent them
 * apart, the floor at zero keeps them showing all the same.
 */
const weight = ({ count, min = 0 }: HeatDay) => Math.max(0, count - min) + min * 0.5

/**
 * Days (oldest first, ending today) into week columns, Monday at the top.
 * The first column is padded with nulls before its first day.
 */
export function heatWeeks(days: HeatDay[]): (HeatCell | null)[][] {
  const max = Math.max(1, ...days.map(weight))
  const lead = days.length ? (parseApiDate(days[0].day).getDay() + 6) % 7 : 0
  const cells: (HeatCell | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...days.map((d) => {
      const w = weight(d)
      return {
        day: d.day,
        count: d.count,
        level: (w === 0 ? 0 : Math.max(1, Math.ceil((w / max) * 4))) as HeatCell['level'],
        min: (d.min ?? 0) > 0 && d.count <= (d.min ?? 0),
        rest: Boolean(d.rest) && w === 0,
      }
    }),
  ]
  const weeks: (HeatCell | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
