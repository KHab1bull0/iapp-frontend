import clsx from 'clsx'
import { NavLink, Outlet } from 'react-router-dom'
import { BackButton } from '@/core/components/BackButton'
import { useEnglishT } from '@/modules/english/i18n'
import { settingsSections } from './sections'
// The app's Settings shell styles, so both settings look and behave alike.
import st from '@/pages/settings/settings.module.scss'

/**
 * English settings shell. Desktop: the sections on the left, the open one on
 * the right. Phones: the index is the list, each section its own page.
 */
export function EnglishSettingsLayout() {
  const t = useEnglishT()
  return (
    <div className={st.layout}>
      <aside className={st.sideNav}>
        <BackButton fallback="/english" className={st.backLink} />
        <h1 className={st.sideNavTitle}>{t.title}</h1>
        <nav className={st.sideGroup} aria-label={t.settings.sections}>
          {settingsSections(t.settings).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => clsx(st.sideItem, isActive && st.active)}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  )
}
