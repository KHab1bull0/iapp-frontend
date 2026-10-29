import { Navigate, useLocation } from 'react-router-dom'
import { legacyRedirect } from '@/core/modules/registry-utils'

/** Sends pre-module URLs (installed PWAs, bookmarks) to where the page lives now. */
export function LegacyRedirect() {
  const { pathname, search } = useLocation()
  return <Navigate to={legacyRedirect(pathname, search) ?? '/'} replace />
}
