import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { toast } from '@/core/components/ui/toast'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import { useCoreT } from '@/core/i18n/useCoreT'
import {
  createInspiration,
  deleteInspiration,
  fetchInspirations,
  inspirationsKey,
  updateInspiration,
  type Inspiration,
  type InspirationKind,
} from '@/core/api/inspirations'
import { SettingsSubpage } from './SettingsSubpage'
import shell from './settings.module.scss'
import s from './InspirationsPage.module.scss'

const KINDS: InspirationKind[] = ['goal', 'dream', 'quote', 'note']

/** The kind chips: optional, tap again to clear. */
function KindPicker({ value, onChange }: { value: InspirationKind | null; onChange: (k: InspirationKind | null) => void }) {
  const t = useCoreT().settings.inspiration
  return (
    <div className={s.kinds} role="group" aria-label={t.kind}>
      {KINDS.map((k) => (
        <button
          key={k}
          type="button"
          className={clsx(s.kind, value === k && s.kindOn)}
          aria-pressed={value === k}
          onClick={() => onChange(value === k ? null : k)}
        >
          {t.kinds[k]}
        </button>
      ))}
    </div>
  )
}

/** One entry: its words as written, or the form to change them. */
function Entry({ entry }: { entry: Inspiration }) {
  const t = useCoreT().settings.inspiration
  const { lang } = useLang()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(entry.text)
  const [kind, setKind] = useState(entry.kind)
  const refresh = () => qc.invalidateQueries({ queryKey: inspirationsKey })
  const save = useMutation({
    mutationFn: () => updateInspiration(entry.id, { text, kind }),
    onSuccess: async () => {
      setEditing(false)
      await refresh()
    },
    onError: (err) => toast(apiErrorText(err, lang, t.failed), 'error'),
  })
  const remove = useMutation({
    mutationFn: () => deleteInspiration(entry.id),
    onSuccess: refresh,
    onError: (err) => toast(apiErrorText(err, lang, t.failed), 'error'),
  })

  if (editing) {
    return (
      <li className={s.item}>
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim() && !save.isPending) save.mutate()
          }}
        >
          <textarea className={s.textarea} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} />
          <KindPicker value={kind} onChange={setKind} />
          <div className={s.actions}>
            <button
              type="button"
              className={shell.btnSecondary}
              onClick={() => {
                setText(entry.text)
                setKind(entry.kind)
                setEditing(false)
              }}
            >
              {t.cancel}
            </button>
            <button type="submit" className={shell.btnPrimary} disabled={!text.trim() || save.isPending}>
              {t.save}
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className={s.item} aria-busy={remove.isPending || undefined}>
      <p className={s.text}>{entry.text}</p>
      <div className={s.meta}>
        {entry.kind && <span className={s.kindLabel}>{t.kinds[entry.kind]}</span>}
        <button type="button" className={s.iconBtn} onClick={() => setEditing(true)} aria-label={t.edit}>
          <Pencil size={14} />
        </button>
        <ConfirmDialog
          trigger={
            <button type="button" className={s.iconBtn} aria-label={t.delete} disabled={remove.isPending}>
              <Trash2 size={14} />
            </button>
          }
          title={t.deleteTitle}
          description={t.deleteDesc}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          onConfirm={() => remove.mutate()}
        />
      </div>
    </li>
  )
}

/** Settings → Ilhom: the user's own words, shown on Home and in reminders. */
export function InspirationsPage() {
  const core = useCoreT()
  const t = core.settings.inspiration
  const { lang } = useLang()
  const qc = useQueryClient()
  const { data: entries = [], isLoading } = useQuery({ queryKey: inspirationsKey, queryFn: fetchInspirations })
  const [text, setText] = useState('')
  const [kind, setKind] = useState<InspirationKind | null>(null)
  const add = useMutation({
    mutationFn: () => createInspiration({ text, kind }),
    onSuccess: async () => {
      setText('')
      setKind(null)
      await qc.invalidateQueries({ queryKey: inspirationsKey })
    },
    onError: (err) => toast(apiErrorText(err, lang, t.failed), 'error'),
  })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (text.trim() && !add.isPending) add.mutate()
  }

  return (
    <SettingsSubpage title={core.settings.inspirations} description={core.settings.inspirationsSub}>
      <form className={clsx(shell.card, s.form)} onSubmit={submit}>
        {/* A textarea on purpose: Enter is a new line, kept as written. */}
        <textarea
          className={s.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t.placeholder}
          aria-label={t.newEntry}
        />
        <KindPicker value={kind} onChange={setKind} />
        <div className={s.actions}>
          <button type="submit" className={shell.btnPrimary} disabled={!text.trim() || add.isPending} aria-busy={add.isPending || undefined}>
            <Plus size={14} aria-hidden /> {add.isPending ? t.adding : t.add}
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className={s.hint} aria-busy="true">{t.loading}</p>
      ) : entries.length === 0 ? (
        <EmptyState compact icon={Sparkles} title={t.empty} />
      ) : (
        <ul className={clsx(shell.card, s.list)}>
          {entries.map((e) => (
            <Entry key={e.id} entry={e} />
          ))}
        </ul>
      )}
    </SettingsSubpage>
  )
}
