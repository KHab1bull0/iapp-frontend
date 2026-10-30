import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/core/hooks/useMediaQuery'
import type { Task } from '@/modules/tasks/api/tasks'
import { TaskDialog } from './components/TaskDialog'

/** Add and edit open a full-screen page on phones and a dialog on desktop. */
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
