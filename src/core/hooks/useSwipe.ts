import { useRef, useState, type PointerEvent } from 'react'

/** How far (px) a row has to travel before letting go acts. */
const THRESHOLD = 80

interface Options {
  /** Swiped to the right far enough. */
  onRight?: () => void
  /** Swiped to the left far enough. */
  onLeft?: () => void
}

/**
 * Horizontal swipe on a list row, touch only (a mouse drag selects text as
 * usual). Returns the offset to translate the row by and the handlers to
 * spread on it. Pair the row with `touch-action: pan-y` so vertical scrolling
 * still belongs to the page.
 */
export function useSwipe({ onRight, onLeft }: Options) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null)
  const locked = useRef<'x' | 'y' | null>(null)
  const [dx, setDx] = useState(0)

  const reset = () => {
    start.current = null
    locked.current = null
    setDx(0)
  }

  const handlers = {
    onPointerDown(e: PointerEvent) {
      if (e.pointerType !== 'touch' || (!onRight && !onLeft)) return
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    },
    onPointerMove(e: PointerEvent) {
      const s = start.current
      if (!s || s.id !== e.pointerId) return
      const x = e.clientX - s.x
      const y = e.clientY - s.y
      if (!locked.current && Math.hypot(x, y) > 8) {
        locked.current = Math.abs(x) > Math.abs(y) ? 'x' : 'y'
        // Keep the row's events while the finger wanders off it.
        if (locked.current === 'x') (e.currentTarget as Element).setPointerCapture?.(e.pointerId)
      }
      if (locked.current !== 'x') return
      // Only towards a side that does something, with resistance past the threshold.
      const allowed = (x > 0 && onRight) || (x < 0 && onLeft) ? x : 0
      const damped = Math.abs(allowed) > THRESHOLD ? Math.sign(allowed) * (THRESHOLD + (Math.abs(allowed) - THRESHOLD) * 0.3) : allowed
      setDx(damped)
    },
    onPointerUp() {
      if (dx >= THRESHOLD) onRight?.()
      else if (dx <= -THRESHOLD) onLeft?.()
      reset()
    },
    onPointerCancel: reset,
  }

  return { dx, armed: Math.abs(dx) >= THRESHOLD, handlers }
}
