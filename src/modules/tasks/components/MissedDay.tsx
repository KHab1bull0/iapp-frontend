import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, ChevronRight } from 'lucide-react'
import { Calendar } from '@/core/components/ui/Calendar'
import { Sheet } from '@/core/components/ui/Sheet'
import { toast } from '@/core/components/ui/toast'
import { useToday } from '@/core/hooks/useToday'
import { addDaysYmd, formatDay } from '@/core/lib/format'
import { completeTask, tasksKeys, undoCompletion, type Task } from '@/modules/tasks/api/tasks'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './MissedDay.module.scss'

/**
 * In the editor of an overdue task: tick off the day it was really done
 * (did it last night, ticked it after midnight). A calendar from the first
 * day not ticked up to yesterday; the days before the one picked stay not
 * done, and today's occurrence of a daily task stays due. Ticking a row is
 * still "done today", so the usual case stays one tap.
 */
export function MissedDay({ task, onDone }: { task: Task; onDone: () => void }) {
  const t = useTasksT()
  const today = useToday()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const yesterday = addDaysYmd(today, -1)
  const dayName = (day: string) => (day === yesterday ? t.missed.yesterday : formatDay(day))

  const undo = useMutation({
    mutationFn: undoCompletion,
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKeys.all }),
    onError: () => toast(t.undoFailed, 'error'),
  })

  const mark = useMutation({
    mutationFn: (day: string) => completeTask(task.id, today, task.dueDate, day),
    onSuccess: ({ completionId }, day) => {
      void qc.invalidateQueries({ queryKey: tasksKeys.all })
      toast(t.missed.done(task.title, dayName(day)), 'success', {
        label: t.undo,
        onClick: () => undo.mutate(completionId),
      })
      setOpen(false)
      onDone()
    },
    onError: async () => {
      await qc.invalidateQueries({ queryKey: tasksKeys.all })
      toast(t.completeFailed, 'error')
    },
  })

  // Only a task left behind has past days to tick.
  if (task.dueDate === null || task.dueDate >= today || task.completedAt) return null
  const since = task.dueDate

  return (
    <>
      <button type="button" className={s.row} onClick={() => setOpen(true)}>
        <span className={s.icon} aria-hidden>
          <CalendarCheck size={18} />
        </span>
        <span className={s.text}>
          <span className={s.label}>{t.missed.title}</span>
          <span className={s.sub}>{t.missed.since(formatDay(since))}</span>
        </span>
        <ChevronRight size={18} className={s.chevron} aria-hidden />
      </button>

      <Sheet open={open} onOpenChange={setOpen} title={t.missed.pick} description={t.missed.pickSub}>
        <div className={s.sheet}>
          <div className={s.quick}>
            <button
              type="button"
              className={s.chip}
              disabled={mark.isPending}
              onClick={() => mark.mutate(yesterday)}
            >
              {t.missed.yesterday}
            </button>
          </div>
          <Calendar
            value={null}
            onChange={(day) => !mark.isPending && mark.mutate(day)}
            today={today}
            min={since}
            max={yesterday}
          />
        </div>
      </Sheet>
    </>
  )
}
