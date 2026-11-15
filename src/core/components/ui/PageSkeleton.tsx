import clsx from 'clsx'
import { Skeleton, SkeletonGroup } from './Skeleton'
import s from './PageSkeleton.module.scss'

export interface PageSkeletonProps {
  /** How many card blocks under the header (default 3). */
  cards?: number
  /** Draw the title + subtitle lines of a PageHeader (default true). */
  header?: boolean
  /** Read out instead of the shapes; defaults to "Loading…" in the current language. */
  label?: string
  /** Wait ~180ms before showing anything, so a quick load doesn't flash (default true). */
  delayed?: boolean
  className?: string
}

// Line counts per card, cycled: the blocks differ a little, like real cards do.
const LINES = [3, 2, 4]

/**
 * A generic page while its code or data loads: the page column, a header
 * line and a few cards. The route fallback, and any page with nothing more
 * specific to draw.
 */
export function PageSkeleton({ cards = 3, header = true, label, delayed = true, className }: PageSkeletonProps) {
  return (
    <SkeletonGroup label={label} delayed={delayed} className={clsx(s.page, className)}>
      {header && (
        <div className={s.header}>
          <Skeleton width="55%" height="var(--ps-title-h)" radius="var(--radius-sm)" />
          <Skeleton width="35%" height="var(--lh-meta)" />
        </div>
      )}
      {Array.from({ length: cards }, (_, i) => (
        <CardShape key={i} lines={LINES[i % LINES.length]} />
      ))}
    </SkeletonGroup>
  )
}

/** One card's shape: a title line and a few text lines on the card surface. */
function CardShape({ lines }: { lines: number }) {
  return (
    <div className={s.card}>
      <Skeleton width="40%" height="var(--lh-title)" />
      {Array.from({ length: lines }, (_, j) => (
        <Skeleton key={j} width={j % 2 ? '70%' : '100%'} height="var(--lh-ui)" />
      ))}
    </div>
  )
}

export interface CardSkeletonProps {
  /** Text lines under the title line (default 3). */
  lines?: number
  label?: string
  /** Wait ~180ms before showing anything (default true). */
  delayed?: boolean
}

/** A single card while it loads (a home card, a panel): busy, with a hidden "Loading…". */
export function CardSkeleton({ lines = 3, label, delayed = true }: CardSkeletonProps) {
  return (
    <SkeletonGroup label={label} delayed={delayed}>
      <CardShape lines={lines} />
    </SkeletonGroup>
  )
}
