import { describe, expect, test } from 'vitest'
import { reviewLabel } from './review'

describe('reviewLabel', () => {
  test('relative to today', () => {
    expect(reviewLabel('2026-10-31', '2026-10-31')).toBe('Due today')
    expect(reviewLabel('2026-10-29', '2026-10-31')).toBe('Due 2 days ago')
    expect(reviewLabel('2026-11-01', '2026-10-31')).toBe('Tomorrow')
    expect(reviewLabel('2026-11-07', '2026-10-31')).toBe('In 7 days')
  })
})
