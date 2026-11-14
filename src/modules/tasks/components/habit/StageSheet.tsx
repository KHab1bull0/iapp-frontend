import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Gift, Trophy } from 'lucide-react'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import { ProgressBar } from '@/core/components/ui/Progress'
import { Sheet } from '@/core/components/ui/Sheet'
import { toast } from '@/core/components/ui/toast'
import { claimStage, tasksKeys, type CompleteResult, type NextStage } from '@/modules/tasks/api/tasks'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './Habit.module.scss'

export interface StageReached {
  title: string
  stage: NonNullable<CompleteResult['stageReached']>
  streak: number
  daily: boolean
  next: NextStage | null
}

/**
 * The one time a check-in earns a sheet: a stage reached. It names the
 * reward the user chose for it (never a surprise), takes "I took my reward",
 * and shows the next stage straight away, so the run doesn't feel finished.
 */
export function StageSheet({
  data,
  open,
  onOpenChange,
}: {
  /** Kept after closing, so the sheet doesn't empty while it slides away. */
  data: StageReached | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTasksT()
  const { lang } = useLang()
  const qc = useQueryClient()

  const claim = useMutation({
    mutationFn: claimStage,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tasksKeys.all })
      toast(t.habit.claimedToast, 'success')
      onOpenChange(false)
    },
    onError: (err) => toast(apiErrorText(err, lang, t.habit.claimFailed), 'error'),
  })

  const reward = data?.stage.reward
  const next = data?.next

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={data ? t.habit.reachedTitle(data.stage.position) : ''}
      description={data ? t.habit.reachedSub(t.habit.streak(data.streak, data.daily)) : undefined}
      footer={
        data &&
        (reward ? (
          <button
            type="button"
            className={s.claim}
            disabled={claim.isPending}
            onClick={() => claim.mutate(data.stage.id)}
          >
            <Gift size={18} aria-hidden /> {t.habit.claim}
          </button>
        ) : (
          <button type="button" className={s.claim} onClick={() => onOpenChange(false)}>
            {t.habit.keepGoing}
          </button>
        ))
      }
    >
      {data && (
        <div className={s.reached}>
          <div className={s.trophy} aria-hidden>
            <Trophy size={32} />
          </div>
          <div className={s.reachedTitle}>{data.title}</div>
          {reward && <div className={s.reward}>{t.habit.yourReward(reward)}</div>}

          <div className={s.next}>
            {next ? (
              <>
                <div className={s.nextHead}>
                  <span className={s.nextLabel}>
                    {t.habit.next}: {t.habit.stage(next.position)}
                  </span>
                  <span className={s.nextCount}>
                    {data.streak}/{next.days}
                  </span>
                </div>
                <ProgressBar
                  value={data.streak}
                  max={next.days}
                  label={t.habit.stageProgress(next.position, data.streak, next.days)}
                />
                {next.reward && <span className={s.nextReward}>{t.habit.nextReward(next.reward)}</span>}
              </>
            ) : (
              <span className={s.nextLabel}>{t.habit.allReached}</span>
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}
