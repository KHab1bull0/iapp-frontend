import type { ReactNode } from 'react'
import { Check, Moon, Sprout } from 'lucide-react'
import { Sheet } from '@/core/components/ui/Sheet'
import type { CompletionKind, Task } from '@/modules/tasks/api/tasks'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './Habit.module.scss'

/**
 * A habit's ways to check in, from a long-press or "⋯": in full (the tick
 * does the same), the two-minute version for a hard day, or one of the
 * month's rest days. Each is one tap; nothing to confirm.
 */
export function CheckInSheet({
  task,
  open,
  onOpenChange,
  onPick,
}: {
  /** Kept after closing, so the sheet doesn't empty while it slides away. */
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (task: Task, kind: CompletionKind) => void
}) {
  const t = useTasksT()
  const restLeft = task?.progress?.restLeft ?? 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={task?.title ?? ''} description={t.habit.kindSub}>
      {task && (
        <div className={s.choices}>
          <Choice icon={<Check size={18} strokeWidth={3} />} label={t.habit.full} onClick={() => onPick(task, 'full')} />
          {task.minVersion && (
            <Choice icon={<Sprout size={18} />} label={t.habit.min(task.minVersion)} onClick={() => onPick(task, 'min')} />
          )}
          <Choice
            icon={<Moon size={18} />}
            label={t.habit.rest(restLeft)}
            sub={restLeft > 0 ? t.habit.restSub : t.habit.restNone}
            disabled={restLeft === 0}
            onClick={() => onPick(task, 'rest')}
            muted
          />
        </div>
      )}
    </Sheet>
  )
}

function Choice({
  icon,
  label,
  sub,
  onClick,
  disabled,
  muted,
}: {
  icon: ReactNode
  label: string
  sub?: string
  onClick: () => void
  disabled?: boolean
  muted?: boolean
}) {
  return (
    <button type="button" className={s.choice} onClick={onClick} disabled={disabled}>
      <span className={muted ? s.choiceIconMuted : s.choiceIcon} aria-hidden>
        {icon}
      </span>
      <span className={s.choiceText}>
        <span className={s.choiceLabel}>{label}</span>
        {sub && <span className={s.choiceSub}>{sub}</span>}
      </span>
    </button>
  )
}
