import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Plus } from 'lucide-react'
import type { Category } from '@/modules/finance/api/categories'
import {
  createCategoryParent,
  deleteCategoryParent,
  updateCategoryParent,
  type CategoryParent,
} from '@/modules/finance/api/categoryParents'
import { CATEGORY_SWATCHES } from '@/core/lib/chartColors'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import { toast } from '@/core/components/ui/toast'
import { useLang } from '@/core/i18n'
import { apiErrorText } from '@/core/i18n/errors'
import { Spinner } from '@/modules/finance/components/loading/Loading'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import { EMOJI_LIST } from './emojis'
import { refreshCategories } from './refresh'
import s from './CategoryForm.module.scss'

const TYPES = ['expense', 'income'] as const

interface Props {
  /** Editing this one; creating when left out. */
  parent?: CategoryParent | null
  categories: Category[]
  /** A new one's type to start with (the tab it was added from). */
  initialType?: 'income' | 'expense'
  onSaved: () => void
  onCancel: () => void
}

/**
 * A parent ("Uy to'lovlari"): what it will look like first, live; then its
 * type (new ones only), name, the categories in it, colour and icon.
 */
export function ParentForm({ parent, categories, initialType = 'expense', onSaved, onCancel }: Props) {
  const t = useFinanceT()
  const { lang } = useLang()
  const catName = useCategoryName()
  const qc = useQueryClient()

  const [type, setType] = useState<'income' | 'expense'>(parent?.type ?? initialType)
  const [name, setName] = useState(parent?.name ?? '')
  const [color, setColor] = useState(parent?.color ?? CATEGORY_SWATCHES[5])
  const [icon, setIcon] = useState(parent?.icon ?? '📁')
  const [ids, setIds] = useState(() => categories.filter((c) => parent && c.parentId === parent.id).map((c) => c.id))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const busy = saving || deleting

  // Only unassigned categories of its type, and its own, can go in.
  const choices = categories.filter((c) => c.type === type && (!c.parentId || c.parentId === parent?.id))
  const toggle = (id: string) => setIds((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const trimmed = name.trim()
    if (!trimmed) return setError(t.categories.nameRequired)
    setSaving(true)
    setError('')
    try {
      const body = { name: trimmed, color, icon, categoryIds: ids }
      if (parent) await updateCategoryParent(parent.id, body)
      else await createCategoryParent({ ...body, type })
      await refreshCategories(qc)
      toast(parent ? t.categories.parentUpdated : t.categories.parentCreated, 'success')
      onSaved()
    } catch (err) {
      setError(apiErrorText(err, lang, t.categories.parentSaveFailed))
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (busy || !parent) return
    setDeleting(true)
    try {
      await deleteCategoryParent(parent.id)
      await refreshCategories(qc)
      toast(t.categories.parentDeleted(parent.name), 'success')
      onSaved()
    } catch {
      toast(t.categories.parentDeleteFailed, 'error')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={s.form}>
      <div className={s.preview} aria-hidden>
        <span className={s.previewTile} style={{ background: `${color}22`, color }}>
          {icon}
        </span>
        <span className={clsx(s.previewName, !name.trim() && s.previewEmpty)}>
          {name.trim() || t.categories.newParent}
        </span>
        <span className={s.previewType}>
          {t[type]} · {t.categories.parentCount(ids.length)}
        </span>
      </div>

      {/* A parent's type is set when it is made. */}
      {!parent && (
        <div className={s.tabs}>
          {TYPES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={type === value}
              onClick={() => {
                if (value === type) return
                setType(value)
                setIds([])
              }}
              className={clsx(s.tab, type === value && s.active)}
            >
              {t[value]}
            </button>
          ))}
        </div>
      )}

      <label className={s.field}>
        <span className={s.fieldLabel}>{t.categories.name}</span>
        <div className={s.inputWrap}>
          <input
            className={s.input}
            value={name}
            placeholder={t.categories.parentPlaceholder}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            maxLength={100}
            aria-label={t.categories.name}
          />
        </div>
      </label>

      <div className={s.field}>
        <span className={s.fieldLabel} id="parent-children">
          {t.categories.parentChildren}
        </span>
        {choices.length === 0 ? (
          <p className={s.hint}>{t.categories.parentNoChildren}</p>
        ) : (
          <div className={s.chips} role="group" aria-labelledby="parent-children">
            {choices.map((c) => {
              const on = ids.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  className={clsx(s.chip, on && s.chipOn)}
                  onClick={() => toggle(c.id)}
                >
                  {on ? <Check size={14} aria-hidden /> : <span aria-hidden>{c.icon}</span>}
                  {catName(c.name)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>{t.categories.color}</span>
        <div className={s.swatches}>
          {CATEGORY_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={t.categories.colorLabel(c)}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className={clsx(s.swatch, color === c && s.active)}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>{t.categories.icon}</span>
        <div className={s.emojiGrid}>
          {EMOJI_LIST.map((e) => (
            <button
              key={e}
              type="button"
              aria-label={t.categories.iconLabel(e)}
              aria-pressed={icon === e}
              onClick={() => setIcon(e)}
              className={s.emoji}
              style={icon === e ? { background: `${color}22`, borderColor: color } : undefined}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className={s.formError} role="alert">
          {error}
        </div>
      )}

      <div data-form-actions>
        {parent && (
          <ConfirmDialog
            trigger={
              <button type="button" className={s.btnDanger} disabled={busy} aria-busy={deleting || undefined}>
                {deleting && <Spinner size={14} />}
                {deleting ? t.deleting : t.delete}
              </button>
            }
            title={t.categories.parentDeleteTitle(parent.name)}
            description={t.categories.parentDeleteDesc}
            confirmLabel={t.delete}
            cancelLabel={t.cancel}
            onConfirm={handleDelete}
          />
        )}
        <button type="button" className={s.btnSecondary} onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="submit" className={s.btnPrimary} disabled={busy} aria-busy={saving || undefined}>
          {saving ? <Spinner size={14} /> : !parent && <Plus size={14} />}
          {parent ? (saving ? t.saving : t.save) : saving ? t.categories.creating : t.categories.create}
        </button>
      </div>
    </form>
  )
}
