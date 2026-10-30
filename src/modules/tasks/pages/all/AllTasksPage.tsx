import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { Plus, RefreshCw } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { fetchTasks, tasksKeys } from '@/modules/tasks/api/tasks'
import { groupByDue } from '@/modules/tasks/lib/repeat'
import { TaskRow } from '@/modules/tasks/components/TaskRow'
import { useTaskEditor } from '@/modules/tasks/useTaskEditor'
import s from '../TasksPages.module.scss'

/**
 * Tasks → All tasks: every planned task, by when it is next due, to plan and
 * edit. Ticking happens on Today, once a task's day has come.
 */
export function AllTasksPage() {
  const today = useToday()
  const editor = useTaskEditor()

  const { data: tasks = [], isLoading, isError, refetch } = useQuery({
    queryKey: tasksKeys.list('active'),
    queryFn: () => fetchTasks('active'),
  })

  const groups = groupByDue(tasks, today)

  return (
    <div className={s.page}>
      {isError ? (
        <div className={s.empty}>
          <div className={s.emptyTitle}>Failed to load tasks</div>
          <button className={s.btnSecondary} onClick={() => refetch()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : isLoading ? null : groups.length === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyTitle}>No tasks yet</div>
          <div className={s.emptySub}>Add one with the + button: once, on a schedule, or after done.</div>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key} className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={clsx(s.sectionTitle, g.key === 'overdue' && s.danger)}>{g.label}</h2>
              <span className={s.count}>{g.tasks.length}</span>
            </div>
            <div className={s.list}>
              {g.tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  today={today}
                  showDue={g.key !== 'today' && g.key !== 'none'}
                  onOpen={editor.openEdit}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {editor.dialog}
      <button className={s.fab} onClick={editor.openNew} aria-label="Add task">
        <Plus size={22} />
      </button>
    </div>
  )
}
