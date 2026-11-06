import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import { House, Menu, Plus, type LucideIcon } from 'lucide-react'
import type { BottomNavItem, ModuleManifest } from '@/core/modules/types'
import { bottomNavItems } from '@/core/modules/registry-utils'
import { useQuickAdd } from '@/core/quickAdd/context'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './BottomNav.module.scss'

type Link = { to: string; icon: LucideIcon; label: string; end: boolean }

/** Phones and tablets: Today, the modules, and "+" in the middle where the thumb rests. */
export function BottomNav({ modules }: { modules: ModuleManifest[] }) {
  const t = useCoreT()
  const text = useText()
  const quickAdd = useQuickAdd()

  const toLink = (item: Exclude<BottomNavItem, { kind: 'add' }>): Link => {
    switch (item.kind) {
      case 'home': return { to: '/', icon: House, label: t.nav.today, end: true }
      case 'menu': return { to: '/menu', icon: Menu, label: t.nav.more, end: true }
      // Not `end`: the module stays highlighted on all of its pages.
      case 'module': return { to: item.module.basePath, icon: item.module.icon, label: text(item.module.name), end: false }
    }
  }

  const items = bottomNavItems(modules)

  return (
    <nav className={s.bottomnav} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((item) => {
        if (item.kind === 'add') {
          return (
            <div key="add" className={s.addSlot}>
              <button type="button" className={s.add} onClick={() => quickAdd.open()} aria-label={t.nav.add}>
                <Plus size={26} strokeWidth={2.5} />
              </button>
            </div>
          )
        }
        const { to, icon: Icon, label, end } = toLink(item)
        return (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => clsx(s.bnavItem, isActive && s.active)}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
