import { describe, expect, test } from 'vitest'
import { advancedFilterCount } from './filterCount'

describe('advancedFilterCount', () => {
  test('counts only what the toolbar does not show: type and dates', () => {
    expect(advancedFilterCount({})).toBe(0)
    expect(advancedFilterCount({ search: 'x', categoryId: 'c' })).toBe(0)
    expect(advancedFilterCount({ type: 'income', startDate: '2026-10-01' })).toBe(2)
    expect(advancedFilterCount({ type: 'expense', startDate: 'a', endDate: 'b' })).toBe(3)
  })
})
