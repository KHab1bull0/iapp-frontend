import { describe, expect, test } from 'vitest'
import { periodRange, toQuery } from './period'

const today = new Date(2026, 9, 29) // 29 Oct 2026, local time

describe('periodRange', () => {
  test('week is the last 7 days including today', () => {
    expect(periodRange('week', {}, today)).toEqual({ startDate: '2026-10-23', endDate: '2026-10-29' })
  })

  test('month is the calendar month today is in, first to last day', () => {
    expect(periodRange('month', {}, today)).toEqual({ startDate: '2026-10-01', endDate: '2026-10-31' })
    expect(periodRange('month', {}, new Date(2026, 1, 3))).toEqual({ startDate: '2026-02-01', endDate: '2026-02-28' })
  })

  test('all has no bounds', () => {
    expect(periodRange('all', { startDate: '2026-01-01' }, today)).toEqual({})
  })

  test('range uses the chosen dates', () => {
    expect(periodRange('range', { startDate: '2026-10-01', endDate: '2026-10-10' }, today)).toEqual({
      startDate: '2026-10-01',
      endDate: '2026-10-10',
    })
  })
})

describe('toQuery', () => {
  test('turns the period into API dates and drops the period itself', () => {
    expect(toQuery({ period: 'week', type: 'income', search: 'x' }, today)).toEqual({
      type: 'income',
      search: 'x',
      startDate: '2026-10-23',
      endDate: '2026-10-29',
    })
  })
})
