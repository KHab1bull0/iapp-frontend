import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { BackButton } from '@/core/components/BackButton'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import { Skeleton } from '@/core/components/ui/Skeleton'
import { toast } from '@/core/components/ui/toast'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import { createGroup, deleteGroup, fetchGroups, renameGroup, type TaskGroup } from '@/modules/tasks/api/groups'
import { tasksKeys } from '@/modules/tasks/api/tasks'
import { LoadingLabel } from '@/modules/tasks/components/skeletons'
import { useTasksT } from '@/modules/tasks/i18n'
// The app's settings shell (back link, heading), so this reads like Finance's
// and English's settings; the list is the tasks pages' own section and card.
import shell from '@/pages/settings/settings.module.scss'
import p from '../TasksPages.module.scss'
import s from './TaskSettingsPage.module.scss'

/** The server's limit on a group's name. */
const NAME_MAX = 40

// A group's tasks change with it (renamed label, ungrouped on delete): ['tasks'] covers both.
const useRefresh = () => {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: tasksKeys.all })
}

/** One group: its name, renamed in place, and deleting it after a confirm. */
function GroupRow({ group }: { group: TaskGroup }) {
  const { lang } = useLang()
  const t = useTasksT()
  const refresh = useRefresh()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)

  const save = useMutation({
    mutationFn: () => renameGroup(group.id, name.trim()),
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

  if (editing) {
    return (
      <form
        className={s.row}
        onSubmit={(ev) => {
          ev.preventDefault()
          if (!name.trim() || save.isPending) return
          // Unchanged: nothing to send.
          if (name.trim() === group.name) setEditing(false)
          else save.mutate()
        }}
      >
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
          onClick={() => {
            setName(group.name)
            setEditing(false)
          }}
        >
          {t.form.cancel}
        </button>
      </form>
    )
  }

  return (
    <div className={s.row} aria-busy={remove.isPending || undefined}>
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
          <button type="button" className={s.iconBtn} disabled={remove.isPending} aria-label={t.settings.deleteNamed(group.name)}>
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

/** Names a new group; the field empties once it is added. */
function AddGroupRow() {
  const { lang } = useLang()
  const t = useTasksT()
  const refresh = useRefresh()
  const [name, setName] = useState('')
  const add = useMutation({
    mutationFn: () => createGroup(name.trim()),
    onSuccess: async () => {
      setName('')
      await refresh()
    },
    onError: (err) => toast(apiErrorText(err, lang, t.settings.addFailed), 'error'),
  })
  return (
    <form
      className={s.addRow}
      onSubmit={(ev: FormEvent) => {
        ev.preventDefault()
        if (name.trim() && !add.isPending) add.mutate()
      }}
    >
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
    </form>
  )
}

/**
 * Tasks → Settings (the gear in the bottom nav, Settings → Modules). For now
 * only the groups a task can be put in: add, rename, delete.
 */
export function TaskSettingsPage() {
  const t = useTasksT()
  const { data: groups = [], isLoading } = useQuery({ queryKey: tasksKeys.groups, queryFn: fetchGroups })

  return (
    <div className={shell.page}>
      {/* Back to wherever it was opened from: the bottom nav's gear, or Settings → Modules. */}
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
          <AddGroupRow />
        </div>
      </section>
    </div>
  )
}
