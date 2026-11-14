import { useState } from 'react'
import clsx from 'clsx'
import { ArrowRight, Check, Flame, MoreHorizontal, Repeat, TriangleAlert } from 'lucide-react'
import { chain, useLongPress } from '@/core/hooks/useLongPress'
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
  /** While its completion is being saved, so a second tap can't complete it twice. */
  busy?: boolean
  onOpen: (task: Task) => void
  /** Swipe left: move to tomorrow. The edit sheet's date is the non-gesture way to do the same. */
  onTomorrow?: (task: Task) => void
  /** Show "Tomorrow", "3 days overdue"… (All tasks); Today's own sections say it already. */
  showDue?: boolean
  /**
   * A habit's other ways to check in (two-minute version, rest day): a
   * long-press on touch, the "⋯" button with a mouse. The tick stays one tap = in full.
   */
  onMore?: (task: Task) => void
  /** Done today as a rest day, not as done. */
  rested?: boolean
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
  onMore,
  rested = false,
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
  const more = onMore && onToggle && !done && !busy ? () => onMore(task) : undefined

  const swipe = useSwipe({
    onRight: onToggle && !done && !busy ? () => onToggle(task) : undefined,
    onLeft: onTomorrow && !done ? () => onTomorrow(task) : undefined,
  })
  // Held still: the sheet's choices. A held finger that then moves no longer swipes.
  const press = useLongPress({ onLongPress: more, onHold: swipe.cancel })
  const gestures = {
    onPointerDown: chain(swipe.handlers.onPointerDown, press.handlers.onPointerDown),
    onPointerMove: chain(swipe.handlers.onPointerMove, press.handlers.onPointerMove),
    onPointerUp: chain(swipe.handlers.onPointerUp, press.handlers.onPointerUp),
    onPointerCancel: chain(swipe.handlers.onPointerCancel, press.handlers.onPointerCancel),
    onClickCapture: press.handlers.onClickCapture,
    onContextMenu: press.handlers.onContextMenu,
  }
  const meta = task.dueTime || repeat || due || habit || rested

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
        className={clsx(s.row, done && s.done, atRisk && s.atRisk, more && s.pressable, press.held && s.held)}
        style={swipe.dx ? { transform: `translateX(${swipe.dx}px)` } : undefined}
        {...gestures}
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
                <span className={s.stage}>{t.habit.stageProgress(habit.stage.position, habit.streak, habit.stage.days)}</span>
              )}
              {atRisk && (
                <span className={s.risk}>
                  <TriangleAlert size={12} aria-hidden /> {t.habit.atRisk}
                </span>
              )}
              {rested && <span>{t.habit.rested}</span>}
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

        {/* A mouse can't long-press: the same choices behind a visible button. */}
        {more && (
          <button
            type="button"
            className={s.more}
            onClick={more}
            title={t.habit.more(task.title)}
            aria-label={t.habit.more(task.title)}
            aria-haspopup="dialog"
          >
            <MoreHorizontal size={18} aria-hidden />
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
