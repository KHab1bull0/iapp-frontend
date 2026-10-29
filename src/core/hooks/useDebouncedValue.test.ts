import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('only settles on the last value once input stops', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
      initialProps: { v: 'c' },
    })
    rerender({ v: 'co' })
    rerender({ v: 'cof' })
    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('c')
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('cof')
  })
})
