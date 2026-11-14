import { describe, expect, test } from 'vitest'
import { heatWeeks } from './heatWeeks'

describe('heatWeeks', () => {
  test('columns start on Monday and levels follow the busiest day', () => {
    // 2026-11-04 is a Wednesday: two blanks before it.
    const weeks = heatWeeks([
      { day: '2026-11-04', count: 0 },
      { day: '2026-11-05', count: 1 },
      { day: '2026-11-06', count: 4 },
    ])
    expect(weeks).toHaveLength(1)
    expect(weeks[0].slice(0, 2)).toEqual([null, null])
    expect(weeks[0].slice(2).map((c) => c?.level)).toEqual([0, 1, 4])
  })
})

describe('heatWeeks: a habit', () => {
  test('a two-minute day is lighter than a full one, and a rest day is marked apart', () => {
    // Monday 2026-11-02 onwards: full, min, rest, nothing.
    const [week] = heatWeeks([
      { day: '2026-11-02', count: 1, min: 0 },
      { day: '2026-11-03', count: 1, min: 1 },
      { day: '2026-11-04', count: 0, min: 0, rest: true },
      { day: '2026-11-05', count: 0, min: 0 },
    ])
    expect(week.map((c) => c?.level)).toEqual([4, 2, 0, 0])
    expect(week.map((c) => c?.min)).toEqual([false, true, false, false])
    expect(week.map((c) => c?.rest)).toEqual([false, false, true, false])
  })
})
