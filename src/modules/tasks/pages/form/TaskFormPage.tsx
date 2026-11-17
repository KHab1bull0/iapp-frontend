import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useToday } from '@/core/hooks/useToday'
import { fetchTask, tasksKeys } from '@/modules/tasks/api/tasks'
import { TaskForm } from '@/modules/tasks/components/TaskForm'
import { LoadingLabel, TaskFormSkeleton } from '@/modules/tasks/components/skeletons'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './TaskFormPage.module.scss'

/**
 * Add/edit a task: a page of its own on every screen size, outside the app
 * shell so nothing pulls you away half-way. Its back button is the way out.
 */
export function TaskFormPage() {
  const t = useTasksT()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const today = useToday()
  const isEdit = Boolean(id)

  // Back to wherever it was opened from (Today or All tasks).
  const close = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/tasks'))

  const { data: task, isLoading, isError } = useQuery({
    queryKey: tasksKeys.one(id ?? '', today),
    queryFn: () => fetchTask(id!, today),
    enabled: isEdit,
  })
  const loading = isEdit && isLoading

  return (
    <div className={s.page}>
      <header className={s.head}>
        <button className={s.backBtn} onClick={close} aria-label={t.back}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={s.h1}>{isEdit ? t.editTask : t.newTask}</h1>
      </header>
      <div className={s.body} aria-busy={loading || undefined}>
        {loading ? (
          // The form in outline, with its action row.
          <>
            <LoadingLabel />
            <TaskFormSkeleton />
          </>
        ) : isEdit && (isError || !task) ? (
          <div className={s.state}>{t.notFound}</div>
        ) : (
          // Only the form: the task's record lives on its own page (TaskDetailPage).
          <TaskForm
            task={task ?? null}
            onSaved={close}
            onCancel={close}
            // The task's own page is gone too: back to the list.
            onDeleted={() => navigate('/tasks', { replace: true })}
          />
        )}
      </div>
    </div>
  )
}
