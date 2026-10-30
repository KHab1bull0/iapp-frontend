import { useState } from 'react'
import clsx from 'clsx'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { toast } from '@/core/components/ui/toast'
import { completeTask, fetchTasks, tasksKeys, undoCompletion, type Task } from '@/modules/tasks/api/tasks'
import { groupByDue } from '@/modules/tasks/lib/repeat'
import { TaskRow } from '@/modules/tasks/components/TaskRow'
import { useTaskEditor } from '@/modules/tasks/useTaskEditor'
import s from '../TasksPages.module.scss'

/** Tasks → All tasks: everything planned, by when it is next due. */
export function AllTasksPage() {
  const today = useToday()
  const qc = useQueryClient()
  const editor = useTaskEditor()
  const [pending, setPending] = useState<Set<string>>(new Set())

  const { data: tasks = [], isLoading, isError, refetch } = useQuery({
    queryKey: tasksKeys.list('active'),
    queryFn: () => fetchTasks('active'),
  })
  const { data: finished = [] } = useQuery({
    queryKey: tasksKeys.list('done'),
    queryFn: () => fetchTasks('done'),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: tasksKeys.all })
  const undo = useMutation({
    mutationFn: (completionId: string) => undoCompletion(completionId),
    onSuccess: refresh,
    onError: () => toast('Could not undo', 'error'),
  })
  const complete = useMutation({
    mutationFn: (task: Task) => completeTask(task.id, today, task.dueDate),
    onMutate: (task) => setPending((p) => new Set(p).add(task.id)),
    onSettled: (_r, _e, task) =>
      setPending((p) => {
        const next = new Set(p)
        next.delete(task.id)
        return next
      }),
    onSuccess: async ({ completionId }, task) => {
      await refresh()
      toast(`“${task.title}” done`, 'success', { label: 'Undo', onClick: () => undo.mutate(completionId) })
    },
    onError: async () => {
      await refresh()
      toast('Could not complete the task', 'error')
    },
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
      ) : isLoading ? null : groups.length === 0 && finished.length === 0 ? (
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
                  busy={pending.has(t.id)}
                  onToggle={complete.mutate}
                  onOpen={editor.openEdit}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {finished.length > 0 && (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>Completed</h2>
            <span className={s.count}>{finished.length}</span>
          </div>
          <div className={s.list}>
            {finished.map((t) => (
              <TaskRow key={t.id} task={t} today={today} done onOpen={editor.openEdit} />
            ))}
          </div>
        </section>
      )}

      {editor.dialog}
      <button className={s.fab} onClick={editor.openNew} aria-label="Add task">
        <Plus size={22} />
      </button>
    </div>
  )
}
