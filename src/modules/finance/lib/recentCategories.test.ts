import { beforeEach, describe, expect, test } from 'vitest'
import { byRecent, recentCategoryIds, rememberCategory } from './recentCategories'

describe('recent categories', () => {
  beforeEach(() => localStorage.clear())

  test('remembers newest first, without repeats', () => {
    rememberCategory('a')
    rememberCategory('b')
    rememberCategory('a')
    expect(recentCategoryIds()).toEqual(['a', 'b'])
  })

  test('sorts recent ones first and keeps the rest in order', () => {
    const items = [{ id: 'x' }, { id: 'y' }, { id: 'z' }, { id: 'w' }]
    expect(byRecent(items, ['z', 'w']).map((i) => i.id)).toEqual(['z', 'w', 'x', 'y'])
  })
})
