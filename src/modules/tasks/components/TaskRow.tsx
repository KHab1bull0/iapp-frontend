import clsx from 'clsx'
import { Check, Repeat } from 'lucide-react'
import type { Task } from '@/modules/tasks/api/tasks'
import { describeRepeat, dueLabel } from '@/modules/tasks/lib/repeat'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './TaskRow.module.scss'

interface Props {
  task: Task
  today: string
  /** Ticked: done today (Today page) or finished (a completed one-off). */
  done?: boolean
  /** Omit where tasks can't be ticked (All tasks): no check is shown. */
  onToggle?: (task: Task) => void
  /**
   * While a request about it is on its way (ticking, unticking): its
   * buttons wait, so a second tap can't send it twice.
   */
  busy?: boolean
  onOpen: (task: Task) => void
  /** Show "Tomorrow", a weekday… (All tasks); Today's own sections say it already. */
  showDue?: boolean
}

export function TaskRow({
  task,
  today,
  done = false,
  onToggle,
  busy = false,
  onOpen,
  showDue = false,
}: Props) {
  const t = useTasksT()
  const habit = task.isHabit ? task.progress : null
  // A habit's line is its chip; the editor still says how it repeats.
  const repeat = habit ? '' : describeRepeat(task, t)
  // No red "N days late": a day already passed simply isn't mentioned.
  const due = showDue ? dueLabel(task.dueDate, today, t) : ''

  const meta = task.isHabit || task.dueTime || repeat || due

  return (
    <div className={s.wrap}>
      {/* The tick is the one way to mark it done: no swipe. */}
      <div className={clsx(s.row, done && s.done, busy && s.busy)}>
        <button className={s.body} onClick={() => onOpen(task)}>
          <span className={s.title}>{task.title}</span>
          {meta && (
            <span className={s.meta}>
              {/* Habits sit among the other tasks, told apart by this chip. */}
              {task.isHabit && <span className={s.habitChip}>{t.habit.label}</span>}
              {task.dueTime && <span className={s.time}>{task.dueTime}</span>}
              {due && !habit && <span>{due}</span>}
              {repeat && (
                <span className={s.repeat}>
                  <Repeat size={12} aria-hidden /> {repeat}
                </span>
              )}
            </span>
          )}
        </button>


        {/* The tick at the right end, under the right thumb. */}
        {onToggle && (
          <button
            className={clsx(s.check, done && s.checked)}
            onClick={() => onToggle(task)}
            disabled={busy}
            aria-busy={busy || undefined}
            aria-label={done ? t.undoLabel(task.title) : t.completeLabel(task.title)}
          >
            <Check size={16} strokeWidth={3} className={s.tick} />
          </button>
        )}
      </div>
    </div>
  )
}
