import { Suspense, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ChunkErrorBoundary } from '@/core/components/ChunkErrorBoundary'
import { PageSkeleton } from '@/core/components/ui/PageSkeleton'
import { TopProgress } from '@/core/components/ui/TopProgress'

/** What a page shows while its code downloads: the top bar at once, the page shape a moment later. */
export function RouteFallback() {
  return (
    <>
      <TopProgress />
      <PageSkeleton />
    </>
  )
}

/**
 * Where lazily loaded pages render. Keyed by path, so every navigation mounts
 * a fresh boundary: React then shows the fallback for a page whose code isn't
 * here yet, instead of holding the old page on screen with no sign of the tap
 * (navigations run as transitions). A chunk gone after a deploy reloads once.
 */
export function RouteSuspense({ children = <Outlet /> }: { children?: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <ChunkErrorBoundary key={pathname}>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </ChunkErrorBoundary>
  )
}
