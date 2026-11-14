import { describe, expect, test } from 'vitest'
import { mondayOf, weekFromParam, weekRange } from './week'

describe('weeks', () => {
  test('mondayOf: weeks run Monday to Sunday', () => {
    expect(mondayOf('2026-11-09')).toBe('2026-11-09') // Monday
    expect(mondayOf('2026-11-14')).toBe('2026-11-09') // Saturday
    expect(mondayOf('2026-11-15')).toBe('2026-11-09') // Sunday
    expect(mondayOf('2026-11-16')).toBe('2026-11-16')
    expect(mondayOf('2026-01-01')).toBe('2025-12-29') // across a year
  })

  test('weekFromParam: any day of a past week, else the current one', () => {
    const today = '2026-11-14'
    expect(weekFromParam(null, today)).toBe('2026-11-09')
    expect(weekFromParam('2026-11-04', today)).toBe('2026-11-02')
    expect(weekFromParam('2026-11-02', today)).toBe('2026-11-02')
    // Nothing to review in a week still to come.
    expect(weekFromParam('2026-11-23', today)).toBe('2026-11-09')
    expect(weekFromParam('soon', today)).toBe('2026-11-09')
    expect(weekFromParam('2026-13-45', today)).toBe('2026-11-09')
  })

  test('weekRange: Monday to Sunday', () => {
    expect(weekRange('2026-11-09')).toBe('9 Nov – 15 Nov')
  })
})
