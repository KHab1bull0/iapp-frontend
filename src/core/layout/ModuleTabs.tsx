import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import type { ModuleManifest } from '@/core/modules/types'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './ModuleTabs.module.scss'

/**
 * Phones: a module's pages as a segmented switcher pinned under the status
 * bar. Desktop lists them in the sidebar instead.
 */
export function ModuleTabs({ module }: { module: ModuleManifest }) {
  const t = useCoreT()
  const text = useText()
  return (
    <div className={s.wrap}>
      <nav className={s.tabs} aria-label={t.nav.pagesOf(text(module.name))}>
        {module.pages.map(({ path, label, end }) => (
          <NavLink key={path} to={path} end={end} viewTransition className={({ isActive }) => clsx(s.tab, isActive && s.active)}>
            {text(label)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
