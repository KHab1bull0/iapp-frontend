import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useHideOnScroll } from './useHideOnScroll'

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

describe('useHideOnScroll', () => {
  const matchMedia = window.matchMedia
  beforeEach(() => {
    // Runs the frame at once; 0 = no frame left pending.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
  })
  afterEach(() => {
    window.matchMedia = matchMedia
    vi.unstubAllGlobals()
    scrollTo(0)
  })

  const phone = (matches: boolean) => {
    window.matchMedia = ((q: string) => ({ ...matchMedia(q), matches })) as typeof window.matchMedia
  }

  test('on a phone: hides scrolling down, shows again scrolling up, at the top and on a new page', () => {
    phone(true)
    const { result, rerender } = renderHook(({ page }) => useHideOnScroll(page), { initialProps: { page: '/a' } })
    expect(result.current).toBe(false)
    scrollTo(300)
    expect(result.current).toBe(true)
    scrollTo(280)
    expect(result.current).toBe(false)
    scrollTo(600)
    expect(result.current).toBe(true)
    rerender({ page: '/b' })
    expect(result.current).toBe(false)
    scrollTo(900)
    expect(result.current).toBe(true)
    scrollTo(10)
    expect(result.current).toBe(false)
  })

  test('on desktop nothing hides', () => {
    phone(false)
    const { result } = renderHook(() => useHideOnScroll('/a'))
    scrollTo(500)
    expect(result.current).toBe(false)
  })
})
