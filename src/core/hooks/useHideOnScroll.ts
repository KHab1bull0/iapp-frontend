import { useEffect, useState } from 'react'

/**
 * Phones: the app's bars (module tabs, bottom nav) get out of the way while
 * reading. Scrolling down past the top hides them; a little scroll up, or
 * reaching the top, brings them back. `resetKey` (the page) shows them again
 * on every new page. Desktop never hides anything.
 */
export function useHideOnScroll(resetKey: string): boolean {
  const [hidden, setHidden] = useState(false)
  const [key, setKey] = useState(resetKey)
  if (key !== resetKey) {
    setKey(resetKey)
    setHidden(false)
  }

  useEffect(() => {
    const phone = window.matchMedia('(max-width: 1023px)')
    let last = window.scrollY
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (!phone.matches) return setHidden(false)
        const y = window.scrollY
        const dy = y - last
        if (y < 56) setHidden(false)
        else if (dy > 8) setHidden(true)
        else if (dy < -8) setHidden(false)
        if (Math.abs(dy) > 8 || y < 56) last = y
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return hidden
}
