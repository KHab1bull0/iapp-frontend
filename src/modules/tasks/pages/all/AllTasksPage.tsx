import { useQuery } from '@tanstack/react-query'
import { ListTodo, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { useToday } from '@/core/hooks/useToday'
import { fetchTasks, tasksKeys } from '@/modules/tasks/api/tasks'
import { groupByDue, pastTasks } from '@/modules/tasks/lib/repeat'
import { PastSection } from '@/modules/tasks/components/PastSection'
import { TaskRow } from '@/modules/tasks/components/TaskRow'
import { LoadingLabel, SectionSkeleton } from '@/modules/tasks/components/skeletons'
import { useTaskEditor } from '@/modules/tasks/useTaskEditor'
import { useTasksT } from '@/modules/tasks/i18n'
import s from '../TasksPages.module.scss'

/**
 * Tasks → All tasks: every planned task, by when it is next due, to plan and
 * edit. Ticking happens on Today, once a task's day has come.
 */
export function AllTasksPage() {
  const today = useToday()
  const t = useTasksT()
  const editor = useTaskEditor()

  const { data: tasks = [], isLoading, isError, refetch } = useQuery({
    queryKey: tasksKeys.list('active', today),
    queryFn: () => fetchTasks('active', today),
  })

  const groups = groupByDue(tasks, today, t)
  // Tasks whose day passed: folded away at the very end (no red overdue pile).
  const past = pastTasks(tasks, today)

  return (
    <div className={s.page}>
      {isError ? (
        <EmptyState title={t.loadFailed} action={{ label: t.retry, icon: RefreshCw, onClick: () => void refetch() }} />
      ) : isLoading ? (
        // Groups by when they're due, in outline; no ticks here, as on the real rows.
        <div className={s.skeletons} aria-busy="true">
          <LoadingLabel />
          <SectionSkeleton rows={3} tick={false} />
          <SectionSkeleton rows={2} tick={false} index={1} />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState icon={ListTodo} title={t.noTasks} description={t.noTasksSub} />
      ) : (
        groups.map((g) => (
          <section key={g.key} className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>{g.label}</h2>
              <span className={s.count}>{g.tasks.length}</span>
            </div>
            <div className={s.list}>
              {g.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  today={today}
                  showDue={g.key !== 'today' && g.key !== 'none'}
                  onOpen={editor.openDetail}
                />
              ))}
            </div>
          </section>
        ))
      )}
      {!isLoading && !isError && (
        <PastSection count={past.length}>
          {past.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              today={today}
              showDue
              onOpen={editor.openDetail}
            />
          ))}
        </PastSection>
      )}
      {editor.dialog}
    </div>
  )
}
