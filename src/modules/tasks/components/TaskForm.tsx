import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { todayYmd } from '@/core/lib/format'
import { toast } from '@/core/components/ui/toast'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/core/components/ui/alert-dialog'
import {
  createTask,
  deleteTask,
  tasksKeys,
  updateTask,
  type RepeatMode,
  type RepeatUnit,
  type Task,
  type TaskInput,
} from '@/modules/tasks/api/tasks'
import { useTasksT } from '@/modules/tasks/i18n'
import s from './TaskForm.module.scss'

interface Props {
  task: Task | null
  onSaved: () => void
  onCancel: () => void
}

const MODES: RepeatMode[] = ['none', 'schedule', 'after_done']

// Monday first, as people plan their week.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function TaskForm({ task, onSaved, onCancel }: Props) {
  const t = useTasksT()
  const qc = useQueryClient()
  const [title, setTitle] = useState(task?.title ?? '')
  const [note, setNote] = useState(task?.note ?? '')
  const [dueDate, setDueDate] = useState(task ? (task.dueDate ?? '') : todayYmd())
  const [dueTime, setDueTime] = useState(task?.dueTime ?? '')
  const [mode, setMode] = useState<RepeatMode>(task?.repeatMode ?? 'none')
  const [unit, setUnit] = useState<RepeatUnit>(task?.repeatUnit ?? 'day')
  const [every, setEvery] = useState(String(task?.repeatEvery ?? 1))
  const [weekdays, setWeekdays] = useState<number[]>(task?.repeatWeekdays ?? [])

  const weekly = mode === 'schedule' && unit === 'week'
  const everyN = Number(every)
  const valid =
    title.trim().length > 0 &&
    (mode === 'none' || (Number.isInteger(everyN) && everyN >= 1 && everyN <= 365)) &&
    (!weekly || weekdays.length > 0)

  const save = useMutation({
    mutationFn: () => {
      const input: TaskInput = {
        title: title.trim(),
        note: note.trim() || null,
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        repeatMode: mode,
        repeatUnit: mode === 'none' ? null : unit,
        repeatEvery: mode === 'none' ? null : everyN,
        repeatWeekdays: weekly ? [...weekdays].sort((a, b) => a - b) : null,
      }
      return task ? updateTask(task.id, input) : createTask(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tasksKeys.all })
      toast(task ? t.form.updated : t.form.added, 'success')
      onSaved()
    },
    onError: () => toast(t.form.saveFailed, 'error'),
  })

  const remove = useMutation({
    mutationFn: () => deleteTask(task!.id),
    onSuccess: async () => {
      // Drop the deleted task's own query first, or refreshing it 404s and the
      // edit page flashes "not found" before closing.
      qc.removeQueries({ queryKey: tasksKeys.one(task!.id) })
      await qc.invalidateQueries({ queryKey: tasksKeys.all })
      toast(t.form.deleted, 'success')
      onSaved()
    },
    onError: () => toast(t.form.deleteFailed, 'error'),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (valid && !save.isPending) save.mutate()
  }

  // Switching to a weekly schedule starts from the chosen date's weekday.
  function chooseUnit(next: RepeatUnit) {
    setUnit(next)
    if (mode === 'schedule' && next === 'week' && weekdays.length === 0 && dueDate) {
      const [y, m, d] = dueDate.split('-').map(Number)
      setWeekdays([new Date(y, m - 1, d).getDay()])
    }
  }

  function chooseMode(next: RepeatMode) {
    setMode(next)
    if (next === 'schedule' && unit === 'week' && weekdays.length === 0 && dueDate) {
      const [y, m, d] = dueDate.split('-').map(Number)
      setWeekdays([new Date(y, m - 1, d).getDay()])
    }
  }

  function toggleDay(d: number) {
    setWeekdays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))
  }

  return (
    <form className={s.form} onSubmit={submit}>
      <label className={s.field}>
        <span className={s.label}>{t.form.title}</span>
        <input
          className={s.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder={t.form.titlePlaceholder}
          aria-label={t.form.title}
          autoFocus={!task}
        />
      </label>

      <div className={s.row}>
        <label className={s.field}>
          <span className={s.label}>{mode === 'none' ? t.form.date : t.form.nextDate}</span>
          <input
            type="date"
            className={s.input}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label={t.form.date}
          />
        </label>
        <label className={s.field}>
          <span className={s.label}>{t.form.time}</span>
          <input
            type="time"
            className={s.input}
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            aria-label={t.form.time}
          />
        </label>
      </div>

      {!dueDate && (
        <span className={s.hint}>{t.form.noDateHint}</span>
      )}

      <div className={s.field}>
        <span className={s.label}>{t.form.repeat}</span>
        <div className={s.segments} role="radiogroup" aria-label={t.form.repeat}>
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              className={clsx(s.segment, mode === m && s.active)}
              onClick={() => chooseMode(m)}
            >
              {t.form.modes[m].label}
            </button>
          ))}
        </div>
        <span className={s.hint}>{t.form.modes[mode].hint}</span>
      </div>

      {mode !== 'none' && (
        <div className={s.row}>
          <label className={s.field}>
            <span className={s.label}>{t.form.every}</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              className={s.input}
              value={every}
              onChange={(e) => setEvery(e.target.value)}
              aria-label={t.form.every}
            />
          </label>
          <label className={s.field}>
            <span className={s.label}>{t.form.unit}</span>
            <select
              className={s.input}
              value={unit}
              onChange={(e) => chooseUnit(e.target.value as RepeatUnit)}
              aria-label={t.form.unit}
            >
              <option value="day">{t.form.unitLabel('day', everyN)}</option>
              <option value="week">{t.form.unitLabel('week', everyN)}</option>
              <option value="month">{t.form.unitLabel('month', everyN)}</option>
            </select>
          </label>
        </div>
      )}

      {weekly && (
        <div className={s.field}>
          <span className={s.label}>{t.form.on}</span>
          <div className={s.days} role="group" aria-label={t.form.weekdays}>
            {WEEK_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                role="checkbox"
                aria-checked={weekdays.includes(d)}
                className={clsx(s.day, weekdays.includes(d) && s.active)}
                onClick={() => toggleDay(d)}
              >
                {t.repeat.weekdays[d]}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className={s.field}>
        <span className={s.label}>{t.form.note}</span>
        <textarea
          className={clsx(s.input, s.textarea)}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder={t.form.optional}
          aria-label={t.form.note}
        />
      </label>

      <div className={s.actions}>
        {task && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className={s.btnDanger}>
                {t.form.delete}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.form.deleteTitle(task.title)}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.form.deleteDesc}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.form.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => remove.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t.form.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <button type="button" className={s.btnSecondary} onClick={onCancel}>
          {t.form.cancel}
        </button>
        <button type="submit" className={s.btnPrimary} disabled={!valid || save.isPending}>
          {save.isPending ? t.form.saving : t.form.save}
        </button>
      </div>
    </form>
  )
}
