import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { BackButton } from '@/core/components/BackButton'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { toast } from '@/core/components/ui/toast'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import {
  createGroup,
  deleteGroup,
  fetchGroups,
  updateGroup,
  GROUP_COLORS,
  type TaskGroup,
} from '@/modules/tasks/api/groups'
import { tasksKeys } from '@/modules/tasks/api/tasks'
import { LoadingLabel } from '@/modules/tasks/components/skeletons'
import { useTasksT } from '@/modules/tasks/i18n'
import shell from '@/pages/settings/settings.module.scss'
import p from '../TasksPages.module.scss'
import s from './TaskSettingsPage.module.scss'

const NAME_MAX = 40

const useRefresh = () => {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: tasksKeys.all })
}

// ── Color picker ─────────────────────────────────────────────────────────────

interface ColorPickerProps {
  value: string | null
  onChange: (c: string | null) => void
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const t = useTasksT()
  const ready = (GROUP_COLORS as readonly string[]).includes(value?.toLowerCase() ?? '')
  const custom = value !== null && !ready
  return (
    <div className={s.colorPicker} role="group" aria-label={t.settings.color}>
      {/* "No colour" swatch: a struck-through circle */}
      <button
        type="button"
        className={`${s.swatch} ${s.swatchNone} ${value === null ? s.swatchSelected : ''}`}
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        aria-label={t.settings.noColor}
      />
      {GROUP_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={`${s.swatch} ${value?.toLowerCase() === c ? s.swatchSelected : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-pressed={value?.toLowerCase() === c}
          aria-label={c}
        />
      ))}
      {/* Any colour: the system picker; a rainbow until one is picked, then that colour. */}
      <label
        className={`${s.swatch} ${s.swatchCustom} ${custom ? s.swatchSelected : ''}`}
        style={custom ? { background: value } : undefined}
        title={t.settings.customColor}
      >
        <input
          type="color"
          className={s.colorInput}
          value={value ?? GROUP_COLORS[2]}
          onChange={(ev) => onChange(ev.target.value)}
          aria-label={t.settings.customColor}
        />
      </label>
    </div>
  )
}

// ── GroupRow ──────────────────────────────────────────────────────────────────

function GroupRow({ group }: { group: TaskGroup }) {
  const { lang } = useLang()
  const t = useTasksT()
  const refresh = useRefresh()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)
  const [color, setColor] = useState<string | null>(group.color)

  const save = useMutation({
    mutationFn: () => updateGroup(group.id, name.trim(), color),
    onSuccess: async () => {
      setEditing(false)
      await refresh()
    },
    onError: (err) => toast(apiErrorText(err, lang, t.settings.saveFailed), 'error'),
  })

  const remove = useMutation({
    mutationFn: () => deleteGroup(group.id),
    onSuccess: refresh,
    onError: (err) => toast(apiErrorText(err, lang, t.settings.deleteFailed), 'error'),
  })

  const cancel = () => {
    setName(group.name)
    setColor(group.color)
    setEditing(false)
  }

  if (editing) {
    return (
      <form
        className={s.editForm}
        onSubmit={(ev) => {
          ev.preventDefault()
          if (!name.trim() || save.isPending) return
          if (name.trim() === group.name && color === group.color) { setEditing(false); return }
          save.mutate()
        }}
      >
        <ColorPicker value={color} onChange={setColor} />
        <div className={s.editRow}>
          <input
            className={s.input}
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            maxLength={NAME_MAX}
            aria-label={t.settings.nameOf(group.name)}
            autoFocus
          />
          <button
            type="submit"
            className={s.btnPrimary}
            disabled={!name.trim() || save.isPending}
            aria-busy={save.isPending || undefined}
          >
            {save.isPending ? t.form.saving : t.form.save}
          </button>
          <button
            type="button"
            className={s.btnGhost}
            disabled={save.isPending}
            onClick={cancel}
          >
            {t.form.cancel}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className={s.row} aria-busy={remove.isPending || undefined}>
      <span
        className={s.colorDot}
        style={{ background: group.color ?? 'var(--border-strong)' }}
        aria-hidden
      />
      <span className={s.name}>{group.name}</span>
      <button
        type="button"
        className={s.iconBtn}
        onClick={() => setEditing(true)}
        disabled={remove.isPending}
        aria-label={t.settings.rename(group.name)}
      >
        <Pencil size={14} />
      </button>
      <ConfirmDialog
        trigger={
          <button
            type="button"
            className={s.iconBtn}
            disabled={remove.isPending}
            aria-label={t.settings.deleteNamed(group.name)}
          >
            <Trash2 size={14} />
          </button>
        }
        title={t.settings.deleteTitle(group.name)}
        description={t.settings.deleteDesc}
        confirmLabel={t.form.delete}
        cancelLabel={t.form.cancel}
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}

// ── AddGroupRow ───────────────────────────────────────────────────────────────

function AddGroupRow({ groups }: { groups: TaskGroup[] }) {
  const { lang } = useLang()
  const t = useTasksT()
  const refresh = useRefresh()

  // Pre-select the first colour not yet used by any other group.
  const autoColor =
    GROUP_COLORS.find((c) => !groups.some((g) => g.color === c)) ?? GROUP_COLORS[0]

  const [name, setName] = useState('')
  const [color, setColor] = useState<string | null>(autoColor)

  const add = useMutation({
    mutationFn: () => createGroup(name.trim(), color),
    onSuccess: async () => {
      setName('')
      // Advance to the next unused colour.
      await refresh()
    },
    onError: (err) => toast(apiErrorText(err, lang, t.settings.addFailed), 'error'),
  })

  return (
    <form
      className={s.addForm}
      onSubmit={(ev: FormEvent) => {
        ev.preventDefault()
        if (name.trim() && !add.isPending) add.mutate()
      }}
    >
      <ColorPicker value={color} onChange={setColor} />
      <div className={s.editRow}>
        <input
          className={s.input}
          placeholder={t.settings.newGroup}
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          maxLength={NAME_MAX}
          aria-label={t.settings.groupName}
        />
        <button
          type="submit"
          className={s.btnPrimary}
          disabled={!name.trim() || add.isPending}
          aria-busy={add.isPending || undefined}
        >
          {add.isPending ? t.settings.adding : t.settings.add}
        </button>
      </div>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function TaskSettingsPage() {
  const t = useTasksT()
  const { data: groups = [], isLoading } = useQuery({
    queryKey: tasksKeys.groups,
    queryFn: fetchGroups,
  })

  return (
    <div className={shell.page}>
      <BackButton fallback="/tasks" className={shell.backLink} />
      <header className={shell.pageHead}>
        <div>
          <h1 className={shell.h1}>{t.settings.title}</h1>
          <div className={shell.pageSub}>{t.settings.sub}</div>
        </div>
      </header>

      <section className={p.section} aria-label={t.settings.groups}>
        <div className={p.sectionHead}>
          <h2 className={p.sectionTitle}>{t.settings.groups}</h2>
          {groups.length > 0 && <span className={p.count}>{groups.length}</span>}
        </div>
        <div className={p.list}>
          {isLoading ? (
            <div className={s.row} aria-busy="true">
              <LoadingLabel label={t.settings.loading} />
              <Skeleton height="var(--lh-ui)" width="40%" />
            </div>
          ) : groups.length === 0 ? (
            <div className={s.row}>
              <span className={s.hint}>{t.settings.empty}</span>
            </div>
          ) : (
            groups.map((g) => <GroupRow key={g.id} group={g} />)
          )}
          <AddGroupRow groups={groups} />
        </div>
      </section>
    </div>
  )
}
