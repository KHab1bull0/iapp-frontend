import { useCallback, useSyncExternalStore } from 'react'

/**
 * "20 more today": extra new words asked for on top of the daily number. It
 * holds for the day it was asked on, on this device; every view of today's
 * stack (review, its tag cards, the menu's count) reads the same number.
 */
const KEY = 'iapp-extra-new'
const EVENT = 'iapp-extra-new'

function read(day: string): number {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { day: string; n: number } | null
    return saved && saved.day === day ? saved.n : 0
  } catch {
    return 0
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function useExtraNew(day: string): [number, (more: number) => void] {
  const extra = useSyncExternalStore(subscribe, () => read(day), () => 0)
  const add = useCallback(
    (more: number) => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ day, n: read(day) + more }))
      } catch {
        // Private mode: the extra words just aren't remembered.
      }
      window.dispatchEvent(new Event(EVENT))
    },
    [day],
  )
  return [extra, add]
}
