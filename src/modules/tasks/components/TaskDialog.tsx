import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import type { Task } from '@/modules/tasks/api/tasks'
import { useTasksT } from '@/modules/tasks/i18n'
import { TaskForm } from './TaskForm'
import { TaskStatsCard } from './stats/TaskStatsCard'

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
  const t = useTasksT()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? t.editTask : t.newTask}</DialogTitle>
        </DialogHeader>
        {task && open && <TaskStatsCard taskId={task.id} />}
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
