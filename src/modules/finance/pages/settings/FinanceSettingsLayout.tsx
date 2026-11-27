import clsx from 'clsx'
import { NavLink, Outlet } from 'react-router-dom'
import { BackButton } from '@/core/components/BackButton'
import { useFinanceT } from '@/modules/finance/i18n'
import { settingsSections } from './sections'
// The app's Settings shell styles, so every settings looks and behaves alike.
import st from '@/pages/settings/settings.module.scss'

/**
 * Finance settings shell. Desktop: the sections on the left, the open one on
 * the right. Phones: the index is the list, each section its own page.
 */
export function FinanceSettingsLayout() {
  const t = useFinanceT()
  return (
    <div className={st.layout}>
      <aside className={st.sideNav}>
        <BackButton fallback="/finance" className={st.backLink} />
        <h1 className={st.sideNavTitle}>{t.settings.title}</h1>
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
