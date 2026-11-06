import clsx from 'clsx'
import { Link, NavLink } from 'react-router-dom'
import { House, Settings, LayoutGrid, PanelLeft, Plus, Search, Sun, Moon, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { useTheme } from '@/core/contexts/ThemeContext'
import { useProfile } from '@/core/hooks/useProfile'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import { SignOutButton } from '@/core/components/SignOutButton'
import type { ModuleManifest } from '@/core/modules/types'
import { useQuickAdd } from '@/core/quickAdd/context'
import s from './Sidebar.module.scss'

interface SidebarProps {
  modules: ModuleManifest[]
  collapsed: boolean
  onToggle: () => void
  onSearch: () => void
}

interface NavItemProps {
  to: string
  icon: LucideIcon
  label: string
  end?: boolean
  collapsed: boolean
  useBadge?: () => number | null
}

/** What's waiting on a page; nothing when there's nothing. */
function Badge({ useBadge, collapsed }: { useBadge: () => number | null; collapsed: boolean }) {
  const n = useBadge()
  if (!n) return null
  return <span className={collapsed ? s.badgeDot : s.badge}>{collapsed ? '' : n > 99 ? '99+' : n}</span>
}

function NavItem({ to, icon: Icon, label, end, collapsed, useBadge }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      viewTransition
      className={({ isActive }) => clsx(s.navItem, isActive && s.active)}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
      {useBadge && <Badge useBadge={useBadge} collapsed={collapsed} />}
    </NavLink>
  )
}

export function Sidebar({ modules, collapsed, onToggle, onSearch }: SidebarProps) {
  const quickAdd = useQuickAdd()
  const { user } = useAuth()
  const { displayName } = useProfile()
  const { theme, toggleTheme } = useTheme()
  const t = useCoreT()
  const text = useText()
  const initial = displayName[0]?.toUpperCase() ?? 'U'

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
          <button className={s.collapseBtn} onClick={onToggle} aria-label={t.nav.collapse}>
            <PanelLeft size={16} />
          </button>
        )}
      </div>

      {/* Desktop's "+": the same chooser as the phone's bottom bar. */}
      <div className={s.actions}>
        <button className={s.addBtn} onClick={() => quickAdd.open()} title={collapsed ? t.nav.add : undefined}>
          <Plus size={18} strokeWidth={2.5} />
          {!collapsed && (
            <>
              <span>{t.nav.add}</span>
              <kbd className={s.kbd}>N</kbd>
            </>
          )}
        </button>
        <button className={s.searchBtn} onClick={onSearch} title={t.palette.open}>
          <Search size={16} aria-hidden />
          <span className="sr-only">{t.palette.open}</span>
          {!collapsed && <kbd className={s.kbd}>⌘K</kbd>}
        </button>
      </div>

      <nav className={s.nav} aria-label={t.nav.modules}>
        <NavItem to="/" end icon={House} label={t.nav.overview} collapsed={collapsed} />

        {modules.map((m) => (
          <div key={m.id} className={s.navGroup}>
            {!collapsed && <div className={s.navGroupLabel}>{text(m.name)}</div>}
            {m.pages.map((p) => (
              <NavItem
                key={p.path}
                to={p.path}
                end={p.end}
                icon={p.icon}
                label={text(p.label)}
                collapsed={collapsed}
                useBadge={p.useBadge}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* App-wide, so apart from the module groups above: it used to sit
          under the last module and read as that module's settings. */}
      <div className={s.sidebarBottom}>
        <NavItem to="/settings" icon={Settings} label={t.nav.settings} collapsed={collapsed} />
        <button className={s.themeToggle} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{theme === 'dark' ? t.nav.lightMode : t.nav.darkMode}</span>}
        </button>
        <Link to="/settings/profile" className={s.user} title={collapsed ? displayName : undefined}>
          <div className={s.avatar}>{initial}</div>
          {!collapsed && (
            <div className={s.userMeta}>
              <div className={s.userName}>{displayName}</div>
              <div className={s.userHandle}>@{user?.username}</div>
            </div>
          )}
        </Link>
        {/* Apart from the navigation, and confirmed before it acts. */}
        {!collapsed && <SignOutButton variant="compact" />}
        {collapsed && (
          <button className={s.collapseBtnCentered} onClick={onToggle} aria-label={t.nav.expand}>
            <PanelLeft size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
        )}
      </div>
    </aside>
  )
}
