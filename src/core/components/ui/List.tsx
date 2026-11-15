import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Skeleton, SkeletonGroup } from './Skeleton'
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
  /** Anything else in the icon's place (an emoji tile). */
  leading?: ReactNode
  /** Right-hand text: an amount, a count, a setting's value. */
  value?: ReactNode
  /** Anything else on the right (a switch, a button); replaces the chevron. */
  trailing?: ReactNode
  to?: string
  onClick?: () => void
  tone?: 'default' | 'danger'
}

export function ListRow({ title, subtitle, icon: Icon, iconColor, leading, value, trailing, to, onClick, tone = 'default' }: RowProps) {
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
      {leading}
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

interface ListSkeletonProps {
  /** Rows to draw (default 3). */
  rows?: number
  /** Leave room for the group's small heading. */
  title?: boolean
  /** Leave room for a one-line footer under the list. */
  footer?: boolean
  label?: string
}

/** A ListGroup while its rows load: the same heading, surface and row heights, so nothing jumps. */
export function ListSkeleton({ rows = 3, title, footer, label }: ListSkeletonProps) {
  return (
    <SkeletonGroup label={label} className={s.group}>
      {title && <Skeleton className={s.skeletonLabel} width={96} height="var(--lh-caption)" />}
      <div className={s.list}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={s.row}>
            <Skeleton width="var(--tile-md)" height="var(--tile-md)" radius="var(--radius-sm)" />
            <span className={s.skeletonText}>
              <Skeleton width={i % 2 ? '45%' : '60%'} height="var(--fs-ui)" />
              <Skeleton width={i % 2 ? '65%' : '80%'} height="var(--fs-meta)" />
            </span>
          </div>
        ))}
      </div>
      {footer && <Skeleton className={s.skeletonLabel} width="70%" height="var(--lh-caption)" />}
    </SkeletonGroup>
  )
}
