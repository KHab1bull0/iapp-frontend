import { describe, expect, test } from 'vitest'
import { advancedFilterCount } from './filterCount'

describe('advancedFilterCount', () => {
  test('counts only what the toolbar does not show: the type', () => {
    expect(advancedFilterCount({ period: 'week' })).toBe(0)
    expect(advancedFilterCount({ period: 'range', search: 'x', categoryId: 'c', startDate: 'a' })).toBe(0)
    expect(advancedFilterCount({ period: 'week', type: 'income' })).toBe(1)
  })
})
