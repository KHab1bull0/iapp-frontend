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
