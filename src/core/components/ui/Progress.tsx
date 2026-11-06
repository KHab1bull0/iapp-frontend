import clsx from 'clsx'
import type { ReactNode } from 'react'
import s from './Progress.module.scss'

type Tone = 'primary' | 'success' | 'danger' | 'warning'

const ratio = (value: number, max: number) => (max > 0 ? Math.min(1, Math.max(0, value / max)) : 0)

/** A thin horizontal bar: how far along something is (a budget spent, a day's tasks done). */
export function ProgressBar({
  value,
  max,
  label,
  tone = 'primary',
  className,
}: {
  value: number
  max: number
  label: string
  tone?: Tone
  className?: string
}) {
  return (
    <div
      className={clsx(s.track, className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <span className={clsx(s.fill, s[tone])} style={{ width: `${ratio(value, max) * 100}%` }} />
    </div>
  )
}

/** The same as a ring, with room for a figure in the middle. */
export function ProgressRing({
  value,
  max,
  label,
  size = 56,
  stroke = 6,
  tone = 'primary',
  children,
}: {
  value: number
  max: number
  label: string
  size?: number
  stroke?: number
  tone?: Tone
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div
      className={s.ring}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className={s.ringTrack} cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className={clsx(s.ringFill, s[tone])}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio(value, max))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className={s.ringCenter}>{children}</div>}
    </div>
  )
}
