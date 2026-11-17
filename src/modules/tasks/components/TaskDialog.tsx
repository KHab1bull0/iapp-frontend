import { Sheet } from '@/core/components/ui/Sheet'
import type { Task } from '@/modules/tasks/api/tasks'
import { useTasksT } from '@/modules/tasks/i18n'
import { TaskForm } from './TaskForm'

/** Add/edit a task (the form only; the record is on the task's page): a bottom sheet on phones, a panel on desktop. */
export function TaskDialog({
  open,
  onOpenChange,
  task,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  onDeleted?: () => void
}) {
  const t = useTasksT()
  return (
    <Sheet desktop="panel" open={open} onOpenChange={onOpenChange} title={task ? t.editTask : t.newTask}>
      <TaskForm
        // Remount on open so a fresh sheet never shows the previous task.
        key={`${task?.id ?? 'new'}-${String(open)}`}
        task={task ?? null}
        onSaved={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        onDeleted={
          onDeleted &&
          (() => {
            onOpenChange(false)
            onDeleted()
          })
        }
      />
    </Sheet>
  )
}
