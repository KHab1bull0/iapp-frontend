import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/core/components/ui/toast'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import { addDaysYmd } from '@/core/lib/format'
import {
  completeTask,
  tasksKeys,
  undoCompletion,
  updateTask,
  type CompleteResult,
  type Task,
} from './api/tasks'
import { Celebration, type CelebrationData } from './components/habit/Celebration'
import { isDaily } from './lib/repeat'
import { useTasksT } from './i18n'

/** A short tick on phones that support it; silently nothing elsewhere. */
function haptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(10)
}

/** The ids whose request is in flight: added on start, dropped once it settles. */
function useInFlight() {
  const [ids, setIds] = useState<Set<string>>(new Set())
  const add = useCallback((id: string) => setIds((p) => new Set(p).add(id)), [])
  const drop = useCallback(
    (id: string) =>
      setIds((p) => {
        const next = new Set(p)
        next.delete(id)
        return next
      }),
    [],
  )
  return { ids, add, drop }
}

/**
 * Ticking a task off, with an Undo toast, shared by Today and the home card.
 * `pending` holds tasks whose completion is being saved (by task id) and
 * completions being undone (by completion id), so their tick is disabled
 * meanwhile and a double tap can't complete or undo one twice.
 *
 * A habit answers differently: a short celebration of the streak instead
 * of the toast. Render `feedback` once, where the hook is used.
 */
export function useCompleteTask(today: string) {
  const m = useTasksT()
  const { lang } = useLang()
  const qc = useQueryClient()
  const { ids: pending, add, drop } = useInFlight()
  const [celebration, setCelebration] = useState<CelebrationData | null>(null)
  const dismiss = useCallback(() => setCelebration(null), [])

  const refresh = () => qc.invalidateQueries({ queryKey: tasksKeys.all })

  const undo = useMutation({
    mutationFn: (completionId: string) => undoCompletion(completionId),
    onMutate: add,
    onSettled: (_r, _e, completionId) => drop(completionId),
    onSuccess: refresh,
    onError: () => toast(m.undoFailed, 'error'),
  })

  // Say so at once; the lists catch up in the background.
  function answer(result: CompleteResult, task: Task) {
    const undoAction = { label: m.undo, onClick: () => undo.mutate(result.completionId) }
    if (!task.isHabit) return toast(m.doneToast(task.title), 'success', undoAction)
    const total = result.task.progress?.total
    setCelebration({
      id: Date.now(),
      title: task.title,
      from: task.progress?.streak ?? 0,
      to: result.streak.current,
      daily: isDaily(task),
      line: task.identity ? m.habit.vote(task.identity) : total ? m.habit.total(total) : null,
      completionId: result.completionId,
    })
  }

  const complete = useMutation({
    mutationFn: ({ task }: { task: Task }) => completeTask(task.id, today, task.dueDate),
    onMutate: ({ task }) => {
      haptic()
      add(task.id)
    },
    onSettled: (_r, _e, { task }) => drop(task.id),
    onSuccess: (result, { task }) => {
      void refresh()
      answer(result, task)
    },
    onError: async (err) => {
      // Usually a stale copy (done elsewhere already): show the real state.
      await refresh()
      toast(apiErrorText(err, lang, m.completeFailed), 'error')
    },
  })

  const feedback = <Celebration data={celebration} onUndo={(id) => undo.mutate(id)} onDismiss={dismiss} />

  return {
    /** The tick. */
    complete: (task: Task) => complete.mutate({ task }),
    /** Unticks a completion; a second call while one is on its way does nothing. */
    undo: (completionId: string) => {
      if (!pending.has(completionId)) undo.mutate(completionId)
    },
    pending,
    feedback,
  }
}

/**
 * Swipe left on a row: put the task off until tomorrow, with Undo. `moving`
 * holds the tasks being moved, so their row waits rather than taking another
 * swipe or tick meanwhile.
 */
export function useMoveToTomorrow(today: string) {
  const m = useTasksT()
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: tasksKeys.all })
  const { ids: moving, add, drop } = useInFlight()

  const move = useMutation({
    mutationFn: ({ task, to }: { task: Task; to: string | null }) => updateTask(task.id, { dueDate: to }),
    onMutate: ({ task }) => add(task.id),
    onSettled: (_r, _e, { task }) => drop(task.id),
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

  return {
    toTomorrow: (task: Task) => {
      if (!moving.has(task.id)) move.mutate({ task, to: addDaysYmd(today, 1) })
    },
    moving,
  }
}
