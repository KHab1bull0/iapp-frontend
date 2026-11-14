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
import { fetchOverallStats, fetchToday, tasksKeys, type Task } from '@/modules/tasks/api/tasks'
import { Heatmap } from '@/modules/tasks/components/stats/Heatmap'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { TaskRow } from '@/modules/tasks/components/TaskRow'
import { byTime } from '@/modules/tasks/lib/repeat'
import { useTaskEditor } from '@/modules/tasks/useTaskEditor'
import { useCompleteTask, useMoveToTomorrow } from '@/modules/tasks/useCompleteTask'
import { useTasksT } from '@/modules/tasks/i18n'
import s from '../TasksPages.module.scss'

/** At risk first (today decides their streak), then by the clock. */
const habitOrder = (tasks: Task[]) => {
  const timed = byTime(tasks)
  return [...timed.filter((t) => t.progress?.atRisk), ...timed.filter((t) => !t.progress?.atRisk)]
}

/**
 * Tasks → Today: how far through the day you are, the habits on top (done
 * ones stay there, ticked, with their streak), what else is due (overdue
 * first), and what's done, folded away. Swipe right to tick, left to put off
 * until tomorrow; the bar at the bottom adds.
 */
export function TodayPage() {
  const today = useToday()
  const m = useTasksT()
  const quickAdd = useQuickAdd()
  const editor = useTaskEditor()
  const { complete, chooseKind, undo, pending, feedback } = useCompleteTask(today)
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

  const allOverdue = data?.overdue ?? []
  const allToday = data?.today ?? []
  const allDone = data?.doneToday ?? []
  const all = allOverdue.length + allToday.length + allDone.length

  const habits = habitOrder([...allOverdue, ...allToday].filter((t) => t.isHabit))
  const habitsDone = allDone.filter((d) => d.task.isHabit)
  const overdue = allOverdue.filter((t) => !t.isHabit)
  // Anything with a time goes first, by the clock.
  const dueToday = byTime(allToday.filter((t) => !t.isHabit))
  const done = allDone.filter((d) => !d.task.isHabit)

  const row = (t: Task) => (
    <TaskRow
      key={t.id}
      task={t}
      today={today}
      busy={pending.has(t.id)}
      onToggle={complete}
      onTomorrow={toTomorrow}
      onOpen={editor.openEdit}
      onMore={t.isHabit ? chooseKind : undefined}
    />
  )

  const doneRow = ({ completionId, task, kind }: (typeof allDone)[number], key = completionId) => (
    <TaskRow
      key={key}
      task={task}
      today={today}
      done
      rested={kind === 'rest'}
      onToggle={() => undo(completionId)}
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
          <Skeleton height={88} radius={16} />
          <Skeleton height={180} radius={16} />
        </div>
      ) : (
        <div className={s.layout}>
          <aside className={s.rail}>
          {all > 0 && (
            <section className={s.summary}>
              <ProgressRing value={allDone.length} max={all} label={m.progressTitle(allDone.length, all)} size={56}>
                {Math.round((allDone.length / all) * 100)}%
              </ProgressRing>
              <div>
                <div className={s.summaryTitle}>
                  {allDone.length === all ? m.progressAllDone : m.progressTitle(allDone.length, all)}
                </div>
                <div className={s.summarySub}>{formatFullDate(parseApiDate(today))}</div>
              </div>
            </section>
          )}
          {stats && stats.total > 0 && (
            <section className={s.railCard} aria-label={m.stats.activity}>
              <div className={s.railHead}>
                <h2 className={s.railTitle}>{m.stats.activity}</h2>
                {stats.currentStreak > 0 && <span className={s.streak}>{m.stats.streakValue(stats.currentStreak)}</span>}
              </div>
              <Heatmap days={stats.daily.slice(-56)} />
            </section>
          )}
          </aside>

          <div className={s.main}>

          {habits.length + habitsDone.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <h2 className={s.sectionTitle}>{m.habit.section}</h2>
                <span className={s.count}>
                  {habitsDone.length}/{habits.length + habitsDone.length}
                </span>
              </div>
              {/* One list keyed by task: a habit ticked off stays the same row, so its streak can pop.
                  (Done once and due again today, e.g. a past day ticked: its own key.) */}
              <div className={s.list}>
                {[
                  ...habits.map(row),
                  ...habitsDone.map((d) =>
                    doneRow(d, habits.some((h) => h.id === d.task.id) ? d.completionId : d.task.id),
                  ),
                ]}
              </div>
            </section>
          )}

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

          {overdue.length === 0 && dueToday.length === 0 && habits.length === 0 && (
            <EmptyState
              icon={CircleCheckBig}
              title={allDone.length > 0 ? m.home.allDone : m.nothingToday}
              description={allDone.length > 0 ? m.home.allDoneSub : m.nothingTodaySub}
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
              {showDone && <div className={s.list}>{done.map((d) => doneRow(d))}</div>}
            </section>
          )}
          </div>
        </div>
      )}

      {editor.dialog}
      {feedback}
    </div>
  )
}
