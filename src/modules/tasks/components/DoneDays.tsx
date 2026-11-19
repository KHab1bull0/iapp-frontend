import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar } from '@/core/components/ui/Calendar'
import { toast } from '@/core/components/ui/toast'
import { useToday } from '@/core/hooks/useToday'
import { addDaysYmd } from '@/core/lib/format'
import { fetchTaskStats, markDay, STATS_DAYS, tasksKeys, unmarkDay, type Task } from '@/modules/tasks/api/tasks'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './stats/TaskStats.module.scss'

/**
 * On the task's page, always open: a month calendar with every day it was
 * done filled in. One tap on a day up to today flips it, done or not done;
 * days ahead can't be tapped. It reads the same stats as the activity card,
 * so both change together. A tapped day shows its new state at once and
 * waits, dimmed, until it is saved.
 */
export function DoneDays({ task }: { task: Task }) {
  const t = useTasksT()
  const today = useToday()
  const qc = useQueryClient()
  // Days tapped and not yet saved, with the state they are going to.
  const [going, setGoing] = useState<Map<string, boolean>>(new Map())

  const { data } = useQuery({
    queryKey: tasksKeys.stats(task.id, today),
    queryFn: () => fetchTaskStats(task.id, today),
  })

  const flip = useMutation({
    mutationFn: ({ day, done }: { day: string; done: boolean }) =>
      done ? markDay(task.id, day, today) : unmarkDay(task.id, day, today),
    onMutate: ({ day, done }) => setGoing((m) => new Map(m).set(day, done)),
    onSettled: async (_r, _e, { day }) => {
      await qc.invalidateQueries({ queryKey: tasksKeys.all })
      setGoing((m) => {
        const next = new Map(m)
        next.delete(day)
        return next
      })
    },
    onError: () => toast(t.days.failed, 'error'),
  })

  const done = new Set((data?.daily ?? []).filter((d) => d.count > 0).map((d) => d.day))
  for (const [day, on] of going) {
    if (on) done.add(day)
    else done.delete(day)
  }

  return (
    <section className={s.card} aria-label={t.days.title}>
      <div className={s.groupHead}>
        <h2 className={s.groupLabel}>{t.days.title}</h2>
        <span className={s.note}>{t.days.hint}</span>
      </div>
      <Calendar
        value={null}
        today={today}
        // As far back as the stats reach, up to today.
        min={addDaysYmd(today, -(STATS_DAYS - 1))}
        max={today}
        selected={done}
        busy={new Set(going.keys())}
        onChange={(day) => flip.mutate({ day, done: !done.has(day) })}
      />
    </section>
  )
}
