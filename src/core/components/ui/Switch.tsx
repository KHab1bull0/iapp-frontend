import clsx from 'clsx'
import s from './Switch.module.scss'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Required: a switch beside its row title still needs its own name for screen readers. */
  label: string
  disabled?: boolean
}

/** On/off for a setting that applies at once (no Save button). */
export function Switch({ checked, onChange, label, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={clsx(s.switch, checked && s.on)}
      onClick={() => onChange(!checked)}
    >
      <span className={s.knob} aria-hidden />
    </button>
  )
}
