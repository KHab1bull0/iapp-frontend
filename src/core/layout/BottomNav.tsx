import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import { House, Menu, Settings, type LucideIcon } from 'lucide-react'
import type { BottomNavItem, ModuleManifest } from '@/core/modules/types'
import { bottomNavItems } from '@/core/modules/registry-utils'
import s from './BottomNav.module.scss'

function toLink(item: BottomNavItem): { to: string; icon: LucideIcon; label: string; end: boolean } {
  switch (item.kind) {
    case 'home':     return { to: '/',         icon: House,    label: 'Home',     end: true }
    case 'settings': return { to: '/settings', icon: Settings, label: 'Settings', end: true }
    case 'menu':     return { to: '/menu',     icon: Menu,     label: 'Menu',     end: true }
    // Not `end`: the module stays highlighted on all of its pages.
    case 'module':   return { to: item.module.basePath, icon: item.module.icon, label: item.module.name, end: false }
  }
}

export function BottomNav({ modules }: { modules: ModuleManifest[] }) {
  const items = bottomNavItems(modules).map(toLink)

  return (
    <nav className={s.bottomnav} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => clsx(s.bnavItem, isActive && s.active)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
