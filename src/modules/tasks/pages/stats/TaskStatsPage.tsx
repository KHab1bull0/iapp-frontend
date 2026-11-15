import { useQuery } from '@tanstack/react-query'
import { BarChart3, Plus, RefreshCw } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { formatDate, parseApiDate } from '@/core/lib/format'
import { fetchOverallStats, tasksKeys } from '@/modules/tasks/api/tasks'
import { Heatmap } from '@/modules/tasks/components/stats/Heatmap'
import { StatGrid, StatTile } from '@/core/components/ui/StatTile'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { useQuickAdd } from '@/core/quickAdd/context'
import st from '@/modules/tasks/components/stats/TaskStats.module.scss'
import { useTasksT } from '@/modules/tasks/i18n'
import { ReviewEntryCard } from '@/modules/tasks/review/ReviewEntryCard'
import s from '../TasksPages.module.scss'

/** Tasks → Tahlil: the way into the weekly review, the streak and the total, and the heatmap. */
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

  if (isLoading || !data) return <div className={s.page} />

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
      <StatGrid columns={2}>
        <StatTile
          label={t.stats.streak}
          value={t.stats.streakValue(data.currentStreak)}
          sub={t.stats.bestStreak(data.bestStreak)}
          tone={data.currentStreak > 0 ? 'warning' : 'default'}
        />
        <StatTile
          label={t.stats.total}
          value={String(data.total)}
          sub={t.stats.totalSub(data.firstDoneOn && formatDate(parseApiDate(data.firstDoneOn)))}
        />
      </StatGrid>

      <section className={st.card} aria-label={t.stats.activity}>
        <h2 className={st.cardTitle}>{t.stats.activity}</h2>
        <Heatmap days={data.daily} />
        <p className={st.note}>{t.stats.streakRule}</p>
      </section>
    </div>
  )
}
