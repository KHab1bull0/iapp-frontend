import { Suspense, useState } from 'react'
import clsx from 'clsx'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { ModuleTabs } from './ModuleTabs'
import { Dialog, DialogContent, DialogTitle } from '@/core/components/ui/dialog'
import { ChunkErrorBoundary } from '@/core/components/ChunkErrorBoundary'
import { activeModule, fabBehavior, isModulePage } from '@/core/modules/registry-utils'
import type { ModuleManifest } from '@/core/modules/types'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './AppLayout.module.scss'

interface AppLayoutProps {
  /** Passed in from App so core never imports a module. */
  modules: ModuleManifest[]
}

export function AppLayout({ modules }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const t = useCoreT()
  const text = useText()
  const active = activeModule(modules, pathname)
  const fab = fabBehavior(modules)

  return (
    <div className={clsx(s.app, sidebarCollapsed && s.collapsed)}>
      <Sidebar
        modules={modules}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      <main className={s.main}>
        <div className={s.scroll}>
          {active && active.pages.length > 1 && isModulePage(active, pathname) && (
            <ModuleTabs module={active} />
          )}
          <ChunkErrorBoundary key={pathname}>
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </ChunkErrorBoundary>
        </div>

        {/* The FAB is itself tablet-and-below only, so it always routes. */}
        {fab.kind !== 'none' && (
          <button
            className={s.fab}
            onClick={() => (fab.kind === 'direct' ? navigate(fab.to) : setQuickAddOpen(true))}
            aria-label={fab.kind === 'direct' ? text(fab.label) : t.nav.add}
          >
            <Plus size={22} />
          </button>
        )}

        {fab.kind === 'menu' && (
          <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
            <DialogContent>
              <DialogTitle>{t.nav.add}</DialogTitle>
              <div className={s.quickAddList}>
                {fab.actions.map(({ id, label, icon: Icon, to }) => (
                  <button
                    key={id}
                    className={s.quickAddItem}
                    onClick={() => {
                      setQuickAddOpen(false)
                      navigate(to)
                    }}
                  >
                    <Icon size={18} />
                    {text(label)}
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <BottomNav modules={modules} />
      </main>
    </div>
  )
}
