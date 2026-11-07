import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import s from './StatTile.module.scss'

interface Props {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'success' | 'danger' | 'warning' | 'primary'
  icon?: LucideIcon
  /** 'sm' for figures beside a bigger headline number (20px instead of 24px). */
  size?: 'md' | 'sm'
  className?: string
}

/** One headline number with its label: the building block of every stats row. */
export function StatTile({ label, value, sub, tone = 'default', icon: Icon, size = 'md', className }: Props) {
  return (
    <div className={clsx(s.tile, className)}>
      <div className={s.head}>
        <span className={s.label}>{label}</span>
        {Icon && (
          <span className={clsx(s.icon, s[tone])} aria-hidden>
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className={clsx(s.value, size === 'sm' && s.valueSm, tone !== 'default' && s[`${tone}Text`])}>{value}</div>
      {sub && <div className={s.sub}>{sub}</div>}
    </div>
  )
}

export function StatGrid({ children, columns = 3 }: { children: React.ReactNode; columns?: 2 | 3 | 4 }) {
  return <div className={clsx(s.grid, s[`cols${columns}`])}>{children}</div>
}
