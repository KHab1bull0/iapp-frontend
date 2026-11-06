import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { fetchToday, tasksKeys } from '@/modules/tasks/api/tasks'
import { TaskRow } from '@/modules/tasks/components/TaskRow'
import { byTime } from '@/modules/tasks/lib/repeat'
import { useTaskEditor } from '@/modules/tasks/useTaskEditor'
import { useCompleteTask } from '@/modules/tasks/useCompleteTask'
import { useTasksT } from '@/modules/tasks/i18n'
import s from '../TasksPages.module.scss'

/** Tasks → Today: what is due now, overdue first, like a review queue; then what's done. */
export function TodayPage() {
  const today = useToday()
  const m = useTasksT()
  const editor = useTaskEditor()
  const { complete, undo, pending } = useCompleteTask(today)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: tasksKeys.today(today),
    queryFn: () => fetchToday(today),
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
                    onToggle={complete}
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
                    onToggle={complete}
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
                    onToggle={() => undo(completionId)}
                    onOpen={editor.openEdit}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {editor.dialog}
    </div>
  )
}
