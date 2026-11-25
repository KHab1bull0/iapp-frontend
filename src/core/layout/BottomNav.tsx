import clsx from 'clsx'
import { NavLink, useLocation } from 'react-router-dom'
import { House, Menu, Plus, Settings, type LucideIcon } from 'lucide-react'
import type { BottomNavItem, ModuleManifest } from '@/core/modules/types'
import { addHere, bottomNavItems, quickAddActions } from '@/core/modules/registry-utils'
import { useQuickAdd } from '@/core/quickAdd/context'
import { useText } from '@/core/i18n'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './BottomNav.module.scss'

type Link = {
  to: string
  icon: LucideIcon
  label: string
  end: boolean
  useBadge?: () => number | null
}

/** What's waiting on a page; nothing when there's nothing. */
function Badge({ useBadge }: { useBadge: () => number | null }) {
  const n = useBadge()
  if (!n) return null
  return <span className={s.badge}>{n > 99 ? '99+' : n}</span>
}

/**
 * Phones and tablets: Home and the modules, with "+" floating above the
 * bar's right end, under the right thumb. Inside a module (`current`) the modules give way to that
 * module's own pages, so its menu is down here rather than at the top.
 */
export function BottomNav({
  modules,
  current,
  hidden = false,
}: {
  modules: ModuleManifest[]
  current?: ModuleManifest
  hidden?: boolean
}) {
  const t = useCoreT()
  const text = useText()
  const quickAdd = useQuickAdd()

  const toLink = (item: BottomNavItem): Link => {
    switch (item.kind) {
      case 'home': return { to: '/', icon: House, label: t.nav.overview, end: true }
      case 'menu': return { to: '/menu', icon: Menu, label: t.nav.more, end: true }
      // Not `end`: the module stays highlighted on all of its pages.
      case 'module': return { to: item.module.basePath, icon: item.module.icon, label: text(item.module.name), end: false }
      case 'page': {
        const { path, icon, label, end = false, useBadge } = item.page
        return { to: path, icon, label: text(label), end, useBadge }
      }
      case 'settings': return { to: item.path, icon: Settings, label: t.nav.settings, end: false }
    }
  }

  const items = bottomNavItems(modules, current)
  // Home adds anything (the chooser); a module's own page adds that module's thing.
  const { global, action } = addHere(modules, useLocation().pathname)
  const canAdd = global ? quickAddActions(modules).length > 0 : Boolean(action)

  return (
    <>
      <nav
        className={clsx(s.bottomnav, hidden && s.hidden)}
        aria-label={current ? t.nav.pagesOf(text(current.name)) : t.nav.main}
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map((item) => {
          const { to, icon: Icon, label, end, useBadge } = toLink(item)
          return (
            <NavLink key={to} to={to} end={end} viewTransition className={({ isActive }) => clsx(s.bnavItem, isActive && s.active)}>
              <span className={s.iconWrap}>
                <Icon size={22} aria-hidden />
                {useBadge && <Badge useBadge={useBadge} />}
              </span>
              <span>{label}</span>
            </NavLink>
          )
        })}
      </nav>
      {canAdd && (
        <button
          type="button"
          className={clsx(s.add, hidden && s.addHidden)}
          onClick={() => quickAdd.open(global ? undefined : action?.id)}
          aria-label={t.nav.add}
          tabIndex={hidden ? -1 : undefined}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}
    </>
  )
}
