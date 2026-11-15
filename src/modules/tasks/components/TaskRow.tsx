import { useState } from 'react'
import clsx from 'clsx'
import { ArrowRight, Check, Flame, Repeat, TriangleAlert } from 'lucide-react'
import { useSwipe } from '@/core/hooks/useSwipe'
import type { Task } from '@/modules/tasks/api/tasks'
import { describeRepeat, dueLabel, isDaily } from '@/modules/tasks/lib/repeat'
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
   * While a request about it is on its way (ticking, unticking, moving): its
   * buttons and swipes wait, so a second tap can't send it twice.
   */
  busy?: boolean
  onOpen: (task: Task) => void
  /** Swipe left: move to tomorrow. The edit sheet's date is the non-gesture way to do the same. */
  onTomorrow?: (task: Task) => void
  /** Show "Tomorrow", "3 days overdue"… (All tasks); Today's own sections say it already. */
  showDue?: boolean
  /**
   * A habit with a two-minute version: a small button beside the tick that
   * checks it in that way. The tick stays one tap = in full.
   */
  onMin?: (task: Task) => void
}

export function TaskRow({
  task,
  today,
  done = false,
  onToggle,
  busy = false,
  onOpen,
  onTomorrow,
  showDue = false,
  onMin,
}: Props) {
  const t = useTasksT()
  const habit = task.isHabit ? task.progress : null
  // A habit's line is its streak and stage; the editor still says how it repeats.
  const repeat = habit ? '' : describeRepeat(task, t)
  const due =
    showDue || (task.dueDate !== null && task.dueDate < today) ? dueLabel(task.dueDate, today, t) : ''
  const overdue = !done && task.dueDate !== null && task.dueDate < today
  const atRisk = !done && Boolean(habit?.atRisk)
  // Only a streak that changes while in view pops, not every row on load.
  const [firstStreak] = useState(habit?.streak)
  const bumped = habit !== null && habit.streak !== firstStreak
  const min = habit && task.minVersion && onMin && onToggle && !done ? () => onMin(task) : undefined

  const swipe = useSwipe({
    onRight: onToggle && !done && !busy ? () => onToggle(task) : undefined,
    onLeft: onTomorrow && !done && !busy ? () => onTomorrow(task) : undefined,
  })
  const meta = task.dueTime || repeat || due || habit

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
        className={clsx(s.row, done && s.done, atRisk && s.atRisk, busy && s.busy)}
        style={swipe.dx ? { transform: `translateX(${swipe.dx}px)` } : undefined}
        {...swipe.handlers}
      >
        <button className={s.body} onClick={() => onOpen(task)}>
          <span className={s.title}>{task.title}</span>
          {meta && (
            <span className={s.meta}>
              {task.dueTime && <span className={s.time}>{task.dueTime}</span>}
              {due && !habit && <span className={clsx(overdue && s.overdue)}>{due}</span>}
              {habit && habit.streak > 0 && (
                <span className={s.streak}>
                  <Flame size={12} aria-hidden />
                  {/* Keyed on the number: each new streak pops in again. */}
                  <span key={habit.streak} className={clsx(bumped && s.streakNum)} aria-hidden>
                    {habit.streak}
                  </span>
                  <span className="sr-only">{t.habit.streakLabel(habit.streak, isDaily(task))}</span>
                </span>
              )}
              {habit?.stage && (
                <span className={s.stage}>
                  <span aria-hidden>
                    {habit.streak}/{habit.stage.days}
                  </span>
                  <span className="sr-only">
                    {t.habit.stageProgress(habit.stage.position, habit.streak, habit.stage.days)}
                  </span>
                </span>
              )}
              {atRisk && (
                <span className={s.risk}>
                  <TriangleAlert size={12} aria-hidden /> {t.habit.atRisk}
                </span>
              )}
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
            disabled={busy}
            title={t.swipe.tomorrow}
            aria-label={`${task.title}: ${t.swipe.tomorrow}`}
          >
            <ArrowRight size={16} aria-hidden />
            <span>{t.swipe.tomorrow}</span>
          </button>
        )}

        {/* A hard day: the two-minute version, one tap, next to the tick. */}
        {min && (
          <button
            type="button"
            className={s.min}
            onClick={min}
            disabled={busy}
            title={task.minVersion ?? undefined}
            aria-label={t.habit.minLabel(task.title, task.minVersion ?? '')}
          >
            {t.habit.minButton}
          </button>
        )}

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
