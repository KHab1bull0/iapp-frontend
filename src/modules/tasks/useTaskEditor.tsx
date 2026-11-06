import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import type { Task } from '@/modules/tasks/api/tasks'
import { TaskDialog } from './components/TaskDialog'

/**
 * Add and edit: a page of its own on phones (/tasks/new, /tasks/:id/edit),
 * a panel over the current page on desktop. Render `dialog` once.
 */
export function useTaskEditor() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [task, setTask] = useState<Task | null>(null)

  return {
    openNew() {
      if (isMobile) return navigate('/tasks/new')
      setTask(null)
      setOpen(true)
    },
    openEdit(t: Task) {
      if (isMobile) return navigate(`/tasks/${t.id}/edit`)
      setTask(t)
      setOpen(true)
    },
    dialog: <TaskDialog open={open} onOpenChange={setOpen} task={task} />,
  }
}
