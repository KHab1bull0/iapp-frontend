import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import type { Task } from '@/modules/tasks/api/tasks'
import { TaskForm } from './TaskForm'

/** Desktop container for TaskForm; touch layouts route to TaskFormPage. */
export function TaskDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'New task'}</DialogTitle>
        </DialogHeader>
        <TaskForm
          // Remount on open so a fresh dialog never shows the previous task.
          key={`${task?.id ?? 'new'}-${String(open)}`}
          task={task ?? null}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
