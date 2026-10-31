import clsx from 'clsx'
import { NavLink, Outlet } from 'react-router-dom'
import type { ModuleManifest } from '@/core/modules/types'
import { SignOutButton } from '@/core/components/SignOutButton'
import { useLang } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import { settingsNav, type SettingsNavGroup } from './nav'
import s from './settings.module.scss'

export interface SettingsOutletContext {
  groups: SettingsNavGroup[]
}

export function SettingsLayout({ modules }: { modules: ModuleManifest[] }) {
  const { lang } = useLang()
  const t = useCoreT()
  const groups = settingsNav(modules, lang)

  return (
    <div className={s.layout}>
      <aside className={s.sideNav} aria-label={t.settings.sections}>
        <h1 className={s.sideNavTitle}>{t.settings.title}</h1>
        {groups.map((g) => (
          <nav key={g.title} className={s.sideGroup} aria-label={g.title}>
            <div className={s.groupTitle}>{g.title}</div>
            {g.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => clsx(s.sideItem, isActive && s.active)}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        ))}
        <div className={s.sideFooter}>
          <SignOutButton variant="compact" />
        </div>
      </aside>

      <div>
        <Outlet context={{ groups } satisfies SettingsOutletContext} />
      </div>
    </div>
  )
}
