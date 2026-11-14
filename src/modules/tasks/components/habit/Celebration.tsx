import { useEffect } from 'react'
import { Flame } from 'lucide-react'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './Habit.module.scss'

export interface CelebrationData {
  /** New for every completion, so a second one restarts the timer and the count. */
  id: number
  title: string
  from: number
  to: number
  daily: boolean
  /** "+1 vote: I am a reader", or "21 times in all" when there is no identity. */
  line: string | null
  completionId: string
}

const SHOW_MS = 4000

/**
 * Right after a habit is done: the streak ticking up and what the
 * completion stands for. A pill where the toasts appear, not a modal, gone
 * by itself; Undo stays at hand as on any tick. The count's roll is a CSS
 * animation, so "reduce motion" (global rule in index.css) shows the new
 * number at once. The region is always mounted, so screen readers announce
 * each new streak.
 */
export function Celebration({
  data,
  onUndo,
  onDismiss,
}: {
  data: CelebrationData | null
  onUndo: (completionId: string) => void
  onDismiss: () => void
}) {
  const t = useTasksT()

  useEffect(() => {
    if (!data) return
    const timer = setTimeout(onDismiss, SHOW_MS)
    return () => clearTimeout(timer)
  }, [data, onDismiss])

  return (
    <div className={s.celebrationHost} role="status" aria-live="polite">
      {data && (
        <div key={data.id} className={s.celebration}>
          <span className={s.flame} aria-hidden>
            <Flame size={20} />
          </span>
          <span className={s.celebrationText}>
            <span className={s.count} aria-hidden>
              {data.from < data.to && <span className={s.countFrom}>{data.from}</span>}
              <span className={s.countTo}>{data.to}</span>
              <span className={s.countUnit}>{t.habit.unit(data.daily, data.to)}</span>
            </span>
            <span className="sr-only">{t.habit.celebrate(data.title, t.habit.streak(data.to, data.daily))}</span>
            {data.line && <span className={s.vote}>{data.line}</span>}
          </span>
          <button
            type="button"
            className={s.celebrationUndo}
            onClick={() => {
              onUndo(data.completionId)
              onDismiss()
            }}
          >
            {t.undo}
          </button>
        </div>
      )}
    </div>
  )
}
