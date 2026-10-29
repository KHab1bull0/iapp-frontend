import { Suspense, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Outlet, useRoutes, type RouteObject } from 'react-router-dom'
import { AuthProvider } from '@/core/contexts/AuthContext'
import { ThemeProvider } from '@/core/contexts/ThemeContext'
import { ProtectedRoute } from '@/core/components/ProtectedRoute'
import { LegacyRedirect } from '@/core/components/LegacyRedirect'
import { ToastHost } from '@/core/components/ui/toast'
import { AppLayout } from '@/core/layout/AppLayout'
import type { ModuleManifest } from '@/core/modules/types'
import { MODULES } from '@/modules/registry'
import { AuthPage } from '@/pages/auth'
import { SettingsPage } from '@/pages/settings'
import { MenuPage } from '@/pages/menu'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

function buildRoutes(modules: ModuleManifest[]): RouteObject[] {
  return [
    { path: '/auth', element: <AuthPage /> },
    {
      element: <ProtectedRoute />,
      children: [
        // Full-screen tasks (a module's add/edit pages) sit OUTSIDE AppLayout:
        // they carry neither the mobile header nor the bottom nav, bring their
        // own back button and own the whole viewport.
        ...modules
          .filter((m) => m.fullscreenRoutes)
          .map((m) => ({
            path: m.basePath,
            element: (
              <Suspense fallback={null}>
                <Outlet />
              </Suspense>
            ),
            children: m.fullscreenRoutes,
          })),
        {
          element: <AppLayout modules={modules} />,
          children: [
            { index: true, element: <Navigate to="/finance" replace /> },
            ...modules.map((m) => ({ path: m.basePath, children: m.routes })),
            { path: 'settings', element: <SettingsPage /> },
            { path: 'menu', element: <MenuPage /> },
          ],
        },
        { path: 'transactions/*', element: <LegacyRedirect /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ]
}

const routes = buildRoutes(MODULES)

function AppRoutes() {
  return useRoutes(routes)
}

/** Wraps children in every module's provider, first module outermost. */
function ModuleProviders({ children }: { children: ReactNode }) {
  return MODULES.reduceRight<ReactNode>((inner, { id, provider: Provider }) => {
    return Provider ? <Provider key={id}>{inner}</Provider> : inner
  }, children)
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ModuleProviders>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />

              {/*
                Global, not per-layout: full-screen module pages live outside
                AppLayout and still toast on save.
              */}
              <ToastHost />
            </BrowserRouter>
          </AuthProvider>
        </ModuleProviders>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
