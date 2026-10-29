import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import type { ModuleManifest } from '@/core/modules/types'
import s from './ModuleTabs.module.scss'

/** Mobile switcher between a module's pages; the desktop sidebar groups them instead. */
export function ModuleTabs({ module }: { module: ModuleManifest }) {
  return (
    <nav className={s.tabs} aria-label={`${module.name} pages`}>
      {module.pages.map(({ path, label, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          className={({ isActive }) => clsx(s.tab, isActive && s.active)}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
