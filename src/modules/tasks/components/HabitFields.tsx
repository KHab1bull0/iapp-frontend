import { useId } from 'react'
import clsx from 'clsx'
import { Check, Plus, X } from 'lucide-react'
import { Switch } from '@/core/components/ui/Switch'
import { useTasksT } from '@/modules/tasks/i18n'
import {
  MAX_STAGES,
  MAX_STAGE_DAYS,
  SUGGESTED_STAGES,
  invalidStageAt,
  stageDraft,
  type HabitDraft,
  type StageDraft,
} from '@/modules/tasks/lib/habit'
import f from './TaskForm.module.scss'
import s from './HabitFields.module.scss'

interface Props {
  value: HabitDraft
  onChange: (next: HabitDraft) => void
  /** A daily habit's stages count days; any other repeat's count times. */
  daily: boolean
}

/**
 * The task form's habit part (a repeating task only): the switch, then who
 * it makes you, when it happens, the two-minute version for a hard day, and
 * the stages with the rewards the user picks for themselves.
 */
export function HabitFields({ value, onChange, daily }: Props) {
  const t = useTasksT()
  const set = (patch: Partial<HabitDraft>) => onChange({ ...value, ...patch })

  function toggle(on: boolean) {
    // First time on: start from a suggestion instead of an empty list.
    const stages = on && value.stages.length === 0 ? SUGGESTED_STAGES.map((d) => stageDraft(d)) : value.stages
    set({ isHabit: on, stages })
  }

  return (
    <div className={s.habit}>
      <div className={s.switchRow}>
        <div className={s.switchText}>
          <span className={s.switchLabel}>{t.habit.label}</span>
          <span className={f.hint}>{t.habit.hint}</span>
        </div>
        <Switch checked={value.isHabit} onChange={toggle} label={t.habit.label} />
      </div>

      {value.isHabit && (
        <>
          <TextField
            label={t.habit.identity}
            placeholder={t.habit.identityPlaceholder}
            value={value.identity}
            maxLength={120}
            onChange={(identity) => set({ identity })}
          />
          <TextField
            label={t.habit.cue}
            placeholder={t.habit.cuePlaceholder}
            value={value.cue}
            maxLength={200}
            onChange={(cue) => set({ cue })}
          />
          <TextField
            label={t.habit.minVersion}
            placeholder={t.habit.minVersionPlaceholder}
            hint={t.habit.minVersionHint}
            value={value.minVersion}
            maxLength={120}
            onChange={(minVersion) => set({ minVersion })}
          />
          <StagesEditor stages={value.stages} onChange={(stages) => set({ stages })} daily={daily} />
        </>
      )}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  maxLength: number
  hint?: string
}) {
  return (
    <label className={f.field}>
      <span className={f.label}>{label}</span>
      <input
        className={f.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-label={label}
      />
      {hint && <span className={f.hint}>{hint}</span>}
    </label>
  )
}

/** Rows of "after N days/times → reward"; each needs more than the one above it. */
function StagesEditor({
  stages,
  onChange,
  daily,
}: {
  stages: StageDraft[]
  onChange: (stages: StageDraft[]) => void
  daily: boolean
}) {
  const t = useTasksT()
  const id = useId()
  const errorId = `${id}-error`
  const bad = invalidStageAt(stages)

  const update = (key: string, patch: Partial<StageDraft>) =>
    onChange(stages.map((st) => (st.key === key ? { ...st, ...patch } : st)))

  function add() {
    // The next suggestion past the last row, or double it: rarely needs retyping.
    const last = Number(stages.at(-1)?.days) || 0
    const next = SUGGESTED_STAGES.find((d) => d > last) ?? Math.min(MAX_STAGE_DAYS, Math.max(1, last * 2))
    onChange([...stages, stageDraft(next)])
  }

  return (
    <div className={f.field} role="group" aria-labelledby={`${id}-label`}>
      <span className={f.label} id={`${id}-label`}>
        {t.habit.stages}
      </span>
      {stages.length > 0 && (
        <ol className={s.stages}>
          {stages.map((st, i) => {
            const n = i + 1
            const reached = st.reachedDays !== null && String(st.reachedDays) === st.days.trim()
            return (
              <li key={st.key} className={s.stage}>
                <span className={clsx(s.stageNo, reached && s.reached)} title={reached ? t.habit.reached : undefined}>
                  {reached ? (
                    <>
                      <Check size={14} strokeWidth={3} aria-hidden />
                      <span className="sr-only">{t.habit.reached}</span>
                    </>
                  ) : (
                    n
                  )}
                </span>
                <span className={s.days}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_STAGE_DAYS}
                    className={clsx(f.input, s.daysInput)}
                    value={st.days}
                    onChange={(e) => update(st.key, { days: e.target.value })}
                    aria-label={t.habit.stageDays(n, daily)}
                    aria-invalid={bad === i || undefined}
                    aria-describedby={bad === i ? errorId : undefined}
                  />
                  <span className={s.unit} aria-hidden>
                    {t.habit.unit(daily)}
                  </span>
                </span>
                <input
                  className={f.input}
                  value={st.reward}
                  onChange={(e) => update(st.key, { reward: e.target.value })}
                  maxLength={200}
                  placeholder={t.habit.rewardPlaceholder}
                  aria-label={t.habit.stageReward(n)}
                />
                <button
                  type="button"
                  className={s.remove}
                  onClick={() => onChange(stages.filter((x) => x.key !== st.key))}
                  aria-label={t.habit.removeStage(n)}
                >
                  <X size={16} aria-hidden />
                </button>
              </li>
            )
          })}
        </ol>
      )}
      {bad >= 0 ? (
        <span id={errorId} className={clsx(f.hint, s.error)}>
          {t.habit.stagesOrder}
        </span>
      ) : (
        <span className={f.hint}>{t.habit.stagesHint}</span>
      )}
      {stages.length < MAX_STAGES && (
        <button type="button" className={s.add} onClick={add}>
          <Plus size={16} aria-hidden /> {t.habit.addStage}
        </button>
      )}
    </div>
  )
}
