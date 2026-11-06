import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { ListTodo, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { useToday } from '@/core/hooks/useToday'
import { fetchTasks, tasksKeys } from '@/modules/tasks/api/tasks'
import { groupByDue } from '@/modules/tasks/lib/repeat'
import { TaskRow } from '@/modules/tasks/components/TaskRow'
import { useTaskEditor } from '@/modules/tasks/useTaskEditor'
import { useMoveToTomorrow } from '@/modules/tasks/useCompleteTask'
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
  const toTomorrow = useMoveToTomorrow(today)

  const { data: tasks = [], isLoading, isError, refetch } = useQuery({
    queryKey: tasksKeys.list('active'),
    queryFn: () => fetchTasks('active'),
  })

  const groups = groupByDue(tasks, today, t)

  return (
    <div className={s.page}>
      {isError ? (
        <EmptyState title={t.loadFailed} action={{ label: t.retry, icon: RefreshCw, onClick: () => void refetch() }} />
      ) : isLoading ? null : groups.length === 0 ? (
        <EmptyState icon={ListTodo} title={t.noTasks} description={t.noTasksSub} />
      ) : (
        groups.map((g) => (
          <section key={g.key} className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={clsx(s.sectionTitle, g.key === 'overdue' && s.danger)}>{g.label}</h2>
              <span className={s.count}>{g.tasks.length}</span>
            </div>
            <div className={s.list}>
              {g.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  today={today}
                  showDue={g.key !== 'today' && g.key !== 'none'}
                  onTomorrow={toTomorrow}
                  onOpen={editor.openEdit}
                />
              ))}
            </div>
          </section>
        ))
      )}
      {editor.dialog}
    </div>
  )
}
