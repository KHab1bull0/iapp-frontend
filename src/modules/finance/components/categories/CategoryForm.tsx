import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { createCategory, deleteCategory, updateCategory, type Category } from '@/modules/finance/api/categories'
import { categoryParentsKey, fetchCategoryParents } from '@/modules/finance/api/categoryParents'
import { CATEGORY_SWATCHES } from '@/core/lib/chartColors'
import { ConfirmDialog } from '@/core/components/ui/ConfirmDialog'
import { toast } from '@/core/components/ui/toast'
import { Spinner } from '@/modules/finance/components/loading/Loading'
import { useCategoryName, useFinanceT } from '@/modules/finance/i18n'
import { EMOJI_LIST } from './emojis'
import { refreshCategories } from './refresh'
import s from './CategoryForm.module.scss'

const TYPES = ['expense', 'income'] as const

interface Props {
  category?: Category | null
  /** A new one's type to start with (the tab it was added from). */
  initialType?: 'income' | 'expense'
  onSaved: () => void
  onCancel: () => void
  /** After a delete; defaults to onSaved. */
  onDeleted?: () => void
}

/**
 * Add or edit a category. What it will look like comes first, live: its
 * tile and name, as the list will show them. Then type, name, parent (chips),
 * colour and icon.
 */
export function CategoryForm({ category, initialType = 'expense', onSaved, onCancel, onDeleted }: Props) {
  const t = useFinanceT()
  const catName = useCategoryName()
  const qc = useQueryClient()
  const isEdit = Boolean(category)

  const [type, setType] = useState<'income' | 'expense'>(category?.type ?? initialType)
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? CATEGORY_SWATCHES[5])
  const [icon, setIcon] = useState(category?.icon ?? '📁')
  const [parentId, setParentId] = useState<string | null>(category?.parentId ?? null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const busy = saving || deleting

  const { data: parents = [] } = useQuery({ queryKey: categoryParentsKey, queryFn: fetchCategoryParents })
  const parentChoices = parents.filter((p) => p.type === type)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!name.trim()) return setError(t.categories.nameRequired)
    setSaving(true)
    setError('')
    try {
      const dto = { name: name.trim(), type, color, icon, parentId }
      if (category) await updateCategory(category.id, dto)
      else await createCategory(dto)
      await refreshCategories(qc)
      toast(category ? t.categories.updated : t.categories.created, 'success')
      onSaved()
    } catch {
      setError(category ? t.categories.updateFailed : t.categories.createFailed)
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (busy || !category) return
    setDeleting(true)
    try {
      await deleteCategory(category.id)
      await refreshCategories(qc)
      toast(t.categories.deleted(catName(category.name)), 'success')
      ;(onDeleted ?? onSaved)()
    } catch {
      toast(t.categories.deleteFailed, 'error')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={s.form}>
      {/* How it will look in the lists, as it is being made. */}
      <div className={s.preview} aria-hidden>
        <span className={s.previewTile} style={{ background: `${color}22`, color }}>
          {icon}
        </span>
        <span className={clsx(s.previewName, !name.trim() && s.previewEmpty)}>
          {name.trim() || t.categories.new}
        </span>
        <span className={s.previewType}>{t[type]}</span>
      </div>

      <div className={s.tabs}>
        {TYPES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={type === value}
            onClick={() => {
              if (value === type) return
              setType(value)
              // A parent holds one type only.
              setParentId(null)
            }}
            className={clsx(s.tab, type === value && s.active)}
          >
            {t[value]}
          </button>
        ))}
      </div>

      <label className={s.field}>
        <span className={s.fieldLabel}>{t.categories.name}</span>
        <div className={s.inputWrap}>
          <input
            className={s.input}
            placeholder={t.categories.namePlaceholder}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            maxLength={100}
          />
        </div>
      </label>

      {/* Parent: only for grouping, optional. */}
      {parentChoices.length > 0 && (
        <div className={s.field}>
          <span className={s.fieldLabel} id="cat-parent">
            {t.categories.parent}
          </span>
          <div className={s.chips} role="radiogroup" aria-labelledby="cat-parent">
            {[{ id: null, name: t.categories.noParent, icon: '' }, ...parentChoices].map((p) => (
              <button
                key={p.id ?? 'none'}
                type="button"
                role="radio"
                aria-checked={parentId === p.id}
                className={clsx(s.chip, parentId === p.id && s.chipOn)}
                onClick={() => setParentId(p.id)}
              >
                {p.icon && <span aria-hidden>{p.icon}</span>}
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

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
              className={clsx(s.emoji, icon === e && s.active)}
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
        {category && (
          <ConfirmDialog
            trigger={
              <button type="button" className={s.btnDanger} disabled={busy} aria-busy={deleting || undefined}>
                {deleting && <Spinner size={14} />}
                {deleting ? t.deleting : t.delete}
              </button>
            }
            title={t.categories.deleteTitle(catName(category.name))}
            description={t.categories.deleteDesc}
            confirmLabel={t.delete}
            cancelLabel={t.cancel}
            onConfirm={handleDelete}
          />
        )}
        <button type="button" className={s.btnSecondary} onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="submit" className={s.btnPrimary} disabled={busy} aria-busy={saving || undefined}>
          {saving ? <Spinner size={14} /> : !isEdit && <Plus size={14} />}
          {isEdit ? (saving ? t.saving : t.save) : saving ? t.categories.creating : t.categories.create}
        </button>
      </div>
    </form>
  )
}
