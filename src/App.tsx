import { useEffect, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { AuthProvider } from '@/core/contexts/AuthContext'
import { ThemeProvider } from '@/core/contexts/ThemeContext'
import { LanguageProvider } from '@/core/i18n'
import { ToastHost } from '@/core/components/ui/toast'
import { MODULES } from '@/modules/registry'
import { buildRoutes } from '@/routes'
import { canPreload, preloadRoutes, whenIdle } from '@/core/lib/preload'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

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
  // Once the first screen is up and the browser has a quiet moment, fetch the
  // other pages' code too: later navigations then open without a wait.
  useEffect(() => {
    if (!canPreload()) return
    return whenIdle(() => preloadRoutes(routes))
  }, [])

  return (
    <LanguageProvider>
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
    </LanguageProvider>
  )
}
