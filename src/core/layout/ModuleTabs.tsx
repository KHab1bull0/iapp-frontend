import { useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { NavLink, useLocation } from 'react-router-dom'
import { Settings } from 'lucide-react'
import type { ModuleManifest } from '@/core/modules/types'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './ModuleTabs.module.scss'

/** The page the path is on: the longest page path it falls under; -1 = none. */
function activeIndex(paths: { path: string; end?: boolean }[], pathname: string): number {
  let best = -1
  paths.forEach((p, i) => {
    const hit = p.end ? pathname === p.path : pathname === p.path || pathname.startsWith(`${p.path}/`)
    if (hit && (best < 0 || p.path.length > paths[best].path.length)) best = i
  })
  return best
}

/**
 * Phones: a module's pages as tabs pinned under the status bar, each with its
 * icon, then a gear for the module's settings; a line slides under the one
 * open. They slide away while scrolling down (`hidden`). Desktop lists the
 * pages in the sidebar instead.
 */
export function ModuleTabs({ module, hidden = false }: { module: ModuleManifest; hidden?: boolean }) {
  const t = useCoreT()
  const text = useText()
  const { pathname } = useLocation()
  const settings = module.settingsPath
  const all = [...module.pages, ...(settings ? [{ path: settings, end: false }] : [])]
  const at = activeIndex(all, pathname)

  // The line's place: measured from the open tab, as tabs differ in width.
  const nav = useRef<HTMLElement>(null)
  const [line, setLine] = useState<{ left: number; width: number } | null>(null)
  useLayoutEffect(() => {
    const el = nav.current
    if (!el) return
    const measure = () => {
      const tab = el.querySelectorAll<HTMLElement>('[data-tab]')[at]
      setLine(tab ? { left: tab.offsetLeft, width: tab.offsetWidth } : null)
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [at])

  return (
    <div className={clsx(s.wrap, hidden && s.hidden)}>
      <nav ref={nav} className={s.tabs} aria-label={t.nav.pagesOf(text(module.name))}>
        {module.pages.map(({ path, label, end, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            viewTransition
            data-tab
            className={({ isActive }) => clsx(s.tab, isActive && s.active)}
          >
            <Icon size={18} aria-hidden />
            <span className={s.label}>{text(label)}</span>
          </NavLink>
        ))}
        {settings && (
          <NavLink
            to={settings}
            viewTransition
            data-tab
            aria-label={t.nav.settings}
            title={t.nav.settings}
            className={({ isActive }) => clsx(s.tab, s.gear, isActive && s.active)}
          >
            <Settings size={18} aria-hidden />
          </NavLink>
        )}
        {line && (
          <span
            className={s.indicator}
            style={{ width: line.width, transform: `translateX(${line.left}px)` }}
            aria-hidden
          />
        )}
      </nav>
    </div>
  )
}
