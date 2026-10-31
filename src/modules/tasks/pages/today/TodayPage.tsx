import { useState } from 'react'
import clsx from 'clsx'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { toast } from '@/core/components/ui/toast'
import {
  completeTask,
  fetchToday,
  tasksKeys,
  undoCompletion,
  type Task,
} from '@/modules/tasks/api/tasks'
import { TaskRow } from '@/modules/tasks/components/TaskRow'
import { byTime } from '@/modules/tasks/lib/repeat'
import { useTaskEditor } from '@/modules/tasks/useTaskEditor'
import { useTasksT } from '@/modules/tasks/i18n'
import s from '../TasksPages.module.scss'

/** Tasks → Today: what is due now, overdue first, like a review queue; then what's done. */
export function TodayPage() {
  const today = useToday()
  const m = useTasksT()
  const qc = useQueryClient()
  const editor = useTaskEditor()
  // Tasks whose completion is being saved; their tick is disabled meanwhile.
  const [pending, setPending] = useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: tasksKeys.today(today),
    queryFn: () => fetchToday(today),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: tasksKeys.all })

  const undo = useMutation({
    mutationFn: (completionId: string) => undoCompletion(completionId),
    onSuccess: refresh,
    onError: () => toast(m.undoFailed, 'error'),
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
      toast(m.doneToast(task.title), 'success', {
        label: m.undo,
        onClick: () => undo.mutate(completionId),
      })
    },
    onError: async () => {
      // Usually a stale copy (done elsewhere already): show the real state.
      await refresh()
      toast(m.completeFailed, 'error')
    },
  })

  const overdue = data?.overdue ?? []
  // Anything with a time goes first, by the clock.
  const dueToday = byTime(data?.today ?? [])
  const done = data?.doneToday ?? []

  return (
    <div className={s.page}>
      {isError ? (
        <div className={s.empty}>
          <div className={s.emptyTitle}>{m.loadFailed}</div>
          <button className={s.btnSecondary} onClick={() => refetch()}>
            <RefreshCw size={14} /> {m.retry}
          </button>
        </div>
      ) : isLoading ? null : (
        <>
          {overdue.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <h2 className={clsx(s.sectionTitle, s.danger)}>{m.overdue}</h2>
                <span className={s.count}>{overdue.length}</span>
              </div>
              <div className={s.list}>
                {overdue.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    today={today}
                    busy={pending.has(t.id)}
                    onToggle={complete.mutate}
                    onOpen={editor.openEdit}
                  />
                ))}
              </div>
            </section>
          )}

          {dueToday.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <h2 className={s.sectionTitle}>{m.today}</h2>
                <span className={s.count}>{dueToday.length}</span>
              </div>
              <div className={s.list}>
                {dueToday.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    today={today}
                    busy={pending.has(t.id)}
                    onToggle={complete.mutate}
                    onOpen={editor.openEdit}
                  />
                ))}
              </div>
            </section>
          )}

          {overdue.length === 0 && dueToday.length === 0 && (
            <div className={s.empty}>
              <div className={s.emptyTitle}>{m.nothingToday}</div>
              <div className={s.emptySub}>{m.nothingTodaySub}</div>
            </div>
          )}

          {done.length > 0 && (
            <section className={s.section}>
              <div className={s.sectionHead}>
                <h2 className={s.sectionTitle}>{m.done}</h2>
                <span className={s.count}>{done.length}</span>
              </div>
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
            </section>
          )}
        </>
      )}

      {editor.dialog}
      <button className={s.fab} onClick={editor.openNew} aria-label={m.add}>
        <Plus size={22} />
      </button>
    </div>
  )
}
