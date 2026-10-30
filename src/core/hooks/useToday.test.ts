import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useToday } from './useToday'

describe('useToday', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('rolls over at midnight', () => {
    vi.setSystemTime(new Date(2026, 9, 30, 23, 59, 50))
    const { result } = renderHook(() => useToday())
    expect(result.current).toBe('2026-10-30')
    act(() => vi.advanceTimersByTime(20_000))
    expect(result.current).toBe('2026-10-31')
  })

  test('catches up when the app comes back to the foreground', () => {
    vi.setSystemTime(new Date(2026, 9, 30, 12, 0))
    const { result } = renderHook(() => useToday())
    // The phone slept through midnight: timers didn't run, the clock moved.
    vi.setSystemTime(new Date(2026, 9, 31, 8, 0))
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(result.current).toBe('2026-10-31')
  })
})
