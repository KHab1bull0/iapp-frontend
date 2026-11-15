import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/core/hooks/useToday'
import { formatDate, parseApiDate } from '@/core/lib/format'
import { fetchTaskStats, tasksKeys, type Task } from '@/modules/tasks/api/tasks'
import { HabitStages } from '@/modules/tasks/components/habit/HabitStages'
import { isDaily } from '@/modules/tasks/lib/repeat'
import { useTasksT } from '@/modules/tasks/i18n'
import { StatGrid, StatTile } from '@/core/components/ui/StatTile'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { Heatmap } from './Heatmap'
import s from './TaskStats.module.scss'

/**
 * At the top of the task editor: the streak (and the best one), how many
 * times it was done in all, a habit's stages, and the heatmap. A streak that
 * isn't daily counts times instead of days.
 */
export function TaskStatsCard({ taskId, task }: { taskId: string; task?: Task }) {
  const t = useTasksT()
  const habit = task?.isHabit ? task : null
  // Before habits the editor always said days; only a task known not to be daily changes that.
  const daily = task ? isDaily(task) : true
  const today = useToday()
  const { data, isLoading, isError } = useQuery({
    queryKey: tasksKeys.stats(taskId, today),
    queryFn: () => fetchTaskStats(taskId, today),
  })

  if (isError) return null
  if (isLoading || !data) {
    return (
      <section className={s.card} aria-label={t.stats.region} aria-busy="true">
        <Skeleton height={120} radius={12} />
      </section>
    )
  }

  return (
    <section className={s.card} aria-label={t.stats.region}>
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

      {habit && habit.stages.length > 0 && (
        <div className={s.group}>
          <h2 className={s.groupLabel}>{t.habit.stages}</h2>
          <HabitStages task={habit} />
        </div>
      )}

      {data.total === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyTitle}>{t.stats.notDoneYet}</div>
          <div className={s.emptySub}>{t.stats.notDoneYetSub}</div>
        </div>
      ) : (
        <div className={s.group}>
          <h2 className={s.groupLabel}>{t.stats.activity}</h2>
          <Heatmap days={data.daily} />
          <p className={s.note}>{t.stats.streakRule}</p>
        </div>
      )}
    </section>
  )
}
