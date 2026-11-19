import { useState } from 'react'
import clsx from 'clsx'
import { Check, Flame, Repeat, TriangleAlert } from 'lucide-react'
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
   * While a request about it is on its way (ticking, unticking): its
   * buttons and swipes wait, so a second tap can't send it twice.
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
  // A habit's line is its streak; the editor still says how it repeats.
  const repeat = habit ? '' : describeRepeat(task, t)
  // No red "N days late": a day already passed simply isn't mentioned.
  const due = showDue ? dueLabel(task.dueDate, today, t) : ''
  const atRisk = !done && Boolean(habit?.atRisk)
  // Only a streak that changes while in view pops, not every row on load.
  const [firstStreak] = useState(habit?.streak)
  const bumped = habit !== null && habit.streak !== firstStreak

  const swipe = useSwipe({
    onRight: onToggle && !done && !busy ? () => onToggle(task) : undefined,
  })
  const meta = task.dueTime || repeat || due || habit

  return (
    <div className={clsx(s.wrap, swipe.dx !== 0 && s.swiping)}>
      {swipe.dx > 0 && (
        <div className={clsx(s.under, s.underDone, swipe.armed && s.armed)} aria-hidden>
          <Check size={20} strokeWidth={3} /> {t.swipe.done}
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
              {due && !habit && <span>{due}</span>}
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
