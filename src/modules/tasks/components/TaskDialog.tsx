import { Sheet } from '@/core/components/ui/Sheet'
import type { Task } from '@/modules/tasks/api/tasks'
import { useTasksT } from '@/modules/tasks/i18n'
import { TaskForm } from './TaskForm'
import { TaskStatsCard } from './stats/TaskStatsCard'

/** Add/edit a task: a bottom sheet on phones, a dialog on desktop. */
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
    <Sheet desktop="panel" open={open} onOpenChange={onOpenChange} title={task ? t.editTask : t.newTask}>
      {task && open && <TaskStatsCard taskId={task.id} />}
      <TaskForm
        // Remount on open so a fresh sheet never shows the previous task.
        key={`${task?.id ?? 'new'}-${String(open)}`}
        task={task ?? null}
        onSaved={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </Sheet>
  )
}
