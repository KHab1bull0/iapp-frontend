import { Suspense } from 'react'
import { Navigate, Outlet, type RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '@/core/components/ProtectedRoute'
import { LegacyRedirect } from '@/core/components/LegacyRedirect'
import { ChunkErrorBoundary } from '@/core/components/ChunkErrorBoundary'
import { AppLayout } from '@/core/layout/AppLayout'
import type { ModuleManifest } from '@/core/modules/types'
import { AuthPage } from '@/pages/auth'
import { HomePage } from '@/pages/home'
import {
  AboutPage,
  PreferencesPage,
  ProfilePage,
  SecurityPage,
  SettingsIndex,
  SettingsLayout,
} from '@/pages/settings'
import { MenuPage } from '@/pages/menu'

export function buildRoutes(modules: ModuleManifest[]): RouteObject[] {
  return [
    { path: '/auth', element: <AuthPage /> },
    {
      element: <ProtectedRoute />,
      children: [
        // Full-screen tasks (a module's add/edit pages) sit OUTSIDE AppLayout:
        // they carry neither the mobile header nor the bottom nav, bring their
        // own back button and own the whole viewport.
        //
        // The wrapper is pathless and the children carry the full path: a
        // wrapper with path basePath would itself match basePath and, when a
        // module has no index route, win over the layout with an empty page.
        ...modules
          .filter((m) => m.fullscreenRoutes)
          .map((m) => ({
            element: (
              <ChunkErrorBoundary>
                <Suspense fallback={null}>
                  <Outlet />
                </Suspense>
              </ChunkErrorBoundary>
            ),
            children: m.fullscreenRoutes!.map((r) => ({ ...r, path: `${m.basePath}/${r.path}` })),
          })),
        {
          element: <AppLayout modules={modules} />,
          children: [
            { index: true, element: <HomePage /> },
            ...modules.map((m) => ({ path: m.basePath, children: m.routes })),
            {
              path: 'settings',
              element: <SettingsLayout modules={modules} />,
              children: [
                { index: true, element: <SettingsIndex /> },
                { path: 'profile', element: <ProfilePage /> },
                { path: 'security', element: <SecurityPage /> },
                { path: 'preferences', element: <PreferencesPage /> },
                { path: 'about', element: <AboutPage /> },
              ],
            },
            { path: 'menu', element: <MenuPage /> },
          ],
        },
        { path: 'transactions/*', element: <LegacyRedirect /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ]
}
