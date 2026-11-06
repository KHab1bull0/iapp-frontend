import { useState } from 'react'
import type { Task } from '@/modules/tasks/api/tasks'
import { TaskDialog } from './components/TaskDialog'

/** Add and edit open the task sheet (bottom sheet on phones, dialog on desktop). */
export function useTaskEditor() {
  const [open, setOpen] = useState(false)
  const [task, setTask] = useState<Task | null>(null)

  return {
    openNew() {
      setTask(null)
      setOpen(true)
    },
    openEdit(t: Task) {
      setTask(t)
      setOpen(true)
    },
    dialog: <TaskDialog open={open} onOpenChange={setOpen} task={task} />,
  }
}
