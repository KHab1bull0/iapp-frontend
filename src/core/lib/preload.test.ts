import { createElement, lazy, Suspense, type ComponentType } from 'react'
import { describe, expect, test, vi } from 'vitest'
import type { RouteObject } from 'react-router-dom'
import { canPreload, lazyRouteTypes, preloadLazy, preloadRoutes, whenIdle } from './preload'

const page = (): Promise<{ default: ComponentType }> => Promise.resolve({ default: () => null })

describe('preloadRoutes', () => {
  test('finds lazy pages anywhere in the tree, each once, and starts their downloads', () => {
    const a = vi.fn(page)
    const b = vi.fn(page)
    const A = lazy(a)
    const B = lazy(b)
    const routes: RouteObject[] = [
      { path: '/', element: createElement('div') },
      {
        element: createElement(Suspense, null, createElement(B)),
        children: [
          { path: 'a', element: createElement(A) },
          { path: 'a2', element: createElement(A) },
        ],
      },
    ]
    expect(lazyRouteTypes(routes)).toHaveLength(2)
    expect(preloadRoutes(routes)).toBe(2)
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    // Started already: a second pass does nothing.
    expect(preloadRoutes(routes)).toBe(0)
  })

  test('a failed download is put back, so the real navigation tries again', async () => {
    const load = vi.fn(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module')))
    const Broken = lazy(load as () => Promise<{ default: ComponentType }>)
    expect(preloadLazy(Broken)).toBe(true)
    await new Promise((r) => setTimeout(r, 0))
    expect(preloadLazy(Broken)).toBe(true)
    expect(load).toHaveBeenCalledTimes(2)
  })

  test('ignores anything that is not a lazy component', () => {
    expect(preloadLazy(() => null)).toBe(false)
    expect(preloadLazy({ $$typeof: Symbol.for('react.lazy') })).toBe(false)
    expect(preloadLazy(null)).toBe(false)
  })
})

describe('whenIdle', () => {
  test('falls back to a timer without requestIdleCallback, and can be cancelled', () => {
    vi.useFakeTimers()
    const w = window as { requestIdleCallback?: unknown }
    const saved = w.requestIdleCallback
    delete w.requestIdleCallback
    const cb = vi.fn()
    whenIdle(cb)
    vi.runAllTimers()
    expect(cb).toHaveBeenCalledTimes(1)
    const cancelled = vi.fn()
    whenIdle(cancelled)()
    vi.runAllTimers()
    expect(cancelled).not.toHaveBeenCalled()
    if (saved) w.requestIdleCallback = saved
    vi.useRealTimers()
  })

  test('uses requestIdleCallback where there is one', () => {
    const ric = vi.fn((cb: () => void) => {
      cb()
      return 1
    })
    const w = window as { requestIdleCallback?: unknown }
    const saved = w.requestIdleCallback
    w.requestIdleCallback = ric
    const cb = vi.fn()
    whenIdle(cb)
    expect(ric).toHaveBeenCalled()
    expect(cb).toHaveBeenCalledTimes(1)
    w.requestIdleCallback = saved
  })
})

describe('canPreload', () => {
  test('not offline', () => {
    const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(canPreload()).toBe(false)
    spy.mockReturnValue(true)
    expect(canPreload()).toBe(true)
    spy.mockRestore()
  })
})
