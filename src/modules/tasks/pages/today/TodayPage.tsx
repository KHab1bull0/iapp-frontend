import { useState } from 'react'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, CircleCheckBig, Plus, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { ProgressRing } from '@/core/components/ui/Progress'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useToday } from '@/core/hooks/useToday'
import { formatFullDate, parseApiDate } from '@/core/lib/format'
import { useQuickAdd } from '@/core/quickAdd/context'
import { fetchOverallStats, fetchToday, tasksKeys } from '@/modules/tasks/api/tasks'
import { Heatmap } from '@/modules/tasks/components/stats/Heatmap'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { TaskRow } from '@/modules/tasks/components/TaskRow'
import { byTime } from '@/modules/tasks/lib/repeat'
import { useTaskEditor } from '@/modules/tasks/useTaskEditor'
import { useCompleteTask, useMoveToTomorrow } from '@/modules/tasks/useCompleteTask'
import { useTasksT } from '@/modules/tasks/i18n'
import s from '../TasksPages.module.scss'

/**
 * Tasks → Today: how far through the day you are, what is due (overdue
 * first), and what's done, folded away. Swipe right to tick, left to put off
 * until tomorrow; the bar at the bottom adds.
 */
export function TodayPage() {
  const today = useToday()
  const m = useTasksT()
  const quickAdd = useQuickAdd()
  const editor = useTaskEditor()
  const { complete, undo, pending } = useCompleteTask(today)
  const toTomorrow = useMoveToTomorrow(today)
  // Open by default: done tasks stay in view (and can be unticked) unless folded away.
  const [showDone, setShowDone] = useState(true)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: tasksKeys.today(today),
    queryFn: () => fetchToday(today),
  })
  // The side rail's activity, desktop only (shared with the Statistics page).
  const isMobile = useIsMobile()
  const { data: stats } = useQuery({
    queryKey: tasksKeys.overallStats(today),
    queryFn: () => fetchOverallStats(today),
    enabled: !isMobile,
  })

  const overdue = data?.overdue ?? []
  // Anything with a time goes first, by the clock.
  const dueToday = byTime(data?.today ?? [])
  const done = data?.doneToday ?? []
  const all = overdue.length + dueToday.length + done.length

  const row = (t: (typeof dueToday)[number]) => (
    <TaskRow
      key={t.id}
      task={t}
      today={today}
      busy={pending.has(t.id)}
      onToggle={complete}
      onTomorrow={toTomorrow}
      onOpen={editor.openEdit}
    />
  )

  return (
    <div className={s.page}>
      {isError ? (
        <EmptyState
          title={m.loadFailed}
          action={{ label: m.retry, icon: RefreshCw, onClick: () => void refetch() }}
        />
      ) : isLoading ? (
        <div className={s.skeletons}>
          <Skeleton height={76} radius={20} />
          <Skeleton height={180} radius={16} />
        </div>
      ) : (
        <div className={s.layout}>
          <aside className={s.rail}>
          {all > 0 && (
            <section className={s.summary}>
              <ProgressRing value={done.length} max={all} label={m.progressTitle(done.length, all)} size={56}>
                {Math.round((done.length / all) * 100)}%
              </ProgressRing>
              <div>
                <div className={s.summaryTitle}>
                  {done.length === all ? m.progressAllDone : m.progressTitle(done.length, all)}
                </div>
                <div className={s.summarySub}>{formatFullDate(parseApiDate(today))}</div>
              </div>
            </section>
          )}
          {stats && stats.total > 0 && (
            <section className={s.railCard} aria-label={m.stats.activity}>
              <div className={s.railHead}>
                <h2 className={s.sectionTitle}>{m.stats.activity}</h2>
                {stats.currentStreak > 0 && <span className={s.streak}>{m.stats.streakValue(stats.currentStreak)}</span>}
              </div>
              <Heatmap days={stats.daily.slice(-56)} />
            </section>
          )}
          </aside>

          <div className={s.main}>

          {overdue.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <h2 className={clsx(s.sectionTitle, s.danger)}>{m.overdue}</h2>
                <span className={s.count}>{overdue.length}</span>
              </div>
              <div className={s.list}>{overdue.map(row)}</div>
            </section>
          )}

          {dueToday.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <h2 className={s.sectionTitle}>{m.today}</h2>
                <span className={s.count}>{dueToday.length}</span>
              </div>
              <div className={s.list}>{dueToday.map(row)}</div>
            </section>
          )}

          {overdue.length === 0 && dueToday.length === 0 && (
            <EmptyState
              icon={CircleCheckBig}
              title={done.length > 0 ? m.home.allDone : m.nothingToday}
              description={done.length > 0 ? m.home.allDoneSub : m.nothingTodaySub}
              action={{ label: m.home.addTask, icon: Plus, onClick: () => quickAdd.open('tasks.task') }}
            />
          )}

          {done.length > 0 && (
            <section className={s.section}>
              <button
                type="button"
                className={s.foldHead}
                aria-expanded={showDone}
                onClick={() => setShowDone((v) => !v)}
              >
                <h2 className={s.sectionTitle}>{m.showDone(done.length)}</h2>
                <ChevronDown size={18} className={clsx(s.foldIcon, showDone && s.open)} aria-hidden />
              </button>
              {showDone && (
                <div className={s.list}>
                  {done.map(({ completionId, task }) => (
                    <TaskRow
                      key={completionId}
                      task={task}
                      today={today}
                      done
                      onToggle={() => undo(completionId)}
                      onOpen={editor.openEdit}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
          </div>
        </div>
      )}

      {editor.dialog}
    </div>
  )
}
