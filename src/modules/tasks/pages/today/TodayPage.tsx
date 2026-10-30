import { useState } from 'react'
import clsx from 'clsx'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { todayYmd } from '@/core/lib/format'
import { toast } from '@/core/components/ui/toast'
import {
  completeTask,
  fetchToday,
  tasksKeys,
  undoCompletion,
  type Task,
} from '@/modules/tasks/api/tasks'
import { TaskRow } from '@/modules/tasks/components/TaskRow'
import { useTaskEditor } from '@/modules/tasks/useTaskEditor'
import s from '../TasksPages.module.scss'

/** Tasks → Today: what is due now, overdue first, like a review queue. */
export function TodayPage() {
  const today = todayYmd()
  const qc = useQueryClient()
  const editor = useTaskEditor()
  const [showDone, setShowDone] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: tasksKeys.today(today),
    queryFn: () => fetchToday(today),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: tasksKeys.all })

  const undo = useMutation({
    mutationFn: (completionId: string) => undoCompletion(completionId),
    onSuccess: refresh,
    onError: () => toast('Could not undo', 'error'),
  })

  const complete = useMutation({
    mutationFn: (task: Task) => completeTask(task.id, today),
    onSuccess: async ({ completionId }, task) => {
      await refresh()
      toast(`“${task.title}” done`, 'success', {
        label: 'Undo',
        onClick: () => undo.mutate(completionId),
      })
    },
    onError: () => toast('Could not complete the task', 'error'),
  })

  const overdue = data?.overdue ?? []
  const dueToday = data?.today ?? []
  const done = data?.doneToday ?? []

  return (
    <div className={s.page}>
      {isError ? (
        <div className={s.empty}>
          <div className={s.emptyTitle}>Failed to load tasks</div>
          <button className={s.btnSecondary} onClick={() => refetch()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : isLoading ? null : (
        <>
          {overdue.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <h2 className={clsx(s.sectionTitle, s.danger)}>Overdue</h2>
                <span className={s.count}>{overdue.length}</span>
              </div>
              <div className={s.list}>
                {overdue.map((t) => (
                  <TaskRow key={t.id} task={t} today={today} onToggle={complete.mutate} onOpen={editor.openEdit} />
                ))}
              </div>
            </section>
          )}

          {dueToday.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <h2 className={s.sectionTitle}>Today</h2>
                <span className={s.count}>{dueToday.length}</span>
              </div>
              <div className={s.list}>
                {dueToday.map((t) => (
                  <TaskRow key={t.id} task={t} today={today} onToggle={complete.mutate} onOpen={editor.openEdit} />
                ))}
              </div>
            </section>
          )}

          {overdue.length === 0 && dueToday.length === 0 && (
            <div className={s.empty}>
              <div className={s.emptyTitle}>Nothing due today</div>
              <div className={s.emptySub}>Plan what's next in All tasks.</div>
            </div>
          )}

          {done.length > 0 && (
            <section className={s.section}>
              <button
                className={s.toggle}
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
              >
                {showDone ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                Done today ({done.length})
              </button>
              {showDone && (
                <div className={s.list}>
                  {done.map(({ completionId, task }) => (
                    <TaskRow
                      key={completionId}
                      task={task}
                      today={today}
                      done
                      onToggle={() => undo.mutate(completionId)}
                      onOpen={editor.openEdit}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {editor.dialog}
      <button className={s.fab} onClick={editor.openNew} aria-label="Add task">
        <Plus size={22} />
      </button>
    </div>
  )
}
