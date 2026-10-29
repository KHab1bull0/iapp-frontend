import { useEffect, useState } from 'react'

/** Keep in sync with the bp-tablet mixin in styles/_mixins.scss. */
const MOBILE_QUERY = '(max-width: 1023px)'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/**
 * Add/edit is a full page on touch layouts and a dialog on desktop, so the
 * triggers need to know which they are about to open.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY)
}
