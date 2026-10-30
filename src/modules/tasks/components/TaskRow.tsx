import clsx from 'clsx'
import { Check, Repeat } from 'lucide-react'
import type { Task } from '@/modules/tasks/api/tasks'
import { describeRepeat, dueLabel } from '@/modules/tasks/lib/repeat'
import s from './TaskRow.module.scss'

interface Props {
  task: Task
  today: string
  /** Ticked: done today (Today page) or finished (a completed one-off). */
  done?: boolean
  /** Omit for a check that only shows state (finished one-offs). */
  onToggle?: (task: Task) => void
  /** While its completion is being saved, so a second tap can't complete it twice. */
  busy?: boolean
  onOpen: (task: Task) => void
  /** Show "Tomorrow", "3 days overdue"… (All tasks); Today's own sections say it already. */
  showDue?: boolean
}

export function TaskRow({ task, today, done = false, onToggle, busy = false, onOpen, showDue = false }: Props) {
  const repeat = describeRepeat(task)
  const due = showDue || (task.dueDate !== null && task.dueDate < today) ? dueLabel(task.dueDate, today) : ''
  const overdue = !done && task.dueDate !== null && task.dueDate < today

  return (
    <div className={clsx(s.row, done && s.done)}>
      {onToggle ? (
        <button
          className={clsx(s.check, done && s.checked)}
          onClick={() => onToggle(task)}
          disabled={busy}
          aria-label={done ? `Undo ${task.title}` : `Complete ${task.title}`}
        >
          {done && <Check size={14} strokeWidth={3} />}
        </button>
      ) : (
        <span className={clsx(s.check, done && s.checked)} aria-hidden="true">
          {done && <Check size={14} strokeWidth={3} />}
        </span>
      )}

      <button className={s.body} onClick={() => onOpen(task)}>
        <span className={s.title}>{task.title}</span>
        {(task.dueTime || repeat || due) && (
          <span className={s.meta}>
            {task.dueTime && <span>{task.dueTime}</span>}
            {due && <span className={clsx(overdue && s.overdue)}>{due}</span>}
            {repeat && (
              <span className={s.repeat}>
                <Repeat size={11} /> {repeat}
              </span>
            )}
          </span>
        )}
      </button>
    </div>
  )
}
