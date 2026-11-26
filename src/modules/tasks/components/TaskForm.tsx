import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { GrowingInput } from '@/core/components/ui/GrowingInput'
import { useAutosize } from '@/core/hooks/useAutosize'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { todayYmd } from '@/core/lib/format'
import { DateField } from '@/core/components/ui/DateField'
import { toast } from '@/core/components/ui/toast'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import {
  createTask,
  DEFAULT_REMIND,
  deleteTask,
  REMIND_OPTIONS,
  tasksKeys,
  updateTask,
  type RepeatMode,
  type RepeatUnit,
  type Task,
  type TaskInput,
} from '@/modules/tasks/api/tasks'
import { fetchGroups } from '@/modules/tasks/api/groups'
import { useTasksT } from '@/modules/tasks/i18n'
import { habitDraft, habitInput } from '@/modules/tasks/lib/habit'
import { HabitFields } from './HabitFields'
import s from './TaskForm.module.scss'

interface Props {
  task: Task | null
  onSaved: () => void
  onCancel: () => void
  /** After a delete; defaults to onSaved. The task's own page can't be gone back to then. */
  onDeleted?: () => void
  /** Following a link out of the form (to add a group); a panel closes, a page just goes. */
  onLeave?: () => void
}

const MODES: RepeatMode[] = ['none', 'schedule', 'after_done']

// Monday first, as people plan their week.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function TaskForm({ task, onSaved, onCancel, onDeleted, onLeave }: Props) {
  const t = useTasksT()
  const { lang } = useLang()
  const qc = useQueryClient()
  const [title, setTitle] = useState(task?.title ?? '')
  const [note, setNote] = useState(task?.note ?? '')
  const noteRef = useAutosize(note)
  const [dueDate, setDueDate] = useState(task ? (task.dueDate ?? '') : todayYmd())
  const [dueTime, setDueTime] = useState(task?.dueTime ?? '')
  const [remindBefore, setRemindBefore] = useState<number | null>(task ? task.remindBefore : DEFAULT_REMIND)
  const [mode, setMode] = useState<RepeatMode>(task?.repeatMode ?? 'none')
  const [unit, setUnit] = useState<RepeatUnit>(task?.repeatUnit ?? 'day')
  const [every, setEvery] = useState(String(task?.repeatEvery ?? 1))
  const [weekdays, setWeekdays] = useState<number[]>(task?.repeatWeekdays ?? [])
  const [habit, setHabit] = useState(() => habitDraft(task))
  const [groupId, setGroupId] = useState<string | null>(task?.groupId ?? null)
  const { data: groups } = useQuery({ queryKey: tasksKeys.groups, queryFn: fetchGroups })

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
        // Kept even without a time: it applies again once a time is set.
        remindBefore,
        repeatMode: mode,
        repeatUnit: mode === 'none' ? null : unit,
        repeatEvery: mode === 'none' ? null : everyN,
        repeatWeekdays: weekly ? [...weekdays].sort((a, b) => a - b) : null,
        ...habitInput(habit, mode !== 'none'),
        // A group deleted meanwhile is sent as none rather than refused (400);
        // before the list arrives the task's own group is kept as it is.
        groupId: groups && groupId && !groups.some((g) => g.id === groupId) ? null : groupId,
      }
      return task ? updateTask(task.id, input) : createTask(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tasksKeys.all })
      toast(task ? t.form.updated : t.form.added, 'success')
      onSaved()
    },
    // The server's own reason when it gives one (a group gone meanwhile: errors.bad_group).
    onError: (err) => toast(apiErrorText(err, lang, t.form.saveFailed), 'error'),
  })

  const remove = useMutation({
    mutationFn: () => deleteTask(task!.id),
    onSuccess: async () => {
      // Drop the deleted task's own query first, or refreshing it 404s and the
      // edit page flashes "not found" before closing.
      qc.removeQueries({ queryKey: tasksKeys.item(task!.id) })
      await qc.invalidateQueries({ queryKey: tasksKeys.all })
      toast(t.form.deleted, 'success')
      ;(onDeleted ?? onSaved)()
    },
    onError: () => toast(t.form.deleteFailed, 'error'),
  })

  // One request at a time: saving and deleting each hold the other back.
  const busy = save.isPending || remove.isPending

  function submit(e: FormEvent) {
    e.preventDefault()
    if (valid && !busy) save.mutate()
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
        {/* Keeps the user's line breaks: Enter adds a line, Ctrl/Cmd+Enter saves. */}
        <GrowingInput
          multiline
          className={clsx(s.input, s.textarea)}
          value={title}
          onChange={setTitle}
          maxLength={200}
          placeholder={t.form.titlePlaceholder}
          aria-label={t.form.title}
          autoFocus={!task}
        />
      </label>

      <div className={s.row}>
        <div className={s.field}>
          <span className={s.label}>{mode === 'none' ? t.form.date : t.form.nextDate}</span>
          {/* Our own picker: input[type=date] prints the browser's format, not the app's language. */}
          <DateField label={t.form.date} value={dueDate || null} onChange={(d) => setDueDate(d ?? '')} clearable={mode === 'none'} />
        </div>
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

      {/* A reminder needs a time to count back from; a task without one comes in the hourly push. */}
      {dueTime && (
        <label className={s.field}>
          <span className={s.label}>{t.form.remind}</span>
          <select
            className={s.input}
            value={remindBefore ?? 'none'}
            onChange={(e) => setRemindBefore(e.target.value === 'none' ? null : Number(e.target.value))}
            aria-label={t.form.remind}
          >
            {REMIND_OPTIONS.map((n) => (
              <option key={n ?? 'none'} value={n ?? 'none'}>
                {t.form.remindLabel(n)}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Repeat in one row: the kind, then (if it repeats) every N and the unit. */}
      <div className={s.field}>
        <span className={s.label}>{t.form.repeat}</span>
        <div className={clsx(s.repeatRow, mode === 'none' && s.repeatOnce)}>
          <select
            className={s.input}
            value={mode}
            onChange={(e) => chooseMode(e.target.value as RepeatMode)}
            aria-label={t.form.kind}
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {t.form.modes[m].label}
              </option>
            ))}
          </select>
          {mode !== 'none' && (
            <>
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
            </>
          )}
        </div>
        <span className={s.hint}>{t.form.modes[mode].hint}</span>
      </div>

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
          ref={noteRef}
          className={clsx(s.input, s.textarea)}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={1}
          placeholder={t.form.optional}
          aria-label={t.form.note}
        />
      </label>

      {/* Optional, none by default: tap a chip to choose it, tap it again to clear. */}
      {groups && groups.length > 0 ? (
        <div className={s.field}>
          <span className={s.label}>{t.group.label}</span>
          <div className={s.chips} role="group" aria-label={t.group.choose}>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={groupId === g.id}
                className={clsx(s.chip, groupId === g.id && s.chipOn)}
                onClick={() => setGroupId((cur) => (cur === g.id ? null : g.id))}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        groups && (
          <Link to="/tasks/settings" className={s.addGroup} onClick={onLeave}>
            {t.group.add}
          </Link>
        )
      )}

      {/* A habit repeats, so the switch comes with a repeat. */}
      {mode !== 'none' && <HabitFields value={habit} onChange={setHabit} />}

      <div data-form-actions>
        {task && (
          <ConfirmDialog
            trigger={
              <button
                type="button"
                className={s.btnDanger}
                disabled={busy}
                aria-busy={remove.isPending || undefined}
              >
                {remove.isPending ? t.form.deleting : t.form.delete}
              </button>
            }
            title={t.form.deleteTitle(task.title)}
            description={t.form.deleteDesc}
            confirmLabel={t.form.delete}
            cancelLabel={t.form.cancel}
            onConfirm={() => {
              if (!busy) remove.mutate()
            }}
          />
        )}
        <button type="button" className={s.btnSecondary} onClick={onCancel}>
          {t.form.cancel}
        </button>
        <button
          type="submit"
          className={s.btnPrimary}
          disabled={!valid || busy}
          aria-busy={save.isPending || undefined}
        >
          {save.isPending ? t.form.saving : t.form.save}
        </button>
      </div>
    </form>
  )
}
