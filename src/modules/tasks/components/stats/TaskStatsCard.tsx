import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/core/hooks/useToday'
import { formatDate, parseApiDate } from '@/core/lib/format'
import { fetchTaskStats, tasksKeys } from '@/modules/tasks/api/tasks'
import { useTasksT } from '@/modules/tasks/i18n'
import { CHART } from '@/core/lib/chartColors'
import { ProgressChart } from './ProgressChart'
import { StatGrid, StatTile } from '@/core/components/ui/StatTile'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { Heatmap } from './Heatmap'
import { PeriodToggle } from './parts'
import { toChartPoints, type Period } from './points'
import s from './TaskStats.module.scss'

/** At the top of the task editor: how often this one task has been done. */
export function TaskStatsCard({ taskId }: { taskId: string }) {
  const t = useTasksT()
  const today = useToday()
  const [period, setPeriod] = useState<Period>('daily')
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
      <StatGrid columns={3}>
        <StatTile
          label={t.stats.total}
          value={String(data.total)}
          sub={t.stats.totalSub(data.firstDoneOn && formatDate(parseApiDate(data.firstDoneOn)))}
        />
        <StatTile label={t.stats.thisMonth} value={String(data.thisMonth)} sub={t.stats.thisMonthSub} />
        <StatTile
          label={t.stats.streak}
          value={t.stats.streakValue(data.currentStreak)}
          sub={t.stats.bestStreak(data.bestStreak)}
          tone={data.currentStreak > 0 ? 'warning' : 'default'}
        />
      </StatGrid>

      {data.total === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyTitle}>{t.stats.notDoneYet}</div>
          <div className={s.emptySub}>{t.stats.notDoneYetSub}</div>
        </div>
      ) : (
        <>
          <div className={s.cardHead}>
            <h2 className={s.groupLabel}>{t.stats.progress}</h2>
            <PeriodToggle value={period} onChange={setPeriod} />
          </div>
          <ProgressChart
            data={toChartPoints(data, period)}
            bars={[{ key: 'count', label: t.stats.doneCount, color: CHART.primarySoft }]}
            height={150}
          />
          <h2 className={s.groupLabel}>{t.stats.activity}</h2>
          <Heatmap days={data.daily} />
          <p className={s.note}>{t.stats.streakRule}</p>
        </>
      )}
    </section>
  )
}
