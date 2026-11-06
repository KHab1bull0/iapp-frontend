import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/core/components/ui/toast'
import { addDaysYmd } from '@/core/lib/format'
import { completeTask, tasksKeys, undoCompletion, updateTask, type Task } from './api/tasks'
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
    onSuccess: ({ completionId }, task) => {
      // Say so at once; the lists catch up in the background.
      void refresh()
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

/** Swipe left on a row: put the task off until tomorrow, with Undo. */
export function useMoveToTomorrow(today: string) {
  const m = useTasksT()
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: tasksKeys.all })

  const move = useMutation({
    mutationFn: ({ task, to }: { task: Task; to: string | null }) => updateTask(task.id, { dueDate: to }),
    onSuccess: async (_r, { task, to }) => {
      await refresh()
      if (to === addDaysYmd(today, 1)) {
        toast(m.swipe.moved(task.title), 'success', {
          label: m.undo,
          onClick: () => move.mutate({ task, to: task.dueDate }),
        })
      }
    },
    onError: () => toast(m.swipe.moveFailed, 'error'),
  })

  return (task: Task) => move.mutate({ task, to: addDaysYmd(today, 1) })
}
