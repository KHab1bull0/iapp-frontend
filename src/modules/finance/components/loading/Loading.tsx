import type { CSSProperties, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/core/components/ui/Skeleton'
import s from './Loading.module.scss'

/**
 * A block shown while its data loads: marked busy, and named for screen
 * readers (the skeletons inside are hidden from them).
 */
export function LoadingBlock({
  label,
  className,
  children,
}: {
  /** "Loading statistics…": read out instead of the shapes. */
  label: string
  /** The layout of what it stands in for, so nothing moves when that arrives. */
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className} aria-busy="true" data-loading>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

/**
 * One line of text that has not arrived. Put it where the text goes, inside
 * the element that styles that text: it takes that line's height, so the
 * real text replaces it without a jump.
 */
export function TextSkeleton({ width = '100%' }: { width?: CSSProperties['width'] }) {
  return (
    <span className={s.textLine} style={{ width }} aria-hidden>
      {'​'}
      <Skeleton className={s.textBar} height="0.8em" />
    </span>
  )
}

/** Turns inside a button while its request runs; holds still under "reduce motion". */
export function Spinner({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} className={s.spinner} aria-hidden />
}
