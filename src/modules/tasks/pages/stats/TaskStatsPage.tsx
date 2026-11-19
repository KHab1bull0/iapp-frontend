import { useQuery } from '@tanstack/react-query'
import { BarChart3, Plus, RefreshCw } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { fetchOverallStats, tasksKeys } from '@/modules/tasks/api/tasks'
import { Heatmap } from '@/modules/tasks/components/stats/Heatmap'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useQuickAdd } from '@/core/quickAdd/context'
import { HeatmapSkeleton, LoadingLabel } from '@/modules/tasks/components/skeletons'
import st from '@/modules/tasks/components/stats/TaskStats.module.scss'
import { useTasksT } from '@/modules/tasks/i18n'
import { ReviewEntryCard } from '@/modules/tasks/review/ReviewEntryCard'
import s from '../TasksPages.module.scss'

/** Tasks → Tahlil: the way into the weekly review, and the activity with the total done. */
export function TaskStatsPage() {
  const t = useTasksT()
  const today = useToday()
  const quickAdd = useQuickAdd()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: tasksKeys.overallStats(today),
    queryFn: () => fetchOverallStats(today),
  })

  if (isError) {
    return (
      <div className={s.page}>
        <EmptyState title={t.stats.loadFailed} action={{ label: t.retry, icon: RefreshCw, onClick: () => void refetch() }} />
      </div>
    )
  }

  if (isLoading || !data) {
    // The page in outline. The review card loads on its own, so it is the real one.
    return (
      <div className={s.page} aria-busy="true">
        <ReviewEntryCard />
        <LoadingLabel />
        <div className={st.card}>
          <Skeleton height="var(--lh-title)" width={80} />
          <HeatmapSkeleton />
        </div>
      </div>
    )
  }

  if (data.total === 0) {
    return (
      <div className={s.page}>
        {/* The week can still be reviewed (its questions) before any task is done. */}
        <ReviewEntryCard />
        <EmptyState
          icon={BarChart3}
          title={t.stats.empty}
          description={t.stats.emptySub}
          action={{ label: t.home.addTask, icon: Plus, onClick: () => quickAdd.open('tasks.task') }}
        />
      </div>
    )
  }

  return (
    <div className={s.page}>
      <ReviewEntryCard />
      <section className={st.card} aria-label={t.stats.activity}>
        <div className={st.groupHead}>
          <h2 className={st.cardTitle}>{t.stats.activity}</h2>
          <span className={st.cardValue}>{t.stats.totalTimes(data.total)}</span>
        </div>
        <Heatmap days={data.daily} />
      </section>
    </div>
  )
}
