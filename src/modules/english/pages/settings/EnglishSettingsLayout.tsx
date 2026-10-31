import clsx from 'clsx'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { SECTIONS } from './sections'
// The app's Settings shell styles, so both settings look and behave alike.
import st from '@/pages/settings/settings.module.scss'

/**
 * English settings shell. Desktop: the sections on the left, the open one on
 * the right. Phones: the index is the list, each section its own page.
 */
export function EnglishSettingsLayout() {
  return (
    <div className={st.layout}>
      <aside className={st.sideNav}>
        <Link to="/settings" className={st.backLink}>
          <ChevronLeft size={18} /> Settings
        </Link>
        <h1 className={st.sideNavTitle}>English</h1>
        <nav className={st.sideGroup} aria-label="English settings sections">
          {SECTIONS.map(({ to, label, icon: Icon }) => (
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
