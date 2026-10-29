import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import { House, Settings, LayoutGrid, PanelLeft, Sun, Moon, LogOut, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { useTheme } from '@/core/contexts/ThemeContext'
import type { ModuleManifest } from '@/core/modules/types'
import s from './Sidebar.module.scss'

interface SidebarProps {
  modules: ModuleManifest[]
  collapsed: boolean
  onToggle: () => void
}

interface NavItemProps {
  to: string
  icon: LucideIcon
  label: string
  end?: boolean
  collapsed: boolean
}

function NavItem({ to, icon: Icon, label, end, collapsed }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => clsx(s.navItem, isActive && s.active)}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

export function Sidebar({ modules, collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const initial = user?.username?.[0]?.toUpperCase() ?? 'U'

  return (
    <aside className={clsx(s.sidebar, collapsed && s.collapsed)}>
      <div className={s.sidebarTop}>
        <div className={s.logo}>
          <div className={s.logoMark}>
            <LayoutGrid size={18} />
          </div>
          {!collapsed && <span className={s.logoWord}>IAPP</span>}
        </div>
        {!collapsed && (
          <button className={s.collapseBtn} onClick={onToggle} aria-label="Collapse sidebar">
            <PanelLeft size={16} />
          </button>
        )}
      </div>

      <nav className={s.nav}>
        <NavItem to="/" end icon={House} label="Home" collapsed={collapsed} />

        {modules.map((m) => (
          <div key={m.id} className={s.navGroup}>
            {!collapsed && <div className={s.navGroupLabel}>{m.name}</div>}
            {m.pages.map((p) => (
              <NavItem
                key={p.path}
                to={p.path}
                end={p.end}
                icon={p.icon}
                label={p.label}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}

        <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
      </nav>

      <div className={s.sidebarBottom}>
        <button className={s.themeToggle} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>
        <div className={s.user}>
          <div className={s.avatar}>{initial}</div>
          {!collapsed && (
            <div className={s.userMeta}>
              <div className={s.userName}>{user?.username}</div>
              <button className={s.signOutBtn} onClick={logout}>
                <LogOut size={11} /> Sign out
              </button>
            </div>
          )}
        </div>
        {collapsed && (
          <button className={s.collapseBtnCentered} onClick={onToggle} aria-label="Expand sidebar">
            <PanelLeft size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
        )}
      </div>
    </aside>
  )
}
