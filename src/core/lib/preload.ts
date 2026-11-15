import { isValidElement, type ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'

/*
 * Warms every lazily loaded page once the app is idle, so the first tap on a
 * page is as quick as the second. Pages stay plain React.lazy (modules need
 * nothing extra): this walks the route tree and starts each lazy component's
 * own loader, which leaves it resolved for React's first render of it.
 *
 * That loader is React's, not public API, so every step is guarded: a React
 * that looks different is simply not preloaded. A failed download is put back
 * the way it was, so the real navigation later tries again by itself.
 */

const LAZY = Symbol.for('react.lazy')
const UNINITIALIZED = -1
const REJECTED = 2

interface LazyPayload {
  _status: number
  _result: unknown
}

interface LazyType {
  $$typeof: symbol
  _payload: LazyPayload
  _init: (payload: LazyPayload) => unknown
}

function isLazy(type: unknown): type is LazyType {
  if (typeof type !== 'object' || type === null) return false
  const t = type as Partial<LazyType>
  return t.$$typeof === LAZY && typeof t._init === 'function' && typeof t._payload === 'object' && t._payload !== null
}

/** Starts one lazy component's download; true if it started one. */
export function preloadLazy(type: unknown): boolean {
  if (!isLazy(type)) return false
  const payload = type._payload
  if (payload._status !== UNINITIALIZED || typeof payload._result !== 'function') return false
  const load = payload._result
  try {
    type._init(payload)
  } catch (pending) {
    // The loader throws its promise while loading: that is the normal case.
    if (pending && typeof (pending as PromiseLike<unknown>).then === 'function') {
      ;(pending as PromiseLike<unknown>).then(undefined, () => {
        if (payload._status === REJECTED) {
          payload._status = UNINITIALIZED
          payload._result = load
        }
      })
    }
  }
  return true
}

/** Every lazy component in an element tree (an element, its children, theirs). */
function lazyTypesIn(node: ReactNode, found: Set<unknown>, depth = 0) {
  if (depth > 8 || node === null || node === undefined || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) lazyTypesIn(child, found, depth + 1)
    return
  }
  if (!isValidElement(node)) return
  if (isLazy(node.type)) found.add(node.type)
  lazyTypesIn((node.props as { children?: ReactNode }).children, found, depth + 1)
}

/** Every lazy page under these routes, each once. */
export function lazyRouteTypes(routes: RouteObject[]): unknown[] {
  const found = new Set<unknown>()
  const walk = (list: RouteObject[]) => {
    for (const route of list) {
      lazyTypesIn(route.element, found)
      if (route.Component && isLazy(route.Component)) found.add(route.Component)
      if (route.children) walk(route.children)
    }
  }
  walk(routes)
  return [...found]
}

/** Starts downloading every lazy page in the route tree. Returns how many it started. */
export function preloadRoutes(routes: RouteObject[]): number {
  let started = 0
  for (const type of lazyRouteTypes(routes)) {
    try {
      if (preloadLazy(type)) started++
    } catch {
      // Never let warming up break the app.
    }
  }
  return started
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (id: number) => void
}

/** Runs `cb` when the browser is idle (or after a short wait where it can't say). Returns a cancel. */
export function whenIdle(cb: () => void, timeout = 3000): () => void {
  const w = window as IdleWindow
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(cb, { timeout })
    return () => w.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(cb, 1500)
  return () => window.clearTimeout(id)
}

/** Whether downloading pages ahead of time is welcome: online, and no data saver. */
export function canPreload(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  if (nav.onLine === false) return false
  return !nav.connection?.saveData
}
