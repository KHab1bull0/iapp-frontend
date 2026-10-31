import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import { fetchTask, tasksKeys } from '@/modules/tasks/api/tasks'
import { TaskForm } from '@/modules/tasks/components/TaskForm'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './TaskFormPage.module.scss'

/**
 * Full-screen add/edit on touch layouts, outside AppLayout so the nav can't
 * pull you away half-way. Desktop uses TaskDialog instead.
 */
export function TaskFormPage() {
  const t = useTasksT()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isEdit = Boolean(id)

  // Back to wherever it was opened from (Today or All tasks).
  const close = () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/tasks'))

  useEffect(() => {
    if (!isMobile) navigate('/tasks', { replace: true })
  }, [isMobile, navigate])

  const { data: task, isLoading, isError } = useQuery({
    queryKey: tasksKeys.one(id ?? ''),
    queryFn: () => fetchTask(id!),
    enabled: isEdit,
  })

  return (
    <div className={s.page}>
      <header className={s.head}>
        <button className={s.backBtn} onClick={close} aria-label={t.back}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={s.h1}>{isEdit ? t.editTask : t.newTask}</h1>
      </header>
      <div className={s.body}>
        {isEdit && isLoading ? null : isEdit && (isError || !task) ? (
          <div className={s.state}>{t.notFound}</div>
        ) : (
          <TaskForm task={task ?? null} onSaved={close} onCancel={close} />
        )}
      </div>
    </div>
  )
}
