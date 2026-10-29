import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Settings } from 'lucide-react'
import s from './BottomNav.module.scss'

const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/settings',     icon: Settings,        label: 'Settings'     },
]

export function BottomNav() {
  return (
    <nav className={s.bottomnav}>
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => clsx(s.bnavItem, isActive && s.active)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
