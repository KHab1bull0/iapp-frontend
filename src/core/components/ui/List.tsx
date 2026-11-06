import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import s from './List.module.scss'

/** Rows grouped on one rounded surface, with an optional small heading above (iOS grouped list). */
export function ListGroup({ title, children, footer }: { title?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className={s.group} aria-label={title}>
      {title && <h2 className={s.groupTitle}>{title}</h2>}
      <div className={s.list}>{children}</div>
      {footer && <div className={s.groupFooter}>{footer}</div>}
    </section>
  )
}

interface RowProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: LucideIcon
  /** Background of the icon tile: a category colour, say. */
  iconColor?: string
  /** Right-hand text: an amount, a count, a setting's value. */
  value?: ReactNode
  /** Anything else on the right (a switch, a button); replaces the chevron. */
  trailing?: ReactNode
  to?: string
  onClick?: () => void
  tone?: 'default' | 'danger'
}

export function ListRow({ title, subtitle, icon: Icon, iconColor, value, trailing, to, onClick, tone = 'default' }: RowProps) {
  const interactive = Boolean(to || onClick)
  const content = (
    <>
      {Icon && (
        <span
          className={clsx(s.icon, iconColor && s.iconColored)}
          style={iconColor ? { background: iconColor } : undefined}
          aria-hidden
        >
          <Icon size={18} />
        </span>
      )}
      <span className={s.text}>
        <span className={clsx(s.title, tone === 'danger' && s.danger)}>{title}</span>
        {subtitle && <span className={s.subtitle}>{subtitle}</span>}
      </span>
      {value !== undefined && <span className={s.value}>{value}</span>}
      {trailing ?? (interactive && <ChevronRight size={18} className={s.chevron} aria-hidden />)}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={clsx(s.row, s.interactive)}>
        {content}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" className={clsx(s.row, s.interactive)} onClick={onClick}>
        {content}
      </button>
    )
  }
  return <div className={s.row}>{content}</div>
}
