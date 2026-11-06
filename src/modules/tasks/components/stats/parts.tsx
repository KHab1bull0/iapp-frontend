import clsx from 'clsx'
import { useTasksT } from '@/modules/tasks/i18n'
import type { Period } from './points'
import s from './TaskStats.module.scss'

export function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className={s.tile}>
      <div className={s.tileLabel}>{label}</div>
      <div className={s.tileValue}>{value}</div>
      <div className={s.tileSub}>{sub}</div>
    </div>
  )
}

export function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const t = useTasksT()
  return (
    <div className={s.segments} role="radiogroup" aria-label={t.stats.period}>
      {(['daily', 'monthly'] as const).map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          className={clsx(s.segment, value === p && s.active)}
          onClick={() => onChange(p)}
        >
          {t.stats[p]}
        </button>
      ))}
    </div>
  )
}
