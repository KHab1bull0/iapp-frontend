import { useLayoutEffect, useRef } from 'react'

/**
 * Grows a textarea with its text: one row when short, taller as lines wrap
 * or are added, never a scrollbar. Re-measures when the text changes and
 * when the field's width changes (a narrower field wraps more). Returns the
 * ref to put on the textarea.
 */
export function useAutosize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      // Shrink first so scrollHeight reports the text's height, not the old box's.
      el.style.height = 'auto'
      const borders = el.offsetHeight - el.clientHeight
      el.style.height = `${el.scrollHeight + borders}px`
    }
    fit()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [value])

  return ref
}
