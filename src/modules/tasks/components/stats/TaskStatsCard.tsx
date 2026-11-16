import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/core/hooks/useToday'
import { formatDate, parseApiDate } from '@/core/lib/format'
import { fetchTaskStats, tasksKeys, type Task } from '@/modules/tasks/api/tasks'
import { HabitStages } from '@/modules/tasks/components/habit/HabitStages'
import { isDaily } from '@/modules/tasks/lib/repeat'
import { useTasksT } from '@/modules/tasks/i18n'
import { StatGrid, StatTile } from '@/core/components/ui/StatTile'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { HeatmapSkeleton, LoadingLabel, StatTileSkeleton } from '@/modules/tasks/components/skeletons'
import { Heatmap } from './Heatmap'
import s from './TaskStats.module.scss'

/** A habit's stages. They come with the task, so they show while the numbers load too. */
function Stages({ habit }: { habit: Task | null }) {
  const t = useTasksT()
  if (!habit || habit.stages.length === 0) return null
  return (
    <div className={s.group}>
      <h2 className={s.groupLabel}>{t.habit.stages}</h2>
      <HabitStages task={habit} />
    </div>
  )
}

function TilesSkeleton() {
  return (
    <StatGrid columns={2}>
      <StatTileSkeleton />
      <StatTileSkeleton />
    </StatGrid>
  )
}

/** The activity group in outline: its label, the heatmap and the note under it. */
function ActivitySkeleton() {
  return (
    <div className={s.group}>
      <Skeleton height="var(--lh-caption)" width={64} />
      <HeatmapSkeleton />
      <Skeleton height="var(--lh-caption)" width="70%" />
    </div>
  )
}

/** The card in outline, for the edit page while the task itself still loads (the page says "Loading"). */
export function TaskStatsSkeleton() {
  const t = useTasksT()
  return (
    <section className={s.card} aria-label={t.stats.region} aria-busy="true">
      <TilesSkeleton />
      <ActivitySkeleton />
    </section>
  )
}

/**
 * At the top of the task editor: the streak (and the best one), how many
 * times it was done in all, a habit's stages, and the heatmap. A streak that
 * isn't daily counts times instead of days.
 *
 * While the numbers load, the same card in outline. The stages don't wait
 * (they come with the task) and keep their place, so a claim started
 * meanwhile carries on.
 */
export function TaskStatsCard({ taskId, task }: { taskId: string; task?: Task }) {
  const t = useTasksT()
  const habit = task?.isHabit ? task : null
  // Before habits the editor always said days; only a task known not to be daily changes that.
  const daily = task ? isDaily(task) : true
  const today = useToday()
  const { data, isError } = useQuery({
    queryKey: tasksKeys.stats(taskId, today),
    queryFn: () => fetchTaskStats(taskId, today),
  })

  if (isError) return null

  return (
    <section className={s.card} aria-label={t.stats.region} aria-busy={data ? undefined : true}>
      {!data && <LoadingLabel />}
      {data ? (
        <StatGrid columns={2}>
          <StatTile
            label={t.stats.streak}
            value={daily ? t.stats.streakValue(data.currentStreak) : t.habit.streak(data.currentStreak, false)}
            sub={daily ? t.stats.bestStreak(data.bestStreak) : t.stats.bestTimes(data.bestStreak)}
            tone={data.currentStreak > 0 ? 'warning' : 'default'}
          />
          <StatTile
            label={t.stats.total}
            value={String(data.total)}
            sub={t.stats.totalSub(data.firstDoneOn && formatDate(parseApiDate(data.firstDoneOn)))}
          />
        </StatGrid>
      ) : (
        <TilesSkeleton />
      )}

      <Stages habit={habit} />

      {!data ? (
        <ActivitySkeleton />
      ) : data.total === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyTitle}>{t.stats.notDoneYet}</div>
          <div className={s.emptySub}>{t.stats.notDoneYetSub}</div>
        </div>
      ) : (
        <div className={s.group}>
          <h2 className={s.groupLabel}>{t.stats.activity}</h2>
          <Heatmap days={data.daily} compact />
          <p className={s.note}>{t.stats.streakRule}</p>
        </div>
      )}
    </section>
  )
}
