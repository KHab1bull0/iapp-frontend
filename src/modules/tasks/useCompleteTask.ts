import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/core/components/ui/toast'
import { completeTask, tasksKeys, undoCompletion, type Task } from './api/tasks'
import { useTasksT } from './i18n'

/** A short tick on phones that support it; silently nothing elsewhere. */
function haptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(10)
}

/**
 * Ticking a task off, with an Undo toast, shared by Today and the home card.
 * `pending` holds tasks whose completion is being saved, so their tick is
 * disabled meanwhile and a double tap can't complete one twice.
 */
export function useCompleteTask(today: string) {
  const m = useTasksT()
  const qc = useQueryClient()
  const [pending, setPending] = useState<Set<string>>(new Set())

  const refresh = () => qc.invalidateQueries({ queryKey: tasksKeys.all })

  const undo = useMutation({
    mutationFn: (completionId: string) => undoCompletion(completionId),
    onSuccess: refresh,
    onError: () => toast(m.undoFailed, 'error'),
  })

  const complete = useMutation({
    mutationFn: (task: Task) => completeTask(task.id, today, task.dueDate),
    onMutate: (task) => {
      haptic()
      setPending((p) => new Set(p).add(task.id))
    },
    onSettled: (_r, _e, task) =>
      setPending((p) => {
        const next = new Set(p)
        next.delete(task.id)
        return next
      }),
    onSuccess: async ({ completionId }, task) => {
      await refresh()
      toast(m.doneToast(task.title), 'success', {
        label: m.undo,
        onClick: () => undo.mutate(completionId),
      })
    },
    onError: async () => {
      // Usually a stale copy (done elsewhere already): show the real state.
      await refresh()
      toast(m.completeFailed, 'error')
    },
  })

  return { complete: complete.mutate, undo: undo.mutate, pending }
}
