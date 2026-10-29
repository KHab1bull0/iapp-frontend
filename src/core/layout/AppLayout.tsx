import { Suspense, useState } from 'react'
import clsx from 'clsx'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sun, Moon, Plus } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { ModuleTabs } from './ModuleTabs'
import { useTheme } from '@/core/contexts/ThemeContext'
import { Dialog, DialogContent, DialogTitle } from '@/core/components/ui/dialog'
import { activeModule, fabBehavior } from '@/core/modules/registry-utils'
import type { ModuleManifest } from '@/core/modules/types'
import { formatHeaderDate } from '@/core/lib/format'
import s from './AppLayout.module.scss'

interface AppLayoutProps {
  /** Passed in from App so core never imports a module. */
  modules: ModuleManifest[]
}

export function AppLayout({ modules }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const active = activeModule(modules, pathname)
  const HeaderAction = active?.headerAction
  const fab = fabBehavior(modules)

  const themeToggle = (
    <button className={s.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )

  return (
    <div className={clsx(s.app, sidebarCollapsed && s.collapsed)}>
      <Sidebar
        modules={modules}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      <main className={s.main}>
        <header className={s.mheader}>
          <div className={s.mheaderBrand}>
            <span className={s.mheaderTitle}>IAPP</span>
            <span className={s.mheaderDate}>{formatHeaderDate(new Date())}</span>
          </div>
          <div className={s.mheaderActions}>
            {HeaderAction ? <HeaderAction fallback={themeToggle} /> : themeToggle}
          </div>
        </header>

        <div className={s.scroll}>
          {active && active.pages.length > 1 && <ModuleTabs module={active} />}
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>

        {/* The FAB is itself tablet-and-below only, so it always routes. */}
        {fab.kind !== 'none' && (
          <button
            className={s.fab}
            onClick={() => (fab.kind === 'direct' ? navigate(fab.to) : setQuickAddOpen(true))}
            aria-label={fab.kind === 'direct' ? fab.label : 'Add'}
          >
            <Plus size={22} />
          </button>
        )}

        {fab.kind === 'menu' && (
          <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
            <DialogContent>
              <DialogTitle>Add</DialogTitle>
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
                    {label}
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
