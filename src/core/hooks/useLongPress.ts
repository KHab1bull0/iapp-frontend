import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'

/** How long (ms) a finger rests on a row before it counts as a long-press. */
const HOLD_MS = 500
/** Moving further (px) than this is a swipe or a scroll, not a press. */
const SLOP = 8
/** The click a released long-press produces arrives just after; it is swallowed within this window (ms). */
const CLICK_GUARD_MS = 400

interface Options {
  /** Released after a long hold. Left out, the hook does nothing. */
  onLongPress?: () => void
  /** The hold was recognised (the finger is still down): stop any other gesture on the element. */
  onHold?: () => void
}

/**
 * Press and hold, touch and pen only: a mouse has a visible button instead
 * (pass the same action to it). It shares the row with a tap (open) and a
 * swipe (useSwipe), so:
 * - moving past a few pixels before the hold ends it, leaving the touch to the swipe or the scroll;
 * - once held, `onHold` lets the caller cancel the swipe, and the action runs on release,
 *   so the sheet it opens isn't under the finger when it lifts;
 * - the click that follows the release is swallowed (capture phase), so the tap's own
 *   action (and a tick under the finger) doesn't fire too.
 */
export function useLongPress({ onLongPress, onHold }: Options) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const start = useRef<{ x: number; y: number; id: number } | null>(null)
  const fired = useRef(false)
  const guardUntil = useRef(0)
  const [held, setHeld] = useState(false)

  useEffect(() => () => clearTimeout(timer.current), [])

  const end = () => {
    clearTimeout(timer.current)
    start.current = null
    fired.current = false
    setHeld(false)
  }

  const handlers = {
    onPointerDown(e: PointerEvent) {
      if (!onLongPress || e.pointerType === 'mouse') return
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
      fired.current = false
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        fired.current = true
        setHeld(true)
        onHold?.()
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(10)
      }, HOLD_MS)
    },
    onPointerMove(e: PointerEvent) {
      const s = start.current
      if (!s || s.id !== e.pointerId || fired.current) return
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > SLOP) end()
    },
    onPointerUp() {
      if (fired.current) {
        guardUntil.current = Date.now() + CLICK_GUARD_MS
        onLongPress?.()
      }
      end()
    },
    onPointerCancel: end,
    onClickCapture(e: MouseEvent) {
      if (Date.now() < guardUntil.current) {
        guardUntil.current = 0
        e.preventDefault()
        e.stopPropagation()
      }
    },
    // Android opens the context menu on a long touch; a mouse's right click keeps its menu.
    onContextMenu(e: MouseEvent) {
      if (start.current || fired.current) e.preventDefault()
    },
  }

  return { held, handlers }
}

/** Calls each handler in turn: two gestures' handlers on one element. */
export function chain<E>(...fns: (((e: E) => void) | undefined)[]) {
  return (e: E) => fns.forEach((f) => f?.(e))
}
