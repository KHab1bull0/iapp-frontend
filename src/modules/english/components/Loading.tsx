import type { CSSProperties, ReactNode } from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useEnglishT } from '@/modules/english/i18n'
import l from './Loading.module.scss'

/**
 * A page, or a part of one, while its data loads: skeletons the shape of what
 * is coming (so nothing jumps when it arrives), marked busy, with a hidden
 * "Loading…" for screen readers.
 */
export function Loading({
  className,
  label,
  children,
}: {
  className?: string
  label?: string
  children: ReactNode
}) {
  const t = useEnglishT()
  return (
    <div className={className} aria-busy="true">
      <span className="sr-only">{label ?? t.loading}</span>
      {children}
    </div>
  )
}

/** The turning ring a button shows while its request runs. */
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={clsx(l.spin, className)} aria-hidden />
}

/**
 * One line of text while it loads: a bar a little shorter than the line,
 * centred in a box exactly the line's height, so the text drops in without
 * moving anything.
 */
export function SkeletonText({
  width = '100%',
  line,
  className,
}: {
  width?: CSSProperties['width']
  /** The line height the text will have, in px (the --lh-* token). */
  line: number
  className?: string
}) {
  return (
    <span className={clsx(l.line, className)} style={{ width, height: line }} aria-hidden>
      <Skeleton height={Math.round(line * 0.65)} radius={6} />
    </span>
  )
}

/** A row of chips (tags, levels) while what they stand for loads. */
export function ChipsSkeleton({ widths, className }: { widths: number[]; className?: string }) {
  return (
    <Loading className={clsx(l.chips, className)}>
      {widths.map((w, i) => (
        <Skeleton key={i} width={w} height="var(--control-md)" radius={999} />
      ))}
    </Loading>
  )
}
