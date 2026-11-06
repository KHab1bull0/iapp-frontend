import { Suspense, useState } from 'react'
import clsx from 'clsx'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { ModuleTabs } from './ModuleTabs'
import { CommandPalette } from './CommandPalette'
import { ChunkErrorBoundary } from '@/core/components/ChunkErrorBoundary'
import { activeModule, isModulePage } from '@/core/modules/registry-utils'
import type { ModuleManifest } from '@/core/modules/types'
import { QuickAddProvider } from '@/core/quickAdd/QuickAddProvider'
import s from './AppLayout.module.scss'

interface AppLayoutProps {
  /** Passed in from App so core never imports a module. */
  modules: ModuleManifest[]
}

export function AppLayout({ modules }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { pathname } = useLocation()
  const active = activeModule(modules, pathname)

  return (
    <QuickAddProvider modules={modules}>
      <div className={clsx(s.app, sidebarCollapsed && s.collapsed)}>
        <Sidebar
          modules={modules}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
          onSearch={() => setPaletteOpen(true)}
        />

        <main className={s.main}>
          <div className={s.scroll}>
            {active && active.pages.length > 1 && isModulePage(active, pathname) && <ModuleTabs module={active} />}
            <ChunkErrorBoundary key={pathname}>
              <Suspense fallback={null}>
                <Outlet />
              </Suspense>
            </ChunkErrorBoundary>
          </div>

          <BottomNav modules={modules} />
        </main>
      </div>
      <CommandPalette modules={modules} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </QuickAddProvider>
  )
}
