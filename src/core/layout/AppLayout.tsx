import { Suspense, useEffect, useState } from 'react'
import clsx from 'clsx'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { ModuleTabs } from './ModuleTabs'
import { useHideOnScroll } from '@/core/hooks/useHideOnScroll'
import { CommandPalette } from './CommandPalette'
import { DesktopTopBar } from './DesktopTopBar'
import { ShortcutsDialog } from './ShortcutsDialog'
import { ChunkErrorBoundary } from '@/core/components/ChunkErrorBoundary'
import { activeModule, isModulePage } from '@/core/modules/registry-utils'
import type { ModuleManifest } from '@/core/modules/types'
import { QuickAddProvider } from '@/core/quickAdd/QuickAddProvider'
import { isDialogOpen, isTyping } from '@/core/lib/dom'
import { usePushBridge } from '@/core/notifications/usePushBridge'
import s from './AppLayout.module.scss'

const SIDEBAR_KEY = 'iapp-sidebar-collapsed'

interface AppLayoutProps {
  /** Passed in from App so core never imports a module. */
  modules: ModuleManifest[]
}

export function AppLayout({ modules }: AppLayoutProps) {
  // Remembered on this device: a folded sidebar stays folded.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1')
  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])
  const [paletteOpen, setPaletteOpen] = useState(false)
  usePushBridge()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { pathname } = useLocation()
  const active = activeModule(modules, pathname)
  const onModulePage = Boolean(active && isModulePage(active, pathname))
  // A module's own settings open from the gear in its tabs, so the tabs stay there too.
  const onModuleSettings = Boolean(
    active?.settingsPath && (pathname === active.settingsPath || pathname.startsWith(`${active.settingsPath}/`)),
  )

  // "?" lists the shortcuts, "/" jumps to the page's search, "[" folds the sidebar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey || isDialogOpen()) return
      if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen(true)
      } else if (e.key === '/') {
        // The visible one: a page can keep a phone and a desktop search side by side.
        const search = Array.from(document.querySelectorAll<HTMLInputElement>('[data-page-search]')).find(
          (el) => el.offsetParent !== null,
        )
        if (search) {
          e.preventDefault()
          search.focus()
        }
      } else if (e.key === '[') {
        setSidebarCollapsed((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Phones: the tabs and bottom nav slide away while scrolling down.
  const barsHidden = useHideOnScroll(pathname)
  // Sticky bits under the tabs (a page's search) follow them up: --module-tabs-h.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-bars-hidden', barsHidden)
  }, [barsHidden])

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
            {active && onModulePage && (
              <DesktopTopBar module={active} pathname={pathname} onShortcuts={() => setShortcutsOpen(true)} />
            )}
            {active && active.pages.length > 1 && (onModulePage || onModuleSettings) && (
              <ModuleTabs module={active} hidden={barsHidden} />
            )}
            <ChunkErrorBoundary key={pathname}>
              <Suspense fallback={null}>
                <Outlet />
              </Suspense>
            </ChunkErrorBoundary>
          </div>

          <BottomNav modules={modules} hidden={barsHidden} />
        </main>
      </div>
      <CommandPalette modules={modules} open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </QuickAddProvider>
  )
}
