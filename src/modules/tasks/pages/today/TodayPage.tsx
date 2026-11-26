import clsx from 'clsx'
import { useState } from 'react'
import type React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, CircleCheckBig, Plus, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { ProgressRing } from '@/core/components/ui/Progress'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { useToday } from '@/core/hooks/useToday'
import { formatFullDate, parseApiDate } from '@/core/lib/format'
import { useQuickAdd } from '@/core/quickAdd/context'
import { fetchOverallStats, fetchToday, tasksKeys, type Task } from '@/modules/tasks/api/tasks'
import { fetchGroups } from '@/modules/tasks/api/groups'
import { Heatmap } from '@/modules/tasks/components/stats/Heatmap'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { TaskRow } from '@/modules/tasks/components/TaskRow'
import { HeatmapSkeleton, LoadingLabel, SectionSkeleton } from '@/modules/tasks/components/skeletons'
import { byTime } from '@/modules/tasks/lib/repeat'
import { byGroup, clusterByGroup } from '@/modules/tasks/lib/byGroup'
import { loadCollapsed, saveCollapsed } from '@/modules/tasks/lib/collapsedGroups'
import { PastSection } from '@/modules/tasks/components/PastSection'
import { useTaskEditor } from '@/modules/tasks/useTaskEditor'
import { useCompleteTask } from '@/modules/tasks/useCompleteTask'
import { useTasksT } from '@/modules/tasks/i18n'
import s from '../TasksPages.module.scss'

/** The desktop rail's activity card while it loads (CSS hides the rail card on phones). */
function RailSkeleton() {
  const m = useTasksT()
  return (
    <section className={s.railCard} aria-label={m.stats.activity} aria-busy="true">
      <LoadingLabel />
      <div className={s.railHead}>
        <Skeleton height="var(--lh-title)" width={80} />
      </div>
      <HeatmapSkeleton />
    </section>
  )
}

/**
 * Tasks → Today: how far through the day you are, what's due today (habits
 * among the rest, told apart by their chip) and what's done. Days that
 * passed fold away at the end, without red. The tick is the one action: a
 * task is either done or not, never put off. "+" adds.
 */
export function TodayPage() {
  const today = useToday()
  const m = useTasksT()
  const quickAdd = useQuickAdd()
  const editor = useTaskEditor()
  const { complete, undo, pending } = useCompleteTask(today)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: tasksKeys.today(today),
    queryFn: () => fetchToday(today),
  })
  // The side rail's activity, desktop only (shared with the Statistics page).
  const isMobile = useIsMobile()
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: tasksKeys.overallStats(today),
    queryFn: () => fetchOverallStats(today),
    enabled: !isMobile,
  })
  const { data: groups = [] } = useQuery({ queryKey: tasksKeys.groups, queryFn: fetchGroups })

  const allDue = data?.today ?? []
  const allDone = data?.doneToday ?? []
  const all = allDue.length + allDone.length

  // In each section a group's tasks sit together, told apart by colour only;
  // within a group, anything with a time goes first, by the clock.
  const self = (t: Task) => t
  const dueToday = clusterByGroup(byTime(allDue), groups, self)
  // Today's tasks by group, each part foldable; null when none is in a group.
  const parts = byGroup(byTime(allDue), groups, m.group.none)
  const [collapsed, setCollapsed] = useState(loadCollapsed)
  const toggle = (key: string) => {
    const next = collapsed.includes(key) ? collapsed.filter((k) => k !== key) : [...collapsed, key]
    setCollapsed(next)
    saveCollapsed(next)
  }
  const done = clusterByGroup(allDone, groups, (d) => d.task)
  // Days that passed stay passed: folded away at the end, without red.
  const past = clusterByGroup(data?.overdue ?? [], groups, self)

  // Build a groupId → colour lookup so each row can carry its accent stripe.
  const groupColorMap = new Map(groups.map((g) => [g.id, g.color]))
  const groupColor = (task: Task) => (task.groupId ? (groupColorMap.get(task.groupId) ?? null) : null)

  const row = (t: Task) => (
    <TaskRow
      key={t.id}
      task={t}
      today={today}
      busy={pending.has(t.id)}
      groupColor={groupColor(t)}
      onToggle={complete}
      onOpen={editor.openDetail}
    />
  )

  // A past task with its day shown plainly, so it reads as "from earlier".
  const pastRow = (t: Task) => (
    <TaskRow
      key={t.id}
      task={t}
      today={today}
      showDue
      busy={pending.has(t.id)}
      groupColor={groupColor(t)}
      onToggle={complete}
      onOpen={editor.openDetail}
    />
  )

  const doneRow = ({ completionId, task }: (typeof allDone)[number], key = completionId) => (
    <TaskRow
      key={key}
      task={task}
      today={today}
      done
      busy={pending.has(completionId)}
      groupColor={groupColor(task)}
      onToggle={() => undo(completionId)}
      onOpen={editor.openDetail}
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
        // The page's own layout, in outline: the day's progress (and on wide
        // screens the activity rail), then today's tasks.
        <div className={s.layout} aria-busy="true">
          <LoadingLabel />
          <aside className={s.rail}>
            <div className={s.summary}>
              <Skeleton width={56} height={56} radius="var(--radius-pill)" />
              <div className={s.summaryText}>
                <Skeleton height="var(--lh-title)" width="60%" />
                <Skeleton height="var(--lh-meta)" width="40%" />
              </div>
            </div>
            {!isMobile && <RailSkeleton />}
          </aside>
          <div className={s.main}>
            <SectionSkeleton rows={2} />
            <SectionSkeleton rows={3} index={1} />
          </div>
        </div>
      ) : (
        <div className={s.layout}>
          <aside className={s.rail}>
          {all > 0 && (
            <section className={s.summary}>
              <ProgressRing value={allDone.length} max={all} label={m.progressTitle(allDone.length, all)} size={56}>
                {Math.round((allDone.length / all) * 100)}%
              </ProgressRing>
              <div className={s.summaryText}>
                <div className={s.summaryTitle}>
                  {allDone.length === all ? m.progressAllDone : m.progressTitle(allDone.length, all)}
                </div>
                <div className={s.summarySub}>{formatFullDate(parseApiDate(today))}</div>
              </div>
            </section>
          )}
          {statsLoading && <RailSkeleton />}
          {stats && stats.total > 0 && (
            <section className={s.railCard} aria-label={m.stats.activity}>
              <div className={s.railHead}>
                <h2 className={s.railTitle}>{m.stats.activity}</h2>
              </div>
              <Heatmap days={stats.daily.slice(-56)} />
            </section>
          )}
          </aside>

          <div className={s.main}>


          {dueToday.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <h2 className={s.sectionTitle}>{m.today}</h2>
                <span className={s.count}>{dueToday.length}</span>
              </div>
              {/* With groups, each is its own card (like Done below); without, one plain card. */}
              {parts ? (
                <div className={s.groupCards}>
                  {parts.map((part) => {
                      const open = !collapsed.includes(part.key)
                      const color = part.key === 'none' ? null : groupColorMap.get(part.key)
                      return (
                        <div key={part.key} className={s.list}>
                          <button
                            type="button"
                            className={s.groupHead}
                            aria-expanded={open}
                            onClick={() => toggle(part.key)}
                            style={color ? ({ '--accent': color } as React.CSSProperties) : undefined}
                          >
                            <span className={s.groupName}>{part.label}</span>
                            <span className={s.groupCount}>{part.tasks.length}</span>
                            <ChevronDown size={16} className={clsx(s.groupChev, !open && s.groupChevClosed)} aria-hidden />
                          </button>
                          {open && part.tasks.map(row)}
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className={s.list}>{dueToday.map(row)}</div>
              )}
            </section>
          )}

          {dueToday.length === 0 && (
            <EmptyState
              icon={CircleCheckBig}
              title={allDone.length > 0 ? m.home.allDone : m.nothingToday}
              description={allDone.length > 0 ? m.home.allDoneSub : m.nothingTodaySub}
              action={{ label: m.home.addTask, icon: Plus, onClick: () => quickAdd.open('tasks.task') }}
            />
          )}

          {done.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <h2 className={s.sectionTitle}>{m.done}</h2>
                <span className={s.count}>{done.length}</span>
              </div>
              <div className={s.list}>{done.map((d) => doneRow(d))}</div>
            </section>
          )}

          {/* Earlier days, at the very end and folded away. */}
          <PastSection count={past.length}>{past.map(pastRow)}</PastSection>
          </div>
        </div>
      )}

      {editor.dialog}
    </div>
  )
}
