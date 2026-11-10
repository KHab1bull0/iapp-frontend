import clsx from 'clsx'
import { ArrowRight, Check, Repeat } from 'lucide-react'
import { useSwipe } from '@/core/hooks/useSwipe'
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
  /** While its completion is being saved, so a second tap can't complete it twice. */
  busy?: boolean
  onOpen: (task: Task) => void
  /** Swipe left: move to tomorrow. The edit sheet's date is the non-gesture way to do the same. */
  onTomorrow?: (task: Task) => void
  /** Show "Tomorrow", "3 days overdue"… (All tasks); Today's own sections say it already. */
  showDue?: boolean
}

export function TaskRow({ task, today, done = false, onToggle, busy = false, onOpen, onTomorrow, showDue = false }: Props) {
  const t = useTasksT()
  const repeat = describeRepeat(task, t)
  const due =
    showDue || (task.dueDate !== null && task.dueDate < today) ? dueLabel(task.dueDate, today, t) : ''
  const overdue = !done && task.dueDate !== null && task.dueDate < today

  const swipe = useSwipe({
    onRight: onToggle && !done && !busy ? () => onToggle(task) : undefined,
    onLeft: onTomorrow && !done ? () => onTomorrow(task) : undefined,
  })

  return (
    <div className={clsx(s.wrap, swipe.dx !== 0 && s.swiping)}>
      {swipe.dx > 0 && (
        <div className={clsx(s.under, s.underDone, swipe.armed && s.armed)} aria-hidden>
          <Check size={20} strokeWidth={3} /> {t.swipe.done}
        </div>
      )}
      {swipe.dx < 0 && (
        <div className={clsx(s.under, s.underLater, swipe.armed && s.armed)} aria-hidden>
          {t.swipe.tomorrow} <ArrowRight size={20} />
        </div>
      )}
      <div
        className={clsx(s.row, done && s.done)}
        style={swipe.dx ? { transform: `translateX(${swipe.dx}px)` } : undefined}
        {...swipe.handlers}
      >
        <button className={s.body} onClick={() => onOpen(task)}>
          <span className={s.title}>{task.title}</span>
          {(task.dueTime || repeat || due) && (
            <span className={s.meta}>
              {task.dueTime && <span className={s.time}>{task.dueTime}</span>}
              {due && <span className={clsx(overdue && s.overdue)}>{due}</span>}
              {repeat && (
                <span className={s.repeat}>
                  <Repeat size={12} aria-hidden /> {repeat}
                </span>
              )}
            </span>
          )}
        </button>

        {/* Pointer devices: the swipe's actions as buttons, shown on hover or focus. */}
        {onTomorrow && !done && (
          <button
            type="button"
            className={s.hoverAction}
            onClick={() => onTomorrow(task)}
            title={t.swipe.tomorrow}
            aria-label={`${task.title}: ${t.swipe.tomorrow}`}
          >
            <ArrowRight size={16} aria-hidden />
            <span>{t.swipe.tomorrow}</span>
          </button>
        )}

        {/* The tick at the right end, under the right thumb. */}
        {onToggle && (
          <button
            className={clsx(s.check, done && s.checked)}
            onClick={() => onToggle(task)}
            disabled={busy}
            aria-label={done ? t.undoLabel(task.title) : t.completeLabel(task.title)}
          >
            <Check size={16} strokeWidth={3} className={s.tick} />
          </button>
        )}
      </div>
    </div>
  )
}
