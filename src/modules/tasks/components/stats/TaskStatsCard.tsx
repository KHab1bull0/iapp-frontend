import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/core/hooks/useToday'
import { fetchTaskStats, tasksKeys, type Task } from '@/modules/tasks/api/tasks'
import { useTasksT } from '@/modules/tasks/i18n'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { HeatmapSkeleton, LoadingLabel } from '@/modules/tasks/components/skeletons'
import { Heatmap } from './Heatmap'
import s from './TaskStats.module.scss'

/** The activity card in outline: its head and the heatmap. */
function ActivitySkeleton() {
  return (
    <div className={s.group}>
      <Skeleton height="var(--lh-caption)" width="40%" />
      <HeatmapSkeleton />
    </div>
  )
}

/** The card in outline, for the task page while the task itself still loads (the page says "Loading"). */
export function TaskStatsSkeleton() {
  const t = useTasksT()
  return (
    <section className={s.card} aria-label={t.stats.region} aria-busy="true">
      <ActivitySkeleton />
    </section>
  )
}

/**
 * A task's record: its activity (the heatmap), with the number of days it
 * was done across from the heading. While the numbers load, the same card
 * in outline.
 */
// `task` is kept for callers; the card needs only the id.
export function TaskStatsCard({ taskId }: { taskId: string; task?: Task }) {
  const t = useTasksT()
  const today = useToday()
  const { data, isError } = useQuery({
    queryKey: tasksKeys.stats(taskId, today),
    queryFn: () => fetchTaskStats(taskId, today),
  })

  if (isError) return null

  return (
    <section className={s.card} aria-label={t.stats.region} aria-busy={data ? undefined : true}>
      {!data && <LoadingLabel />}
      {!data ? (
        <ActivitySkeleton />
      ) : data.total === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyTitle}>{t.stats.notDoneYet}</div>
          <div className={s.emptySub}>{t.stats.notDoneYetSub}</div>
        </div>
      ) : (
        <div className={s.group}>
          <div className={s.groupHead}>
            <h2 className={s.groupLabel}>{t.stats.activity}</h2>
            <span className={s.groupValue}>{t.stats.totalDays(data.total)}</span>
          </div>
          <Heatmap days={data.daily} compact single />
        </div>
      )}
    </section>
  )
}
