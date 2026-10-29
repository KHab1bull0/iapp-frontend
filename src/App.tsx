import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { AuthProvider } from '@/core/contexts/AuthContext'
import { ThemeProvider } from '@/core/contexts/ThemeContext'
import { ToastHost } from '@/core/components/ui/toast'
import { MODULES } from '@/modules/registry'
import { buildRoutes } from '@/routes'

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
