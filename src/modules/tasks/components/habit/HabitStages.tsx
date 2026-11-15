import { useState } from 'react'
import clsx from 'clsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Gift } from 'lucide-react'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import { ProgressBar } from '@/core/components/ui/Progress'
import { toast } from '@/core/components/ui/toast'
import { claimStage, tasksKeys, type Task } from '@/modules/tasks/api/tasks'
import { useTasksT } from '@/modules/tasks/i18n'
import { isDaily } from '@/modules/tasks/lib/repeat'
import s from './HabitStages.module.scss'

/**
 * In the habit's stats: every stage, and where each stands. Taken (claimed),
 * reached with the reward still to take (claim it here if the sheet was
 * closed), the next one with the streak's progress, or still ahead.
 */
export function HabitStages({ task }: { task: Task }) {
  const t = useTasksT()
  const { lang } = useLang()
  const qc = useQueryClient()
  const daily = isDaily(task)
  const streak = task.progress?.streak ?? 0
  const nextPosition = task.progress?.stage?.position
  // The desktop panel holds the task it was opened with: remember what was claimed here.
  const [claimedHere, setClaimedHere] = useState<string[]>([])

  const claim = useMutation({
    mutationFn: claimStage,
    onSuccess: (_r, id) => {
      setClaimedHere((ids) => [...ids, id])
      void qc.invalidateQueries({ queryKey: tasksKeys.all })
      toast(t.habit.claimedToast, 'success')
    },
    onError: (err) => toast(apiErrorText(err, lang, t.habit.claimFailed), 'error'),
  })

  if (task.stages.length === 0) return null

  return (
    <ol className={s.list}>
      {task.stages.map((st) => {
        const isNext = st.position === nextPosition
        return (
          <li key={st.id} className={clsx(s.stage, st.reachedAt && s.reached)}>
            <span className={s.badge} aria-hidden>
              {st.reachedAt ? <Check size={14} strokeWidth={3} /> : st.position}
            </span>
            <span className={s.text}>
              <span className={s.name}>
                {t.habit.stage(st.position)} · {t.habit.streak(st.days, daily)}
              </span>
              {st.reward && <span className={s.reward}>{st.reward}</span>}
              {isNext && !st.reachedAt && (
                <ProgressBar
                  className={s.bar}
                  value={streak}
                  max={st.days}
                  label={t.habit.stageProgress(st.position, streak, st.days)}
                />
              )}
            </span>
            <span className={s.state}>
              {st.claimedAt || claimedHere.includes(st.id) ? (
                <span className={s.claimed}>{t.habit.claimed}</span>
              ) : st.reachedAt && st.reward ? (
                <button
                  type="button"
                  className={s.claim}
                  disabled={claim.isPending}
                  aria-busy={(claim.isPending && claim.variables === st.id) || undefined}
                  onClick={() => claim.mutate(st.id)}
                >
                  <Gift size={14} aria-hidden />{' '}
                  {claim.isPending && claim.variables === st.id ? t.habit.claiming : t.habit.claim}
                </button>
              ) : st.reachedAt ? (
                <span className={s.claimed}>{t.habit.reached}</span>
              ) : isNext ? (
                <span className={s.count}>
                  {streak}/{st.days}
                </span>
              ) : null}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
