import { useCallback, useSyncExternalStore } from 'react'

/** Keep in sync with the bp-tablet mixin in styles/_mixins.scss. */
const MOBILE_QUERY = '(max-width: 1023px)'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

/**
 * Phone and tablet layouts (bottom bar, sheets from the bottom) versus the
 * desktop one (sidebar, centred dialogs).
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY)
}
