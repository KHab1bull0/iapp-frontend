import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Settings, Wallet, PanelLeft, Sun, Moon, LogOut } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { useTheme } from '@/core/contexts/ThemeContext'
import s from './Sidebar.module.scss'

const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/settings',     icon: Settings,        label: 'Settings'     },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const initial = user?.username?.[0]?.toUpperCase() ?? 'U'

  return (
    <aside className={clsx(s.sidebar, collapsed && s.collapsed)}>
      <div className={s.sidebarTop}>
        <div className={s.logo}>
          <div className={s.logoMark}>
            <Wallet size={18} />
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
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => clsx(s.navItem, isActive && s.active)}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
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
