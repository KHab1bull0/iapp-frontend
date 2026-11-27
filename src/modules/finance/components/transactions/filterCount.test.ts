import { describe, expect, test } from 'vitest'
import { advancedFilterCount } from './filterCount'

describe('advancedFilterCount', () => {
  test('counts what the Filters sheet holds: a search, and a period other than Month', () => {
    expect(advancedFilterCount({ period: 'month' })).toBe(0)
    expect(advancedFilterCount({ period: 'month', type: 'income', categoryId: 'c' })).toBe(0)
    expect(advancedFilterCount({ period: 'week' })).toBe(1)
    expect(advancedFilterCount({ period: 'range', search: 'x' })).toBe(2)
  })
})
