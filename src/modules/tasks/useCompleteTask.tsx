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
  type CompletionKind,
  type Task,
} from './api/tasks'
import { Celebration, type CelebrationData } from './components/habit/Celebration'
import { StageSheet, type StageReached } from './components/habit/StageSheet'
import { isDaily } from './lib/repeat'
import { useTasksT } from './i18n'

/** A short tick on phones that support it; silently nothing elsewhere. */
function haptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(10)
}

/** A sheet's content stays after it closes, so it doesn't empty while sliding away. */
interface Opened<T> {
  data: T
  open: boolean
}

/**
 * Ticking a task off, with an Undo toast, shared by Today and the home card.
 * `pending` holds tasks whose completion is being saved, so their tick is
 * disabled meanwhile and a double tap can't complete one twice.
 *
 * A habit answers differently: a short celebration of the streak (no
 * toast), and a sheet with the reward when a stage is reached. Render
 * `feedback` once, where the hook is used.
 */
export function useCompleteTask(today: string) {
  const m = useTasksT()
  const { lang } = useLang()
  const qc = useQueryClient()
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [celebration, setCelebration] = useState<CelebrationData | null>(null)
  const [reached, setReached] = useState<Opened<StageReached> | null>(null)
  const dismiss = useCallback(() => setCelebration(null), [])

  const refresh = () => qc.invalidateQueries({ queryKey: tasksKeys.all })

  const undo = useMutation({
    mutationFn: (completionId: string) => undoCompletion(completionId),
    onSuccess: refresh,
    onError: () => toast(m.undoFailed, 'error'),
  })

  // Say so at once; the lists catch up in the background.
  function answer(result: CompleteResult, task: Task, kind: CompletionKind) {
    const undoAction = { label: m.undo, onClick: () => undo.mutate(result.completionId) }
    if (!task.isHabit) return toast(m.doneToast(task.title), 'success', undoAction)
    if (kind === 'rest') {
      return toast(m.habit.restToast(task.title, result.task.progress?.restLeft ?? 0), 'success', undoAction)
    }
    const daily = isDaily(task)
    if (result.stageReached) {
      setCelebration(null)
      setReached({
        open: true,
        data: {
          title: task.title,
          stage: result.stageReached,
          streak: result.streak.current,
          daily,
          next: result.task.progress?.stage ?? null,
        },
      })
      return
    }
    const total = result.task.progress?.total
    setCelebration({
      id: Date.now(),
      title: task.title,
      from: task.progress?.streak ?? 0,
      to: result.streak.current,
      daily,
      line: task.identity ? m.habit.vote(task.identity) : total ? m.habit.total(total) : null,
      completionId: result.completionId,
    })
  }

  const complete = useMutation({
    mutationFn: ({ task, kind }: { task: Task; kind: CompletionKind }) =>
      completeTask(task.id, today, task.dueDate, { kind }),
    onMutate: ({ task }) => {
      haptic()
      setPending((p) => new Set(p).add(task.id))
    },
    onSettled: (_r, _e, { task }) =>
      setPending((p) => {
        const next = new Set(p)
        next.delete(task.id)
        return next
      }),
    onSuccess: (result, { task, kind }) => {
      void refresh()
      answer(result, task, kind)
    },
    onError: async (err) => {
      // Usually a stale copy (done elsewhere already): show the real state.
      await refresh()
      toast(apiErrorText(err, lang, m.completeFailed), 'error')
    },
  })

  const feedback = (
    <>
      <Celebration data={celebration} onUndo={(id) => undo.mutate(id)} onDismiss={dismiss} />
      <StageSheet
        data={reached?.data ?? null}
        open={reached?.open ?? false}
        onOpenChange={(open) => setReached((r) => r && { ...r, open })}
      />
    </>
  )

  return {
    /** The tick: in full. */
    complete: (task: Task) => complete.mutate({ task, kind: 'full' }),
    /** A habit's two-minute version, from its button on the row. */
    completeMin: (task: Task) => complete.mutate({ task, kind: 'min' }),
    undo: undo.mutate,
    pending,
    feedback,
  }
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
