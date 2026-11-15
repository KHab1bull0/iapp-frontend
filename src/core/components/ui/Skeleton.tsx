import clsx from 'clsx'
import type { CSSProperties, ReactNode } from 'react'
import { useCoreT } from '@/core/i18n/useCoreT'
import s from './Skeleton.module.scss'

interface Props {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  radius?: CSSProperties['borderRadius']
  className?: string
}

/** A placeholder block the shape of what is loading, so the page doesn't jump when it arrives. */
export function Skeleton({ width = '100%', height = 16, radius, className }: Props) {
  return <span className={clsx(s.skeleton, className)} style={{ width, height, borderRadius: radius }} aria-hidden />
}

interface GroupProps {
  children: ReactNode
  /** Read out instead of the shapes; defaults to "Loading…" in the current language. */
  label?: string
  className?: string
  /**
   * Hold the shapes back for a moment, so a load that finishes quickly shows
   * nothing at all rather than a flash of grey.
   */
  delayed?: boolean
}

/**
 * Wraps the skeletons that stand in for one view: busy for assistive tech,
 * with a hidden "Loading…" to read out in place of the grey blocks.
 */
export function SkeletonGroup({ children, label, className, delayed }: GroupProps) {
  const t = useCoreT()
  return (
    <div className={clsx(delayed && s.delayed, className)} aria-busy="true">
      <span className="sr-only">{label ?? t.common.loading}</span>
      {children}
    </div>
  )
}
