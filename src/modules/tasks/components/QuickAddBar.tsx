import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUp, CalendarDays, Clock, Repeat } from 'lucide-react'
import { toast } from '@/core/components/ui/toast'
import { useDayLabel } from '@/core/hooks/useDayLabel'
import { addDaysYmd } from '@/core/lib/format'
import { createTask, tasksKeys, type TaskInput } from '@/modules/tasks/api/tasks'
import { parseQuickAdd } from '@/modules/tasks/lib/parseQuickAdd'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './QuickAddBar.module.scss'

/** What the date chip steps through when the text names no day. */
type DefaultDay = 'today' | 'tomorrow' | 'none'
const NEXT: Record<DefaultDay, DefaultDay> = { today: 'tomorrow', tomorrow: 'none', none: 'today' }

/**
 * Type a task and press Enter. A day, a time and a repeat written in the text
 * ("ertaga 9:00", "har kuni") are picked out and shown as chips before it is
 * added; with no day in the text, the date chip decides (Today by default).
 */
export function QuickAddBar({ today, defaultDay = 'today' }: { today: string; defaultDay?: DefaultDay }) {
  const t = useTasksT()
  const qc = useQueryClient()
  const dayLabel = useDayLabel()
  const [text, setText] = useState('')
  const [fallback, setFallback] = useState<DefaultDay>(defaultDay)

  const parsed = parseQuickAdd(text, today)
  const fallbackDate = fallback === 'today' ? today : fallback === 'tomorrow' ? addDaysYmd(today, 1) : null
  const dueDate = parsed.dueDate ?? fallbackDate

  const add = useMutation({
    mutationFn: (input: TaskInput) => createTask(input),
    onSuccess: async (task) => {
      setText('')
      await qc.invalidateQueries({ queryKey: tasksKeys.all })
      toast(t.quick.added(task.title), 'success')
    },
    onError: () => toast(t.quick.failed, 'error'),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!parsed.title || add.isPending) return
    add.mutate({
      title: parsed.title,
      dueDate,
      dueTime: parsed.dueTime,
      repeatMode: parsed.repeat ? 'schedule' : 'none',
      repeatUnit: parsed.repeat?.unit ?? null,
      repeatEvery: parsed.repeat ? 1 : null,
      repeatWeekdays: parsed.repeat?.weekdays ?? null,
      // A repeat needs a day to start on.
      ...(parsed.repeat && !dueDate ? { dueDate: today } : {}),
    })
  }

  return (
    <form className={s.bar} onSubmit={submit} aria-label={t.quick.label}>
      <div className={s.inputRow}>
        <input
          className={s.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.quick.placeholder}
          aria-label={t.quick.label}
          enterKeyHint="done"
          maxLength={200}
        />
        <button type="submit" className={s.send} disabled={!parsed.title || add.isPending} aria-label={t.quick.add}>
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </div>
      {text.trim() && (
        <div className={s.chips}>
          <button
            type="button"
            className={clsx(s.chip, parsed.dueDate && s.detected)}
            // A day typed in the text wins; the chip only steps the fallback.
            onClick={() => !parsed.dueDate && setFallback(NEXT[fallback])}
          >
            <CalendarDays size={14} aria-hidden /> {dueDate ? dayLabel(dueDate) : t.quick.noDate}
          </button>
          {parsed.dueTime && (
            <span className={clsx(s.chip, s.detected)}>
              <Clock size={14} aria-hidden /> {parsed.dueTime}
            </span>
          )}
          {parsed.repeat && (
            <span className={clsx(s.chip, s.detected)}>
              <Repeat size={14} aria-hidden /> {t.quick.repeat[parsed.repeat.unit]}
            </span>
          )}
        </div>
      )}
    </form>
  )
}
