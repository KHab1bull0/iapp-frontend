import { describe, expect, test } from 'vitest'
import { paceVsLast } from './pace'

describe('paceVsLast', () => {
  test('compares by the last day that has come', () => {
    expect(
      paceVsLast([
        { day: 1, current: 100, previous: 50 },
        { day: 2, current: 150, previous: 100 },
        { day: 3, current: null, previous: 300 },
      ]),
    ).toEqual({ pct: 50, more: true })
    expect(paceVsLast([{ day: 1, current: 80, previous: 100 }])).toEqual({ pct: 20, more: false })
  })

  test('says nothing without last month to compare with', () => {
    expect(paceVsLast([{ day: 1, current: 80, previous: 0 }])).toBeNull()
    expect(paceVsLast([])).toBeNull()
  })
})
