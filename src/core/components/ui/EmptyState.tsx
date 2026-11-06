import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import s from './EmptyState.module.scss'

interface Action {
  label: string
  icon?: LucideIcon
  /** A link… */
  to?: string
  /** …or a button. */
  onClick?: () => void
}

interface Props {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  /** What to do about it. An empty state that says "add one" carries the button to add one. */
  action?: Action
  secondary?: Action
  /** Inside a card rather than filling a page. */
  compact?: boolean
}

function ActionButton({ action, primary }: { action: Action; primary: boolean }) {
  const Icon = action.icon
  const className = primary ? s.primary : s.secondary
  const content = (
    <>
      {Icon && <Icon size={18} aria-hidden />}
      {action.label}
    </>
  )
  return action.to ? (
    <Link to={action.to} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" className={className} onClick={action.onClick}>
      {content}
    </button>
  )
}

export function EmptyState({ icon: Icon, title, description, action, secondary, compact }: Props) {
  return (
    <div className={clsx(s.empty, compact && s.compact)}>
      {Icon && (
        <div className={s.glyph} aria-hidden>
          <Icon size={compact ? 22 : 28} />
        </div>
      )}
      <div className={s.title}>{title}</div>
      {description && <div className={s.description}>{description}</div>}
      {(action || secondary) && (
        <div className={s.actions}>
          {action && <ActionButton action={action} primary />}
          {secondary && <ActionButton action={secondary} primary={false} />}
        </div>
      )}
    </div>
  )
}
