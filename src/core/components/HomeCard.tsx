import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import s from './HomeCard.module.scss'

interface Props {
  icon: LucideIcon
  title: string
  /** The module page this card summarises; the header links there. */
  to: string
  /** Read out for the header link, e.g. "Open Tasks". */
  linkLabel: string
  /** Top-right: a progress ring, the month. */
  accessory?: ReactNode
  children: ReactNode
}

/**
 * The frame every module's home card shares. Only the header is a link, so
 * the body can hold its own buttons (tick a task, start a review).
 */
export function HomeCard({ icon: Icon, title, to, linkLabel, accessory, children }: Props) {
  return (
    <section className={s.card} aria-label={title}>
      <div className={s.head}>
        <Link to={to} className={s.titleLink} aria-label={linkLabel}>
          <span className={s.icon} aria-hidden>
            <Icon size={18} />
          </span>
          <span className={s.title}>{title}</span>
          <ChevronRight size={18} className={s.chevron} aria-hidden />
        </Link>
        {accessory && <div className={s.accessory}>{accessory}</div>}
      </div>
      <div className={s.body}>{children}</div>
    </section>
  )
}
