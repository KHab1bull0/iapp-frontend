import clsx from 'clsx'
import { GrowingInput } from '@/core/components/ui/GrowingInput'
import { Switch } from '@/core/components/ui/Switch'
import { useTasksT } from '@/modules/tasks/i18n'
import type { HabitDraft } from '@/modules/tasks/lib/habit'
import f from './TaskForm.module.scss'
import s from './HabitFields.module.scss'

interface Props {
  value: HabitDraft
  onChange: (next: HabitDraft) => void
}

/**
 * The task form's habit part (a repeating task only): the switch, then who
 * it makes you — the one thing a habit asks for. (A habit's cue is no longer
 * edited here; one already saved is kept as it is.)
 */
export function HabitFields({ value, onChange }: Props) {
  const t = useTasksT()

  return (
    <div className={s.habit}>
      <div className={s.switchRow}>
        <div className={s.switchText}>
          <span className={s.switchLabel}>{t.habit.label}</span>
          <span className={f.hint}>{t.habit.hint}</span>
        </div>
        <Switch checked={value.isHabit} onChange={(isHabit) => onChange({ ...value, isHabit })} label={t.habit.label} />
      </div>

      {value.isHabit && (
        <label className={f.field}>
          <span className={f.label}>{t.habit.identity}</span>
          <GrowingInput
            className={clsx(f.input, f.textarea)}
            value={value.identity}
            onChange={(identity) => onChange({ ...value, identity })}
            maxLength={120}
            placeholder={t.habit.identityPlaceholder}
            aria-label={t.habit.identity}
          />
        </label>
      )}
    </div>
  )
}
