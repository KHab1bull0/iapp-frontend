import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { fetchTask, tasksKeys } from '@/modules/tasks/api/tasks'
import { MissedDay } from '@/modules/tasks/components/MissedDay'
import { TaskStatsCard, TaskStatsSkeleton } from '@/modules/tasks/components/stats/TaskStatsCard'
import { LoadingLabel } from '@/modules/tasks/components/skeletons'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { describeRepeat, dueLabel } from '@/modules/tasks/lib/repeat'
import { useTaskEditor } from '@/modules/tasks/useTaskEditor'
import { useTasksT } from '@/modules/tasks/i18n'
import shell from '../form/TaskFormPage.module.scss'
import s from './TaskDetailPage.module.scss'

/**
 * One task in full: what it is (title, note, when, how it repeats, the habit's
 * who), ticking off a past day, and its record
 * (streak, total, activity). Editing is a step away, behind the
 * pencil; the editor itself holds only the form.
 */
export function TaskDetailPage() {
  const t = useTasksT()
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const today = useToday()

  // Back to wherever it was opened from (Today or All tasks).
  const close = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/tasks'))
  // Deleted from the desktop panel: this page has nothing left to show.
  const editor = useTaskEditor({ onDeleted: () => navigate('/tasks', { replace: true }) })

  const { data: task, isLoading, isError } = useQuery({
    queryKey: tasksKeys.one(id, today),
    queryFn: () => fetchTask(id, today),
  })

  const repeat = task ? describeRepeat(task, t) : ''
  const facts = task
    ? ([
        [t.form.date, dueLabel(task.dueDate, today, t)],
        [t.form.time, task.dueTime],
        [t.form.repeat, repeat || t.form.modes.none.label],
        [t.habit.identity, task.isHabit ? task.identity : null],
      ].filter(([, v]) => v) as [string, string][])
    : []

  return (
    <div className={shell.page}>
      <header className={shell.head}>
        <button className={shell.backBtn} onClick={close} aria-label={t.back}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={shell.h1}>{t.detail.title}</h1>
        {task && (
          <button type="button" className={s.editBtn} onClick={() => editor.openEdit(task)}>
            <Pencil size={16} aria-hidden /> {t.detail.edit}
          </button>
        )}
      </header>
      <div className={s.body} aria-busy={isLoading || undefined}>
        {isLoading ? (
          <>
            <LoadingLabel />
            <TaskStatsSkeleton />
            <section className={s.info}>
              <Skeleton height={28} width="60%" />
              <Skeleton height={16} width="80%" />
              <Skeleton height={64} radius={12} />
            </section>
          </>
        ) : isError || !task ? (
          <div className={shell.state}>{t.notFound}</div>
        ) : (
          <>
            {/* The record first: it is what this page is opened for. */}
            <TaskStatsCard taskId={task.id} task={task} />
            <section className={s.info} aria-label={t.detail.title}>
              <h2 className={s.title}>{task.title}</h2>
              {task.note && <p className={s.note}>{task.note}</p>}
              <dl className={s.facts}>
                {facts.map(([k, v]) => (
                  <div key={k} className={s.fact}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
            {/* A past day ticked off stays on this page: its record above updates. */}
            <MissedDay task={task} onDone={() => {}} />
          </>
        )}
      </div>
      {editor.dialog}
    </div>
  )
}
