import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import { ChevronRight, House, LayoutGrid, PanelLeftClose, PanelLeftOpen, Plus, Search, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { useProfile } from '@/core/hooks/useProfile'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
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
      aria-label={collapsed ? label : undefined}
    >
      <Icon size={collapsed ? 20 : 18} aria-hidden />
      {!collapsed && <span className={s.label}>{label}</span>}
      {useBadge && <Badge useBadge={useBadge} collapsed={collapsed} />}
    </NavLink>
  )
}

export function Sidebar({ modules, collapsed, onToggle, onSearch }: SidebarProps) {
  const quickAdd = useQuickAdd()
  const { user } = useAuth()
  const { displayName } = useProfile()
  const t = useCoreT()
  const text = useText()
  const initial = displayName[0]?.toUpperCase() ?? 'U'
  const toggleLabel = collapsed ? t.nav.expand : t.nav.collapse
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <aside className={clsx(s.sidebar, collapsed && s.collapsed)}>
      {/* The toggle stays at the top in both states, so a folded sidebar can always be opened again. */}
      <div className={s.top}>
        <div className={s.logo}>
          <div className={s.logoMark} aria-hidden>
            <LayoutGrid size={18} />
          </div>
          {!collapsed && <span className={s.logoWord}>IAPP</span>}
        </div>
        <button className={s.toggle} onClick={onToggle} aria-label={toggleLabel} title={`${toggleLabel} ([)`}>
          <ToggleIcon size={18} />
        </button>
      </div>

      {/* Desktop's "+": the same chooser as the phone's bottom bar. */}
      <div className={s.actions}>
        <button className={s.addBtn} onClick={() => quickAdd.open()} title={collapsed ? `${t.nav.add} (N)` : undefined}>
          <Plus size={collapsed ? 20 : 18} strokeWidth={2.5} aria-hidden />
          {collapsed ? (
            <span className="sr-only">{t.nav.add}</span>
          ) : (
            <>
              <span>{t.nav.add}</span>
              <kbd className={s.kbd}>N</kbd>
            </>
          )}
        </button>
        <button className={s.searchBtn} onClick={onSearch} title={`${t.palette.open} (⌘K)`}>
          <Search size={collapsed ? 20 : 16} aria-hidden />
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

      {/* One way to Settings: you. Theme, language and sign-out live in there. */}
      <NavLink
        to="/settings"
        className={({ isActive }) => clsx(s.user, isActive && s.userActive)}
        title={collapsed ? `${displayName} · ${t.nav.settings}` : undefined}
        aria-label={`${t.nav.settings}: ${displayName}`}
      >
        <span className={s.avatar} aria-hidden>
          {initial}
        </span>
        {!collapsed && (
          <>
            <span className={s.userMeta}>
              <span className={s.userName}>{displayName}</span>
              <span className={s.userSub}>
                @{user?.username} · {t.nav.settings}
              </span>
            </span>
            <ChevronRight size={16} className={s.userChevron} aria-hidden />
          </>
        )}
      </NavLink>
    </aside>
  )
}
