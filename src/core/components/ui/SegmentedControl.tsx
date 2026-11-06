import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import s from './SegmentedControl.module.scss'

export interface Segment<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
}

interface Props<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Segment<T>[]
  /** Read out for the group, e.g. "Period". */
  label: string
  size?: 'sm' | 'md'
  /** Fill the row, every option the same width. */
  stretch?: boolean
  className?: string
}

/** A few mutually exclusive choices side by side: one radio group, the chosen one raised. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  stretch = false,
  className,
}: Props<T>) {
  return (
    <div
      className={clsx(s.group, s[size], stretch && s.stretch, className)}
      role="radiogroup"
      aria-label={label}
    >
      {options.map(({ value: v, label: l, icon: Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          className={clsx(s.segment, value === v && s.active)}
          onClick={() => onChange(v)}
        >
          {Icon && <Icon size={size === 'sm' ? 14 : 16} aria-hidden />}
          {l}
        </button>
      ))}
    </div>
  )
}
