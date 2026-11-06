import clsx from 'clsx'
import type { CSSProperties } from 'react'
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
