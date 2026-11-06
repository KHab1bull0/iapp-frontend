import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/core/hooks/useToday'
import { CHART, SERIES } from '@/core/lib/chartColors'
import { formatDate, parseApiDate } from '@/core/lib/format'
import { fetchOverallStats, REPEAT_KINDS, tasksKeys, type RepeatKind } from '@/modules/tasks/api/tasks'
import { ProgressChart, type BarSeries } from '@/modules/tasks/components/stats/ProgressChart'
import { PeriodToggle } from '@/modules/tasks/components/stats/parts'
import { Heatmap } from '@/modules/tasks/components/stats/Heatmap'
import { StatGrid, StatTile } from '@/core/components/ui/StatTile'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { useQuickAdd } from '@/core/quickAdd/context'
import { BarChart3, Plus, RefreshCw } from 'lucide-react'
import { toChartPoints, type Period } from '@/modules/tasks/components/stats/points'
import st from '@/modules/tasks/components/stats/TaskStats.module.scss'
import { useTasksT } from '@/modules/tasks/i18n'
import s from '../TasksPages.module.scss'

const KIND_COLORS: Record<RepeatKind, string> = {
  once: CHART.neutral,
  daily: SERIES[0],
  weekly: SERIES[1],
  monthly: SERIES[2],
}

/** Tasks → Statistics: every task together, split by how it repeats. */
export function TaskStatsPage() {
  const t = useTasksT()
  const today = useToday()
  const quickAdd = useQuickAdd()
  const [period, setPeriod] = useState<Period>('daily')
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
        <EmptyState
          icon={BarChart3}
          title={t.stats.empty}
          description={t.stats.emptySub}
          action={{ label: t.home.addTask, icon: Plus, onClick: () => quickAdd.open('tasks.task') }}
        />
      </div>
    )
  }

  const bars: BarSeries[] = REPEAT_KINDS.map((k) => ({ key: k, label: t.stats.kinds[k], color: KIND_COLORS[k] }))
  const maxKind = Math.max(1, ...REPEAT_KINDS.map((k) => data.byKind[k]))

  return (
    <div className={s.page}>
      <StatGrid columns={4}>
        <StatTile
          label={t.stats.total}
          value={String(data.total)}
          sub={t.stats.totalSub(data.firstDoneOn && formatDate(parseApiDate(data.firstDoneOn)))}
        />
        <StatTile label={t.stats.thisMonth} value={String(data.thisMonth)} sub={t.stats.thisMonthSub} />
        <StatTile label={t.stats.streak} value={t.stats.streakValue(data.currentStreak)} sub={t.stats.bestStreak(data.bestStreak)} tone={data.currentStreak > 0 ? 'warning' : 'default'} />
        <StatTile label={t.today} value={String(data.daily.at(-1)?.count ?? 0)} sub={t.stats.doneCount} />
      </StatGrid>

      <section className={st.card} aria-label={t.stats.progress}>
        <div className={st.cardHead}>
          <h2 className={st.cardTitle}>{t.stats.progress}</h2>
          <PeriodToggle value={period} onChange={setPeriod} />
        </div>
        <ProgressChart data={toChartPoints(data, period)} bars={bars} height={220} />
        <div className={st.legend}>
          {bars.map((b) => (
            <span key={b.key}>
              <span className={st.dot} style={{ background: b.color }} />
              {b.label}
            </span>
          ))}
        </div>
      </section>

      <section className={st.card} aria-label={t.stats.activity}>
        <h2 className={st.cardTitle}>{t.stats.activity}</h2>
        <Heatmap days={data.daily} />
        <p className={st.note}>{t.stats.streakRule}</p>
      </section>

      <section className={st.card} aria-label={t.stats.byKind}>
        <h2 className={st.cardTitle}>{t.stats.byKind}</h2>
        <ul className={st.rows}>
          {REPEAT_KINDS.map((k) => (
            <li key={k} className={st.row}>
              <span className={st.rowLabel}>
                <span className={st.dot} style={{ background: KIND_COLORS[k] }} />
                {t.stats.kinds[k]}
              </span>
              <span className={st.track}>
                {data.byKind[k] > 0 && (
                  <span
                    className={st.bar}
                    style={{ width: `${(data.byKind[k] / maxKind) * 100}%`, background: KIND_COLORS[k] }}
                  />
                )}
              </span>
              <span className={st.rowValue}>{data.byKind[k]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
